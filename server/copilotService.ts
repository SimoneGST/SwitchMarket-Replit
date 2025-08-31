import { storage } from "./storage";
import { generateText } from "./gemini";
import { User, Product, CopilotConfig } from "@shared/schema";
// CopilotSession runtime shape may vary; keep as any for now during triage
type CopilotSession = any;

// Note: shared/schema exports specific table objects (copilotSessions, users, products).
// For runtime typing here we use any casts when pulling configs from storage as a safe triage.

interface CopilotContext {
  merchant: User;
  config: CopilotConfig;
  products?: Product[];
  session: CopilotSession;
}

export class CopilotService {
  
  // Verifica se il copilot è disponibile per un merchant
  async isCopilotAvailable(merchantId: string): Promise<boolean> {
    const config = await storage.getCopilotConfig(merchantId) as CopilotConfig | null;
    const cfgAny: any = config;
    if (!cfgAny || !cfgAny.isEnabled) return false;

    // Controlla orari di lavoro
    const now = new Date();
    // Use an English weekday name to match stored keys like 'monday', 'tuesday', etc.
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessHours = (cfgAny.businessHours || {}) as Record<string, any>;
    const dayConfig = (businessHours[dayName] as any) || { enabled: false, start: '00:00', end: '00:00' };

    if (!dayConfig.enabled) return false;

    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= dayConfig.start && currentTime <= dayConfig.end;
  }
  
  // Inizializza una nuova sessione copilot
  async initializeSession(merchantId: string, customerId: string, requestId?: number): Promise<CopilotSession> {
    const session = await storage.createCopilotSession({
      merchantId,
      customerId,
      requestId,
      status: 'active',
      isAiHandled: true,
      totalMessages: 0,
      aiMessages: 0,
      humanMessages: 0
    });
    
    return session;
  }
  
  // Genera risposta automatica basata sul contesto
  async generateResponse(sessionId: string, customerMessage: string): Promise<{
    response: string;
    shouldTransferToHuman: boolean;
    confidence: number;
  }> {
    const session = await storage.getCopilotSession(sessionId);
    if (!session) throw new Error('Session not found');
    
  const context: any = await this.buildContext(session);
    
    // Costruisci il prompt per Leonardo
    const systemPrompt = this.buildSystemPrompt(context);
    const personalityTone = context?.config?.personality || 'Professionale e cordiale';
    const autonomy = context?.config?.autonomyLevel || 'medium';
    const userPrompt = `Cliente: "${customerMessage}"

    Analizza il messaggio e:
    1. Rispondi come Leonardo, l'assistente AI di ${context.merchant.businessName}
    2. Usa un tono: ${personalityTone}
    3. Livello di autonomia configurato: ${autonomy}
    4. Se non riesci a rispondere adeguatamente, suggerisci di trasferire a un umano

    Formato risposta JSON:
    {
      "response": "risposta al cliente",
      "shouldTransfer": boolean,
      "confidence": numero da 0 a 1,
      "suggestedAction": "optional action"
    }`;
    
    try {
      const aiResponse = await generateText(systemPrompt + "\n\n" + userPrompt);
      const parsed = JSON.parse(aiResponse);
      
      // Aggiorna statistiche sessione
      await storage.updateCopilotSession(sessionId, {
        totalMessages: session.totalMessages + 1,
        aiMessages: session.aiMessages + 1
      });
      
      return {
        response: parsed.response,
        shouldTransferToHuman: parsed.shouldTransfer || false,
        confidence: parsed.confidence || 0.8
      };
      
    } catch (error) {
      console.error('Errore nella generazione della risposta:', error);
      
      // Risposta di fallback
      return {
        response: context?.config?.unavailableMessage || 'Mi dispiace, non posso rispondere ora.',
        shouldTransferToHuman: true,
        confidence: 0.1
      };
    }
  }
  
  // Trasferimento alla gestione umana
  async transferToHuman(sessionId: string, reason: string): Promise<void> {
    await storage.updateCopilotSession(sessionId, {
      status: 'transferred',
      isAiHandled: false,
      handoverReason: reason
    });
    
    // Qui potresti aggiungere notifiche push/email al merchant
    this.notifyMerchant(sessionId, 'transfer', reason);
  }
  
  // Completa una sessione
  async completeSession(sessionId: string, satisfaction?: number, summary?: string): Promise<void> {
    await storage.updateCopilotSession(sessionId, {
      status: 'completed',
      completedAt: new Date(),
      satisfaction,
      summary
    });
    
    // Aggiorna analytics
    const session = await storage.getCopilotSession(sessionId);
    if (session) {
      await this.updateAnalytics(session.merchantId, {
        completedChats: 1,
        customerSatisfaction: satisfaction
      });
    }
  }
  
  // Costruisce il contesto per l'AI
  private async buildContext(session: CopilotSession): Promise<CopilotContext> {
    const merchant = await storage.getUser(session.merchantId);
    const config = await storage.getCopilotConfig(session.merchantId);
    const products = await storage.getProductsByUserId(session.merchantId);
    
    if (!merchant || !config) {
      throw new Error('Missing merchant context');
    }
    
    return { merchant, config, products, session };
  }
  
  // Costruisce il prompt di sistema per Leonardo
  private buildSystemPrompt(context: CopilotContext): string {
    const { merchant, config, products } = context;
    
    const productInfo = products?.length ? 
      `Prodotti disponibili: ${products.map(p => `${p.name} - €${Number((p as any).price || 0).toFixed(2)}`).join(', ')}` : 
      'Nessun prodotto sincronizzato dal gestionale.';
    
    return `Sei Leonardo, l'assistente AI intelligente di ${merchant.businessName || merchant.firstName}.
    
    CONTESTO BUSINESS:
    - Nome attività: ${merchant.businessName}
    - Proprietario: ${merchant.firstName} ${merchant.lastName}
    - Tipo: ${merchant.userType === 'merchant' ? 'Negoziante verificato' : 'Merchant'}
    - ${productInfo}
    
  PERSONALITÀ:
  - Descrizione: ${config.personality || 'Professionale e cordiale'}
  - Livello Autonomia: ${config.autonomyLevel || 'medium'}
    
    COMPITI:
    1. Assistere i clienti con informazioni sui prodotti
    2. Raccogliere richieste e dettagli di contatto
    3. Programmare appuntamenti e visite
    4. Rispondere a domande su prezzi e disponibilità
    5. Trasferire conversazioni complesse al proprietario
    
    ISTRUZIONI:
    - Rispondi sempre in italiano
    - Sii professionale ma amichevole
    - Non inventare prezzi o informazioni sui prodotti
    - Se non sei sicuro, chiedi di essere trasferito a un umano
    - Usa informazioni reali dal catalogo prodotti quando disponibili`;
  }
  
  // Aggiorna le analytics giornaliere
  private async updateAnalytics(merchantId: string, updates: {
    completedChats?: number;
    transferredChats?: number;
    customerSatisfaction?: number;
  }): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = await storage.getCopilotAnalytics(merchantId, today);
    
    if (existing) {
      const newData = {
        ...existing,
        completedChats: existing.completedChats + (updates.completedChats || 0),
        transferredChats: existing.transferredChats + (updates.transferredChats || 0),
        customerSatisfaction: updates.customerSatisfaction ? 
          ((existing.customerSatisfaction as number || 0) + updates.customerSatisfaction) / 2 : 
          existing.customerSatisfaction
      };
      
      await storage.upsertCopilotAnalytics(newData);
    } else {
      await storage.upsertCopilotAnalytics({
        userId: merchantId,
        date: today,
        totalChats: 1,
        completedChats: updates.completedChats || 0,
        transferredChats: updates.transferredChats || 0,
        customerSatisfaction: updates.customerSatisfaction ? updates.customerSatisfaction.toString() : null,
        averageResponseTime: 2, // default 2 secondi
        totalRevenue: "0",
        conversionsCount: 0
      });
    }
  }
  
  // Notifica il merchant (placeholder per future notifiche push/email)
  private async notifyMerchant(sessionId: string, type: string, details: string): Promise<void> {
    console.log(`[COPILOT NOTIFICATION] Session ${sessionId}: ${type} - ${details}`);
    // TODO: Implementare notifiche push/email
  }
  
  // Ottieni statistiche performance copilot
  async getPerformanceStats(merchantId: string, days: number = 7): Promise<any> {
    const stats = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStats = await storage.getCopilotAnalytics(merchantId, dateStr);
      stats.push(dayStats || {
        date: dateStr,
        totalChats: 0,
        completedChats: 0,
        transferredChats: 0,
        customerSatisfaction: null
      });
    }
    
    return stats.reverse();
  }
}

export const copilotService = new CopilotService();