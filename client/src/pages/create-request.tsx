import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ClementeAI, type RequestData, type ChatMessage } from "@/lib/clemente";
import CharacterIntro from "@/components/character-intro";
import { useCharacterIntro } from "@/hooks/useCharacterIntro";

export default function CreateRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Stati per la modalità di creazione
  const [mode, setMode] = useState<'chat' | 'manual'>('chat');
  const [clemente] = useState(() => new ClementeAI());
  
  // Character intro state
  const { showIntro, completeIntro } = useCharacterIntro('clemente');
  
  // Stati per chat con Clemente
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isClementeTyping, setIsClementeTyping] = useState(false);
  const [isClementeSpeaking, setIsClementeSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dati della richiesta
  const [requestData, setRequestData] = useState<Partial<RequestData>>({
    urgencyLevel: 'few_days',
    deliveryPreference: 'both',
    actionRadius: 20,
    location: ''
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestData) => {
      // Prima di creare la richiesta, verifica che il profilo sia completo
      const profile: any = await apiRequest("GET", "/api/profile");
      if (!profile || !profile.firstName || !profile.lastName || !profile.city || !profile.phone) {
        throw new Error("Devi completare il profilo prima di pubblicare una richiesta");
      }
      return apiRequest("POST", "/api/requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Richiesta creata!",
        description: "La tua richiesta è stata pubblicata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      if (error.message.includes("completare il profilo")) {
        toast({
          title: "Profilo incompleto",
          description: error.message,
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/profile-verification")}
              className="ml-2"
            >
              Completa Profilo
            </Button>
          ),
        });
      } else {
        toast({
          title: "Errore",
          description: error.message || "Impossibile creare la richiesta",
          variant: "destructive",
        });
      }
    },
  });

  // Aggiunge un messaggio di benvenuto all'inizio della chat
  const addWelcomeMessage = () => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Ciao! Sono Clemente, il tuo assistente AI per trovare prodotti. Puoi descrivermi cosa stai cercando in modo naturale - ad esempio 'cerco scarpe da running' o 'ho bisogno di una scrivania per casa'. Ti aiuterò a creare una richiesta dettagliata!",
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  };

  // Chat con Clemente
  const handleChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    console.log('💬 Invio messaggio a Clemente:', chatInput);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsClementeTyping(true);
    
    try {
      const response = await clemente.chatWithUser(chatInput);
      const responseText = typeof response === 'string' ? response : (response?.text || '');
      console.log('📨 Risposta ricevuta:', responseText.substring(0, 50));
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: typeof response === 'string' ? response : (response?.text || ''),
        timestamp: new Date(),
        aiGeneratedImage: typeof response === 'object' ? response?.generatedImage : undefined
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Far parlare Clemente se la voce è abilitata
      if (voiceEnabled) {
        setTimeout(() => {
          const messageText = typeof response === 'string' ? response : (response?.text || '');
          speakClementeMessage(messageText);
        }, 500);
      }
    } catch (error) {
      console.error('❌ Errore comunicazione chat:', error);
      toast({
        title: "Errore chat",
        description: "Problema nella comunicazione con Clemente",
        variant: "destructive",
      });
    } finally {
      setIsClementeTyping(false);
    }
  };

  // Genera richiesta dalla chat
  const handleGenerateFromChat = async () => {
    try {
      const generated = await clemente.generateRequestFromChat();
      if (generated) {
        setRequestData(generated);
        setMode('manual');
        toast({
          title: "Richiesta generata dalla chat!",
          description: "Clemente ha estratto tutte le informazioni dalla conversazione.",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare la richiesta dalla chat",
        variant: "destructive",
      });
    }
  };

  // Pubblica richiesta
  const handlePublish = () => {
    if (!requestData.title || !requestData.location || !requestData.category) {
      toast({
        title: "Dati mancanti",
        description: "Completa titolo, categoria e posizione per pubblicare",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate(requestData as RequestData);
  };

  // Aggiorna campo della richiesta
  const updateField = (field: keyof RequestData, value: any) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
  };

  // Scroll automatico solo per l'area messaggi della chat
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isClementeTyping]);

  // Funzione per far parlare Clemente
  const speakClementeMessage = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Ferma eventuali discorsi in corso
    speechSynthesis.cancel();
    
    setIsClementeSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    // Cerca una voce italiana maschile se disponibile
    const voices = speechSynthesis.getVoices();
    const italianVoice = voices.find(voice => 
      voice.lang.includes('it') && voice.name.toLowerCase().includes('male')
    ) || voices.find(voice => voice.lang.includes('it'));
    
    if (italianVoice) {
      utterance.voice = italianVoice;
    }
    
    utterance.onend = () => {
      setIsClementeSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsClementeSpeaking(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  // Comando vocale continuo per generazione richiesta
  const startContinuousVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Riconoscimento vocale non supportato');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';
    
    recognition.onstart = () => {
      toast({
        title: "🎤 Modalità Vocale Attiva",
        description: "Parla liberamente con Clemente per creare la tua richiesta",
      });
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      
      if (event.results[event.results.length - 1].isFinal) {
        // Simula invio messaggio quando la frase è completa
        setChatInput(transcript);
        setTimeout(() => handleChatMessage(), 100);
      }
    };
    
    recognition.onerror = () => {
      toast({
        title: "Errore riconoscimento vocale",
        description: "Riprova o usa la tastiera",
        variant: "destructive"
      });
    };
    
    recognition.start();
    
    // Ferma dopo 30 secondi di inattività
    setTimeout(() => {
      recognition.stop();
    }, 30000);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Cerca Prodotti
        </h1>
        <p className="text-slate-600">
          Trova esattamente quello che cerchi con l'aiuto di Clemente o compila manualmente
        </p>
      </div>

      {/* Modalità di creazione */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <Button
            variant={mode === 'chat' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('chat');
              if (chatMessages.length === 0) {
                addWelcomeMessage();
              }
            }}
            className={mode === 'chat' ? 'bg-green-600 text-white' : ''}
          >
            <img 
              src="/attached_assets/Clemente foto profilo_1754847201275.png" 
              alt="Clemente AI" 
              className="w-4 h-4 mr-2"
            />
            Parla con Clemente
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'ghost'}
            onClick={() => setMode('manual')}
            className={mode === 'manual' ? 'bg-green-600 text-white' : ''}
          >
            <i className="fas fa-edit mr-2"></i>
            Compilazione Manuale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pannello sinistro - Input/Chat */}
        <div>
          {mode === 'chat' && (
            <>
              {showIntro && (
                <div className="mb-4">
                  <CharacterIntro
                    character="clemente"
                    show={showIntro}
                    onComplete={() => {
                      completeIntro();
                      addWelcomeMessage();
                    }}
                  />
                </div>
              )}
              {!showIntro && (
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-green-700">
                  <div className="flex items-center">
                    <img 
                      src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                      alt="Clemente AI" 
                      className="w-5 h-5 mr-2"
                    />
                    Chat con Clemente
                    {isClementeSpeaking && (
                      <div className="ml-2 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                        <span className="text-xs text-green-600">Parlando...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={voiceEnabled ? 'bg-green-50' : 'bg-slate-50'}
                    >
                      {voiceEnabled ? '🔊' : '🔇'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startContinuousVoiceCommand}
                      className="bg-blue-50"
                    >
                      🎤 Modalità Vocale
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Messaggi chat */}
                <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-slate-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-slate-500 mt-20">
                      <div className="w-20 h-24 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                        <img 
                          src="/attached_assets/clemente a busto intero_1754847733100.png" 
                          alt="Clemente AI" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p>Ciao! Sono Clemente, il tuo assistente AI.</p>
                      <p>Dimmi cosa stai cercando e ti aiuterò a creare una richiesta precisa!</p>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white border border-slate-200'
                      }`}>
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isClementeTyping && (
                    <div className="text-left mb-4">
                      <div className="inline-block bg-white border border-slate-200 px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Elemento per scroll automatico */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input chat */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Scrivi a Clemente..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                      disabled={isClementeTyping}
                    />
                  </div>
                  
                  {/* File Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-3 py-2"
                    onClick={() => {
                      // Creo un input file temporaneo
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,application/pdf,.doc,.docx,.txt';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) {
                          Array.from(files).forEach(file => {
                            const fileName = file.name;
                            const fileUrl = URL.createObjectURL(file);
                            
                            setChatMessages(prev => [...prev, {
                              role: 'user',
                              content: `📎 File allegato: ${fileName}`,
                              timestamp: new Date()
                            }]);
                            
                            // Simula invio a Clemente per analisi file
                            setTimeout(() => {
                              setChatMessages(prev => [...prev, {
                                role: 'assistant',
                                content: `Ho ricevuto il file "${fileName}". Puoi descrivermi cosa rappresenta così posso aiutarti meglio con la richiesta?`,
                                timestamp: new Date()
                              }]);
                            }, 1000);
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    📎
                  </Button>

                  {/* Voice Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-3 py-2"
                    onClick={() => {
                      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        const recognition = new SpeechRecognition();
                        recognition.lang = 'it-IT';
                        recognition.onresult = (event: any) => {
                          const transcript = event.results[0][0].transcript;
                          setChatInput(transcript);
                        };
                        recognition.start();
                      } else {
                        alert('Riconoscimento vocale non supportato dal browser');
                      }
                    }}
                  >
                    🎤
                  </Button>
                  
                  <Button 
                    onClick={handleChatMessage}
                    disabled={!chatInput.trim() || isClementeTyping}
                    className="bg-green-600 hover:bg-green-700 px-4"
                  >
                    ✈️
                  </Button>
                </div>

                {/* Genera da chat */}
                {chatMessages.length > 2 && (
                  <Button 
                    onClick={handleGenerateFromChat}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <i className="fas fa-magic mr-2"></i>
                    Genera Richiesta dalla Conversazione
                  </Button>
                )}
              </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Pannello destro - Form richiesta */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-green-700">
                  <i className="fas fa-file-alt mr-2"></i>
                  Dettagli Richiesta
                </span>
                {mode === 'chat' && (
                  <Badge variant="outline" className="text-green-600">
                    Compilato da Clemente
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Titolo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo *
                </label>
                <Input
                  placeholder="Titolo della richiesta"
                  value={requestData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria *
                </label>
                <Select value={requestData.category || ''} onValueChange={(value) => updateField('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elettronica">Elettronica</SelectItem>
                    <SelectItem value="Casa e Giardino">Casa e Giardino</SelectItem>
                    <SelectItem value="Sport e Tempo Libero">Sport e Tempo Libero</SelectItem>
                    <SelectItem value="Veicoli">Veicoli</SelectItem>
                    <SelectItem value="Abbigliamento">Abbigliamento</SelectItem>
                    <SelectItem value="Servizi">Servizi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrizione
                </label>
                <Textarea
                  placeholder="Descrizione dettagliata"
                  value={requestData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Specifiche tecniche */}
              {requestData.technicalSpecs && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Specifiche Tecniche
                  </label>
                  <Textarea
                    value={requestData.technicalSpecs}
                    onChange={(e) => updateField('technicalSpecs', e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Dettagli prodotto in una griglia */}
              <div className="grid grid-cols-2 gap-4">
                {requestData.brand && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                    <Input
                      value={requestData.brand}
                      onChange={(e) => updateField('brand', e.target.value)}
                    />
                  </div>
                )}
                
                {requestData.model && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Modello</label>
                    <Input
                      value={requestData.model}
                      onChange={(e) => updateField('model', e.target.value)}
                    />
                  </div>
                )}
                
                {requestData.color && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Colore</label>
                    <Input
                      value={requestData.color}
                      onChange={(e) => updateField('color', e.target.value)}
                    />
                  </div>
                )}
                
                {requestData.size && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Dimensioni</label>
                    <Input
                      value={requestData.size}
                      onChange={(e) => updateField('size', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Budget (€)
                </label>
                <Input
                  type="number"
                  placeholder="Budget massimo"
                  value={requestData.budget || ''}
                  onChange={(e) => updateField('budget', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>

              {/* Posizione */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Posizione *
                </label>
                <Input
                  placeholder="Città"
                  value={requestData.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>

              {/* Preferenza consegna */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Modalità di Consegna
                </label>
                <Select value={requestData.deliveryPreference} onValueChange={(value) => updateField('deliveryPreference', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Solo Ritiro</SelectItem>
                    <SelectItem value="delivery">Solo Spedizione</SelectItem>
                    <SelectItem value="both">Entrambe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Raggio azione (solo se ritiro incluso) */}
              {(requestData.deliveryPreference === 'pickup' || requestData.deliveryPreference === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Raggio Massimo per Ritiro: {requestData.actionRadius}km
                  </label>
                  <Slider
                    value={[requestData.actionRadius || 20]}
                    onValueChange={(value) => updateField('actionRadius', value[0])}
                    max={100}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              {/* Urgenza */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Livello di Urgenza
                </label>
                <Select value={requestData.urgencyLevel} onValueChange={(value) => updateField('urgencyLevel', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediato (entro poche ore)</SelectItem>
                    <SelectItem value="24h">Entro 24 ore</SelectItem>
                    <SelectItem value="48h">Entro 48 ore</SelectItem>
                    <SelectItem value="few_days">Alcuni giorni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pubblica */}
              <Button 
                onClick={handlePublish}
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                disabled={createRequestMutation.isPending || !requestData.title || !requestData.category || !requestData.location}
              >
                {createRequestMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Pubblicazione...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Pubblica Richiesta
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Character Introduction */}
        <CharacterIntro
          character="clemente"
          show={showIntro}
          onComplete={completeIntro}
        />
      </div>
    </main>
  );
}