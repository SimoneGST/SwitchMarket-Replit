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
    if (!apiKey) {
      console.warn('GEMINI_API_KEY non configurata');
      // Fallback per sviluppo
      this.genAI = null;
      this.model = null;
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

    const systemPrompt = `Sei Clemente, l'assistente AI di Switch Market, specializzato nell'aiutare i clienti a creare richieste precise e dettagliate per trovare prodotti perfetti.

RUOLO: Aiuti i clienti a definire esattamente cosa cercano, facendo domande specifiche per ottenere tutti i dettagli necessari.

OBIETTIVO: Creare richieste inequivocabili che permettano ai negozianti di fare offerte precise.

STILE: Amichevole, professionale, curioso sui dettagli. Fai domande specifiche e tecniche quando necessario.

PROCESSO:
1. Ascolta cosa cerca il cliente
2. Fai domande per specificare: marca, modello, caratteristiche tecniche, dimensioni, colore, materiale
3. Chiarisci budget, urgenza, modalità di consegna
4. Verifica la posizione per il ritiro
5. Riassumi tutto prima di creare la richiesta

Conversazione precedente:
${this.chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Rispondi al cliente in modo naturale e utile. Se hai abbastanza informazioni, proponi di generare la richiesta.`;

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: `Cliente: ${userMessage}` }
      ]);

      const response = result.response.text();
      
      this.chatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      console.error('Errore chat Clemente:', error);
      return 'Mi dispiace, ho avuto un problema tecnico. Puoi ripetere?';
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