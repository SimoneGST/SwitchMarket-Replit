import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { showToast } from "@/lib/toast-notifications";
import LeonardoAssist from "@/components/leonardo-assist";

// Validazione Codice Fiscale italiano
const validateCodiceFiscale = (cf: string): boolean => {
  if (cf.length !== 16) return false;
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!cfRegex.test(cf.toUpperCase())) return false;

  const controlChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const oddValues: { [key: string]: number } = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };
  const evenValues: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  };

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = cf.charAt(i).toUpperCase();
    if (i % 2 === 0) sum += oddValues[char] || 0; else sum += evenValues[char] || 0;
  }
  const expectedControl = controlChars[sum % 26];
  return cf.charAt(15).toUpperCase() === expectedControl;
};

// Validazione Partita IVA italiana
const validatePartitaIva = (piva: string): boolean => {
  if (piva.length !== 11) return false;
  if (!/^[0-9]+$/.test(piva)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(piva.charAt(i));
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit = digit - 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(piva.charAt(10));
};

const verificationSchema = z.object({
  businessName: z.string().min(2, "Nome attività richiesto"),
  taxType: z.enum(["piva", "cf"], { required_error: "Seleziona tipo di identificativo fiscale" }),
  piva: z.string().optional(),
  codiceFiscale: z.string().optional(),
  businessAddress: z.string().min(5, "Indirizzo completo richiesto"),
  city: z.string().min(2, "Città richiesta"),
  province: z.string().min(2, "Provincia richiesta"),
  cap: z.string().regex(/^[0-9]{5}$/, "CAP deve essere di 5 cifre"),
  legalForm: z.string().min(1, "Forma giuridica richiesta"),
}).refine((data) => {
  if (data.taxType === "piva") return !!data.piva && validatePartitaIva(data.piva);
  return !!data.codiceFiscale && validateCodiceFiscale(data.codiceFiscale);
}, {
  message: "Inserisci un Codice Fiscale o Partita IVA validi",
  path: ["taxType"],
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function MerchantVerification() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      businessName: "",
      taxType: "piva",
      piva: "",
      codiceFiscale: "",
      businessAddress: "",
      city: "",
      province: "",
      cap: "",
      legalForm: "",
    },
  });

  const watchTaxType = form.watch("taxType");

  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      const { auth } = await import("@/lib/firebase");
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Non sei autenticato. Effettua il login prima di procedere.");
      const response = await apiRequest("/api/merchant/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      showToast('verification', 'success');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => setLocation("/merchant-dashboard"), 1200);
    },
    onError: (error: any) => {
      if (error?.message?.includes('P.IVA')) showToast('verification', 'invalidPiva');
      else if (error?.message?.includes('Codice Fiscale')) showToast('verification', 'invalidCF');
      else showToast('verification', 'error', error?.message || 'Errore di verifica');
    },
  });

  const handleSubmit = async (data: VerificationForm) => {
    // Ulteriore guard-rail client veloce
    const required: (keyof VerificationForm)[] = ['businessName', 'businessAddress', 'city', 'province', 'cap', 'legalForm'];
    for (const key of required) {
      const v = data[key] as unknown;
      if (typeof v !== 'string' || v.trim().length === 0) {
        showToast('verification', 'error', `Campo obbligatorio mancante`);
        return;
      }
    }
    if (data.taxType === 'piva') {
      if (!data.piva || !validatePartitaIva(data.piva)) {
        showToast('verification', 'invalidPiva');
        return;
      }
    } else {
      if (!data.codiceFiscale || !validateCodiceFiscale(data.codiceFiscale)) {
        showToast('verification', 'invalidCF');
        return;
      }
    }

    setIsVerifying(true);
    verificationMutation.mutate(data, {
      onSettled: () => setIsVerifying(false),
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Verifica Attività Commerciale</h1>
        <p className="text-slate-600 mt-2">Completa la verifica della tua attività per accedere alla dashboard negozianti</p>
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
                    name="taxType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo di Identificativo Fiscale *</FormLabel>
                        <FormControl>
                          <div className="flex gap-6 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="piva"
                                checked={field.value === "piva"}
                                onChange={() => {
                                  field.onChange("piva");
                                  form.setValue("codiceFiscale", "");
                                }}
                                className="text-blue-600"
                              />
                              <span className="font-medium">Partita IVA</span>
                              <span className="text-xs text-slate-500">(società, aziende)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                value="cf"
                                checked={field.value === "cf"}
                                onChange={() => {
                                  field.onChange("cf");
                                  form.setValue("piva", "");
                                }}
                                className="text-blue-600"
                              />
                              <span className="font-medium">Codice Fiscale</span>
                              <span className="text-xs text-slate-500">(artigiani, professionisti)</span>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchTaxType === "piva" && (
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
                          <p className="text-xs text-slate-500">Inserisci 11 cifre della tua Partita IVA</p>
                        </FormItem>
                      )}
                    />
                  )}

                  {watchTaxType === "cf" && (
                    <FormField
                      control={form.control}
                      name="codiceFiscale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Codice Fiscale *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="RSSMRA85M01H501X"
                              maxLength={16}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-slate-500">Per artigiani, professionisti e attività senza P.IVA</p>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="legalForm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma Giuridica *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleziona forma giuridica</option>
                            <option value="ditta_individuale">Ditta Individuale</option>
                            <option value="snc">Società in Nome Collettivo (SNC)</option>
                            <option value="sas">Società in Accomandita Semplice (SAS)</option>
                            <option value="srl">Società a Responsabilità Limitata (SRL)</option>
                            <option value="spa">Società per Azioni (SPA)</option>
                            <option value="sapa">Società in Accomandita per Azioni (SAPA)</option>
                            <option value="cooperativa">Cooperativa</option>
                            <option value="associazione">Associazione</option>
                            <option value="fondazione">Fondazione</option>
                            <option value="libero_professionista">Libero Professionista</option>
                            <option value="artigiano">Artigiano</option>
                          </select>
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
          <div className="mb-6">
            <LeonardoAssist
              title="Compila con Leonardo"
              allowedFields={["businessName","taxType","piva","codiceFiscale","businessAddress","city","province","cap","legalForm"]}
              context={{ page: 'merchant-verification' }}
              onApply={(updates) => {
                // Apply suggested values to the form
                Object.entries(updates).forEach(([k, v]) => {
                  // respect types: province uppercase, cap digits only
                  if (k === 'province' && typeof v === 'string') {
                    form.setValue('province', v.toUpperCase());
                  } else if (k === 'cap' && typeof v === 'string') {
                    form.setValue('cap', v.replace(/\D/g, '').slice(0,5));
                  } else if (k === 'piva' && typeof v === 'string') {
                    form.setValue('piva', v.replace(/\D/g, '').slice(0,11));
                  } else if ((k === 'businessName' || k === 'businessAddress' || k === 'city' || k === 'codiceFiscale' || k === 'legalForm' || k === 'taxType') && typeof v === 'string') {
                    // @ts-ignore - keys align with form fields
                    form.setValue(k as any, v);
                  }
                });
              }}
            />
          </div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-blue-700">Documenti Richiesti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <i className="fas fa-file-alt text-blue-600 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Partita IVA o Codice Fiscale</h4>
                    <p className="text-slate-600">Puoi inserire la P.IVA (società) o il C.F. (artigiani/professionisti)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-600 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Validazione Automatica</h4>
                    <p className="text-slate-600">Controllo algoritmi di verifica italiani</p>
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
                  <h3 className="font-semibold text-green-800 mb-2">Leonardo ti aspetta!</h3>
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