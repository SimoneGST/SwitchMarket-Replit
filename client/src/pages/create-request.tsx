import { useState, useEffect } from "react";
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

export default function CreateRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Stati per la modalità di creazione
  const [mode, setMode] = useState<'quick' | 'chat' | 'manual'>('quick');
  const [clemente] = useState(() => new ClementeAI());
  
  // Stati per chat con Clemente
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isClementeTyping, setIsClementeTyping] = useState(false);
  const [quickInput, setQuickInput] = useState("");
  
  // Dati della richiesta
  const [requestData, setRequestData] = useState<Partial<RequestData>>({
    urgencyLevel: 'few_days',
    deliveryPreference: 'both',
    actionRadius: 20,
    location: ''
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestData) => {
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
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare la richiesta",
        variant: "destructive",
      });
    },
  });

  // Generazione rapida con input semplice
  const handleQuickGenerate = async () => {
    if (!quickInput.trim()) return;
    
    console.log('🚀 Avvio generazione rapida per:', quickInput);
    
    try {
      const generated = await clemente.quickGenerate(quickInput);
      console.log('📝 Risultato generazione:', generated);
      
      if (generated) {
        setRequestData(generated);
        setMode('manual');
        toast({
          title: "Richiesta generata!",
          description: "Clemente ha compilato i campi per te. Controlla e modifica se necessario.",
        });
      } else {
        toast({
          title: "Errore generazione",
          description: "Clemente non è riuscito a generare la richiesta. Prova la chat.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Errore generazione rapida:', error);
      toast({
        title: "Errore",
        description: "Errore nella generazione automatica",
        variant: "destructive",
      });
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
      console.log('📨 Risposta ricevuta:', response.substring(0, 50));
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Crea una Richiesta
        </h1>
        <p className="text-slate-600">
          Trova esattamente quello che cerchi con l'aiuto di Clemente
        </p>
      </div>

      {/* Modalità di creazione */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <Button
            variant={mode === 'quick' ? 'default' : 'ghost'}
            onClick={() => setMode('quick')}
            className={mode === 'quick' ? 'bg-green-600 text-white' : ''}
          >
            <i className="fas fa-bolt mr-2"></i>
            Generazione Rapida
          </Button>
          <Button
            variant={mode === 'chat' ? 'default' : 'ghost'}
            onClick={() => setMode('chat')}
            className={mode === 'chat' ? 'bg-green-600 text-white' : ''}
          >
            <i className="fas fa-comments mr-2"></i>
            Chat con Clemente
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
          {mode === 'quick' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <i className="fas fa-magic mr-2"></i>
                  Generazione Rapida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrivi cosa stai cercando
                  </label>
                  <Textarea
                    placeholder="Esempio: Cerco un laptop per gaming con scheda grafica potente, budget intorno ai 1500€"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleQuickGenerate}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!quickInput.trim()}
                >
                  <i className="fas fa-robot mr-2"></i>
                  Genera Richiesta Automaticamente
                </Button>
                <div className="text-xs text-slate-500">
                  <i className="fas fa-lightbulb mr-1"></i>
                  Clemente analizzerà il tuo input e compilerà automaticamente tutti i campi
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'chat' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <i className="fas fa-robot mr-2"></i>
                  Chat con Clemente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Messaggi chat */}
                <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-slate-50">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-slate-500 mt-20">
                      <i className="fas fa-robot text-4xl mb-4 text-green-500"></i>
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
                </div>

                {/* Input chat */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Scrivi a Clemente..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                    disabled={isClementeTyping}
                  />
                  <Button 
                    onClick={handleChatMessage}
                    disabled={!chatInput.trim() || isClementeTyping}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <i className="fas fa-paper-plane"></i>
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
                {(mode === 'quick' || mode === 'chat') && (
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
      </div>
    </main>
  );
}