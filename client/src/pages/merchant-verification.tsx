import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const verificationSchema = z.object({
  partitaIva: z.string().min(11, "P.IVA deve essere di 11 cifre").max(11),
  codiceFiscale: z.string().min(16, "Codice Fiscale deve essere di 16 caratteri").max(16),
  businessName: z.string().min(2, "Nome attività richiesto"),
  businessType: z.string().min(2, "Tipo attività richiesto"),
  businessAddress: z.string().min(5, "Indirizzo attività richiesto"),
  businessCity: z.string().min(2, "Città richiesta"),
  businessPostalCode: z.string().min(5, "CAP richiesto"),
  businessDescription: z.string().min(10, "Descrizione attività richiesta"),
  businessWebsite: z.string().url("URL sito web non valido").optional().or(z.literal("")),
  businessHours: z.string().optional(),
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function MerchantVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<File[]>([]);

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      partitaIva: user?.partitaIva || "",
      codiceFiscale: user?.codiceFiscale || "",
      businessName: user?.businessName || "",
      businessType: user?.businessType || "",
      businessAddress: user?.businessAddress || "",
      businessCity: user?.businessCity || "",
      businessPostalCode: user?.businessPostalCode || "",
      businessDescription: user?.businessDescription || "",
      businessWebsite: user?.businessWebsite || "",
      businessHours: user?.businessHours || "Lun-Ven 9:00-18:00, Sab 9:00-13:00",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      return apiRequest("/api/merchant/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Richiesta inviata",
        description: "La tua richiesta di verifica è stata inviata. Riceverai una risposta entro 24-48 ore.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore durante l'invio della richiesta di verifica",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: VerificationForm) => {
    verifyMutation.mutate(data);
  };

  const validatePIva = (piva: string) => {
    // Basic P.IVA validation (simplified)
    if (piva.length !== 11 || !/^\d{11}$/.test(piva)) {
      return false;
    }
    // Additional validation logic can be added here
    return true;
  };

  const validateCodiceFiscale = (cf: string) => {
    // Basic Codice Fiscale validation (simplified)
    if (cf.length !== 16) {
      return false;
    }
    // Additional validation logic can be added here
    return true;
  };

  if (user?.pivaVerified && user?.cfVerified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Profilo Verificato</h3>
                <p className="text-green-600">La tua attività è stata verificata con successo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Verifica Attività</h1>
        <p className="text-slate-600 mt-2">
          Completa la verifica della tua attività per accedere a tutte le funzionalità per negozianti
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Dati Attività</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="partitaIva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partita IVA *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="12345678901"
                              className={!validatePIva(field.value) && field.value.length > 0 ? "border-red-300" : ""}
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
                              placeholder="RSSMRA80A01H501Y"
                              className={!validateCodiceFiscale(field.value) && field.value.length > 0 ? "border-red-300" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Attività *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es: SportShop Milano" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Attività *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es: Articoli Sportivi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indirizzo Attività *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Via Roma 123" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="businessCity"
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
                      name="businessPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAP *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="20121" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="businessDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione Attività *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Descrivi la tua attività, i prodotti venduti e i servizi offerti..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessWebsite"
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

                  <FormField
                    control={form.control}
                    name="businessHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orari di Apertura</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Lun-Ven 9:00-18:00, Sab 9:00-13:00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Invia Richiesta di Verifica
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Documenti Richiesti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-file-alt text-blue-600 mt-1"></i>
                <div>
                  <h4 className="font-medium">Certificato di Iscrizione</h4>
                  <p className="text-sm text-slate-600">Camera di Commercio o registro imprese</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <i className="fas fa-id-card text-blue-600 mt-1"></i>
                <div>
                  <h4 className="font-medium">Documento di Identità</h4>
                  <p className="text-sm text-slate-600">Carta d'identità o patente del titolare</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <i className="fas fa-receipt text-blue-600 mt-1"></i>
                <div>
                  <h4 className="font-medium">Visura Camerale (opzionale)</h4>
                  <p className="text-sm text-slate-600">Per verifica dati attività</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Verifica Automatica</h4>
                <p className="text-sm text-blue-600">
                  P.IVA e Codice Fiscale vengono verificati automaticamente tramite 
                  le banche dati ufficiali dell'Agenzia delle Entrate.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}