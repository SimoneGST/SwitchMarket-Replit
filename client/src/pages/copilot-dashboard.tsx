import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LeonardoChat from "@/components/leonardo-chat";

const daysOfWeek = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' }
];

export default function CopilotDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/copilot/config'],
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/copilot/sessions'],
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['/api/copilot/analytics', { days: 7 }],
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/copilot/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/copilot/config'] });
      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni del copilot sono state aggiornate.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione.",
        variant: "destructive",
      });
    }
  });

  const [localConfig, setLocalConfig] = useState(config || {});

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const updateLocalConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...localConfig };
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLocalConfig(newConfig);
  };

  const saveConfig = () => {
    updateConfigMutation.mutate(localConfig);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalChats = analytics.reduce((sum: number, day: any) => sum + (day.totalChats || 0), 0);
  const completedChats = analytics.reduce((sum: number, day: any) => sum + (day.completedChats || 0), 0);
  const avgSatisfaction = analytics.length > 0 ? 
    analytics.reduce((sum: number, day: any) => sum + (parseFloat(day.customerSatisfaction) || 0), 0) / analytics.length : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 p-2">
              <img 
                src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                alt="Leonardo AI" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Copilot Leonardo</h1>
              <p className="text-blue-100">
                Gestisci le conversazioni automatiche con i clienti
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={config?.isEnabled ? "default" : "secondary"} className="px-4 py-2">
              {config?.isEnabled ? "Attivo" : "Disattivo"}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-blue-100">Chat Attive</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          <TabsTrigger value="schedule">Orari</TabsTrigger>
          <TabsTrigger value="sessions">Chat Attive</TabsTrigger>
          <TabsTrigger value="analytics">Statistiche</TabsTrigger>
        </TabsList>

        {/* Impostazioni */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurazione Base */}
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Abilita Copilot</Label>
                  <Switch
                    id="enabled"
                    checked={localConfig.isEnabled}
                    onCheckedChange={(checked) => updateLocalConfig('isEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Massimo Chat Simultanee</Label>
                  <Input
                    type="number"
                    value={localConfig.maxConcurrentChats || 5}
                    onChange={(e) => updateLocalConfig('maxConcurrentChats', parseInt(e.target.value))}
                    min="1"
                    max="20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ritardo Risposta (ms)</Label>
                  <Input
                    type="number"
                    value={localConfig.responseDelay || 2000}
                    onChange={(e) => updateLocalConfig('responseDelay', parseInt(e.target.value))}
                    min="500"
                    max="10000"
                    step="500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personalità */}
            <Card>
              <CardHeader>
                <CardTitle>Personalità Leonardo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tono di Voce</Label>
                  <Select
                    value={localConfig.personalitySettings?.tone}
                    onValueChange={(value) => updateLocalConfig('personalitySettings.tone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tono" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professionale">Professionale</SelectItem>
                      <SelectItem value="amichevole">Amichevole</SelectItem>
                      <SelectItem value="informale">Informale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expertise</Label>
                  <Select
                    value={localConfig.personalitySettings?.expertise}
                    onValueChange={(value) => updateLocalConfig('personalitySettings.expertise', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona expertise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generale">Generale</SelectItem>
                      <SelectItem value="tecnico">Tecnico</SelectItem>
                      <SelectItem value="commerciale">Commerciale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Proattività</Label>
                  <Select
                    value={localConfig.personalitySettings?.proactivity}
                    onValueChange={(value) => updateLocalConfig('personalitySettings.proactivity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona proattività" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basso">Basso</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messaggi Automatici */}
          <Card>
            <CardHeader>
              <CardTitle>Messaggi Automatici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Messaggio di Benvenuto</Label>
                <Textarea
                  value={localConfig.autoResponses?.greeting || ""}
                  onChange={(e) => updateLocalConfig('autoResponses.greeting', e.target.value)}
                  placeholder="Ciao! Sono Leonardo..."
                />
              </div>

              <div className="space-y-2">
                <Label>Messaggio Non Disponibile</Label>
                <Textarea
                  value={localConfig.autoResponses?.unavailable || ""}
                  onChange={(e) => updateLocalConfig('autoResponses.unavailable', e.target.value)}
                  placeholder="Al momento non sono disponibile..."
                />
              </div>

              <div className="space-y-2">
                <Label>Messaggio di Chiusura</Label>
                <Textarea
                  value={localConfig.autoResponses?.closing || ""}
                  onChange={(e) => updateLocalConfig('autoResponses.closing', e.target.value)}
                  placeholder="Grazie per averci contattato..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={saveConfig}
              disabled={updateConfigMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateConfigMutation.isPending ? "Salvando..." : "Salva Configurazione"}
            </Button>
          </div>
        </TabsContent>

        {/* Orari di Lavoro */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Orari di Disponibilità</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => {
                const dayConfig = localConfig.businessHours?.[day.key] || {};
                return (
                  <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-20 font-medium">{day.label}</div>
                    <Switch
                      checked={dayConfig.enabled}
                      onCheckedChange={(checked) => 
                        updateLocalConfig(`businessHours.${day.key}.enabled`, checked)
                      }
                    />
                    {dayConfig.enabled && (
                      <>
                        <Input
                          type="time"
                          value={dayConfig.start || "09:00"}
                          onChange={(e) => 
                            updateLocalConfig(`businessHours.${day.key}.start`, e.target.value)
                          }
                          className="w-32"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={dayConfig.end || "18:00"}
                          onChange={(e) => 
                            updateLocalConfig(`businessHours.${day.key}.end`, e.target.value)
                          }
                          className="w-32"
                        />
                      </>
                    )}
                    {!dayConfig.enabled && <span className="text-gray-500">Chiuso</span>}
                  </div>
                );
              })}
              <div className="flex justify-end">
                <Button 
                  onClick={saveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salva Orari
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Attive */}
        <TabsContent value="sessions">
          <div className="grid gap-4">
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Nessuna chat attiva al momento
                </CardContent>
              </Card>
            ) : (
              sessions.map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Chat {session.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">
                          Cliente: {session.customerId} • {session.totalMessages} messaggi
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={session.isAiHandled ? "default" : "secondary"}>
                          {session.isAiHandled ? "AI" : "Umano"}
                        </Badge>
                        <Badge variant="outline">
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Statistiche */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">{totalChats}</div>
                <div className="text-sm text-gray-600">Chat Totali (7gg)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {totalChats > 0 ? Math.round((completedChats / totalChats) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Tasso Completamento</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {avgSatisfaction.toFixed(1)}/5.0
                </div>
                <div className="text-sm text-gray-600">Soddisfazione Media</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Andamento Ultimi 7 Giorni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.map((day: any, index: number) => (
                  <div key={day.date} className="flex items-center justify-between p-3 border rounded">
                    <div className="font-medium">
                      {new Date(day.date).toLocaleDateString('it-IT', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{day.totalChats || 0} chat</span>
                      <span>{day.completedChats || 0} completate</span>
                      <Badge variant="outline">
                        {day.customerSatisfaction ? `${day.customerSatisfaction}/5` : 'N/A'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat Leonardo Integrata */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Test con Leonardo</CardTitle>
            <p className="text-sm text-gray-600">
              Testa le configurazioni del copilot direttamente con Leonardo
            </p>
          </CardHeader>
          <CardContent>
            <LeonardoChat />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}