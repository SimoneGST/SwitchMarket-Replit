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
