import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LeonardoAssist from "@/components/leonardo-assist";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Integration {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastSync?: string;
  config?: any;
  createdAt: string;
}

export default function MerchantIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);

  const { data: integrations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/integrations"],
    enabled: !!user,
  });

  const addIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/integrations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Integrazione aggiunta",
        description: "L'integrazione è stata configurata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsAddingIntegration(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la configurazione dell'integrazione",
        variant: "destructive",
      });
    },
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Sincronizzazione avviata",
        description: "La sincronizzazione dei dati è in corso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/integrations/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });

  const availableIntegrations = [
    {
      type: "fatture_cloud",
      name: "Fatture in Cloud",
      description: "Sincronizza prodotti e fatture con Fatture in Cloud",
      icon: "fas fa-cloud",
      fields: [
        { key: "apiKey", label: "API Key", type: "text", required: true },
        { key: "apiSecret", label: "API Secret", type: "password", required: true },
        { key: "companyId", label: "Company ID", type: "text", required: true }
      ]
    },
    {
      type: "danea",
      name: "Danea EasyFatt",
      description: "Connetti il tuo gestionale Danea per sincronizzare inventario",
      icon: "fas fa-receipt",
      fields: [
        { key: "endpoint", label: "Endpoint", type: "text", required: true },
        { key: "username", label: "Username", type: "text", required: true },
        { key: "password", label: "Password", type: "password", required: true }
      ]
    },
    {
      type: "teamsystem",
      name: "TeamSystem",
      description: "Integrazione con sistemi gestionali TeamSystem",
      icon: "fas fa-cogs",
      fields: [
        { key: "apiKey", label: "API Key", type: "text", required: true },
        { key: "endpoint", label: "Endpoint", type: "text", required: true },
        { key: "database", label: "Database", type: "text", required: true }
      ]
    }
  ];

  const getIntegrationIcon = (type: string) => {
    const integration = availableIntegrations.find(i => i.type === type);
    return integration?.icon || "fas fa-plug";
  };

  const getIntegrationName = (type: string) => {
    const integration = availableIntegrations.find(i => i.type === type);
    return integration?.name || type;
  };

  const getStatusBadge = (integration: Integration) => {
    if (!integration.isActive) {
      return <Badge variant="secondary">Inattivo</Badge>;
    }
    
    if (!integration.lastSync) {
      return <Badge variant="outline">Mai sincronizzato</Badge>;
    }

    const lastSync = new Date(integration.lastSync);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      return <Badge variant="default">Sincronizzato</Badge>;
    } else if (hoursDiff < 24) {
      return <Badge variant="outline">Sincronizzato {Math.floor(hoursDiff)}h fa</Badge>;
    } else {
      return <Badge variant="destructive">Sync necessario</Badge>;
    }
  };

  const IntegrationForm = ({ integration }: { integration: any }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addIntegrationMutation.mutate({
        type: integration.type,
        name: integration.name,
        config: formData,
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i className={`${integration.icon} text-blue-600 text-xl`}></i>
          </div>
          <div>
            <h3 className="font-semibold">{integration.name}</h3>
            <p className="text-sm text-slate-600">{integration.description}</p>
          </div>
        </div>

        <LeonardoAssist 
          title="Compila con Leonardo"
          allowedFields={["apiKey","apiSecret","companyId","endpoint","username","password","database"]}
          onApply={(updates) => {
            setFormData(prev => ({ ...prev, ...updates }));
          }}
        />

        {integration.fields.map((field: any) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">
              {field.label} {field.required && "*"}
            </label>
            <Input
              type={field.type}
              required={field.required}
              value={formData[field.key] || ""}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                [field.key]: e.target.value
              }))}
              placeholder={`Inserisci ${field.label.toLowerCase()}`}
            />
          </div>
        ))}

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={addIntegrationMutation.isPending}
          >
            {addIntegrationMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Configurazione...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                Aggiungi Integrazione
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setIsAddingIntegration(false)}
          >
            Annulla
          </Button>
        </div>
      </form>
    );
  };

  if (!user?.pivaVerified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Verifica Richiesta</h3>
                <p className="text-yellow-700">Devi completare la verifica della tua attività per accedere alle integrazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Collegamenti Gestionali</h1>
            <p className="text-slate-600 mt-2">
              Sincronizza automaticamente inventario e dati con i tuoi sistemi gestionali
            </p>
          </div>
          <Dialog open={isAddingIntegration} onOpenChange={setIsAddingIntegration}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <i className="fas fa-plus mr-2"></i>
                Nuova Integrazione
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Aggiungi Integrazione</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona gestionale" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIntegrations.map(integration => (
                      <SelectItem key={integration.type} value={integration.type}>
                        <div className="flex items-center gap-2">
                          <i className={`${integration.icon} text-blue-600`}></i>
                          {integration.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedIntegration && (
                  <IntegrationForm 
                    integration={availableIntegrations.find(i => i.type === selectedIntegration)} 
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
  ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-24 w-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <i className="fas fa-plug text-slate-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nessuna integrazione configurata</h3>
            <p className="text-slate-600 mb-4">
              Collega i tuoi sistemi gestionali per sincronizzare automaticamente inventario e dati
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsAddingIntegration(true)}
            >
              <i className="fas fa-plus mr-2"></i>
              Aggiungi Prima Integrazione
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((integration: Integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className={`${getIntegrationIcon(integration.type)} text-blue-600 text-xl`}></i>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{getIntegrationName(integration.type)}</CardTitle>
                      <p className="text-sm text-slate-600">{integration.name}</p>
                    </div>
                  </div>
                  {getStatusBadge(integration)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integration.lastSync && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-clock"></i>
                      <span>Ultima sincronizzazione: {new Date(integration.lastSync).toLocaleString('it-IT')}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncIntegrationMutation.mutate(integration.id)}
                      disabled={syncIntegrationMutation.isPending || !integration.isActive}
                    >
                      {syncIntegrationMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-sync-alt"></i>
                      )}
                      <span className="ml-1">Sincronizza</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleIntegrationMutation.mutate({
                        id: integration.id,
                        isActive: !integration.isActive
                      })}
                    >
                      <i className={`fas ${integration.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                      <span className="ml-1">{integration.isActive ? 'Disattiva' : 'Attiva'}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <i className="fas fa-cog"></i>
                      <span className="ml-1">Configura</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Gestionali Supportati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {availableIntegrations.map(integration => (
                <div key={integration.type} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className={`${integration.icon} text-blue-600`}></i>
                  </div>
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-slate-600">Inventario & Fatture</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Sincronizzazione Automatica</h4>
              <p className="text-sm text-blue-600">
                I dati vengono sincronizzati automaticamente ogni ora o in tempo reale 
                a seconda della configurazione del gestionale. Puoi forzare la sincronizzazione 
                manualmente in qualsiasi momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}