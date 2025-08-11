import { GoogleGenerativeAI } from '@google/generative-ai';
import { findBestProductSchema, generateSmartQuestion, validateCollectedData, generateDynamicProductSchema, type ProductSchema } from './productSchemas';

interface RequestData {
  // Campi base obbligatori
  title: string;
  description: string;
  category: string;
  productName: string;
  
  // Budget e prezzo
  budgetMin?: number;
  budgetMax?: number;
  
  // Localizzazione e consegna
  location: string;
  latitude?: number;
  longitude?: number;
  useProfileLocation?: boolean;
  actionRadius: number; // km per ritiro in negozio
  deliveryPreference: 'pickup' | 'delivery' | 'both';
  urgencyLevel: 'immediate' | '24h' | '48h' | 'few_days';
  
  // Specifiche prodotto dinamiche
  brand?: string;
  model?: string;
  color?: string;
  material?: string;
  size?: string;
  weight?: string;
  dimensions?: string;
  condition?: 'new' | 'used' | 'refurbished';
  
  // Campi specifici per categoria
  attributes?: Record<string, any>;
  technicalSpecs?: string;
  notes?: string;
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

  // Sistema di chat intelligente con schede prodotto
  async chatWithUser(userMessage: string, context?: any, attachedFile?: {url: string, name: string, type: string}): Promise<{text: string, generatedImage?: string, productSchema?: ProductSchema, collectedData?: any}> {
    if (!this.model) {
      return { text: 'Mi dispiace, il servizio AI non è disponibile al momento. Prova la compilazione manuale.' };
    }

    // Usa il context passato dal frontend per mantenere la memoria della conversazione
    const conversationHistory = context?.conversationHistory || [];
    const collectedData = context?.collectedData || {};
    let currentSchema = context?.currentSchema;
    
    // Se non abbiamo ancora una scheda, prova a identificare il prodotto
    if (!currentSchema) {
      // Prima controlla se è un saluto o messaggio generico
      const genericMessages = ['ciao', 'salve', 'buongiorno', 'buonasera', 'hello', 'hi'];
      const isGenericMessage = genericMessages.some(greeting => 
        userMessage.toLowerCase().trim() === greeting || 
        userMessage.toLowerCase().includes(`${greeting} `) ||
        userMessage.toLowerCase().includes(` ${greeting}`)
      );
      
      if (!isGenericMessage) {
        const detectedSchema = findBestProductSchema(userMessage);
        if (detectedSchema) {
          currentSchema = detectedSchema;
          console.log(`🎯 Scheda rilevata: ${detectedSchema.name}`);
        } else {
          // Se non trova una scheda predefinita, prova a generarne una dinamicamente
          console.log(`🔍 Prodotto non riconosciuto, genero scheda dinamica per: ${userMessage}`);
          const dynamicSchema = await generateDynamicProductSchema(userMessage, this.model);
          if (dynamicSchema) {
            currentSchema = dynamicSchema;
            console.log(`🆕 Scheda dinamica creata: ${dynamicSchema.name}`);
          }
        }
      }
    }
    
    // Se abbiamo una scheda, usa la logica intelligente
    if (currentSchema) {
      return await this.handleSchemaBasedChat(userMessage, currentSchema, collectedData, conversationHistory, attachedFile);
    }
    
    // Fallback: logica generale se non riusciamo a identificare il prodotto
    const systemPrompt = `Sei Clemente, assistente esperto di Switch Market. 

Il cliente ha scritto: "${userMessage}"

Se è un SALUTO o messaggio generico (ciao, salve, buongiorno):
- Rispondi cordialmente e chiedi cosa sta cercando
- Esempio: "Ciao! Sono Clemente, il tuo assistente per trovare prodotti. Cosa stai cercando oggi?"

Se è una RICHIESTA DI PRODOTTO:
- Identifica il prodotto e raccogli gradualmente le informazioni
- Caratteristiche specifiche del prodotto
- Budget (SOLO se è un prodotto commerciale)
- Condizioni (SOLO per prodotti fisici)

REGOLE PER IL TONO:
- Tono conversazionale, cordiale e amichevole
- Una domanda per volta, naturale e fluida
- Include esempi quando utile, ma non essere robotico
- Mantieni l'obiettivo di aiutare il cliente
- Non ripetere informazioni già fornite
- Evita formule standard come "Budget? (Es: X-Y€)"
- Massimo 2 frasi per messaggio
- Dopo 5 domande di dettaglio, passa sempre alla fase 2
- Sii diretto e conciso
- VIETATO dire "perfetto", "ok" seguiti dalle info dell'utente

ESEMPI GIUSTI (CON OPZIONI CHIARE):
"Che tipo? (finestra, porta, scorrevole, a rullo...)"
"Che colore? (nero, bianco, marrone, grigio...)"
"Budget massimo? (50€, 100€, 200€, senza limite...)"
"Che materiale? (alluminio, legno, PVC, fibra di vetro...)"
"Che marca? (Nike, Adidas, nessuna preferenza...)"

ESEMPI FASE 2:
"In che zona cerchi? (centro, periferia, quartiere specifico...)"
"Quanto è urgente? (subito, entro 24h, qualche giorno...)"
"Come preferisci? (ritiro in negozio, spedizione, entrambe...)"

ESEMPI ASSOLUTAMENTE SBAGLIATI (NON FARE MAI):
"Ciao! Zanzariera orizzontale a rullo, perfetto. Di che materiale la vorresti?"
"Ok, scarpe da spinning per palestra con attacco..."
"Perfetto, rosa. Che taglia porti?"

RICORDA: Ogni domanda DEVE avere esempi concreti tra parentesi!

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

      return { 
        text: response, 
        generatedImage,
        productSchema: currentSchema,
        collectedData: collectedData
      };
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

  // Gestione intelligente basata su schede prodotto
  private async handleSchemaBasedChat(
    userMessage: string, 
    schema: ProductSchema, 
    collectedData: any, 
    conversationHistory: any[], 
    attachedFile?: {url: string, name: string, type: string}
  ): Promise<{text: string, generatedImage?: string, productSchema?: ProductSchema, collectedData?: any}> {
    
    // Estrai informazioni dal messaggio dell'utente
    const updatedData = await this.extractDataFromMessage(userMessage, schema, collectedData);
    
    // Controlla se abbiamo raccolto tutte le informazioni necessarie
    const validation = validateCollectedData(schema, updatedData);
    
    if (validation.isValid) {
      // Tutte le info raccolte, chiedi se passare alla configurazione
      return {
        text: "Perfetto! Ora dimmi in che zona stai cercando e quanto è urgente per te trovarlo.",
        productSchema: schema,
        collectedData: updatedData
      };
    }
    
    // Genera la prossima domanda intelligente
    const nextQuestion = generateSmartQuestion(schema, updatedData);
    
    if (nextQuestion) {
      const instruction = schema.assistantInstructions || "";
      const contextualQuestion = await this.generateContextualQuestion(nextQuestion, instruction, userMessage, conversationHistory);
      
      return {
        text: contextualQuestion,
        productSchema: schema,
        collectedData: updatedData
      };
    }
    
    // Fallback
    return {
      text: "Hai altre preferenze specifiche per questo prodotto?",
      productSchema: schema,
      collectedData: updatedData
    };
  }

  // Estrae dati dal messaggio dell'utente
  private async extractDataFromMessage(userMessage: string, schema: ProductSchema, existingData: any): Promise<any> {
    const message = userMessage.toLowerCase();
    const newData = { ...existingData };
    
    // Logica di estrazione semplificata (potrebbe essere migliorata con NLP)
    schema.fields.forEach(field => {
      if (!newData[field.key] && field.options) {
        const matchedOption = field.options.find(option => 
          message.includes(option.toLowerCase()) || 
          (option.includes('€') && message.includes('€'))
        );
        if (matchedOption) {
          newData[field.key] = matchedOption;
        }
      }
      
      // Estrazione numeri per taglie e prezzi
      if (!newData[field.key] && field.type === 'number') {
        const numberMatch = message.match(/\d+/);
        if (numberMatch && field.key === 'size') {
          const size = parseInt(numberMatch[0]);
          if (size >= 35 && size <= 50) { // Range ragionevole per scarpe
            newData[field.key] = size;
          }
        }
      }
      
      // Estrazione budget
      if (!newData[field.key] && field.key === 'budget') {
        const budgetMatch = message.match(/(\d+).*?(\d+).*?€|(\d+)\s*€/);
        if (budgetMatch) {
          newData[field.key] = budgetMatch[0];
        }
      }
    });
    
    return newData;
  }
  
  // Genera domanda contestuale usando l'AI
  private async generateContextualQuestion(baseQuestion: string, instruction: string, userMessage: string, history: any[]): Promise<string> {
    const prompt = `Sei Clemente. Fai questa domanda: "${baseQuestion}"

REGOLE PER IL TONO:
- Tono conversazionale, cordiale e amichevole
- Una domanda per volta, naturale e fluida
- Include esempi concreti tra parentesi quando utile
- Non essere robotico o troppo tecnico
- Mantieni l'obiettivo di raccogliere le info per la richiesta

Genera una domanda cordiale e naturale.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('❌ Errore generazione domanda:', error);
      return baseQuestion; // Fallback alla domanda base
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
  async generateRequestFromChat(conversationHistory?: ChatMessage[]): Promise<RequestData | null> {
    if (!this.model) return null;

    const historyToUse = conversationHistory || this.chatHistory;
    const conversationText = historyToUse
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