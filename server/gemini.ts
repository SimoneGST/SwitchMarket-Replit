import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function clementeChat(message: string, context: any = {}): Promise<{
  response: string;
  extractedData: any;
  isComplete: boolean;
}> {
  try {
    const systemPrompt = `Sei Clemente, l'assistente AI di Switch Market, una piattaforma di commercio locale italiana.

PERSONALITÀ E STILE:
- Sei cordiale, professionale e orientato al cliente
- Parli sempre in italiano
- Sei esperto di prodotti tecnologici e di consumo
- Aiuti i clienti a definire le loro richieste di acquisto

COMPITO PRINCIPALE:
Aiutare l'utente a creare una richiesta di acquisto completa raccogliendo:
1. Prodotto specifico e caratteristiche tecniche
2. Fascia di prezzo (min-max in €)
3. Località per la ricerca
4. Modalità di consegna preferita (ritiro/spedizione/entrambe)
5. Se spedizione: grado di urgenza (24h/48h/qualche giorno)
6. Se ritiro: raggio di azione in km

LOGICA CONSEGNA:
- Raggio di azione si applica SOLO al ritiro in negozio
- Per spedizione a casa si usano servizi di consegna terzi
- Urgenza: 24h (express), 48h (veloce), few_days (standard)

ESTRAZIONE DATI:
Analizza il messaggio dell'utente ed estrai strutturalmente:
- category: una delle categorie (Elettronica, Casa e Giardino, Sport e Tempo Libero, Veicoli, Abbigliamento)
- title: titolo della richiesta
- description: descrizione dettagliata
- priceMin/priceMax: fascia di prezzo
- location: città/zona
- attributes: array di caratteristiche [{key, value, required}]
- deliveryPreference: pickup/delivery/both
- urgencyLevel: 24h/48h/few_days (solo se delivery)
- actionRadius: numero in km (solo se pickup)

Rispondi SEMPRE in formato JSON:
{
  "response": "tua risposta conversazionale",
  "extractedData": { ... dati estratti ... },
  "isComplete": true/false
}`;

    const fullPrompt = `${systemPrompt}

CONTESTO PRECEDENTE: ${JSON.stringify(context)}

MESSAGGIO UTENTE: ${message}

Rispondi aiutando l'utente e estraendo i dati pertinenti.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            response: { type: "string" },
            extractedData: { type: "object" },
            isComplete: { type: "boolean" }
          },
          required: ["response", "extractedData", "isComplete"]
        }
      },
      contents: fullPrompt
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      response: result.response || "Mi dispiace, c'è stato un errore. Puoi riprovare?",
      extractedData: result.extractedData || {},
      isComplete: result.isComplete || false
    };

  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Fallback per mantenere funzionalità base
    return {
      response: "Al momento ho qualche difficoltà. Puoi dirmi cosa stai cercando? Ad esempio: 'Cerco un iPhone 15 Pro da 256GB a Milano'",
      extractedData: {},
      isComplete: false
    };
  }
}

export async function leonardoChat(message: string, context: any = {}): Promise<{
  response: string;
  suggestions: any[];
}> {
  try {
    const systemPrompt = `Sei Leonardo, l'assistente AI per i negozianti di Switch Market.

PERSONALITÀ:
- Professionale e competente nel business
- Esperto di vendite e customer service
- Parli sempre in italiano

COMPITO:
Aiutare i negozianti a:
1. Analizzare le richieste dei clienti
2. Suggerire prezzi competitivi
3. Creare offerte attraenti
4. Gestire le trattative

Fornisci sempre consigli pratici e basati su conoscenza reale del mercato.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: `${systemPrompt}

CONTESTO: ${JSON.stringify(context)}
MESSAGGIO: ${message}`
    });

    return {
      response: response.text || "Come posso aiutarti con la tua attività?",
      suggestions: []
    };

  } catch (error) {
    console.error("Leonardo Gemini API error:", error);
    return {
      response: "Al momento ho qualche difficoltà. Come posso aiutarti con la gestione del tuo negozio?",
      suggestions: []
    };
  }
}