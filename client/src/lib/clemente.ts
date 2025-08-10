// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

interface RequestData {
  title: string;
  description: string;
  category: string;
  budget?: number;
  urgencyLevel: 'immediate' | '24h' | '48h' | 'few_days';
  deliveryPreference: 'pickup' | 'delivery' | 'both';
  actionRadius?: number;
  location: string;
  technicalSpecs?: string;
  brand?: string;
  model?: string;
  size?: string;
  color?: string;
  material?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class ClementeAI {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatHistory: ChatMessage[] = [];

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('🔑 API Key disponibile:', !!apiKey, 'Lunghezza:', apiKey?.length);
    
    if (!apiKey) {
      console.warn('❌ VITE_GEMINI_API_KEY non configurata');
      this.genAI = null as any;
      this.model = null;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Clemente AI inizializzato correttamente');
    } catch (error) {
      console.error('❌ Errore inizializzazione Gemini:', error);
      this.genAI = null as any;
      this.model = null;
    }
  }

  // Sistema di chat per ottenere dettagli
  async chatWithUser(userMessage: string): Promise<string> {
    if (!this.model) {
      return 'Mi dispiace, il servizio AI non è disponibile al momento. Prova la compilazione manuale.';
    }

    this.chatHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    const systemPrompt = `Sei Clemente, l'assistente AI di Switch Market. Aiuti i clienti a trovare prodotti nei negozi locali.

PERSONALITÀ: Amichevole e naturale, come un commesso esperto che fa UNA domanda alla volta.

STILE:
- Risposte BREVI: massimo 1-2 frasi
- UNA sola domanda per messaggio
- Tono colloquiale e naturale
- Come una vera conversazione in negozio

PROCESSO:
1. Conferma brevemente il prodotto cercato
2. Fai domande specifiche UNA ALLA VOLTA:
   - Prima le caratteristiche più importanti
   - Poi budget o marca preferita  
   - Infine tempistiche e zona

ESEMPI BUONI:
"Perfetto! Che tipo di attacco preferisci: SPD-SL o Look Delta?"
"Hai un budget in mente?"
"Che taglia indossi di solito?"

IMPORTANTE: Procedi gradualmente, una domanda alla volta, come una conversazione reale. NON fare liste di domande.

Conversazione precedente:
${this.chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Rispondi al cliente in modo naturale e utile. Se hai abbastanza informazioni, proponi di generare la richiesta.`;

    try {
      console.log('🤖 Clemente sta elaborando:', userMessage);
      
      const result = await this.model.generateContent(systemPrompt + '\n\nCliente: ' + userMessage);
      const response = result.response.text();
      
      console.log('✅ Risposta Clemente:', response.substring(0, 100) + '...');
      
      this.chatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      return response;
    } catch (error: any) {
      console.error('❌ Errore chat Clemente:', error);
      
      // Risposta di fallback più informativa
      if (error?.message?.includes('API key')) {
        return 'Problema con la chiave API. Controlla la configurazione di VITE_GEMINI_API_KEY.';
      } else if (error?.message?.includes('quota')) {
        return 'Quota API esaurita. Riprova più tardi.';
      } else {
        return `Errore tecnico: ${error?.message || 'Sconosciuto'}. Prova la compilazione manuale.`;
      }
    }
  }

  // Generazione automatica della richiesta dalla chat
  async generateRequestFromChat(): Promise<RequestData | null> {
    if (!this.model) return null;

    const conversationText = this.chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const extractionPrompt = `Analizza questa conversazione e estrai i dati per una richiesta di prodotto. 
Rispondi SOLO con un JSON valido con questi campi:

{
  "title": "Titolo chiaro e specifico",
  "description": "Descrizione dettagliata con tutte le specifiche",
  "category": "Una di: Elettronica, Casa e Giardino, Sport e Tempo Libero, Veicoli, Abbigliamento, Servizi",
  "budget": numero o null,
  "urgencyLevel": "immediate" | "24h" | "48h" | "few_days",
  "deliveryPreference": "pickup" | "delivery" | "both", 
  "actionRadius": numero in km per ritiro o null,
  "location": "città specificata",
  "technicalSpecs": "specifiche tecniche se presenti",
  "brand": "marca se specificata",
  "model": "modello se specificato",
  "size": "dimensioni se specificate",
  "color": "colore se specificato", 
  "material": "materiale se specificato"
}

Conversazione:
${conversationText}`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const jsonText = result.response.text().trim();
      
      // Rimuovi eventuali markdown o testo extra
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const requestData = JSON.parse(cleanJson);
      return requestData;
    } catch (error) {
      console.error('Errore estrazione dati:', error);
      return null;
    }
  }

  // Generazione rapida da input semplice
  async quickGenerate(userInput: string): Promise<RequestData | null> {
    if (!this.model) return null;

    const quickPrompt = `L'utente vuole: "${userInput}"

Crea una richiesta di prodotto basandoti su questo input. Rispondi SOLO con JSON valido:

{
  "title": "Titolo specifico basato sull'input",
  "description": "Descrizione dettagliata che espande l'input",
  "category": "Categoria più appropriata",
  "budget": null,
  "urgencyLevel": "few_days",
  "deliveryPreference": "both",
  "actionRadius": 20,
  "location": "Da specificare",
  "technicalSpecs": "Specifiche se deducibili",
  "brand": null,
  "model": null,
  "size": null,
  "color": null,
  "material": null
}`;

    try {
      const result = await this.model.generateContent(quickPrompt);
      const jsonText = result.response.text().trim();
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Errore generazione rapida:', error);
      return null;
    }
  }

  // Miglioramento richiesta esistente
  async improveRequest(currentRequest: Partial<RequestData>, userFeedback: string): Promise<RequestData | null> {
    if (!this.model) return null;

    const improvePrompt = `Migliora questa richiesta basandoti sul feedback dell'utente:

Richiesta attuale: ${JSON.stringify(currentRequest)}
Feedback utente: "${userFeedback}"

Rispondi SOLO con il JSON migliorato mantenendo la stessa struttura.`;

    try {
      const result = await this.model.generateContent(improvePrompt);
      const jsonText = result.response.text().trim();
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Errore miglioramento:', error);
      return null;
    }
  }

  // Reset chat
  clearChat() {
    this.chatHistory = [];
  }

  // Ottieni storico chat
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }
}

export { ClementeAI, type RequestData, type ChatMessage };