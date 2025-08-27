import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function MerchantDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/merchant/stats"],
    enabled: !!user,
  });

  const { data: recentRequests } = useQuery<any[]>({
    queryKey: ["/api/requests/nearby"],
    enabled: !!user?.pivaVerified,
  });

  const { data: myProducts } = useQuery<any[]>({
    queryKey: ["/api/products/my"],
    enabled: !!user?.pivaVerified,
  });

  const { data: conversations } = useQuery<any[]>({
    queryKey: ["/api/conversations/my"],
    enabled: !!user?.pivaVerified,
  });

  if (!user?.pivaVerified) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Dashboard Attività</h1>
          <p className="text-slate-600 mt-2">Benvenuto nel tuo centro di controllo commerciale</p>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">Completa la Verifica</h3>
                <p className="text-yellow-700 mb-4">
                  Per accedere a tutte le funzionalità della dashboard negozianti, completa 
                  la verifica della tua attività con P.IVA o Codice Fiscale.
                </p>
                <div className="flex gap-3">
                  <Link href="/merchant-verification">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <i className="fas fa-check-circle mr-2"></i>
                      Verifica Attività
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Dashboard Attività</h1>
            <p className="text-slate-600 mt-2">
              Gestisci la tua attività e monitora le performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              <i className="fas fa-check mr-1"></i>
              Verificato
            </Badge>
            <Badge variant="outline">
              {user?.businessName || 'Attività'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Statistiche Principali */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-search text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-slate-600">Richieste Vicine</p>
                <p className="text-2xl font-bold text-blue-600">
                  {recentRequests?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-slate-600">Prodotti Attivi</p>
                <p className="text-2xl font-bold text-green-600">
                  {myProducts?.filter((p: any) => p.isActive)?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-comments text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-slate-600">Conversazioni</p>
                <p className="text-2xl font-bold text-purple-600">
                  {conversations?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-orange-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-slate-600">Leonardo AI</p>
                <p className="text-xl font-bold text-orange-600">
                  {user?.copilotConfig ? 'Attivo' : 'Configura'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Azioni Rapide */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <i className="fas fa-plus-circle"></i>
              Azioni Rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/product/add">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
                <i className="fas fa-plus mr-2"></i>
                Aggiungi Prodotto
              </Button>
            </Link>
            <Link href="/store-showcase">
              <Button variant="outline" className="w-full justify-start">
                <i className="fas fa-store mr-2"></i>
                Gestisci Vetrina
              </Button>
            </Link>
            <Link href="/merchant-integrations">
              <Button variant="outline" className="w-full justify-start">
                <i className="fas fa-plug mr-2"></i>
                Collegamenti Gestionali
              </Button>
            </Link>
            <Link href="/copilot-dashboard">
              <Button variant="outline" className="w-full justify-start">
                <i className="fas fa-robot mr-2"></i>
                Configura Leonardo AI
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <i className="fas fa-clock"></i>
              Richieste Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(recentRequests) && recentRequests.length > 0 ? (
              <div className="space-y-3">
                {Array.isArray(recentRequests) && recentRequests.slice(0, 3).map((request: any) => (
                  <Link key={request.id} href={`/browse?request=${encodeURIComponent(request.id)}`}>
                  <div className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{request.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {request.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                      {request.description}
                    </p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{request.location}</span>
                      <span className="font-medium text-blue-600">
                        €{request.priceMin}-{request.priceMax}
                      </span>
                    </div>
                  </div>
                  </Link>
                ))}
                <Link href="/browse">
                  <Button variant="outline" size="sm" className="w-full">
                    Vedi Tutte le Richieste
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-search text-slate-300 text-3xl mb-3"></i>
                <p className="text-slate-500 text-sm">Nessuna richiesta vicina</p>
                <Link href="/browse">
                  <Button variant="outline" size="sm" className="mt-3">
                    Cerca Richieste
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <i className="fas fa-chart-line"></i>
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Offerte Inviate</span>
                <span className="font-semibold">{stats?.offersCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tasso Risposta</span>
                <span className="font-semibold text-green-600">
                  {stats?.responseRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Vendite Questo Mese</span>
                <span className="font-semibold text-blue-600">
                  €{stats?.monthlyRevenue || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Rating Medio</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{stats?.averageRating || 0}</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <i 
                        key={star}
                        className={`fas fa-star text-xs ${
                          star <= (stats?.averageRating || 0) 
                            ? 'text-yellow-400' 
                            : 'text-slate-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leonardo AI - Sempre protagonista */}
      <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <img 
              src="/attached_assets/leonardo_avatar_1754851387216.png" 
              alt="Leonardo" 
              className="h-20 w-20 rounded-full border-4 border-white shadow-lg"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face";
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-blue-900">
                  Ciao! Sono Leonardo, il tuo assistente
                </h3>
                {user?.copilotConfig ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <i className="fas fa-circle text-green-600 text-xs mr-1"></i>
                    Attivo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <i className="fas fa-clock text-orange-600 text-xs mr-1"></i>
                    Da Configurare
                  </Badge>
                )}
              </div>
              
              <p className="text-blue-700 mb-4 text-lg">
                {user?.copilotConfig 
                  ? "Sto gestendo le conversazioni con i tuoi clienti. Oggi ho aiutato " + (stats?.todayChats || 0) + " persone!"
                  : "Sono qui per aiutarti a gestire la tua attività! Posso rispondere ai clienti, gestire i prodotti e guidarti in tutte le funzioni della dashboard."
                }
              </p>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-4">
                {user?.copilotConfig ? (
                  <>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-comments text-blue-600"></i>
                        <div>
                          <p className="text-xs text-slate-600">Chat Oggi</p>
                          <p className="font-bold text-blue-600">{stats?.todayChats || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-clock text-green-600"></i>
                        <div>
                          <p className="text-xs text-slate-600">Risposta</p>
                          <p className="font-bold text-green-600">{stats?.avgResponseTime || 2}s</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-thumbs-up text-purple-600"></i>
                        <div>
                          <p className="text-xs text-slate-600">Soddisfazione</p>
                          <p className="font-bold text-purple-600">{stats?.satisfaction || 4.5}/5</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-handshake text-orange-600"></i>
                        <div>
                          <p className="text-xs text-slate-600">Conversioni</p>
                          <p className="font-bold text-orange-600">{stats?.conversions || 12}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-robot text-blue-600"></i>
                        <p className="text-sm font-medium text-blue-700">Chat Automatiche</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-store text-green-600"></i>
                        <p className="text-sm font-medium text-green-700">Gestione Prodotti</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-chart-line text-purple-600"></i>
                        <p className="text-sm font-medium text-purple-700">Analytics Vendite</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-lightbulb text-orange-600"></i>
                        <p className="text-sm font-medium text-orange-700">Consigli Esperti</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                {user?.copilotConfig ? (
                  <>
                    <Link href="/leonardo-copilot">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <i className="fas fa-cog mr-2"></i>
                        Configura Leonardo
                      </Button>
                    </Link>
                    <Link href="/product/add">
                      <Button variant="outline">
                        <i className="fas fa-plus mr-2"></i>
                        Aggiungi Prodotto
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <i className="fas fa-comments mr-2"></i>
                      Chat con Leonardo
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/leonardo-copilot">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <i className="fas fa-rocket mr-2"></i>
                        Attiva Leonardo AI
                      </Button>
                    </Link>
                    <Link href="/leonardo-profile-setup">
                      <Button variant="outline">
                        <i className="fas fa-user-cog mr-2"></i>
                        Completa Profilo
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}