import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
// import VoiceSettings from "@/components/voice-settings";
import { ClementeAI } from "@/lib/clemente";
// import { useAuth } from "@/hooks/use-auth";
// import { trackEvent } from "@/lib/analytics";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'document' | 'other';
  aiGeneratedImage?: string;
}

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

interface VoiceSettings {
  clementeVoice: string;
  leonardoVoice: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceEnabled: boolean;
}

interface ProductSchema {
  category: string;
  requiredFields: string[];
  categorySpecificFields: string[];
  fieldDescriptions: Record<string, string>;
  fieldTypes: Record<string, 'text' | 'number' | 'select' | 'boolean'>;
  selectOptions?: Record<string, string[]>;
}

// TypeScript declarations for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
}

export default function BrowseRequests() {
  // Stati principali
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isClementeTyping, setIsClementeTyping] = useState(false);
  const [requestData, setRequestData] = useState<Partial<RequestData>>({
    urgencyLevel: '24h',
    deliveryPreference: 'both',
    actionRadius: 10,
    useProfileLocation: false,
    condition: 'new'
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [productSchema, setProductSchema] = useState<ProductSchema | null>(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  
  // Impostazioni vocali
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    clementeVoice: '',
    leonardoVoice: '',
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    voiceEnabled: false
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showCharacterIntro, setShowCharacterIntro] = useState(false);
  
  // Riferimenti
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Istanza Clemente
  const [clemente] = useState(() => new ClementeAI());
  // const { user } = useAuth();
  const queryClient = useQueryClient();

  // Scroll automatico della chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Trova il contenitore scrollabile dentro ScrollArea
      const scrollViewport = messagesContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Auto-scroll alla fine della chat
    scrollToBottom();
    
    // Auto-focus sull'input dopo ogni risposta di Clemente
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && !isClementeTyping) {
      // Delay per permettere allo scroll di completarsi e al TTS di partire
      setTimeout(() => {
        const inputElement = document.querySelector('textarea[placeholder*="Dimmi cosa stai cercando"]') as HTMLTextAreaElement;
        if (inputElement && document.activeElement !== inputElement) {
          inputElement.focus();
          // Posiziona il cursore alla fine del testo
          inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        }
      }, 800);
    }
  }, [chatMessages, isClementeTyping]);

  // Inizializza riconoscimento vocale
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognitionClass();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'it-IT';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Errore riconoscimento vocale:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }

    // Carica impostazioni vocali dal localStorage
    const savedSettings = localStorage.getItem('voiceSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setVoiceSettings({ ...settings, voiceEnabled: false }); // Volume sempre disattivato di default
      } catch (error) {
        console.error('Errore caricamento impostazioni vocali:', error);
      }
    }
  }, []);

  // Animazione introduttiva e messaggio di benvenuto
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('clemente_intro_seen');
    if (!hasSeenIntro) {
      setShowCharacterIntro(true);
      localStorage.setItem('clemente_intro_seen', 'true');
      
      // Auto-close animation after 3 seconds
      setTimeout(() => setShowCharacterIntro(false), 3000);
    }

    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ciao! Sono Clemente, il tuo assistente per trovare prodotti locali. Dimmi cosa stai cercando e ti aiuterò a creare una richiesta perfetta per i negozianti della tua zona.',
        timestamp: new Date()
      };
      
      // Aggiungi messaggio dopo l'animazione
      setTimeout(() => {
        setChatMessages([welcomeMessage]);
        if (voiceSettings.voiceEnabled) {
          setTimeout(() => speakClementeMessage(welcomeMessage.content), 500);
        }
      }, hasSeenIntro ? 0 : 3000);
    }
  }, []);

  // Calcola il progresso di completamento
  useEffect(() => {
    const baseRequiredFields = ['title', 'description', 'category', 'productName', 'location'];
    let allRequiredFields = [...baseRequiredFields];
    
    // Aggiungi campi specifici per categoria se esiste uno schema
    if (productSchema) {
      allRequiredFields = [...allRequiredFields, ...productSchema.requiredFields];
    }
    
    const filledFields = allRequiredFields.filter(field => {
      const value = requestData[field as keyof RequestData];
      return value !== undefined && value !== null && value !== '';
    });
    
    const progress = Math.max(20, (filledFields.length / allRequiredFields.length) * 100);
    setCompletionProgress(progress);
  }, [requestData, productSchema]);

  // Funzione Text-to-Speech per Clemente
  const speakClementeMessage = async (text: string) => {
    if (!voiceSettings.voiceEnabled || !text.trim()) return;

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configurazione voce
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === voiceSettings.clementeVoice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = voiceSettings.voiceSpeed;
      utterance.pitch = voiceSettings.voicePitch;
      utterance.lang = 'it-IT';
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Errore Text-to-Speech:', error);
    }
  };

  // Mutation per creare richiesta
  const createRequestMutation = useMutation({
    mutationFn: async (data: Partial<RequestData>) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Errore creazione richiesta');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      // trackEvent('request_created', 'user_journey', 'clemente_chat');
      
      const successMessage: ChatMessage = {
        role: 'assistant',
        content: '🎉 Perfetto! Ho creato la tua richiesta. I negozianti della zona la vedranno e ti contatteranno presto!',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, successMessage]);
      speakClementeMessage(successMessage.content);
      
      // Reset dati
      setRequestData({
        urgencyLevel: '24h',
        deliveryPreference: 'both',
        actionRadius: 10,
        useProfileLocation: false,
        condition: 'new'
      });
      setProductSchema(null);
      setCompletionProgress(0);
    },
    onError: (error) => {
      console.error('Errore creazione richiesta:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Mi dispiace, c\'è stato un errore nella creazione della richiesta. Puoi riprovare?',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  });

  // Invia messaggio a Clemente
  const sendMessage = async () => {
    if (!chatInput.trim() || isClementeTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsClementeTyping(true);

    try {
      const response = await clemente.chatWithUser(chatInput);

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        aiGeneratedImage: response.generatedImage
      };

      setChatMessages(prev => [...prev, aiMessage]);
      await speakClementeMessage(response.text);

    } catch (error) {
      console.error('Errore comunicazione con Clemente:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Mi dispiace, ho avuto un problema tecnico. Puoi riprovare?',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsClementeTyping(false);
    }
  };

  const updateVoiceSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('voiceSettings', JSON.stringify(newSettings));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Geolocalizzazione
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setRequestData(prev => ({
          ...prev,
          latitude,
          longitude,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
      },
      (error) => {
        console.error('Errore geolocalizzazione:', error);
        alert('Impossibile ottenere la posizione. Verifica le impostazioni del browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Funzioni helper per le etichette
  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'Immediato';
      case '24h': return 'Entro 24 ore';
      case '48h': return 'Entro 48 ore';
      case 'few_days': return 'Entro qualche giorno';
      default: return 'Non specificato';
    }
  };

  const getDeliveryLabel = (delivery: string) => {
    switch (delivery) {
      case 'pickup': return 'Solo ritiro in negozio';
      case 'delivery': return 'Solo consegna a domicilio';
      case 'both': return 'Ritiro o consegna';
      default: return 'Non specificato';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/attached_assets/Clemente foto profilo_1754847201275.png" 
              alt="Clemente AI" 
              className="w-16 h-16 rounded-full mr-4 border-4 border-green-300"
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Cerca Prodotti con Clemente</h1>
              <p className="text-lg text-slate-600">Il tuo assistente AI per trovare prodotti locali</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-12rem)]">
          {/* Colonna Chat Principale - Priorità su mobile */}
          <div className="flex-1 lg:w-2/3 min-w-0">
            <Card className="h-full flex flex-col shadow-xl border-2 border-green-200">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-100 to-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <CardTitle className="text-xl text-green-800">Chat con Clemente</CardTitle>
                      <p className="text-sm text-slate-600">Assistente AI specializzato in prodotti locali</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVoiceSettings(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }))}
                      className={`${voiceSettings.voiceEnabled ? 'text-green-600' : 'text-slate-400'} hover:text-slate-700`}
                      title={voiceSettings.voiceEnabled ? 'Disattiva audio' : 'Attiva audio'}
                    >
                      <i className={`fas ${voiceSettings.voiceEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isListening ? stopListening : startListening}
                      className={`${isListening ? 'text-red-500' : 'text-blue-600'} hover:text-slate-700`}
                      title={isListening ? 'Interrompi registrazione' : 'Parla al microfono'}
                      disabled={isClementeTyping}
                    >
                      <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} ${isListening ? 'animate-pulse' : ''}`}></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                {/* Messaggi Chat con altezza fissa */}
                <ScrollArea 
                  className="h-[450px] p-4"
                  ref={messagesContainerRef}
                >
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-green-100 text-slate-800 border border-green-200'
                        }`}>
                          {message.role === 'assistant' && (
                            <div className="flex items-center mb-2">
                              <span className="text-xs font-medium text-green-700">Clemente</span>
                            </div>
                          )}
                          
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          
                          {message.aiGeneratedImage && (
                            <div className="mt-3">
                              <img 
                                src={message.aiGeneratedImage} 
                                alt="Immagine generata da Clemente" 
                                className="max-w-full h-auto rounded-md border"
                              />
                            </div>
                          )}
                          
                          {message.fileUrl && (
                            <div className="mt-3 p-2 bg-slate-100 rounded border">
                              <div className="flex items-center text-xs text-slate-600">
                                <i className={`fas ${
                                  message.fileType === 'image' ? 'fa-image' : 
                                  message.fileType === 'document' ? 'fa-file-text' : 'fa-file'
                                } mr-2`}></i>
                                <span>{message.fileName || 'File allegato'}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className={`text-xs mt-2 opacity-70 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isClementeTyping && (
                      <div className="flex justify-start">
                        <div className="bg-green-100 border border-green-200 rounded-lg p-3 max-w-[80%]">
                          <div className="flex items-center mb-2">
                            <span className="text-xs font-medium text-green-700">Clemente</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="animate-bounce bg-green-400 w-2 h-2 rounded-full"></div>
                            <div className="animate-bounce bg-green-400 w-2 h-2 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                            <div className="animate-bounce bg-green-400 w-2 h-2 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={chatEndRef} />
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isListening ? "Sto ascoltando..." : "Dimmi cosa stai cercando..."}
                        className={`min-h-[60px] resize-none border-2 ${isListening ? 'border-red-300 bg-red-50' : 'border-green-200'} focus:border-green-400`}
                        disabled={isClementeTyping || isListening}
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={sendMessage}
                        disabled={!chatInput.trim() || isClementeTyping}
                        className="bg-green-600 hover:bg-green-700 text-white px-6"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <i className="fas fa-paperclip"></i>
                      </Button>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      // TODO: Handle file upload
                      console.log('File selezionato:', e.target.files?.[0]);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonna Richiesta in Costruzione - Sidebar */}
          <div className="w-full lg:w-1/3 lg:max-w-sm">
            <Card className="h-full lg:sticky lg:top-4 shadow-lg border-2 border-blue-200 flex flex-col">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-100 to-green-100">
                <CardTitle className="text-lg text-blue-800">Richiesta in Costruzione</CardTitle>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span>Completamento</span>
                    <span>{Math.round(completionProgress)}%</span>
                  </div>
                  <Progress value={completionProgress} className="h-2" />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* Campi base editabili */}
                <div>
                  <label className="text-sm font-medium text-slate-700">Nome Prodotto *</label>
                  <input
                    type="text"
                    value={requestData.productName || ''}
                    onChange={(e) => setRequestData(prev => ({ ...prev, productName: e.target.value }))}
                    className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                    placeholder="Es: Scarpe da spinning con chiusura BOA"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Descrizione</label>
                  <textarea
                    value={requestData.description || ''}
                    onChange={(e) => setRequestData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Aggiungi dettagli specifici..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Categoria</label>
                  <select
                    value={requestData.category || ''}
                    onChange={(e) => setRequestData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Seleziona categoria</option>
                    <option value="scarpe">Scarpe</option>
                    <option value="abbigliamento">Abbigliamento</option>
                    <option value="elettronica">Elettronica</option>
                    <option value="casa">Casa e Giardino</option>
                    <option value="sport">Sport e Tempo Libero</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                
                {/* Budget editabile */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Budget Min (€)</label>
                    <input
                      type="number"
                      value={requestData.budgetMin || ''}
                      onChange={(e) => setRequestData(prev => ({ ...prev, budgetMin: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Budget Max (€)</label>
                    <input
                      type="number"
                      value={requestData.budgetMax || ''}
                      onChange={(e) => setRequestData(prev => ({ ...prev, budgetMax: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                      placeholder="150"
                    />
                  </div>
                </div>

                {/* Localizzazione editabile */}
                <div>
                  <label className="text-sm font-medium text-slate-700">Posizione</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={requestData.location || ''}
                      onChange={(e) => setRequestData(prev => ({ ...prev, location: e.target.value }))}
                      className="flex-1 text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                      placeholder="Es: Milano centro, Via Roma 123"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      className="text-xs"
                    >
                      <i className="fas fa-map-marker-alt"></i>
                    </Button>
                  </div>
                  {userLocation && (
                    <p className="text-xs text-slate-500 mt-1">
                      GPS: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Specifiche prodotto editabili */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Specifiche Prodotto</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-600">Marca</label>
                        <input
                          type="text"
                          value={requestData.brand || ''}
                          onChange={(e) => setRequestData(prev => ({ ...prev, brand: e.target.value }))}
                          className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                          placeholder="Nike, Adidas..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Modello</label>
                        <input
                          type="text"
                          value={requestData.model || ''}
                          onChange={(e) => setRequestData(prev => ({ ...prev, model: e.target.value }))}
                          className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                          placeholder="Air Force 1..."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-600">Taglia/Misura</label>
                        <input
                          type="text"
                          value={requestData.size || ''}
                          onChange={(e) => setRequestData(prev => ({ ...prev, size: e.target.value }))}
                          className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                          placeholder="42, L, XL..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Colore</label>
                        <input
                          type="text"
                          value={requestData.color || ''}
                          onChange={(e) => setRequestData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                          placeholder="nero, bianco..."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-600">Materiale</label>
                        <input
                          type="text"
                          value={requestData.material || ''}
                          onChange={(e) => setRequestData(prev => ({ ...prev, material: e.target.value }))}
                          className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                          placeholder="pelle, tessuto..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Condizione</label>
                        <select
                          value={requestData.condition || ''}
                          onChange={(e) => setRequestData(prev => ({ ...prev, condition: e.target.value as 'new' | 'used' | 'refurbished' }))}
                          className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Scegli</option>
                          <option value="new">Nuovo</option>
                          <option value="used">Usato</option>
                          <option value="refurbished">Ricondizionato</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Consegna e urgenza editabili */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Urgenza</label>
                    <select
                      value={requestData.urgencyLevel || ''}
                      onChange={(e) => setRequestData(prev => ({ ...prev, urgencyLevel: e.target.value as 'immediate' | '24h' | '48h' | 'few_days' }))}
                      className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Seleziona urgenza</option>
                      <option value="immediate">Immediato (entro oggi)</option>
                      <option value="24h">Entro 24 ore</option>
                      <option value="48h">Entro 48 ore</option>
                      <option value="few_days">Entro qualche giorno</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Modalità Consegna</label>
                    <select
                      value={requestData.deliveryPreference || ''}
                      onChange={(e) => setRequestData(prev => ({ ...prev, deliveryPreference: e.target.value as 'pickup' | 'delivery' | 'both' }))}
                      className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Seleziona modalità</option>
                      <option value="pickup">Solo ritiro in negozio</option>
                      <option value="delivery">Solo consegna a domicilio</option>
                      <option value="both">Ritiro o consegna</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Raggio di Azione (km)</label>
                    <input
                      type="number"
                      value={requestData.actionRadius || ''}
                      onChange={(e) => setRequestData(prev => ({ ...prev, actionRadius: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full text-sm bg-white p-2 rounded border border-slate-300 focus:border-blue-500 focus:outline-none"
                      placeholder="10"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <Separator />

                {/* Pulsanti di controllo */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestData({
                      title: '',
                      description: '',
                      category: '',
                      productName: '',
                      location: '',
                      urgencyLevel: 'few_days',
                      deliveryPreference: 'both',
                      actionRadius: 10
                    })}
                    className="flex-1"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Salva in localStorage
                      localStorage.setItem('switchmarket_draft_request', JSON.stringify(requestData));
                      alert('Bozza salvata!');
                    }}
                    className="flex-1"
                  >
                    <i className="fas fa-save mr-1"></i>
                    Salva
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Test rapido per verificare la connessione Clemente
                      setChatInput('');
                      const testMessage: ChatMessage = {
                        role: 'user',
                        content: 'ciao',
                        timestamp: new Date()
                      };
                      setChatMessages(prev => [...prev, testMessage]);
                      setIsClementeTyping(true);
                      
                      try {
                        const response = await clemente.chatWithUser('ciao');
                        const aiMessage: ChatMessage = {
                          role: 'assistant',
                          content: response.text,
                          timestamp: new Date()
                        };
                        setChatMessages(prev => [...prev, aiMessage]);
                      } catch (error) {
                        console.error('Test fallito:', error);
                        const errorMessage: ChatMessage = {
                          role: 'assistant',
                          content: 'Test di connessione fallito.',
                          timestamp: new Date()
                        };
                        setChatMessages(prev => [...prev, errorMessage]);
                      } finally {
                        setIsClementeTyping(false);
                      }
                    }}
                    title="Testa la connessione con Clemente"
                  >
                    <i className="fas fa-lightning mr-1"></i>
                    Test
                  </Button>
                </div>

                {/* Pulsante creazione richiesta */}
                {completionProgress >= 75 && (
                  <div className="pt-4">
                    <Button
                      onClick={() => createRequestMutation.mutate(requestData)}
                      disabled={createRequestMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      {createRequestMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Creazione...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-rocket mr-2"></i>
                          Pubblica Richiesta
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Character Introduction Animation */}
      {showCharacterIntro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <img 
                src="/attached_assets/clemente a busto intero_1754847733100.png" 
                alt="Clemente AI" 
                className="w-32 h-40 mx-auto animate-pulse"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Benvenuto!</h2>
            <p className="text-slate-600 mb-4">
              Sono Clemente, il tuo assistente AI per trovare prodotti locali. 
              Ti aiuterò a creare richieste perfette per i negozianti della tua zona.
            </p>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <div className="animate-bounce w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="animate-bounce w-2 h-2 bg-green-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
              <div className="animate-bounce w-2 h-2 bg-green-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}


    </main>
  );
}