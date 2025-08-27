import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CopilotConfig } from "@shared/schema";

const copilotConfigSchema = z.object({
  personality: z.string().min(10, "Descrizione personalità richiesta"),
  autonomyLevel: z.enum(["low", "medium", "high"]),
  autoRespond: z.boolean(),
  maxConcurrentChats: z.number().min(1).max(20),
  responseDelay: z.number().min(0).max(10000),
  businessHours: z.object({
    monday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    tuesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    wednesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    thursday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    friday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    saturday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    sunday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  }),
  greetingMessage: z.string().min(5, "Messaggio di benvenuto richiesto"),
  unavailableMessage: z.string().min(5, "Messaggio non disponibile richiesto"),
});

type CopilotConfigForm = z.infer<typeof copilotConfigSchema>;

interface CopilotAnalyticsSummary {
  todayChats?: number;
  avgResponseTime?: number;
  satisfaction?: number;
  conversions?: number;
}

export default function LeonardoCopilot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { data: config, isLoading } = useQuery<CopilotConfig | null>({
    queryKey: ["/api/copilot/config"],
    enabled: !!user,
  });

  const { data: analytics } = useQuery<CopilotAnalyticsSummary | null>({
    queryKey: ["/api/copilot/analytics"],
    enabled: !!user,
  });

  // typed accessors with safe fallback
  const configVal: CopilotConfig | null = config || null;
  const analyticsVal: CopilotAnalyticsSummary = analytics || ({} as CopilotAnalyticsSummary);

  const form = useForm<CopilotConfigForm>({
    resolver: zodResolver(copilotConfigSchema),
    defaultValues: {
      personality: "Professionale e cordiale, esperto nei prodotti della nostra attività",
      autonomyLevel: "medium",
      autoRespond: true,
      maxConcurrentChats: 5,
      responseDelay: 2000,
      businessHours: {
        monday: { enabled: true, start: "09:00", end: "18:00" },
        tuesday: { enabled: true, start: "09:00", end: "18:00" },
        wednesday: { enabled: true, start: "09:00", end: "18:00" },
        thursday: { enabled: true, start: "09:00", end: "18:00" },
        friday: { enabled: true, start: "09:00", end: "18:00" },
        saturday: { enabled: true, start: "09:00", end: "13:00" },
        sunday: { enabled: false, start: "09:00", end: "18:00" },
      },
      greetingMessage: `Ciao! Sono Leonardo, l'assistente di ${user?.businessName || '[Nome Attività]'}. Come posso aiutarti oggi?`,
      unavailableMessage: "Al momento non sono disponibile. Ti risponderò appena possibile!",
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: CopilotConfigForm) => {
      return apiRequest("/api/copilot/config", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "Leonardo AI è stato configurato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/copilot/config"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio della configurazione",
        variant: "destructive",
      });
    },
  });

  const toggleCopilotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("/api/copilot/toggle", {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/copilot/config"] });
    },
  });

  const handleSubmit = (data: CopilotConfigForm) => {
    saveConfigMutation.mutate(data);
  };

  const days = [
    { key: "monday", label: "Lunedì" },
    { key: "tuesday", label: "Martedì" },
    { key: "wednesday", label: "Mercoledì" },
    { key: "thursday", label: "Giovedì" },
    { key: "friday", label: "Venerdì" },
    { key: "saturday", label: "Sabato" },
    { key: "sunday", label: "Domenica" },
  ];

  const autonomyLevels = [
    { value: "low", label: "Bassa - Solo risposte di base", description: "Risponde solo a domande semplici sui prodotti" },
    { value: "medium", label: "Media - Gestione standard", description: "Gestisce la maggior parte delle conversazioni" },
    { value: "high", label: "Alta - Autonomia completa", description: "Gestisce tutte le conversazioni e negoziazioni" },
  ];

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
                <p className="text-yellow-700">Devi completare la verifica della tua attività per configurare Leonardo AI</p>
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
          <div className="flex items-center gap-4">
            <img
              src="/attached_assets/leonardo_avatar_1754851387216.png"
              alt="Leonardo"
              className="h-12 w-12 rounded-full"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face";
              }}
            />
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Leonardo AI</h1>
              <p className="text-slate-600">Configura il tuo assistente AI per gestire le conversazioni con i clienti</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {configVal?.isActive ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <i className="fas fa-circle text-green-600 text-xs mr-1"></i>
                Attivo
              </Badge>
            ) : (
              <Badge variant="secondary">
                <i className="fas fa-circle text-slate-400 text-xs mr-1"></i>
                Inattivo
              </Badge>
            )}

            <Button
              variant={configVal?.isActive ? "destructive" : "default"}
              onClick={() => toggleCopilotMutation.mutate(!configVal?.isActive)}
              disabled={toggleCopilotMutation.isPending}
            >
              {(configVal?.isActive) ? (
                <>
                  <i className="fas fa-pause mr-2"></i>
                  Disattiva
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  Attiva
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Chat Oggi</p>
                  <p className="text-xl font-bold text-blue-600">{analyticsVal.todayChats || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tempo Risposta</p>
                  <p className="text-xl font-bold text-green-600">{analyticsVal.avgResponseTime || 0}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-thumbs-up text-purple-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Soddisfazione</p>
                  <p className="text-xl font-bold text-purple-600">{analyticsVal.satisfaction || 0}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-handshake text-orange-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Conversioni</p>
                  <p className="text-xl font-bold text-orange-600">{analyticsVal.conversions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Personalità e Comportamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="personality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione Personalità *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Descrivi come deve comportarsi Leonardo con i clienti..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autonomyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Livello di Autonomia *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona livello autonomia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {autonomyLevels.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                <div>
                                  <div className="font-medium">{level.label}</div>
                                  <div className="text-xs text-slate-500">{level.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="autoRespond"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Risposta Automatica</FormLabel>
                            <p className="text-sm text-slate-600">Risponde automaticamente ai messaggi</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxConcurrentChats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat Simultanee Max</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              min={1} 
                              max={20} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="responseDelay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ritardo Risposta (millisecondi)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min={0} 
                            max={10000} 
                            step={500}
                          />
                        </FormControl>
                        <p className="text-sm text-slate-600">
                          Simula il tempo di scrittura umano (2000ms = 2 secondi)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Messaggi Predefiniti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="greetingMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaggio di Benvenuto *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Ciao! Sono Leonardo, come posso aiutarti?"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <p className="text-sm text-slate-600">
                          Usa {`{businessName}`} per includere automaticamente il nome della tua attività
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unavailableMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaggio Non Disponibile *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Al momento non sono disponibile..."
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-700">Orari di Servizio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {days.map(day => (
                      <div key={day.key} className="flex items-center gap-4">
                        <FormField
                          control={form.control}
                          name={`businessHours.${day.key as keyof CopilotConfigForm['businessHours']}.enabled`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="w-20 text-sm font-medium">{day.label}</div>
                        <FormField
                          control={form.control}
                          name={`businessHours.${day.key as keyof CopilotConfigForm['businessHours']}.start`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} className="w-24" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-slate-400">-</span>
                        <FormField
                          control={form.control}
                          name={`businessHours.${day.key as keyof CopilotConfigForm['businessHours']}.end`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} className="w-24" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={saveConfigMutation.isPending}
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Salva Configurazione
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Anteprima Leonardo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <img 
                    src="/attached_assets/leonardo_avatar_1754851387216.png" 
                    alt="Leonardo" 
                    className="h-8 w-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face";
                    }}
                  />
                  <div className="bg-white rounded-lg p-3 flex-1">
                    <p className="text-sm">
                      {form.watch("greetingMessage")?.replace("{businessName}", user?.businessName || "[Nome Attività]")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Autonomia:</span>
                  <Badge variant="outline">
                    {autonomyLevels.find(l => l.value === form.watch("autonomyLevel"))?.label.split(" - ")[0]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Risposta Auto:</span>
                  <Badge variant={form.watch("autoRespond") ? "default" : "secondary"}>
                    {form.watch("autoRespond") ? "Attiva" : "Disattiva"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Chat Max:</span>
                  <span className="font-medium">{form.watch("maxConcurrentChats")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ritardo:</span>
                  <span className="font-medium">{form.watch("responseDelay") / 1000}s</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Funzionalità Leonardo</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-xs"></i>
                    Risponde a domande sui prodotti
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-xs"></i>
                    Gestisce richieste di preventivi
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-xs"></i>
                    Fornisce informazioni sull'attività
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-xs"></i>
                    Trasferisce chat complesse
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}