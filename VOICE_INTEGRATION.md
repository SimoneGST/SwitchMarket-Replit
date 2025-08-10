# Integrazione Vocale Switch Market

## Panoramica

Switch Market ora supporta un'esperienza completamente vocale con Clemente AI, permettendo agli utenti di creare richieste usando solo la voce.

## Funzionalità Implementate

### 1. Text-to-Speech (TTS) - Clemente Parla
- **Voce Italiana**: Clemente usa sintesi vocale italiana con tono maschile
- **Controllo Utente**: Pulsante 🔊/🔇 per attivare/disattivare la voce
- **Indicatore Visuale**: Mostra "Parlando..." quando Clemente sta parlando
- **Velocità Ottimizzata**: Rate 0.9, Pitch 1.1 per naturalezza

### 2. Speech-to-Text (STT) - Riconoscimento Vocale
- **Modalità Chat Normale**: Pulsante 🎤 per dettare singoli messaggi
- **Modalità Vocale Continua**: Conversazione fluida hands-free
- **Riconoscimento Italiano**: Configurato per lingua italiana (it-IT)
- **Auto-invio**: I messaggi vengono inviati automaticamente quando completi

### 3. Comandi Vocali Globali
- **Scorciatoia**: Ctrl+M (Cmd+M su Mac) per attivare comandi vocali
- **Comandi Supportati**:
  - "Crea richiesta" → Vai alla pagina di creazione
  - "Parla con Clemente" → Attiva modalità vocale
  - "Genera richiesta" → Completa la richiesta corrente
  - "Stop" / "Ferma" → Interrompe la sintesi vocale

## Esperienza Utente

### Flusso Vocale Completo
1. **Attivazione**: Click su "🎤 Modalità Vocale"
2. **Conversazione**: Parla naturalmente con Clemente
3. **Risposte**: Clemente risponde sia per testo che vocalmente
4. **Generazione**: Automatica creazione richiesta dettagliata

### Esempio di Conversazione
```
Utente: "Ciao Clemente, sto cercando scarpe da spinning"
Clemente: [Vocale] "Perfetto! Che tipo di chiusura preferisci: boa, velcro o lacci?"
Utente: "Boa"
Clemente: [Vocale] "Ok, boa è una buona scelta! Hai un budget indicativo?"
```

## Integrazione Smart Speakers

### Google Assistant

#### Setup
1. Creare Action su Google Assistant Console
2. Configurare invocation name: "Switch Market"
3. Deploy webhook endpoint: `/api/google-assistant`

#### Manifest (actions.json)
```json
{
  "actions": [
    {
      "name": "actions.intent.MAIN",
      "fulfillment": {
        "conversationName": "switch-market"
      }
    }
  ],
  "conversations": {
    "switch-market": {
      "name": "switch-market",
      "url": "https://tu-dominio.replit.app/api/google-assistant"
    }
  }
}
```

#### Comandi Vocali Google
- "Ok Google, parla con Switch Market"
- "Ok Google, chiedi a Switch Market di cercare scarpe da running"

### Amazon Alexa

#### Setup
1. Creare skill su Alexa Developer Console
2. Configurare invocation name: "Switch Market"
3. Deploy webhook endpoint: `/api/alexa`

#### Interaction Model
```json
{
  "interactionModel": {
    "languageModel": {
      "invocationName": "switch market",
      "intents": [
        {
          "name": "CreateRequestIntent",
          "slots": [
            {
              "name": "product",
              "type": "AMAZON.SearchQuery"
            }
          ],
          "samples": [
            "voglio comprare {product}",
            "sto cercando {product}",
            "ho bisogno di {product}",
            "crea una richiesta per {product}"
          ]
        },
        {
          "name": "AMAZON.HelpIntent",
          "samples": ["aiuto", "cosa puoi fare"]
        }
      ]
    }
  }
}
```

#### Comandi Vocali Alexa
- "Alexa, apri Switch Market"
- "Alexa, chiedi a Switch Market di cercare una scrivania"

## Implementazione Tecnica

### API Endpoints

#### `/api/google-assistant` (POST)
Gestisce richieste da Google Assistant
```typescript
interface GoogleAssistantRequest {
  queryResult: {
    queryText: string;
    parameters: Record<string, any>;
  };
  session: string;
}
```

#### `/api/alexa` (POST)
Gestisce richieste da Alexa
```typescript
interface AlexaRequest {
  request: {
    type: string;
    intent?: {
      name: string;
      slots?: Record<string, any>;
    };
  };
  session: {
    sessionId: string;
  };
}
```

### Architettura Vocale

#### Componenti Principali
- **VoiceCommandProcessor**: Gestisce comandi vocali globali
- **ClementeVoice**: Integra TTS nel chat di Clemente
- **ContinuousRecognition**: Modalità conversazione hands-free
- **SmartSpeakerAdapter**: Bridge per Google/Alexa

#### Flusso Dati
1. **Input Vocale** → Speech Recognition API
2. **Elaborazione** → Clemente AI (Gemini)
3. **Output** → Text-to-Speech + UI Update
4. **Sincronizzazione** → Aggiornamento stato richiesta

## Configurazione Ambiente

### Variabili d'Ambiente Necessarie
```env
# API Keys per servizi vocali (opzionali - usa browser APIs)
GOOGLE_CLOUD_TTS_API_KEY=your_key_here
AZURE_SPEECH_API_KEY=your_key_here

# URLs per webhook smart speakers
GOOGLE_ASSISTANT_WEBHOOK_URL=https://tu-dominio.replit.app/api/google-assistant
ALEXA_WEBHOOK_URL=https://tu-dominio.replit.app/api/alexa
```

### Browser Support
- **Chrome/Edge**: Supporto completo Web Speech API
- **Firefox**: Supporto limitato TTS
- **Safari**: Supporto mobile iOS
- **Mobile**: Android Chrome, iOS Safari

## Sicurezza e Privacy

### Gestione Dati Vocali
- **Locale**: Elaborazione browser-side quando possibile
- **Non Persistenza**: Audio non salvato sui server
- **Crittografia**: HTTPS per trasmissione dati
- **Consenso**: Richiesta esplicita permessi microfono

### GDPR Compliance
- Informativa chiara sull'uso del microfono
- Possibilità di disabilitare completamente la voce
- Cancellazione automatica sessioni vocali

## Roadmap Futura

### Miglioramenti Pianificati
- **Voci Personalizzate**: Clemente con voce custom AI
- **Multilingue**: Supporto English, Spanish, French
- **Comando Hotword**: "Ehi Clemente" always-listening
- **Integrazione IoT**: Smart displays, car systems
- **Voice Analytics**: Metriche engagement vocale

### Integrazioni Avanzate
- **WhatsApp Business API**: Ordini vocali via chat
- **Microsoft Cortana**: Integrazione Windows
- **Samsung Bixby**: Dispositivi Samsung
- **Apple Siri Shortcuts**: iOS automation