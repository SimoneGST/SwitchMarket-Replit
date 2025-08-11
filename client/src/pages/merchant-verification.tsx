import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const verificationSchema = z.object({
  piva: z.string().min(11, "P.IVA deve essere di almeno 11 caratteri").max(11, "P.IVA deve essere di 11 caratteri"),
  codiceFiscale: z.string().min(16, "Codice Fiscale deve essere di 16 caratteri").max(16, "Codice Fiscale deve essere di 16 caratteri"),
  businessName: z.string().min(2, "Nome attività richiesto"),
  businessAddress: z.string().min(5, "Indirizzo completo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  cap: z.string().min(5, "CAP richiesto").max(5, "CAP deve essere di 5 cifre"),
  province: z.string().min(2, "Provincia richiesta").max(2, "Provincia deve essere di 2 caratteri"),
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function MerchantVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      piva: "",
      codiceFiscale: "",
      businessName: "",
      businessAddress: "",
      city: "",
      cap: "",
      province: "",
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      return apiRequest("/api/merchant/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Verifica Inviata",
        description: "I tuoi dati sono stati inviati per la verifica. Leonardo ti aiuterà a completare il profilo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Reindirizza a Leonardo copilot per completare il setup
      setLocation("/leonardo-profile-setup");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'invio della verifica. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: VerificationForm) => {
    setIsVerifying(true);
    // Simula una verifica automatica
    setTimeout(() => {
      verificationMutation.mutate({
        ...data,
        // Simula verifica automatica per demo
      });
      setIsVerifying(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Verifica Attività Commerciale</h1>
        <p className="text-slate-600 mt-2">
          Completa la verifica della tua attività per accedere alla dashboard negozianti
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Dati Fiscali e Attività</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="piva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partita IVA *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="01234567890"
                              maxLength={11}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="codiceFiscale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Codice Fiscale *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="RSSMRA80A01H501Z"
                              maxLength={16}
                              style={{ textTransform: 'uppercase' }}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Attività/Ragione Sociale *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Es. Ferramenta Rossi SRL" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indirizzo Attività *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Via Roma, 123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Città *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Milano" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAP *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="20100"
                              maxLength={5}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provincia *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="MI"
                              maxLength={2}
                              style={{ textTransform: 'uppercase' }}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={verificationMutation.isPending || isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Verifica in corso...
                      </>
                    ) : verificationMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Invio dati...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle mr-2"></i>
                        Verifica Attività
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-blue-700">Documenti Richiesti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <i className="fas fa-file-alt text-blue-600 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Partita IVA</h4>
                    <p className="text-slate-600">Numero di 11 cifre rilasciato dall'Agenzia delle Entrate</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-id-card text-blue-600 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Codice Fiscale</h4>
                    <p className="text-slate-600">Codice alfanumerico di 16 caratteri</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-store text-blue-600 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Dati Attività</h4>
                    <p className="text-slate-600">Nome commerciale e indirizzo sede legale</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <img 
                  src="/attached_assets/leonardo_avatar_1754851387216.png" 
                  alt="Leonardo" 
                  className="h-12 w-12 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face";
                  }}
                />
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">
                    Leonardo ti aspetta!
                  </h3>
                  <p className="text-green-700 text-sm">
                    Dopo la verifica, Leonardo ti guiderà nella compilazione completa del profilo: 
                    descrizione attività, giorni di chiusura, categorie merceologiche e configurazione dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}