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
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'document' | 'other';
  aiGeneratedImage?: string;
}

class ClementeAI {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatHistory: ChatMessage[] = [];

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    console.log('🔑 Server API Key disponibile:', !!apiKey);
    
    if (!apiKey) {
      console.warn('❌ GOOGLE_API_KEY e GEMINI_API_KEY non configurate sul server');
      this.genAI = null as any;
      this.model = null;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Clemente AI Server inizializzato correttamente');
    } catch (error) {
      console.error('❌ Errore inizializzazione Gemini Server:', error);
      this.genAI = null as any;
      this.model = null;
    }
  }

  // Analizza un'immagine caricata dall'utente
  async analyzeImage(imageUrl: string, userMessage?: string): Promise<string> {
    if (!this.model) {
      return 'Mi dispiace, il servizio AI non è disponibile al momento per analizzare immagini.';
    }

    try {
      // Fetch dell'immagine per convertirla in base64
      const response = await fetch(imageUrl);
      const blob = await response.arrayBuffer();
      const base64 = Buffer.from(blob).toString('base64');
      
      // Determina il tipo MIME (assumendo JPEG se non specificato)
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      
      const prompt = userMessage 
        ? `Analizza questa immagine in relazione alla richiesta: "${userMessage}". Come può aiutarmi a trovare quello che cerco?`
        : `Analizza questa immagine e dimmi se può aiutarmi a specificare meglio quello che sto cercando. Cosa vedi e come posso usare queste informazioni per la mia richiesta?`;

      const result = await this.model.generateContent([
        {
          inlineData: {
            data: base64,
            mimeType: mimeType
          }
        },
        prompt
      ]);

      return result.response.text();
    } catch (error) {
      console.error('❌ Errore analisi immagine:', error);
      return 'Non riesco ad analizzare questa immagine al momento. Puoi descrivermi cosa rappresenta?';
    }
  }

  // Genera un'immagine per aiutare l'utente
  async generateExampleImage(description: string): Promise<string | null> {
    // Temporaneamente disabilitato fino a che l'API non è stabile
    console.log('🎨 Generazione immagini temporaneamente disabilitata');
    return null;
  }

  // Sistema di chat per ottenere dettagli (ora con supporto file)
  async chatWithUser(userMessage: string, attachedFile?: {url: string, name: string, type: string}): Promise<{text: string, generatedImage?: string}> {
    if (!this.model) {
      return { text: 'Mi dispiace, il servizio AI non è disponibile al momento. Prova la compilazione manuale.' };
    }

    this.chatHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      fileUrl: attachedFile?.url,
      fileName: attachedFile?.name,
      fileType: attachedFile?.type.startsWith('image/') ? 'image' : 'document'
    });

    const systemPrompt = `Sei Clemente, l'assistente AI di Switch Market, una piattaforma che connette clienti con negozianti locali.

IMPORTANTE: Switch Market è un marketplace locale dove i negozianti della zona rispondono alle richieste dei clienti. Non devi mai chiedere dove fare shopping perché i negozianti locali contatteranno il cliente direttamente.

Obiettivo: Aiutare l'utente a creare richieste dettagliate per i negozianti locali che possono fornire il prodotto.

Comportamento:
- Fai UNA domanda specifica alla volta per ottenere dettagli
- Risposte molto brevi: massimo 1-2 frasi  
- Linguaggio naturale e amichevole
- Concentrati su: specifiche tecniche, budget, tempistiche di consegna, preferenze di ritiro/consegna
- NON chiedere mai dove fare shopping - i negozianti locali risponderanno alla richiesta
- Quando hai abbastanza dettagli, proponi di pubblicare la richiesta per i negozianti

Cronologia conversazione:
${this.chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Aiuta il cliente a specificare bene la richiesta per i negozianti locali.`;

    try {
      console.log('🤖 Clemente Server sta elaborando:', userMessage);
      
      let finalMessage = userMessage;
      let analysisResult = '';

      // Se c'è un file allegato, analizzalo prima
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        console.log('🖼️ Analizzando immagine allegata:', attachedFile.name);
        analysisResult = await this.analyzeImage(attachedFile.url, userMessage);
        finalMessage = `${userMessage}\n\n[Immagine allegata: ${attachedFile.name}]\nAnalisi immagine: ${analysisResult}`;
      }

      const result = await this.model.generateContent(systemPrompt + '\n\nCliente: ' + finalMessage);
      const response = result.response.text();
      
      console.log('✅ Risposta Clemente Server:', response.substring(0, 100) + '...');
      
      // Determina se dovrebbe generare un'immagine di esempio
      const shouldGenerateImage = this.shouldGenerateExampleImage(userMessage, response);
      let generatedImage: string | undefined;
      
      if (shouldGenerateImage) {
        const imageDescription = this.extractImageDescription(userMessage, response);
        generatedImage = await this.generateExampleImage(imageDescription) || undefined;
      }

      this.chatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        aiGeneratedImage: generatedImage
      });

      return { text: response, generatedImage };
    } catch (error: any) {
      console.error('❌ Errore chat Clemente Server:', error);
      
      // Risposta di fallback più informativa
      if (error?.message?.includes('API key')) {
        return { text: 'Problema con la chiave API. Controlla la configurazione di GOOGLE_API_KEY.' };
      } else if (error?.message?.includes('quota')) {
        return { text: 'Quota API esaurita. Riprova più tardi.' };
      } else {
        return { text: `Errore tecnico: ${error?.message || 'Sconosciuto'}. Prova la compilazione manuale.` };
      }
    }
  }

  // Determina se dovrebbe generare un'immagine di esempio
  private shouldGenerateExampleImage(userMessage: string, response: string): boolean {
    const imageKeywords = ['colore', 'forma', 'design', 'aspetto', 'stile', 'modello', 'tipo', 'come', 'simile'];
    const questionPatterns = ['che tipo', 'come', 'quale', 'preferisci'];
    
    const hasImageKeywords = imageKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword) || response.toLowerCase().includes(keyword)
    );
    
    const hasQuestions = questionPatterns.some(pattern => 
      response.toLowerCase().includes(pattern)
    );

    return hasImageKeywords && hasQuestions;
  }

  // Estrae la descrizione per generare un'immagine
  private extractImageDescription(userMessage: string, response: string): string {
    // Logica semplice: estrae il prodotto principale dal messaggio utente
    const productKeywords = ['scarpe', 'bici', 'telefono', 'computer', 'tavolo', 'sedia', 'divano', 'cucina'];
    
    for (const keyword of productKeywords) {
      if (userMessage.toLowerCase().includes(keyword)) {
        return `${keyword} moderno e professionale, vista frontale su sfondo bianco`;
      }
    }
    
    return `prodotto generico moderno, vista frontale su sfondo bianco`;
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
  "actionRadius": 10,
  "location": "Milano",
  "technicalSpecs": null,
  "brand": null,
  "model": null,
  "size": null,
  "color": null,
  "material": null
}`;

    try {
      const result = await this.model.generateContent(quickPrompt);
      const jsonText = result.response.text().trim();
      
      // Rimuovi eventuali markdown
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const requestData = JSON.parse(cleanJson);
      return requestData;
    } catch (error) {
      console.error('Errore generazione rapida:', error);
      return null;
    }
  }
}

// Esporta l'istanza singleton
export const clementeAI = new ClementeAI();