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
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 Server API Key disponibile:', !!apiKey, 'Source: GEMINI_API_KEY');
    
    if (!apiKey) {
      console.warn('❌ GEMINI_API_KEY non configurata sul server');
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

  // Sistema di chat per ottenere dettagli (ora con supporto file e context)
  async chatWithUser(userMessage: string, context?: any, attachedFile?: {url: string, name: string, type: string}): Promise<{text: string, generatedImage?: string}> {
    if (!this.model) {
      return { text: 'Mi dispiace, il servizio AI non è disponibile al momento. Prova la compilazione manuale.' };
    }

    // Usa il context passato dal frontend per mantenere la memoria della conversazione
    const conversationHistory = context?.conversationHistory || [];
    
    const systemPrompt = `Sei Clemente, assistente veloce di Switch Market. Aiuti i clienti a creare richieste complete RAPIDAMENTE.

OBIETTIVO: Raccogliere le informazioni ESSENZIALI in 3-4 scambi MAX, poi proporre di creare la richiesta.

PROCESSO RAPIDO:
1. Conferma il prodotto
2. Chiedi MAX 2-3 caratteristiche principali (colore, taglia, budget) INSIEME
3. Proponi subito di creare la richiesta

REGOLE FERME:
- Massimo 2 frasi per risposta
- FAI PIÙ DOMANDE INSIEME per essere efficiente
- Non scendere in dettagli tecnici a meno che non sia fondamentale
- Proponi di creare la richiesta appena hai le info base

ESEMPI GIUSTI:
"Ok sandali da cerimonia! Colore, taglia e budget?"
"Perfetto! Vuoi che creo la richiesta per negozianti ora?"
"Bene, ho tutto. Creiamo la richiesta?"

ESEMPI SBAGLIATI:
- Fare 10+ domande dettagliate
- Chiedere una cosa alla volta quando puoi chiederne 3
- Scendere in dettagli tecnici inutili

INFORMAZIONI RACCOLTE dalla conversazione precedente:
${context?.productDetails ? `Prodotto: ${context.productDetails}` : ''}
${context?.dimensions ? `Dimensioni: ${context.dimensions}` : ''}
${context?.material ? `Materiale: ${context.material}` : ''}
${context?.budget ? `Budget: ${context.budget}` : ''}
${context?.features ? `Caratteristiche: ${context.features}` : ''}

Cronologia conversazione completa:
${conversationHistory.slice(-15).map((msg: any) => `${msg.isAI ? 'Clemente' : 'Cliente'}: ${msg.content}`).join('\n')}

NON ripetere domande su cose già specificate. Aiuta il cliente a creare una richiesta completa e precisa.`;

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

      // Non aggiornare più la chatHistory locale, il context è gestito dal frontend

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

    const extractionPrompt = `Analizza questa conversazione e crea una richiesta dettagliata e completa per i negozianti.

OBIETTIVO: Creare una richiesta chiara, specifica e completa che permetta ai negozianti di dare offerte precise.

CRITERI QUALITÀ:
- Titolo specifico e descrittivo (non generico)
- Descrizione completa con tutte le caratteristiche discusse
- Specifiche tecniche dettagliate
- Budget realistico se discusso
- Tempistiche chiare

Rispondi SOLO con JSON valido:

{
  "title": "Titolo specifico e descrittivo del prodotto",
  "description": "Descrizione completa con caratteristiche, uso previsto e specifiche discusse",
  "category": "Categoria appropriata: Elettronica, Casa e Giardino, Sport e Tempo Libero, Veicoli, Abbigliamento, Servizi",
  "budget": numero_budget_se_discusso_o_null,
  "urgencyLevel": "immediate | 24h | 48h | few_days",
  "deliveryPreference": "pickup | delivery | both", 
  "actionRadius": numero_km_per_ritiro_o_10_default,
  "location": "Milano",
  "technicalSpecs": "Tutte le specifiche tecniche discusse in dettaglio",
  "brand": "marca_se_specificata_o_null",
  "model": "modello_se_specificato_o_null",
  "size": "dimensioni_se_specificate_o_null",
  "color": "colore_se_specificato_o_null", 
  "material": "materiale_se_specificato_o_null"
}

Conversazione:
${conversationText}

Crea una richiesta completa che i negozianti possano capire perfettamente.`;

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

TASK: Espandi questo input in una richiesta dettagliata e specifica. Aggiungi caratteristiche tecniche importanti, specifiche utili e dettagli che aiuterebbero i negozianti a fornire offerte precise.

PRINCIPI:
- Titolo specifico (non generico)
- Descrizione dettagliata con caratteristiche tecniche
- Specifiche tecniche comprehensive per il tipo di prodotto
- Considerazioni d'uso tipiche

Rispondi SOLO con JSON valido:

{
  "title": "Titolo specifico del prodotto richiesto",
  "description": "Descrizione dettagliata con caratteristiche d'uso, specifiche tecniche importanti per questo tipo di prodotto",
  "category": "Categoria appropriata dal lista: Elettronica, Casa e Giardino, Sport e Tempo Libero, Veicoli, Abbigliamento, Servizi",
  "budget": null,
  "urgencyLevel": "few_days",
  "deliveryPreference": "both",
  "actionRadius": 10,
  "location": "Milano",
  "technicalSpecs": "Specifiche tecniche complete tipiche per questo prodotto",
  "brand": null,
  "model": null,
  "size": null,
  "color": null,
  "material": null
}

Espandi "${userInput}" in una richiesta completa e dettagliata.`;

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