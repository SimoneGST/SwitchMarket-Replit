import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import ClementeChat from "@/components/clemente-chat";

export default function CreateRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [requestData, setRequestData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    priceMin: "",
    priceMax: "",
    location: "",
    actionRadius: 10,
    deliveryPreference: "both",
    urgencyLevel: "few_days",
    attributes: [] as any[],
    keywords: [] as string[],
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/requests", {
        ...data,
        priceMin: data.priceMin ? parseFloat(data.priceMin) : null,
        priceMax: data.priceMax ? parseFloat(data.priceMax) : null,
      });
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

  const handleDataUpdate = (newData: any) => {
    setRequestData(prev => ({ ...prev, ...newData }));
  };

  const handlePublish = () => {
    if (!requestData.title || !requestData.location || !requestData.category) {
      toast({
        title: "Dati mancanti",
        description: "Completa tutti i campi obbligatori per pubblicare la richiesta",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate(requestData);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary to-secondary text-white">
          <h2 className="text-xl font-semibold flex items-center">
            <i className="fas fa-robot mr-3"></i>
            Crea la tua richiesta con l'aiuto di Clemente
          </h2>
          <p className="text-sm opacity-90 mt-1">Il tuo assistente AI ti guiderà passo dopo passo per creare la richiesta perfetta</p>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Chat Interface with Clemente */}
          <div className="lg:w-1/2 border-r border-slate-200">
            <ClementeChat onDataUpdate={handleDataUpdate} />
          </div>

          {/* Request Preview */}
          <div className="lg:w-1/2 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Anteprima della tua richiesta</h3>
            
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Titolo</label>
                <Input
                  value={requestData.title}
                  onChange={(e) => setRequestData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Descrivi cosa stai cercando"
                />
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <Select 
                  value={requestData.category} 
                  onValueChange={(value) => setRequestData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elettronica">Elettronica</SelectItem>
                    <SelectItem value="Casa e Giardino">Casa e Giardino</SelectItem>
                    <SelectItem value="Sport e Tempo Libero">Sport e Tempo Libero</SelectItem>
                    <SelectItem value="Veicoli">Veicoli</SelectItem>
                    <SelectItem value="Abbigliamento">Abbigliamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fascia di prezzo</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min €"
                    value={requestData.priceMin}
                    onChange={(e) => setRequestData(prev => ({ ...prev, priceMin: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max €"
                    value={requestData.priceMax}
                    onChange={(e) => setRequestData(prev => ({ ...prev, priceMax: e.target.value }))}
                  />
                </div>
              </div>

              {requestData.attributes.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Caratteristiche richieste</label>
                  <div className="space-y-2">
                    {requestData.attributes.map((attr: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">{attr.key}: {attr.value}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          attr.required 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {attr.required ? 'Obbligatorio' : 'Preferito'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Posizione</label>
                <div className="relative">
                  <Input
                    value={requestData.location}
                    onChange={(e) => setRequestData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Inserisci la tua città"
                    className="pl-10"
                  />
                  <i className="fas fa-map-marker-alt text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"></i>
                </div>
              </div>

              {/* Raggio di azione - solo per ritiro */}
              {(requestData.deliveryPreference === 'pickup' || requestData.deliveryPreference === 'both') && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <i className="fas fa-walking mr-2"></i>
                    Raggio di azione per ritiro
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Quanto sei disposto a spostarti per ritirare il prodotto?</p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={requestData.actionRadius}
                        onChange={(e) => setRequestData(prev => ({ ...prev, actionRadius: parseInt(e.target.value) || 10 }))}
                        className="w-20"
                      />
                      <span className="text-sm text-slate-600">km dalla mia posizione</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      <i className="fas fa-info-circle mr-1"></i>
                      I negozianti entro questo raggio vedranno la tua richiesta per il ritiro
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Modalità di consegna</label>
                <Select 
                  value={requestData.deliveryPreference} 
                  onValueChange={(value) => setRequestData(prev => ({ ...prev, deliveryPreference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Come vuoi ricevere il prodotto?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">
                      <div className="flex items-center">
                        <i className="fas fa-walking mr-2"></i>
                        Ritiro in negozio
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery">
                      <div className="flex items-center">
                        <i className="fas fa-truck mr-2"></i>
                        Spedizione a casa
                      </div>
                    </SelectItem>
                    <SelectItem value="both">
                      <div className="flex items-center">
                        <i className="fas fa-both mr-2"></i>
                        Entrambe le opzioni
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  {requestData.deliveryPreference === 'pickup' && 'Andrò a ritirare il prodotto di persona'}
                  {requestData.deliveryPreference === 'delivery' && 'Preferisco ricevere il prodotto a casa tramite servizio di consegna'}
                  {requestData.deliveryPreference === 'both' && 'Sono flessibile su entrambe le modalità'}
                </p>
              </div>

              {/* Grado di urgenza - solo per spedizione a casa */}
              {(requestData.deliveryPreference === 'delivery' || requestData.deliveryPreference === 'both') && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <i className="fas fa-clock mr-2"></i>
                    Grado di urgenza per spedizione
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Quando ti serve il prodotto a casa?</p>
                  <Select 
                    value={requestData.urgencyLevel} 
                    onValueChange={(value) => setRequestData(prev => ({ ...prev, urgencyLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona urgenza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">
                        <div className="flex items-center">
                          <i className="fas fa-bolt mr-2 text-red-500"></i>
                          <div>
                            <div className="font-medium">Entro 24 ore</div>
                            <div className="text-xs text-slate-500">Servizio espresso</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="48h">
                        <div className="flex items-center">
                          <i className="fas fa-truck-fast mr-2 text-orange-500"></i>
                          <div>
                            <div className="font-medium">Entro 48 ore</div>
                            <div className="text-xs text-slate-500">Consegna veloce</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="few_days">
                        <div className="flex items-center">
                          <i className="fas fa-calendar mr-2 text-green-500"></i>
                          <div>
                            <div className="font-medium">Qualche giorno</div>
                            <div className="text-xs text-slate-500">Consegna standard</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-slate-500 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    {requestData.urgencyLevel === '24h' && 'Costo maggiore per consegna express tramite servizi terzi (es. Deliveroo, Glovo)'}
                    {requestData.urgencyLevel === '48h' && 'Costo intermedio per consegna veloce tramite corrieri locali'}
                    {requestData.urgencyLevel === 'few_days' && 'Costo standard per consegna normale - supporta mission locale'}
                  </div>
                  
                  {/* Nota per sviluppo futuro: Integrazione API servizi di consegna */}
                  <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                    <i className="fas fa-lightbulb mr-1"></i>
                    <strong>In sviluppo:</strong> Integrazione diretta con servizi di consegna per preventivi automatici
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <Button 
                onClick={handlePublish}
                disabled={createRequestMutation.isPending}
                className="w-full bg-secondary hover:bg-secondary/90 py-3 font-semibold"
              >
                <i className="fas fa-check mr-2"></i>
                {createRequestMutation.isPending ? 'Pubblicazione...' : 'Pubblica Richiesta'}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">La tua richiesta sarà visibile ai negozianti della zona</p>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
