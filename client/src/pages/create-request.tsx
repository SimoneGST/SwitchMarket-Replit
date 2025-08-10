import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MapPin, Clock, Package, AlertCircle, Euro, Truck } from "lucide-react";
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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Crea Nuova Richiesta</h1>
        <p className="text-slate-600">Clemente ti aiuterà a creare la richiesta perfetta per trovare quello che cerchi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Column */}
        <div className="space-y-6">
          {/* Informazioni Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Cosa Stai Cercando?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titolo della richiesta *
                </label>
                <Input
                  value={requestData.title}
                  onChange={(e) => setRequestData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Es. iPhone 15 Pro usato in ottime condizioni"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
                  <Select 
                    value={requestData.category} 
                    onValueChange={(value) => setRequestData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elettronica">Elettronica</SelectItem>
                      <SelectItem value="casa">Casa e Giardino</SelectItem>
                      <SelectItem value="moda">Moda e Abbigliamento</SelectItem>
                      <SelectItem value="sport">Sport e Tempo Libero</SelectItem>
                      <SelectItem value="auto">Auto e Moto</SelectItem>
                      <SelectItem value="libri">Libri e Riviste</SelectItem>
                      <SelectItem value="servizi">Servizi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sottocategoria</label>
                  <Select 
                    value={requestData.subcategory} 
                    onValueChange={(value) => setRequestData(prev => ({ ...prev, subcategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opzionale" />
                    </SelectTrigger>
                    <SelectContent>
                      {requestData.category === "elettronica" && (
                        <>
                          <SelectItem value="smartphone">Smartphone</SelectItem>
                          <SelectItem value="computer">Computer</SelectItem>
                          <SelectItem value="tv">TV e Audio</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                        </>
                      )}
                      {requestData.category === "casa" && (
                        <>
                          <SelectItem value="mobili">Mobili</SelectItem>
                          <SelectItem value="elettrodomestici">Elettrodomestici</SelectItem>
                          <SelectItem value="decorazioni">Decorazioni</SelectItem>
                          <SelectItem value="giardino">Giardino</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrizione dettagliata
                </label>
                <Textarea
                  value={requestData.description}
                  onChange={(e) => setRequestData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrivi cosa stai cercando, caratteristiche specifiche, condizioni desiderate..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prezzo minimo (€)</label>
                  <Input
                    type="number"
                    value={requestData.priceMin}
                    onChange={(e) => setRequestData(prev => ({ ...prev, priceMin: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prezzo massimo (€)</label>
                  <Input
                    type="number"
                    value={requestData.priceMax}
                    onChange={(e) => setRequestData(prev => ({ ...prev, priceMax: e.target.value }))}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {requestData.priceMin && requestData.priceMax && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">
                    Budget: €{requestData.priceMin} - €{requestData.priceMax}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localizzazione e Consegna */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Dove e Come Ritirare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Posizione *
                </label>
                <Input
                  value={requestData.location}
                  onChange={(e) => setRequestData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Es. Milano, Via Roma 123"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Raggio massimo per ritiro: {requestData.actionRadius} km
                </label>
                <Slider
                  value={[requestData.actionRadius]}
                  onValueChange={([value]) => setRequestData(prev => ({ ...prev, actionRadius: value }))}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 km</span>
                  <span>50 km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Modalità di consegna
                </label>
                <Select 
                  value={requestData.deliveryPreference} 
                  onValueChange={(value) => setRequestData(prev => ({ ...prev, deliveryPreference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Solo ritiro in zona</SelectItem>
                    <SelectItem value="delivery">Solo spedizione</SelectItem>
                    <SelectItem value="both">Entrambe le opzioni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(requestData.deliveryPreference === "delivery" || requestData.deliveryPreference === "both") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Truck className="inline h-4 w-4 mr-1" />
                    Urgenza per spedizione
                  </label>
                  <Select 
                    value={requestData.urgencyLevel} 
                    onValueChange={(value) => setRequestData(prev => ({ ...prev, urgencyLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Entro 24 ore</SelectItem>
                      <SelectItem value="48h">Entro 48 ore</SelectItem>
                      <SelectItem value="few_days">Qualche giorno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pulsante Pubblica */}
          <div className="flex gap-4">
            <Button 
              onClick={handlePublish}
              disabled={createRequestMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {createRequestMutation.isPending ? "Pubblicando..." : "Pubblica Richiesta"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              size="lg"
            >
              Annulla
            </Button>
          </div>
        </div>

        {/* Chat Column */}
        <div className="lg:sticky lg:top-8">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">C</span>
                </div>
                Clemente ti aiuta
              </CardTitle>
              <p className="text-sm text-slate-600">
                Descrivi cosa cerchi e Clemente creerà la richiesta perfetta per te
              </p>
            </CardHeader>
            <CardContent className="p-0 h-[480px]">
              <ClementeChat />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}