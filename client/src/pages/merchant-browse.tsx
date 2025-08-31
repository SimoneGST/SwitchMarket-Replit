import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import ChatInterface from '@/components/chat-interface';

interface RequestItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  createdAt?: string | number | Date;
  urgencyLevel?: string;
  buyerId?: string;
  attributes?: Record<string, any>;
}

export default function MerchantBrowse() {
  const { user, firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [myGeo, setMyGeo] = useState<{lat:number; lng:number} | null>(null);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerMsg, setOfferMsg] = useState<string>('');
  const [offerTitle, setOfferTitle] = useState<string>('');
  const [offerImageFile, setOfferImageFile] = useState<File | null>(null);
  // Removed inline chat preview; we deep-link to /messages instead
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMyGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);
  const { data: nearby = [], isLoading, isError } = useQuery<RequestItem[]>({
    queryKey: ['/api/requests/nearby', myGeo?.lat, myGeo?.lng],
    queryFn: async () => {
      const params = myGeo ? `?lat=${myGeo.lat}&lng=${myGeo.lng}&radiusKm=25` : '';
      const res = await apiRequest('GET', `/api/requests/nearby${params}`);
      if (!res.ok) throw new Error('Errore caricamento richieste');
      return res.json();
    },
    enabled: !!user?.pivaVerified,
  });

  // Simple client-side filters
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [min, setMin] = useState<string>('');
  const [max, setMax] = useState<string>('');

  const results = useMemo(() => {
    return (nearby || []).filter((r) => {
      const matchQ = q
        ? (r.title?.toLowerCase().includes(q.toLowerCase()) ||
           r.description?.toLowerCase().includes(q.toLowerCase()))
        : true;
      const matchCat = category ? r.category === category : true;
      const matchMin = min ? (r.priceMax ?? 0) >= Number(min) : true;
      const matchMax = max ? (r.priceMin ?? 0) <= Number(max) : true;
      return matchQ && matchCat && matchMin && matchMax;
    });
  }, [nearby, q, category, min, max]);

  // Deep link support: if URL has ?request=<id>, open its details
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const reqId = u.searchParams.get('request');
      if (reqId && nearby && nearby.length) {
        const found = nearby.find((r) => r.id === reqId);
        if (found) {
          setSelected(found);
          setOfferPrice(String(found.priceMin ?? ''));
          setOfferMsg(found.description ? `Offerta: ${found.description}` : 'Posso aiutarti con la tua richiesta.');
          setOfferTitle(found.title || 'Offerta');
        }
      }
    } catch {}
  }, [nearby]);

  const sendOffer = useMutation({
    mutationFn: async (payload: any) => {
      // If there's an image file, upload to Firebase Storage first
      let imageUrl: string | undefined = undefined;
      if (offerImageFile) {
        const uid = user?.id || firebaseUser?.uid;
        if (!uid) throw new Error('Utente non autenticato');
        const path = `offers/${uid}/${Date.now()}_${offerImageFile.name}`;
        const objectRef = ref(storage, path);
        const snap = await uploadBytes(objectRef, offerImageFile);
        imageUrl = await getDownloadURL(snap.ref);
      }
      const res = await apiRequest('POST', '/api/offers', { ...payload, imageUrl });
      return res.json();
    },
    onSuccess: async (data: any) => {
      toast({ title: 'Offerta inviata', description: 'Hai inviato un’offerta al cliente.' });
      await queryClient.invalidateQueries({ queryKey: ['/api/offers/my'] });
      if (data?.conversationId) {
        navigate(`/messages?conv=${encodeURIComponent(data.conversationId)}`);
      }
    },
    onError: (err: any) => {
      toast({ title: 'Errore', description: err.message || 'Impossibile inviare l’offerta' });
    }
  });

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900">Trova Richieste Clienti</h1>
        <p className="text-slate-600 mt-1">Filtra e rispondi alle richieste nella tua zona</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input placeholder="Cerca per titolo o descrizione" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <Input placeholder="Categoria (es. elettronica)" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Prezzo min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
              <Input placeholder="Prezzo max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Richieste trovate</span>
            <Badge variant="outline">{results.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-12 text-center text-slate-500">Caricamento…</div>
          )}
          {isError && (
            <div className="py-12 text-center text-red-600">Errore nel caricamento delle richieste</div>
          )}
          {!isLoading && !isError && results.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Nessuna richiesta trovata. Prova a modificare i filtri.
            </div>
          )}
          <div className="space-y-4">
            {results.map((r) => (
              <div key={r.id} className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => {
                setSelected(r);
                setOfferPrice(String(r.priceMin ?? ''));
                setOfferMsg(r.description ? `Offerta: ${r.description}` : 'Posso aiutarti con la tua richiesta.');
                setOfferTitle(r.title || 'Offerta');
                setOfferImageFile(null);
              }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{r.title}</h3>
                      {r.category && (
                        <Badge variant="outline" className="text-xs">{r.category}</Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{r.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      {r.location && <span>{r.location}</span>}
                      {(r.priceMin != null || r.priceMax != null) && (
                        <span className="font-medium text-blue-600">€{r.priceMin ?? '-'} - €{r.priceMax ?? '-'}</span>
                      )}
                      {r.urgencyLevel && (
                        <span className="uppercase tracking-wide">{r.urgencyLevel}</span>
                      )}
                      {r.createdAt && (
                        <span>{new Date(r.createdAt).toLocaleDateString('it-IT')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelected(r);
                      setOfferPrice(String(r.priceMin ?? ''));
                      setOfferMsg(r.description ? `Offerta: ${r.description}` : 'Posso aiutarti con la tua richiesta.');
                      setOfferTitle(r.title || 'Offerta');
                      setOfferImageFile(null);
                    }}>
                      <i className="fas fa-eye mr-2"></i>
                      Dettagli
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-slate-400 mt-4">
        Vista per negozianti — la chat di Clemente per creare richieste è disponibile solo per i clienti.
      </div>

      {/* Dettagli richiesta + Offerta rapida */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.description || 'Dettagli della richiesta'}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              {/* Scheda completa richiesta */}
              <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{selected.title}</div>
                    {selected.category && (
                      <div className="text-xs text-slate-500">Categoria: {selected.category}</div>
                    )}
                    {selected.location && (
                      <div className="text-xs text-slate-500">Zona: {selected.location}</div>
                    )}
                    {(selected.priceMin != null || selected.priceMax != null) && (
                      <div className="text-xs text-blue-700 font-medium">Budget: €{selected.priceMin ?? '-'} - €{selected.priceMax ?? '-'}</div>
                    )}
                  </div>
                </div>
                {selected.description && (
                  <div className="text-sm text-slate-700 whitespace-pre-line">{selected.description}</div>
                )}
                {selected.attributes && (
                  <div>
                    <h5 className="text-xs font-semibold text-slate-700 mb-1">Caratteristiche</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selected.attributes).map(([k, v]) => (
                        <span key={k} className="px-2 py-1 rounded bg-white border text-xs text-slate-700">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        // crea o recupera conversazione e apri /messages
                        const res = await apiRequest('POST', '/api/conversations', { requestId: selected.id });
                        const conv = await res.json();
                        navigate(`/messages?conv=${encodeURIComponent(conv.id)}`);
                      } catch (e) {}
                    }}
                  >
                    <i className="fas fa-comments mr-2" />
                    Contatta in chat
                  </Button>
                </div>
              </div>
              {/* Offerta */}
              <div className="mt-2 space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Invia un’offerta</h4>
                <div className="grid grid-cols-3 gap-2">
                  {/* Sezione riassuntiva, evitare ripetizioni inutili */}
                  <Input
                    className="col-span-1"
                    placeholder="Prezzo (€)"
                    inputMode="numeric"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Messaggio al cliente"
                    value={offerMsg}
                    onChange={(e) => setOfferMsg(e.target.value)}
                  />
                  <div className="col-span-3 flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={(e) => setOfferImageFile(e.target.files?.[0] || null)} />
                    <span className="text-xs text-slate-500">Foto prodotto (opzionale)</span>
                  </div>
                </div>
                <DialogFooter className="mt-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={sendOffer.isPending || !offerPrice}
                    onClick={() => {
                      if (!selected) return;
                      const priceNum = Number(offerPrice.replace(',', '.')) || 0;
                      sendOffer.mutate({
                        requestId: selected.id,
                        title: selected.title,
                        description: offerMsg || 'Offerta per la tua richiesta',
                        price: priceNum,
                        status: 'active',
                      });
                      setSelected(null);
                    }}
                  >
                    <i className="fas fa-paper-plane mr-2" />
                    Invia offerta
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inline Chat Modal */}
  {/* Inline Chat Modal removed: we redirect to /messages after invio offerta */}
    </main>
  );
}
