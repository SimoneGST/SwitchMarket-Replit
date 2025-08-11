import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CharacterIntro from '@/components/character-intro';
import { useCharacterIntro } from '@/hooks/useCharacterIntro';
import VoiceSettings from '@/components/voice-settings';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { ClementeAI } from '@/lib/clemente';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  aiGeneratedImage?: string;
}

interface RequestData {
  title?: string;
  category?: string;
  description?: string;
  [key: string]: any;
}

interface ProductSchemaState {
  isActive: boolean;
  currentSchema: any;
  collectedData: Record<string, any>;
}

export default function CreateRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modalità fissa: solo chat con Clemente
  const [clemente] = useState(() => new ClementeAI());
  
  // Character intro state - mostrato per i primi 3 accessi
  const { showIntro, completeIntro, neverShowAgain } = useCharacterIntro('clemente');
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isClementeTyping, setIsClementeTyping] = useState(false);
  const [isClementeSpeaking, setIsClementeSpeaking] = useState(false);
  const [productSchema, setProductSchema] = useState<ProductSchemaState>({
    isActive: false,
    currentSchema: null,
    collectedData: {}
  });
  
  // Impostazioni vocali
  const { settings: voiceSettings, updateVoiceSettings, speakWithSettings } = useVoiceSettings();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Request data state
  const [requestData, setRequestData] = useState<RequestData>({});

  // Mutation per creare richiesta
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Errore nella creazione della richiesta');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta pubblicata!",
        description: "La tua richiesta è stata inviata ai negozianti locali.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      // Reindirizza alla dashboard
      window.location.href = '/customer-dashboard';
    },
    onError: (error: any) => {
      toast({
        title: "Errore pubblicazione",
        description: error.message || "Si è verificato un errore durante la pubblicazione",
        variant: "destructive",
      });
    }
  });

  // Messaggio di benvenuto automatico
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ciao! Sono Clemente, il tuo assistente AI. Dimmi cosa stai cercando e ti aiuterò a creare una richiesta precisa per i negozianti della tua zona!',
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  // Gestione invio messaggio chat
  const handleChatMessage = async () => {
    if (!chatInput.trim() || isClementeTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsClementeTyping(true);

    try {
      const response = await fetch('/api/clemente/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput.trim(),
          conversationHistory: [...chatMessages, userMessage],
          currentSchema: productSchema.isActive ? productSchema.currentSchema : null,
          collectedData: productSchema.collectedData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const responseText = responseData.response?.message || responseData.message || 'Mi dispiace, non riesco a rispondere.';
      
      // Gestisci schede prodotto dinamiche
      if (responseData.response?.productSchema) {
        setProductSchema(prev => ({
          ...prev,
          isActive: true,
          currentSchema: responseData.response.productSchema,
          collectedData: responseData.response.collectedData || {}
        }));
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        aiGeneratedImage: responseData.response?.generatedImage
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Auto-genera la richiesta se Clemente indica che è pronto
      if (responseText.toLowerCase().includes('genero la richiesta') ||
          responseText.toLowerCase().includes('creo subito la richiesta') ||
          (responseText.toLowerCase().includes('genera') && responseText.toLowerCase().includes('richiesta'))) {
        setTimeout(() => {
          handleGenerateFromChat();
        }, 1000);
      }
      
      // Sintesi vocale se abilitata
      if (voiceSettings.voiceEnabled) {
        setTimeout(() => {
          speakClementeMessage(responseText);
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
      const response = await fetch('/api/clemente/generate-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: chatMessages
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.requestData) {
        setRequestData(responseData.requestData);
        toast({
          title: "Richiesta generata dalla chat!",
          description: "Clemente ha estratto tutte le informazioni dalla conversazione.",
        });
        
        // Pubblica automaticamente la richiesta
        setTimeout(() => {
          handlePublish();
        }, 1500);
      } else {
        throw new Error('Dati richiesta non validi');
      }
    } catch (error) {
      console.error('Errore generazione da chat:', error);
      toast({
        title: "Errore generazione",
        description: "Non riesco a generare la richiesta dalla chat.",
        variant: "destructive",
      });
    }
  };

  // Pubblica richiesta
  const handlePublish = () => {
    // Verifica completamento profilo
    if (!user || !user.firstName || !user.lastName || !user.email) {
      toast({
        title: "Profilo incompleto",
        description: "Completa il tuo profilo prima di pubblicare una richiesta.",
        variant: "destructive",
      });
      window.location.href = '/profile';
      return;
    }

    if (!requestData.title || !requestData.category) {
      toast({
        title: "Dati mancanti",
        description: "Clemente deve raccogliere più informazioni prima di pubblicare",
        variant: "destructive",
      });
      return;
    }

    const finalRequestData = {
      ...requestData,
      aiContext: {
        messages: chatMessages,
        extractedSpecs: chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].content : ''
      }
    };

    createRequestMutation.mutate(finalRequestData);
  };

  // Scroll automatico
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

  const speakClementeMessage = async (text: string) => {
    if (!voiceSettings?.voiceEnabled) return;
    
    setIsClementeSpeaking(true);
    
    try {
      await speakWithSettings(text, 'clemente');
    } catch (error) {
      console.error('Errore sintesi vocale:', error);
    } finally {
      setIsClementeSpeaking(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4 overflow-hidden">
              <img 
                src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                alt="Clemente AI" 
                className="w-14 h-14 rounded-lg object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Parla con Clemente
              </h1>
              <p className="text-green-100 text-lg">
                Trova quello che cerchi con il tuo assistente AI
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Chat con Clemente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-green-700">
              <div className="flex items-center">
                <img 
                  src="/attached_assets/clemente a busto intero_1754847733100.png" 
                  alt="Clemente AI" 
                  className="w-6 h-6 mr-2"
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
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="bg-green-50"
                >
                  <i className="fas fa-cog mr-1"></i>
                  Voce
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateVoiceSettings({...voiceSettings, voiceEnabled: !voiceSettings.voiceEnabled})}
                  className={voiceSettings.voiceEnabled ? 'bg-green-50' : 'bg-slate-50'}
                >
                  {voiceSettings.voiceEnabled ? '🔊' : '🔇'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          {/* Pannello Impostazioni Vocali */}
          {showVoiceSettings && (
            <div className="px-6 pb-4 border-b">
              <VoiceSettings 
                settings={voiceSettings}
                onSettingsChange={updateVoiceSettings}
              />
            </div>
          )}
          
          <CardContent>
            {/* Messaggi chat */}
            <div className="h-96 overflow-y-auto border rounded-lg mb-4 bg-slate-50 flex flex-col p-4">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <div className="flex-1 flex items-center justify-center w-full max-h-64">
                    <img 
                      src="/attached_assets/clemente a busto intero_1754847733100.png" 
                      alt="Clemente AI" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="font-semibold">Ciao! Sono Clemente, il tuo assistente AI.</p>
                    <p>Dimmi cosa stai cercando e ti aiuterò a creare una richiesta precisa!</p>
                  </div>
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input chat */}
            <div className="flex gap-2">
              <Input
                placeholder="Scrivi qui cosa stai cercando..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                disabled={isClementeTyping}
                className="flex-1"
              />
              
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
      </div>
      
      {/* Character Introduction */}
      {showIntro && (
        <div className="fixed inset-0 z-50">
          <CharacterIntro
            character="clemente"
            show={showIntro}
            onComplete={completeIntro}
            onNeverShow={neverShowAgain}
          />
        </div>
      )}
    </main>
  );
}