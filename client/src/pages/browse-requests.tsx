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
  optionalFields: string[];
  fieldDescriptions: Record<string, string>;
}

export default function BrowseRequests() {
  // Stati principali
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isClementeTyping, setIsClementeTyping] = useState(false);
  const [requestData, setRequestData] = useState<Partial<RequestData>>({
    urgencyLevel: '24h',
    deliveryPreference: 'both',
    actionRadius: 10
  });
  const [productSchema, setProductSchema] = useState<ProductSchema | null>(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  
  // Impostazioni vocali
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    clementeVoice: '',
    leonardoVoice: '',
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    voiceEnabled: true
  });
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
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isClementeTyping]);

  // Carica impostazioni vocali dal localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('voiceSettings');
    if (savedSettings) {
      try {
        setVoiceSettings(JSON.parse(savedSettings));
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
    const requiredFields = ['title', 'description', 'category', 'location'];
    const completedFields = requiredFields.filter(field => requestData[field as keyof RequestData]);
    setCompletionProgress((completedFields.length / requiredFields.length) * 100);
  }, [requestData]);

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
        actionRadius: 10
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

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUrgencyLabel = (urgency: string) => {
    const labels = {
      'immediate': 'Immediato',
      '24h': '24 ore',
      '48h': '48 ore',
      'few_days': 'Qualche giorno'
    };
    return labels[urgency as keyof typeof labels] || urgency;
  };

  const getDeliveryLabel = (delivery: string) => {
    const labels = {
      'pickup': 'Ritiro in negozio',
      'delivery': 'Consegna a domicilio',
      'both': 'Entrambi'
    };
    return labels[delivery as keyof typeof labels] || delivery;
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Colonna Chat Centrale */}
          <div className="lg:col-span-2 order-1">
            <Card className="h-[700px] flex flex-col shadow-xl border-2 border-green-200">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-100 to-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <CardTitle className="text-xl text-green-800">Chat con Clemente</CardTitle>
                      <p className="text-sm text-slate-600">Assistente AI specializzato in prodotti locali</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVoiceSettings(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }))}
                    className={`${voiceSettings.voiceEnabled ? 'text-green-600' : 'text-slate-400'} hover:text-slate-700`}
                  >
                    <i className={`fas ${voiceSettings.voiceEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                {/* Messaggi Chat */}
                <ScrollArea 
                  className="flex-1 p-4"
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
                        placeholder="Dimmi cosa stai cercando..."
                        className="min-h-[60px] resize-none border-2 border-green-200 focus:border-green-400"
                        disabled={isClementeTyping}
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

          {/* Colonna Richiesta in Costruzione */}
          <div className="order-2">
            <Card className="sticky top-4 shadow-lg border-2 border-blue-200">
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
              
              <CardContent className="space-y-4">
                {/* Informazioni di base */}
                {requestData.title && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Prodotto</label>
                    <p className="text-sm bg-slate-50 p-2 rounded border">{requestData.title}</p>
                  </div>
                )}
                
                {requestData.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Descrizione</label>
                    <p className="text-sm bg-slate-50 p-2 rounded border">{requestData.description}</p>
                  </div>
                )}
                
                {requestData.category && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Categoria</label>
                    <Badge variant="secondary" className="block w-fit mt-1">{requestData.category}</Badge>
                  </div>
                )}
                
                {requestData.budget && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Budget</label>
                    <p className="text-sm bg-green-50 p-2 rounded border text-green-800 font-medium">
                      €{requestData.budget}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Dettagli tecnici */}
                {(requestData.brand || requestData.model || requestData.size || requestData.color) && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Specifiche Tecniche</label>
                    <div className="space-y-2">
                      {requestData.brand && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Marca:</span>
                          <span className="font-medium">{requestData.brand}</span>
                        </div>
                      )}
                      {requestData.model && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Modello:</span>
                          <span className="font-medium">{requestData.model}</span>
                        </div>
                      )}
                      {requestData.size && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Taglia:</span>
                          <span className="font-medium">{requestData.size}</span>
                        </div>
                      )}
                      {requestData.color && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Colore:</span>
                          <span className="font-medium">{requestData.color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Preferenze consegna */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Urgenza</label>
                    <Badge variant="outline" className="block w-fit mt-1">
                      {getUrgencyLabel(requestData.urgencyLevel || '')}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Consegna</label>
                    <Badge variant="outline" className="block w-fit mt-1">
                      {getDeliveryLabel(requestData.deliveryPreference || '')}
                    </Badge>
                  </div>
                  
                  {requestData.actionRadius && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">Raggio di azione</label>
                      <p className="text-sm bg-blue-50 p-2 rounded border text-blue-800">
                        {requestData.actionRadius} km
                      </p>
                    </div>
                  )}
                  
                  {requestData.location && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">Posizione</label>
                      <p className="text-sm bg-slate-50 p-2 rounded border">{requestData.location}</p>
                    </div>
                  )}
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