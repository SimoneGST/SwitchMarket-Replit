import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function MerchantDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/merchant/stats"],
    enabled: !!user,
  });

  const { data: recentRequests } = useQuery({
    queryKey: ["/api/requests/nearby"],
    enabled: !!user?.pivaVerified,
  });

  const { data: myProducts } = useQuery({
    queryKey: ["/api/products/my"],
    enabled: !!user?.pivaVerified,
  });

  const { data: conversations } = useQuery({
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
                  Per accedere a tutte le funzionalità della dashboard negozianti, devi completare 
                  la verifica della tua attività con P.IVA e Codice Fiscale.
                </p>
                <div className="flex gap-3">
                  <Link href="/merchant-verification">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <i className="fas fa-check-circle mr-2"></i>
                      Verifica Attività
                    </Button>
                  </Link>
                  <Link href="/merchant-profile">
                    <Button variant="outline">
                      <i className="fas fa-user mr-2"></i>
                      Completa Profilo
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
            {recentRequests?.length > 0 ? (
              <div className="space-y-3">
                {recentRequests?.slice(0, 3).map((request: any) => (
                  <div key={request.id} className="p-3 border rounded-lg hover:bg-slate-50">
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

      {/* Leonardo AI Status */}
      {user?.copilotConfig ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <img 
                  src="/attached_assets/leonardo_avatar_1754851387216.png" 
                  alt="Leonardo" 
                  className="h-8 w-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face";
                  }}
                />
                Leonardo AI - Assistente Attivo
              </CardTitle>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <i className="fas fa-circle text-green-600 text-xs mr-1"></i>
                Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Chat Gestite Oggi</p>
                  <p className="font-semibold">{stats?.todayChats || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tempo Risposta Medio</p>
                  <p className="font-semibold">{stats?.avgResponseTime || 0}s</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-thumbs-up text-purple-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Soddisfazione</p>
                  <p className="font-semibold">{stats?.satisfaction || 0}/5</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href="/copilot-dashboard">
                <Button variant="outline" size="sm">
                  <i className="fas fa-cog mr-2"></i>
                  Configura
                </Button>
              </Link>
              <Link href="/copilot-analytics">
                <Button variant="outline" size="sm">
                  <i className="fas fa-chart-bar mr-2"></i>
                  Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <img 
                src="/attached_assets/leonardo_avatar_1754851387216.png" 
                alt="Leonardo" 
                className="h-16 w-16 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face";
                }}
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Attiva Leonardo AI
                </h3>
                <p className="text-blue-600 mb-4">
                  L'assistente AI che gestisce automaticamente le conversazioni con i clienti, 
                  risponde alle domande sui prodotti e ti aiuta a convertire più vendite.
                </p>
                <Link href="/copilot-dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <i className="fas fa-robot mr-2"></i>
                    Configura Leonardo AI
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}