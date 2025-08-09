import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const GESTIONALE_TYPES = [
  {
    id: 'fattureincloud',
    name: 'Fatture in Cloud',
    description: 'Il gestionale cloud più utilizzato in Italia',
    icon: '☁️',
    setupFields: ['apiKey', 'companyId'],
    documentation: 'https://developers.fattureincloud.it/',
  },
  {
    id: 'danea',
    name: 'Danea EasyFatt',
    description: 'Software di fatturazione desktop con API REST',
    icon: '🖥️', 
    setupFields: ['apiKey', 'baseUrl'],
    documentation: 'https://www.danea.it/software/easyfatt/api',
  },
  {
    id: 'teamsystem',
    name: 'TeamSystem',
    description: 'Suite gestionale enterprise',
    icon: '🏢',
    setupFields: ['apiKey'],
    documentation: 'https://developer.teamsystem.com/',
  },
  {
    id: 'zucchetti',
    name: 'Zucchetti',
    description: 'Software gestionale e HR',
    icon: '📊',
    setupFields: ['apiKey', 'baseUrl'],
    documentation: 'https://www.zucchetti.it/zucchetti/index.php?page_id=6094',
    comingSoon: true,
  }
];

export default function IntegrationSetup() {
  const [selectedGestionale, setSelectedGestionale] = useState('');
  const [formData, setFormData] = useState({
    apiKey: '',
    companyId: '',
    baseUrl: '',
    syncFrequency: 'daily',
  });
  const { toast } = useToast();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/integrations'],
  });

  const testConnectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/integrations/test", data),
    onSuccess: () => {
      toast({
        title: "✅ Connessione riuscita!",
        description: "Il gestionale è configurato correttamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Connessione fallita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/integrations", data),
    onSuccess: () => {
      toast({
        title: "🎉 Integrazione creata!",
        description: "Il gestionale è stato collegato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      setFormData({ apiKey: '', companyId: '', baseUrl: '', syncFrequency: 'daily' });
      setSelectedGestionale('');
    },
    onError: (error: Error) => {
      toast({
        title: "Errore nella creazione",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (integrationId: number) => apiRequest("POST", `/api/integrations/${integrationId}/sync`),
    onSuccess: () => {
      toast({
        title: "🔄 Sincronizzazione avviata",
        description: "I prodotti verranno aggiornati a breve.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gestionale = GESTIONALE_TYPES.find(g => g.id === selectedGestionale);
    if (!gestionale) return;

    const data = {
      gestionaleType: selectedGestionale,
      ...formData,
    };

    createIntegrationMutation.mutate(data);
  };

  const handleTestConnection = () => {
    const data = {
      gestionaleType: selectedGestionale,
      ...formData,
    };
    testConnectionMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const selectedGestionaleInfo = GESTIONALE_TYPES.find(g => g.id === selectedGestionale);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Collega Gestionale</h1>
        <p className="text-slate-600 mt-1">
          Sincronizza i tuoi prodotti e giacenze con i principali gestionali italiani
        </p>
      </div>

      {/* Integrazioni Esistenti */}
      {integrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Gestionali Collegati</h2>
          {integrations.map((integration: any) => {
            const gestionaleInfo = GESTIONALE_TYPES.find(g => g.id === integration.gestionaleType);
            return (
              <Card key={integration.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{gestionaleInfo?.icon}</span>
                      <div>
                        <h3 className="font-medium">{gestionaleInfo?.name}</h3>
                        <p className="text-sm text-slate-600">
                          Ultima sync: {integration.lastSync ? 
                            new Date(integration.lastSync).toLocaleString('it-IT') : 
                            'Mai sincronizzato'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.isActive ? "default" : "secondary"}>
                        {integration.isActive ? 'Attivo' : 'Disattivo'}
                      </Badge>
                      <Button
                        onClick={() => syncMutation.mutate(integration.id)}
                        disabled={syncMutation.isPending}
                        size="sm"
                        variant="outline"
                      >
                        <i className="fas fa-sync-alt mr-1"></i>
                        Sincronizza
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Nuovo Gestionale */}
      <Card>
        <CardHeader>
          <CardTitle>Aggiungi Nuovo Gestionale</CardTitle>
          <CardDescription>
            Seleziona il tuo software gestionale e inserisci i dati di accesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selezione Gestionale */}
          <div className="space-y-2">
            <Label>Gestionale</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GESTIONALE_TYPES.map((gestionale) => (
                <Card
                  key={gestionale.id}
                  className={`cursor-pointer transition-colors relative ${
                    selectedGestionale === gestionale.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-slate-50'
                  } ${gestionale.comingSoon ? 'opacity-50' : ''}`}
                  onClick={() => !gestionale.comingSoon && setSelectedGestionale(gestionale.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{gestionale.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{gestionale.name}</h3>
                        <p className="text-xs text-slate-600">{gestionale.description}</p>
                      </div>
                      {gestionale.comingSoon && (
                        <Badge variant="secondary" className="text-xs">
                          Presto
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configurazione */}
          {selectedGestionaleInfo && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 text-blue-600">
                <span className="text-xl">{selectedGestionaleInfo.icon}</span>
                <span className="font-medium">{selectedGestionaleInfo.name}</span>
                <a 
                  href={selectedGestionaleInfo.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm underline"
                >
                  📖 Documentazione
                </a>
              </div>

              {selectedGestionaleInfo.setupFields.includes('apiKey') && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Inserisci la tua API Key"
                    required
                  />
                  <p className="text-xs text-slate-600">
                    Trova la tua API Key nelle impostazioni del gestionale
                  </p>
                </div>
              )}

              {selectedGestionaleInfo.setupFields.includes('companyId') && (
                <div className="space-y-2">
                  <Label htmlFor="companyId">ID Azienda *</Label>
                  <Input
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    placeholder="es. 12345"
                    required
                  />
                </div>
              )}

              {selectedGestionaleInfo.setupFields.includes('baseUrl') && (
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">URL Base</Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="http://localhost:57888 (per Danea)"
                  />
                  <p className="text-xs text-slate-600">
                    Lascia vuoto per usare l'URL predefinito
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="syncFrequency">Frequenza Sincronizzazione</Label>
                <Select value={formData.syncFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, syncFrequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">⚡ Tempo reale</SelectItem>
                    <SelectItem value="hourly">🕐 Ogni ora</SelectItem>
                    <SelectItem value="daily">📅 Giornaliera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                  className="flex-1"
                >
                  {testConnectionMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-plug mr-2"></i>
                  )}
                  Testa Connessione
                </Button>

                <Button
                  type="submit"
                  disabled={createIntegrationMutation.isPending}
                  className="flex-1"
                >
                  {createIntegrationMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-link mr-2"></i>
                  )}
                  Collega Gestionale
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-info-circle text-blue-500 mt-1"></i>
            <div className="text-sm">
              <p className="font-medium text-blue-900">Cosa viene sincronizzato?</p>
              <ul className="mt-2 space-y-1 text-blue-800">
                <li>• Catalogo prodotti completo</li>
                <li>• Prezzi e costi aggiornati</li>
                <li>• Giacenze in tempo reale</li>
                <li>• Codici SKU e codici a barre</li>
                <li>• Categorie e attributi prodotto</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}