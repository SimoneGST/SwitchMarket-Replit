import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [userType, setUserType] = useState<"customer" | "merchant" | "">("");
  const [formData, setFormData] = useState({
    businessName: "",
    vatNumber: "",
    taxCode: "",
    businessAddress: "",
    businessPhone: "",
    businessCategory: "",
    businessDescription: "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/auth/complete-profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profilo completato!",
        description: userType === "merchant" ? 
          "Il tuo profilo negoziante è stato creato. Riceverai una email di verifica." :
          "Il tuo profilo cliente è stato completato.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile completare il profilo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!userType) {
      toast({
        title: "Selezione richiesta",
        description: "Seleziona se sei un cliente o un negoziante",
        variant: "destructive",
      });
      return;
    }

    if (userType === "merchant") {
      if (!formData.businessName || (!formData.vatNumber && !formData.taxCode)) {
        toast({
          title: "Dati mancanti",
          description: "Compila tutti i campi obbligatori per i negozianti",
          variant: "destructive",
        });
        return;
      }
    }

    updateProfileMutation.mutate({
      userType,
      ...formData,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Benvenuto su Switch Market
          </h1>
          <p className="text-lg text-slate-600">
            Completa il tuo profilo per iniziare a utilizzare la piattaforma
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* User Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Come vuoi utilizzare Switch Market?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setUserType("customer")}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    userType === "customer" 
                      ? "border-green-500 bg-green-50" 
                      : "border-slate-200 hover:border-green-300"
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <i className="fas fa-shopping-cart text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Cliente</h4>
                      <p className="text-sm text-slate-600">Cerco prodotti e servizi</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Utilizza l'assistente AI Clemente per trovare quello che cerchi dai negozianti locali
                  </p>
                </button>

                <button
                  onClick={() => setUserType("merchant")}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    userType === "merchant" 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <i className="fas fa-store text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Negoziante</h4>
                      <p className="text-sm text-slate-600">Vendo prodotti e servizi</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Ricevi richieste mirate dalla tua zona e gestisci le vendite con Leonardo
                  </p>
                </button>
              </div>
            </div>

            {/* Merchant Form */}
            {userType === "merchant" && (
              <div className="space-y-6 border-t border-slate-200 pt-8">
                <div>
                  <h4 className="text-md font-semibold text-slate-900 mb-4">
                    Dati dell'attività (obbligatori per la verifica)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nome dell'attività *
                    </label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Es. TechStore Milano"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Categoria attività
                    </label>
                    <Select 
                      value={formData.businessCategory} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, businessCategory: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elettronica">Elettronica</SelectItem>
                        <SelectItem value="abbigliamento">Abbigliamento</SelectItem>
                        <SelectItem value="casa-giardino">Casa e Giardino</SelectItem>
                        <SelectItem value="sport-tempo-libero">Sport e Tempo Libero</SelectItem>
                        <SelectItem value="alimentari">Alimentari</SelectItem>
                        <SelectItem value="servizi">Servizi</SelectItem>
                        <SelectItem value="altro">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Partita IVA
                    </label>
                    <Input
                      value={formData.vatNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
                      placeholder="IT01234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Codice Fiscale
                    </label>
                    <Input
                      value={formData.taxCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
                      placeholder="Se non hai P.IVA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Indirizzo dell'attività
                  </label>
                  <Input
                    value={formData.businessAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                    placeholder="Via Roma 1, Milano, MI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefono dell'attività
                  </label>
                  <Input
                    value={formData.businessPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                    placeholder="+39 02 1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrizione dell'attività
                  </label>
                  <Textarea
                    value={formData.businessDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                    placeholder="Descrivi i tuoi prodotti e servizi..."
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
                    <div>
                      <h5 className="font-medium text-blue-900 mb-1">Verifica dell'attività</h5>
                      <p className="text-sm text-blue-700">
                        I tuoi dati saranno verificati entro 24-48 ore. Una volta approvato, 
                        potrai iniziare a ricevere richieste dai clienti.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Confirmation */}
            {userType === "customer" && (
              <div className="border-t border-slate-200 pt-8">
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-check text-green-600 text-2xl"></i>
                  </div>
                  <h4 className="font-semibold text-green-900 mb-2">Perfetto!</h4>
                  <p className="text-green-700">
                    Il tuo profilo cliente è pronto. Potrai subito iniziare a cercare 
                    prodotti e servizi con l'aiuto di Clemente.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <Button 
                onClick={handleSubmit}
                disabled={updateProfileMutation.isPending || !userType}
                className={`px-8 py-3 font-semibold ${
                  userType === "customer" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {updateProfileMutation.isPending ? "Salvataggio..." : "Completa Profilo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}