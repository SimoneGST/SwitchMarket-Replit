import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import LeonardoAssist from "@/components/leonardo-assist";
import { apiRequest } from "@/lib/queryClient";

interface SupplyForm {
  category: string;
  subcategory?: string;
  title: string;
  quantity: number;
  unit: string;
  budgetPerUnit?: number;
  frequency: "one_off" | "weekly" | "monthly" | "quarterly";
  deliveryBy?: string;
  locationCity?: string;
  locationProvince?: string;
  certifications?: string;
  paymentTerms?: string;
  notes?: string;
}

export default function SupplierSearchPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<SupplyForm>({
    category: "",
    subcategory: "",
    title: "",
    quantity: 10,
    unit: "pezzi",
    budgetPerUnit: undefined,
    frequency: "one_off",
    deliveryBy: "",
    locationCity: "",
    locationProvince: "",
    certifications: "",
    paymentTerms: "",
    notes: "",
  });

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category: form.category,
        subcategory: form.subcategory,
        quantity: form.quantity,
        budgetPerUnit: form.budgetPerUnit,
        frequency: form.frequency,
        deliveryBy: form.deliveryBy,
        location: { city: form.locationCity, province: form.locationProvince },
        certifications: form.certifications?.split(',').map(s=>s.trim()).filter(Boolean) || [],
        paymentTerms: form.paymentTerms,
        notes: form.notes,
      };
      const res = await apiRequest('/api/suppliers/search', { method: 'POST', body: JSON.stringify(payload) });
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
    },
    onError: (e:any) => {
      toast({ title: 'Errore ricerca', description: e.message, variant: 'destructive' });
    }
  });

  const saveRequestMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      const res = await apiRequest('/api/supply-requests', { method: 'POST', body: JSON.stringify(payload) });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Richiesta di fornitura salvata', description: 'Puoi contattare i fornitori selezionati' });
    }
  });

  const doSearch = async () => {
    setLoading(true);
    try { await searchMutation.mutateAsync(); } finally { setLoading(false); }
  };

  const applyLeonardo = (updates: Record<string,string>) => {
    setForm(prev => ({
      ...prev,
      title: updates.title ?? prev.title,
      category: updates.category ?? prev.category,
      subcategory: updates.subcategory ?? prev.subcategory,
      quantity: updates.quantity ? parseInt(String(updates.quantity)) : prev.quantity,
      unit: updates.unit ?? prev.unit,
      budgetPerUnit: updates.budgetPerUnit ? parseFloat(String(updates.budgetPerUnit)) : prev.budgetPerUnit,
      frequency: (updates.frequency as any) ?? prev.frequency,
      deliveryBy: updates.deliveryBy ?? prev.deliveryBy,
      locationCity: updates.city ?? prev.locationCity,
      locationProvince: updates.province ?? prev.locationProvince,
      certifications: updates.certifications ?? prev.certifications,
      paymentTerms: updates.paymentTerms ?? prev.paymentTerms,
      notes: updates.notes ?? prev.notes,
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Cerca Fornitori</h1>
        <p className="text-slate-600 mt-2">Compila una richiesta di fornitura tipica e trova fornitori compatibili. Leonardo ti aiuta a compilare.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dati Richiesta Fornitura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Titolo *</label>
                  <Input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} placeholder="Es: Fornitura cavi USB-C" />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria *</label>
                  <Input value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})} placeholder="Elettronica" />
                </div>
                <div>
                  <label className="text-sm font-medium">Sottocategoria</label>
                  <Input value={form.subcategory} onChange={(e)=>setForm({...form, subcategory:e.target.value})} placeholder="Accessori" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Quantità *</label>
                    <Input type="number" value={form.quantity} onChange={(e)=>setForm({...form, quantity: parseInt(e.target.value||'0')})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unità</label>
                    <Select value={form.unit} onValueChange={(v)=>setForm({...form, unit:v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pezzi">Pezzi</SelectItem>
                        <SelectItem value="scatole">Scatole</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Budget per unità (€)</label>
                  <Input type="number" step="0.01" value={form.budgetPerUnit ?? ''} onChange={(e)=>setForm({...form, budgetPerUnit: e.target.value?parseFloat(e.target.value):undefined})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Frequenza *</label>
                  <Select value={form.frequency} onValueChange={(v)=>setForm({...form, frequency: v as SupplyForm['frequency']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_off">Una tantum</SelectItem>
                      <SelectItem value="weekly">Settimanale</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="quarterly">Trimestrale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Consegna entro</label>
                  <Input type="date" value={form.deliveryBy} onChange={(e)=>setForm({...form, deliveryBy: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Città</label>
                  <Input value={form.locationCity} onChange={(e)=>setForm({...form, locationCity:e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Provincia</label>
                  <Input value={form.locationProvince} onChange={(e)=>setForm({...form, locationProvince:e.target.value.toUpperCase()})} maxLength={2} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Certificazioni richieste</label>
                  <Input value={form.certifications} onChange={(e)=>setForm({...form, certifications:e.target.value})} placeholder="ISO9001, HACCP" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Termini di pagamento</label>
                  <Input value={form.paymentTerms} onChange={(e)=>setForm({...form, paymentTerms:e.target.value})} placeholder="30/60 gg, bonifico, contrassegno" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Note</label>
                  <Textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Dettagli tecnici, preferenze di brand, ecc." />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={doSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Ricerca...</>) : (<><i className="fas fa-search mr-2"></i>Cerca Fornitori</>)}
                </Button>
                <Button variant="outline" onClick={()=>saveRequestMutation.mutate()}>
                  <i className="fas fa-save mr-2"></i>Salva Richiesta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <LeonardoAssist
            title="Compila Richiesta con Leonardo"
            allowedFields={[
              'title','category','subcategory','quantity','unit','budgetPerUnit','frequency','deliveryBy','city','province','certifications','paymentTerms','notes'
            ]}
            onApply={applyLeonardo}
          />

          <Card>
            <CardHeader>
              <CardTitle>Risultati</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-slate-500 text-sm">Nessun fornitore trovato. Prova a cambiare i filtri o il prompt.</div>
              ) : (
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{r.name}</h4>
                          <div className="text-xs text-slate-600">{r.city} ({r.province}) • Categorie: {r.categories.join(', ')}</div>
                          {r.certifications?.length > 0 && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {r.certifications.map((c:string)=> (
                                <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-700">Match {r.matchScore}%</div>
                          <div className="text-xs text-slate-500">MOQ {r.minOrder} • Lead {r.leadTimeDays}g</div>
                          <div className="text-xs">Rating {r.rating}/5</div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline"><i className="fas fa-paper-plane mr-1"></i>Contatta</Button>
                        <Button size="sm" variant="outline"><i className="fas fa-bookmark mr-1"></i>Salva</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
