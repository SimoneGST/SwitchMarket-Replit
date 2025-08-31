import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Store, MapPin, Phone, Mail, Calendar, Package, MessageCircle, TrendingUp, Settings, Bot } from 'lucide-react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type MerchantAnalytics = {
  totalViews?: number;
  conversionRate?: number;
  responseTime?: number;
  satisfactionRate?: number;
  activeOffers?: number;
  monthlyRevenue?: number;
};

export default function MerchantProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm] = useState<number>(25);

  // Profile
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  // Try to get browser geolocation (best-effort)
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {} as any;
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          setCoords({ lat: latitude, lng: longitude });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  const nearbyUrl = useMemo(() => {
    if (coords) {
      return `/api/requests/nearby?lat=${coords.lat}&lng=${coords.lng}&radiusKm=${radiusKm}`;
    }
    const city = (profile as any)?.businessCity || (profile as any)?.city;
    if (city) return `/api/requests/nearby?city=${encodeURIComponent(city)}`;
    return '/api/requests/nearby';
  }, [coords, radiusKm, profile]);

  // Offers (seller)
  const { data: offers } = useQuery<any[]>({
    queryKey: ['/api/offers/my'],
    enabled: !!user
  });

  // Conversations (seller-only)
  const { data: conversations } = useQuery<any[]>({
    queryKey: ['/api/conversations/merchant'],
    enabled: !!user
  });

  const { data: nearbyRequests } = useQuery<any[]>({
    queryKey: [nearbyUrl],
    enabled: !!user,
  });

  // Analytics (stubbed server-side for now)
  const { data: analytics } = useQuery<MerchantAnalytics>({
    queryKey: ['/api/merchant/analytics'],
    enabled: !!user
  });

  // Quick offer mutation
  const quickOfferMutation = useMutation({
    mutationFn: async (vars: { requestId: string; price?: number; description?: string }) => {
      await apiRequest('POST', '/api/offers', {
        requestId: vars.requestId,
        price: vars.price,
        description: vars.description || 'Ti ho inviato una proposta per la tua richiesta.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offers/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/merchant'] });
      toast({ title: 'Offerta inviata', description: 'Conversazione creata/aggiornata.' });
    },
    onError: (e: any) => {
      toast({ title: 'Errore invio offerta', description: e?.message || 'Riprova', variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profilo non trovato</p>
          <Link href="/profile-verification">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Completa il Profilo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const businessTypeLabels = {
    retail: 'Commercio al Dettaglio',
    restaurant: 'Ristorazione',
    services: 'Servizi',
    crafts: 'Artigianato',
    tech: 'Tecnologia',
    other: 'Altro'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src={((user as any)?.profileImageUrl) || ''} alt={(profile as any).businessName} />
              <AvatarFallback className="bg-blue-500 text-white text-2xl">
                {(profile as any).businessName?.charAt(0) || (profile as any).firstName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {(profile as any).businessName || `${(profile as any).firstName ?? ''} ${(profile as any).lastName ?? ''}`}
              </h1>
              <div className="flex items-center gap-4 text-blue-100 mb-2">
                <Badge variant="secondary" className="bg-white text-blue-600">
                  <Store className="w-4 h-4 mr-1" />
                  Negoziante
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {(profile as any).businessCity || (profile as any).city}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Membro dal {(user as any)?.createdAt ? new Date((user as any).createdAt as any).toLocaleDateString('it-IT') : ''}
                </div>
              </div>
        {(profile as any).businessType && (
                <p className="text-blue-100">
          {businessTypeLabels[(profile as any).businessType as keyof typeof businessTypeLabels]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informazioni Commerciali */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Informazioni Attività
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="font-medium">{user.email}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Telefono</span>
                  </div>
                  <p className="font-medium">{(profile as any).phone || 'Non specificato'}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Indirizzo Attività</span>
                  </div>
                  <p className="font-medium">
                    {(profile as any).businessAddress && `${(profile as any).businessAddress}, `}
                    {(profile as any).businessCity || (profile as any).city}
                    {(profile as any).businessPostalCode && ` ${(profile as any).businessPostalCode}`}
                  </p>
                </div>

        {(profile as any).partitaIva && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">P. IVA</span>
                    </div>
          <p className="font-medium">{(profile as any).partitaIva}</p>
                  </div>
                )}

        {(profile as any)?.businessDescription && (
                  <div>
                    <div className="text-gray-600 mb-1">
                      <span className="text-sm">Descrizione</span>
                    </div>
          <p className="text-sm">{(profile as any)?.businessDescription}</p>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Link href="/integration-setup">
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Collega Gestionale
                    </Button>
                  </Link>
                  
                  <Link href="/copilot-dashboard">
                    <Button variant="outline" className="w-full">
                      <Bot className="w-4 h-4 mr-2" />
                      Copilot Leonardo
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistiche Rapide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Statistiche Attività</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {offers?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Offerte</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {conversations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Conversazioni</div>
                  </div>
      {!!analytics && (
                    <>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
        {analytics?.totalViews ?? 0}
                        </div>
                        <div className="text-sm text-gray-600">Visualizzazioni</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
        {analytics?.conversionRate ?? 0}%
                        </div>
                        <div className="text-sm text-gray-600">Conversioni</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attività Recenti */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Richieste in zona (aperte) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Richieste Aperte Nella Tua Zona
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nearbyRequests?.length ? (
                    <div className="space-y-3">
                      {nearbyRequests.slice(0, 5).map((r: any) => (
                        <div key={r.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="pr-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{r.title}</h4>
                                {r.category && (
                                  <Badge variant="outline" className="text-xs">{r.category}</Badge>
                                )}
                              </div>
                              {r.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{r.description}</p>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {r.location || 'Località non indicata'}
                                {(r.priceMin != null || r.priceMax != null) && (
                                  <span className="ml-2 font-medium text-blue-600">€{r.priceMin ?? '-'} - €{r.priceMax ?? '-'}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href="/browse">
                                <Button size="sm" variant="outline">
                                  Vedi
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={quickOfferMutation.isPending}
                                onClick={() => {
                                  const p = window.prompt('Prezzo (EUR, opzionale)');
                                  const price = p ? Number(p) : undefined;
                                  const desc = window.prompt('Messaggio (opzionale)', 'Posso aiutarti subito!');
                                  quickOfferMutation.mutate({ requestId: r.id, price: isNaN(Number(price)) ? undefined : price, description: desc || undefined });
                                }}
                              >
                                Invia offerta
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nessuna richiesta trovata al momento.
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Le tue Offerte */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Le tue Offerte
                    <Badge variant="outline">{offers?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {offers?.length ? (
                    <div className="space-y-4">
                      {offers.slice(0, 5).map((offer: any) => (
                        <div key={offer.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{offer.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="font-semibold text-blue-600">€{offer.price}</span>
                              <Badge variant="outline" className="text-xs">
                                {offer.status === 'active' ? 'Attiva' : 'Non attiva'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {new Date(offer.createdAt).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {offers.length > 5 && (
                        <Link href="/my-offers">
                          <Button variant="outline" className="w-full">
                            Vedi tutte le offerte ({offers.length})
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Non hai ancora creato offerte</p>
                      <Link href="/browse">
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                          Trova richieste da soddisfare
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversazioni con Clienti */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Conversazioni con Clienti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conversations?.length ? (
                    <div className="space-y-4">
                      {conversations.slice(0, 3).map((conversation: any) => (
                        <div key={conversation.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {conversation.customerName?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{conversation.customerName || 'Cliente'}</h4>
                            <p className="text-sm text-gray-600">{conversation.lastMessage}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Richiesta: {conversation.requestTitle}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {new Date(conversation.lastMessageAt).toLocaleDateString('it-IT')}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                {conversation.unreadCount} nuovi
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <Link href="/messages">
                        <Button variant="outline" className="w-full">
                          Vedi tutti i messaggi
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nessuna conversazione ancora</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Azioni Rapide */}
              <Card>
                <CardHeader>
                  <CardTitle>Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/browse">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Package className="w-4 h-4 mr-2" />
                        Trova Richieste
                      </Button>
                    </Link>
                    <Link href="/copilot-dashboard">
                      <Button variant="outline" className="w-full">
                        <Bot className="w-4 h-4 mr-2" />
                        Copilot Leonardo
                      </Button>
                    </Link>
                    <Link href="/integration-setup">
                      <Button variant="outline" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Integrazioni
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              {!!analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Andamento Attività
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics?.responseTime ?? 0}h
                        </div>
                        <div className="text-xs text-gray-600">Tempo Risposta Medio</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {analytics?.satisfactionRate ?? 0}%
                        </div>
                        <div className="text-xs text-gray-600">Soddisfazione Cliente</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {analytics?.activeOffers ?? 0}
                        </div>
                        <div className="text-xs text-gray-600">Offerte Attive</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics?.monthlyRevenue ?? 0}€
                        </div>
                        <div className="text-xs text-gray-600">Ricavi Mensili</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}