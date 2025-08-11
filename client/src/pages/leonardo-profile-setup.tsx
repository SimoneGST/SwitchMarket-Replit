import { useState, useEffect } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const profileSetupSchema = z.object({
  businessDescription: z.string().min(20, "Descrizione di almeno 20 caratteri richiesta"),
  phone: z.string().min(10, "Numero di telefono richiesto"),
  email: z.string().email("Email valida richiesta"),
  website: z.string().url("URL valido richiesto").optional().or(z.literal("")),
  categories: z.array(z.string()).min(1, "Seleziona almeno una categoria"),
  subcategories: z.array(z.string()).min(1, "Seleziona almeno una sottocategoria"),
  closingDays: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }),
  openingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string() }),
    tuesday: z.object({ start: z.string(), end: z.string() }),
    wednesday: z.object({ start: z.string(), end: z.string() }),
    thursday: z.object({ start: z.string(), end: z.string() }),
    friday: z.object({ start: z.string(), end: z.string() }),
    saturday: z.object({ start: z.string(), end: z.string() }),
    sunday: z.object({ start: z.string(), end: z.string() }),
  }),
  deliveryService: z.boolean(),
  serviceArea: z.number().min(1, "Raggio di servizio richiesto"),
});

type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

export default function LeonardoProfileSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [leonardoMessage, setLeonardoMessage] = useState("");
  const [isLeonardoTyping, setIsLeonardoTyping] = useState(false);

  const categories = [
    "Alimentari e Bevande", "Abbigliamento e Moda", "Casa e Giardino", 
    "Elettronica e Tecnologia", "Sport e Tempo Libero", "Salute e Bellezza",
    "Auto e Moto", "Servizi Professionali", "Ristorazione", "Artigianato"
  ];

  const subcategoriesByCategory = {
    "Alimentari e Bevande": ["Supermercato", "Panetteria", "Macelleria", "Pescheria", "Enoteca", "Bar"],
    "Abbigliamento e Moda": ["Abbigliamento Uomo", "Abbigliamento Donna", "Calzature", "Accessori", "Intimo"],
    "Casa e Giardino": ["Mobili", "Elettrodomestici", "Ferramenta", "Giardinaggio", "Decorazioni"],
    "Elettronica e Tecnologia": ["Computer", "Smartphone", "TV e Audio", "Fotografia", "Gaming"],
    "Sport e Tempo Libero": ["Abbigliamento Sportivo", "Attrezzature", "Palestre", "Outdoor"],
    "Salute e Bellezza": ["Farmacia", "Parafarmacia", "Cosmetici", "Wellness"],
    "Auto e Moto": ["Ricambi", "Accessori", "Officina", "Carburanti"],
    "Servizi Professionali": ["Consulenza", "Riparazioni", "Pulizie", "Trasporti"],
    "Ristorazione": ["Ristorante", "Pizzeria", "Bar", "Pasticceria", "Take Away"],
    "Artigianato": ["Sartoria", "Falegnameria", "Gioielleria", "Ceramica"]
  };

  const form = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      businessDescription: "",
      phone: "",
      email: user?.email || "",
      website: "",
      categories: [],
      subcategories: [],
      closingDays: {
        monday: false, tuesday: false, wednesday: false, thursday: false,
        friday: false, saturday: false, sunday: true
      },
      openingHours: {
        monday: { start: "09:00", end: "18:00" },
        tuesday: { start: "09:00", end: "18:00" },
        wednesday: { start: "09:00", end: "18:00" },
        thursday: { start: "09:00", end: "18:00" },
        friday: { start: "09:00", end: "18:00" },
        saturday: { start: "09:00", end: "13:00" },
        sunday: { start: "09:00", end: "18:00" },
      },
      deliveryService: false,
      serviceArea: 10,
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileSetupForm) => {
      return apiRequest("/api/merchant/complete-profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profilo Completato",
        description: "Leonardo ha configurato con successo la tua dashboard!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/merchant-dashboard");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio del profilo",
        variant: "destructive",
      });
    },
  });

  // Leonardo typing effect
  const showLeonardoMessage = (message: string) => {
    setIsLeonardoTyping(true);
    setLeonardoMessage("");
    
    setTimeout(() => {
      setIsLeonardoTyping(false);
      setLeonardoMessage(message);
    }, 1500);
  };

  useEffect(() => {
    const messages = {
      1: `Ciao ${user?.businessName ? `${user.businessName}` : 'collega'}! Sono Leonardo, il tuo assistente AI per la gestione dell'attività. Ti aiuterò a completare il profilo in modo semplice e veloce. Iniziamo con la descrizione della tua attività!`,
      2: "Perfetto! Ora seleziona le categorie che meglio descrivono la tua attività. Questo aiuterà i clienti a trovarti più facilmente.",
      3: "Ottimo! Ora configuriamo gli orari di apertura e i giorni di chiusura. Posso aiutarti a impostare gli orari più comuni per il tuo settore.",
      4: "Quasi fatto! Ultimi dettagli sui servizi offerti. Configuro anche il tuo copilot AI per gestire automaticamente le conversazioni con i clienti!"
    };
    
    showLeonardoMessage(messages[currentStep as keyof typeof messages]);
  }, [currentStep, user?.businessName]);

  const handleSubmit = (data: ProfileSetupForm) => {
    showLeonardoMessage("Perfetto! Sto configurando la tua dashboard negozianti. Leonardo AI sarà sempre qui per aiutarti!");
    setTimeout(() => {
      profileMutation.mutate(data);
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <img 
            src="/attached_assets/leonardo_avatar_1754851387216.png" 
            alt="Leonardo" 
            className="h-16 w-16 rounded-full"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face";
            }}
          />
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Setup Guidato con Leonardo</h1>
            <p className="text-slate-600">Configurazione profilo attività commerciale</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div 
                  className={`h-1 w-16 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-700">Descrizione Attività</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="businessDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrivi la tua attività *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Es. Ferramenta specializzata in utensili professionali e articoli per la casa. Offriamo consulenza tecnica e servizio di taglio chiavi..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <p className="text-sm text-slate-600">
                            Una buona descrizione aiuta i clienti a capire cosa offri
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefono *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+39 02 1234567" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sito Web (opzionale)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://www.tuosito.it" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-700">Categorie e Settore</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categorie Principali *</FormLabel>
                          <div className="grid gap-3 md:grid-cols-2">
                            {categories.map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={category}
                                  checked={field.value.includes(category)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, category]);
                                    } else {
                                      field.onChange(field.value.filter(c => c !== category));
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 rounded border-slate-300"
                                />
                                <label htmlFor={category} className="text-sm font-medium">
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("categories").length > 0 && (
                      <FormField
                        control={form.control}
                        name="subcategories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sottocategorie *</FormLabel>
                            <div className="grid gap-3 md:grid-cols-2">
                              {form.watch("categories").flatMap(category => 
                                subcategoriesByCategory[category as keyof typeof subcategoriesByCategory] || []
                              ).map((subcategory) => (
                                <div key={subcategory} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={subcategory}
                                    checked={field.value.includes(subcategory)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([...field.value, subcategory]);
                                      } else {
                                        field.onChange(field.value.filter(c => c !== subcategory));
                                      }
                                    }}
                                    className="h-4 w-4 text-blue-600 rounded border-slate-300"
                                  />
                                  <label htmlFor={subcategory} className="text-sm font-medium">
                                    {subcategory}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-700">Orari e Giorni di Apertura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Giorni di Chiusura</h4>
                      <div className="grid gap-3 md:grid-cols-4">
                        {days.map(day => (
                          <FormField
                            key={day.key}
                            control={form.control}
                            name={`closingDays.${day.key as keyof ProfileSetupForm['closingDays']}`}
                            render={({ field }) => (
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                                <label className="text-sm font-medium">
                                  {day.label}
                                </label>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Orari di Apertura</h4>
                      <div className="space-y-3">
                        {days.map(day => (
                          <div key={day.key} className="flex items-center gap-4">
                            <div className="w-20 text-sm font-medium">{day.label}</div>
                            <FormField
                              control={form.control}
                              name={`openingHours.${day.key as keyof ProfileSetupForm['openingHours']}.start`}
                              render={({ field }) => (
                                <Input type="time" {...field} className="w-24" />
                              )}
                            />
                            <span className="text-slate-400">-</span>
                            <FormField
                              control={form.control}
                              name={`openingHours.${day.key as keyof ProfileSetupForm['openingHours']}.end`}
                              render={({ field }) => (
                                <Input type="time" {...field} className="w-24" />
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-700">Servizi e Configurazione</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="deliveryService"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Servizio di Consegna</h4>
                            <p className="text-sm text-slate-600">Offri consegna a domicilio</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Raggio di Servizio (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              min={1} 
                              max={50} 
                            />
                          </FormControl>
                          <p className="text-sm text-slate-600">
                            Entro quanti km dalla tua attività offri servizi/consegne
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Leonardo AI verrà configurato per:</h4>
                      <ul className="text-sm text-blue-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <i className="fas fa-check text-xs"></i>
                          Rispondere automaticamente ai clienti
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-check text-xs"></i>
                          Fornire informazioni sui tuoi prodotti
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-check text-xs"></i>
                          Gestire richieste di preventivi
                        </li>
                        <li className="flex items-center gap-2">
                          <i className="fas fa-check text-xs"></i>
                          Trasferire conversazioni complesse
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Indietro
                </Button>
                
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    Avanti
                    <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={profileMutation.isPending}
                  >
                    {profileMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Configurazione...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket mr-2"></i>
                        Completa Setup
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Leonardo Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <img 
                  src="/attached_assets/leonardo_avatar_1754851387216.png" 
                  alt="Leonardo" 
                  className="h-12 w-12 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face";
                  }}
                />
                <div className="bg-blue-50 rounded-lg p-3 flex-1">
                  {isLeonardoTyping ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-blue-600">Leonardo sta scrivendo...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700">{leonardoMessage}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Progresso Setup:</span>
                  <Badge variant="outline">
                    {currentStep}/4 Completato
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}