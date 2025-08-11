import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import RequestCard from "@/components/request-card";
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

export default function BrowseRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modalità: tab attiva (browse o create)
  const [activeTab, setActiveTab] = useState("browse");
  
  // Filtri per browsing
  const [filters, setFilters] = useState({
    search: "",
    location: "Milano, MI",
    category: "",
    priceMin: "",
    priceMax: "",
    status: "open",
  });
  
  // Stati per creazione richiesta con Clemente
  const [clemente] = useState(() => new ClementeAI());
  const { showIntro, completeIntro, neverShowAgain } = useCharacterIntro('clemente');
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
  const { settings: voiceSettings, updateSettings: updateVoiceSettings, speakWithSettings } = useVoiceSettings();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Request data state
  const [requestData, setRequestData] = useState<RequestData>({});

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["/api/requests", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/requests?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Non autenticato, restituisce array vuoto invece di errore
          return [];
        }
        throw new Error(`Errore: ${response.status}`);
      }
      
      return response.json();
    },
  });

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
    },
    onError: (error: any) => {
      toast({
        title: "Errore pubblicazione",
        description: error.message || "Si è verificato un errore durante la pubblicazione",
        variant: "destructive",
      });
    }
  });

  // Messaggio di benvenuto automatico per chat
  useEffect(() => {
    if (activeTab === "create" && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ciao! Sono Clemente, il tuo assistente AI. Dimmi cosa stai cercando e ti aiuterò a creare una richiesta precisa per i negozianti della tua zona!',
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [activeTab, chatMessages.length]);

  // Auto-scroll per chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
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

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con tabs */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <img 
            src="/attached_assets/Clemente foto profilo_1754847201275.png" 
            alt="Clemente AI" 
            className="w-10 h-10 rounded-full mr-4 border-2 border-green-300"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cerca Prodotti</h1>
            <p className="text-slate-600">Trova quello che cerchi o crea una nuova richiesta con Clemente</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <i className="fas fa-search"></i>
              Esplora Richieste
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <i className="fas fa-plus"></i>
              Crea con Clemente
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Filtri</h3>
              
              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Posizione</label>
                <div className="relative">
                  <Input
                    placeholder="Inserisci città"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="pl-10"
                  />
                  <i className="fas fa-map-marker-alt text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"></i>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    <SelectItem value="Elettronica">Elettronica</SelectItem>
                    <SelectItem value="Casa e Giardino">Casa e Giardino</SelectItem>
                    <SelectItem value="Sport e Tempo Libero">Sport e Tempo Libero</SelectItem>
                    <SelectItem value="Veicoli">Veicoli</SelectItem>
                    <SelectItem value="Abbigliamento">Abbigliamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fascia di Prezzo</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Stato</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Checkbox 
                      checked={filters.status === 'open'}
                      onCheckedChange={(checked) => updateFilter('status', checked ? 'open' : '')}
                    />
                    <span className="ml-2 text-sm text-slate-600">Aperte</span>
                  </label>
                  <label className="flex items-center">
                    <Checkbox 
                      checked={filters.status === 'negotiating'}
                      onCheckedChange={(checked) => updateFilter('status', checked ? 'negotiating' : '')}
                    />
                    <span className="ml-2 text-sm text-slate-600">In negoziazione</span>
                  </label>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                <i className="fas fa-search mr-2"></i>
                Applica Filtri
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:w-3/4">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Input
                  placeholder="Cosa stai cercando?"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-12 pr-20 py-3 text-lg"
                />
                <i className="fas fa-search text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 text-lg"></i>
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  Cerca
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img 
                src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                alt="Leonardo AI" 
                className="w-8 h-8 rounded-full mr-3 border-2 border-blue-300"
              />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Richieste Trovate</h2>
                <p className="text-sm text-slate-500">
                  {requests.length} risultati per "{filters.search || 'tutte le richieste'}" a {filters.location}
                </p>
              </div>
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Più recenti</SelectItem>
                <SelectItem value="price-high">Prezzo più alto</SelectItem>
                <SelectItem value="price-low">Prezzo più basso</SelectItem>
                <SelectItem value="distance">Distanza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Request Cards Grid */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Caricamento richieste...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
                  <i className="fas fa-search text-slate-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nessuna richiesta trovata</h3>
                <p className="text-slate-500">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              requests.map((request: any) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>

          {/* Pagination */}
          {requests.length > 0 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-slate-500">Mostrando 1-{requests.length} di {requests.length} risultati</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button size="sm" className="bg-primary text-white">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>
          )}
            </div>
          </div>
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chat Section */}
              <div className="order-2 lg:order-1">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img 
                          src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                          alt="Clemente AI" 
                          className="w-8 h-8 rounded-full mr-3 border-2 border-green-300"
                        />
                        <div>
                          <CardTitle className="text-lg">Chat con Clemente</CardTitle>
                          <p className="text-sm text-slate-500">Il tuo assistente AI per creare richieste</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVoiceSettings(true)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <i className="fas fa-cog"></i>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-primary text-white' 
                              : 'bg-slate-100 text-slate-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            {message.aiGeneratedImage && (
                              <img 
                                src={message.aiGeneratedImage} 
                                alt="AI Generated" 
                                className="mt-2 rounded-lg max-w-full"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isClementeTyping && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Dimmi cosa stai cercando..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="pr-12"
                          />
                          {isClementeSpeaking && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || isClementeTyping}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Clemente Preview */}
              <div className="order-1 lg:order-2">
                <Card className="h-[600px] bg-gradient-to-b from-green-50 to-green-100">
                  <CardContent className="h-full flex flex-col justify-center items-center p-6">
                    <div className="text-center">
                      <img 
                        src="/attached_assets/clemente a busto intero_1754847733100.png" 
                        alt="Clemente assistente AI" 
                        className="w-48 h-auto mx-auto mb-6 rounded-2xl shadow-lg"
                      />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Ciao! Sono Clemente
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Il tuo assistente AI per trovare i prodotti perfetti
                      </p>
                      <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex items-center justify-center">
                          <i className="fas fa-check-circle text-green-500 mr-2"></i>
                          <span>Analisi intelligente delle tue esigenze</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <i className="fas fa-check-circle text-green-500 mr-2"></i>
                          <span>Ricerca locale personalizzata</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <i className="fas fa-check-circle text-green-500 mr-2"></i>
                          <span>Connessione diretta con negozianti</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Character Introduction Modal */}
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

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <VoiceSettings 
          settings={voiceSettings}
          onSettingsChange={updateVoiceSettings}
        />
      )}
    </main>
  );
}
