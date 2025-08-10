// Sistema di comandi vocali per Switch Market

export interface VoiceCommand {
  command: string;
  patterns: string[];
  action: (params?: any) => void;
}

export class VoiceCommandProcessor {
  private commands: VoiceCommand[] = [];
  
  constructor() {
    this.initializeCommands();
  }
  
  private initializeCommands() {
    this.commands = [
      {
        command: 'create_request',
        patterns: [
          'crea richiesta',
          'nuova richiesta',
          'voglio comprare',
          'sto cercando',
          'ho bisogno di'
        ],
        action: () => {
          window.location.href = '/create-request';
        }
      },
      {
        command: 'start_voice_chat',
        patterns: [
          'parla con clemente',
          'attiva chat vocale',
          'modalità vocale',
          'assistente vocale'
        ],
        action: () => {
          // Trigger voice mode
          const event = new CustomEvent('startVoiceMode');
          window.dispatchEvent(event);
        }
      },
      {
        command: 'generate_request',
        patterns: [
          'genera richiesta',
          'crea la richiesta',
          'completa richiesta',
          'pubblica richiesta'
        ],
        action: () => {
          const event = new CustomEvent('generateRequest');
          window.dispatchEvent(event);
        }
      },
      {
        command: 'stop_voice',
        patterns: [
          'stop',
          'ferma',
          'basta',
          'silenzio'
        ],
        action: () => {
          speechSynthesis.cancel();
        }
      }
    ];
  }
  
  processVoiceInput(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase();
    
    for (const command of this.commands) {
      for (const pattern of command.patterns) {
        if (lowerTranscript.includes(pattern)) {
          console.log(`🎤 Comando vocale riconosciuto: ${command.command}`);
          command.action();
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Supporto per Google Assistant/Alexa
  generateGoogleActionManifest() {
    return {
      "actions.intent.MAIN": {
        "fulfillment": {
          "conversationName": "switch-market"
        }
      },
      "actions.intent.TEXT": {
        "fulfillment": {
          "conversationName": "switch-market"
        }
      }
    };
  }
  
  generateAlexaSkillManifest() {
    return {
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
                "ho bisogno di {product}"
              ]
            }
          ]
        }
      }
    };
  }
}

// Inizializza processore globale
export const voiceProcessor = new VoiceCommandProcessor();

// Setup listener globale per comandi vocali
let recognition: any = null;

export const initializeGlobalVoiceCommands = () => {
  if (typeof window === 'undefined') return;
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.lang = 'it-IT';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        voiceProcessor.processVoiceInput(transcript);
      };
      
      // Attiva con "Ehi Switch Market" o "Ok Switch Market"
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
          e.preventDefault();
          recognition?.start();
        }
      });
  }
};