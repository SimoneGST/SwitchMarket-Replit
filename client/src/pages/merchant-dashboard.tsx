import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import RequestCard from "@/components/request-card";
import CharacterIntro from "@/components/character-intro";
import { useCharacterIntro } from "@/hooks/useCharacterIntro";

export default function MerchantDashboard() {
  const { user } = useAuth();
  
  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["/api/requests"],
  });

  const { data: myOffers = [] } = useQuery<any[]>({
    queryKey: ["/api/offers/my"],
  });

  const { showIntro, completeIntro, neverShowAgain } = useCharacterIntro('leonardo');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Character Introduction */}
      {showIntro && (
        <div className="fixed inset-0 z-50">
          <CharacterIntro
            character="leonardo"
            show={showIntro}
            onComplete={completeIntro}
            onNeverShow={neverShowAgain}
          />
        </div>
      )}
      {/* Hero Section - Negoziante (Blu) */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
        <div className="max-w-4xl">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 overflow-hidden">
              <img 
                src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                alt="Leonardo AI" 
                className="w-10 h-10 rounded-lg object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Dashboard Negoziante
              </h1>
              <div className="flex items-center text-blue-100 text-lg">
                <span>Benvenuto {user?.businessName || user?.firstName}! Gestisci le tue vendite con</span>
                <img 
                  src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                  alt="Leonardo" 
                  className="w-6 h-6 rounded-full mx-2 border border-blue-300"
                />
                <span>Leonardo</span>
              </div>
            </div>
          </div>
          
          {/* Verification Status */}
          <div className="mb-6">
            {user?.profileVerified ? (
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <i className="fas fa-shield-check mr-2"></i>
                Attività verificata
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <i className="fas fa-clock mr-2"></i>
                Verifica in corso (24-48h)
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/browse">
              <Button className="bg-white text-blue-800 hover:bg-blue-50 hover:text-blue-900 px-6 py-3 rounded-xl font-bold shadow-2xl border-3 border-blue-200 transition-all duration-200">
                <i className="fas fa-search mr-2"></i>
                Trova Richieste
              </Button>
            </Link>
            <Link href="/integration-setup">
              <Button variant="outline" className="border-3 border-white bg-white/10 text-white hover:bg-white hover:text-blue-800 px-6 py-3 rounded-xl font-bold shadow-2xl backdrop-blur-md transition-all duration-200">
                <i className="fas fa-link mr-2"></i>
                Collega Gestionale
              </Button>
            </Link>
            <Link href="/copilot-dashboard">
              <Button variant="outline" className="border-3 border-white bg-white/10 text-white hover:bg-white hover:text-blue-800 px-6 py-3 rounded-xl font-bold shadow-2xl backdrop-blur-md transition-all duration-200">
                <img 
                  src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                  alt="Leonardo AI" 
                  className="w-5 h-5 mr-2"
                />
                Copilot Leonardo
              </Button>
            </Link>
            <Link href="/merchant-profile">
              <Button variant="outline" className="border-3 border-white bg-white/10 text-white hover:bg-white hover:text-blue-800 px-6 py-3 rounded-xl font-bold shadow-2xl backdrop-blur-md transition-all duration-200">
                <i className="fas fa-user mr-2"></i>
                Il Mio Profilo
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 rounded-xl font-semibold">
                <i className="fas fa-message mr-2"></i>
                Gestisci Clienti
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats - Negoziante */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="fas fa-eye text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Richieste Disponibili</p>
                <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="fas fa-handshake text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Offerte Inviate</p>
                <p className="text-2xl font-bold text-slate-900">{myOffers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="fas fa-check-circle text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Vendite Chiuse</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="fas fa-euro-sign text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Ricavi Mese</p>
                <p className="text-2xl font-bold text-slate-900">€0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leonardo Assistant & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-slate-200 bg-blue-50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                <i className="fas fa-brain text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Leonardo, il tuo copilota vendite</h3>
                <p className="text-sm text-slate-600">Ti aiuta a gestire offerte e clienti automaticamente</p>
              </div>
              <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <i className="fas fa-circle text-blue-500 text-xs mr-2"></i>
                Attivo
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 italic">
                  "Ciao! Monitoro automaticamente le richieste che potrebbero interessarti. 
                  Ti aiuto a creare offerte mirate e a gestire le conversazioni con i clienti."
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-blue-500 hover:bg-blue-600" size="sm">
                  <i className="fas fa-magic mr-2"></i>
                  Offerte Automatiche
                </Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-chart-line mr-2"></i>
                  Analizza Performance
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Business Info Card */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">La Tua Attività</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.businessName}</p>
              <p className="text-xs text-slate-500">{user?.businessCategory}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">P.IVA: {user?.vatNumber}</p>
              <p className="text-xs text-slate-600">{user?.businessAddress}</p>
            </div>
            <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Modifica profilo</span>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* Richieste Rilevanti */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Richieste Rilevanti per Te</h2>
            <Link href="/browse">
              <Button variant="outline" size="sm">
                <i className="fas fa-filter mr-2"></i>
                Filtra Richieste
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Leonardo ha selezionato {requests.slice(0, 3).length} richieste che potrebbero interessarti
          </p>
        </div>
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-blue-50 rounded-xl inline-flex items-center justify-center mb-4">
                <i className="fas fa-search text-blue-500 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nessuna richiesta al momento</h3>
              <p className="text-slate-500 mb-4">Quando i clienti pubblicheranno richieste nella tua categoria, appariranno qui</p>
              <Link href="/browse">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <i className="fas fa-search mr-2"></i>
                  Esplora Tutte le Richieste
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.slice(0, 3).map((request: any) => (
                <RequestCard key={request.id} request={request} />
              ))}
              {requests.length > 3 && (
                <div className="text-center pt-4">
                  <Link href="/browse">
                    <Button variant="outline">
                      Visualizza tutte le richieste ({requests.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Attività Recente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <i className="fas fa-eye text-slate-400 w-5"></i>
                  <span className="ml-3 text-sm text-slate-600">Richieste visualizzate oggi</span>
                </div>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <i className="fas fa-paper-plane text-slate-400 w-5"></i>
                  <span className="ml-3 text-sm text-slate-600">Offerte inviate questa settimana</span>
                </div>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <i className="fas fa-message text-slate-400 w-5"></i>
                  <span className="ml-3 text-sm text-slate-600">Nuovi messaggi</span>
                </div>
                <span className="text-sm font-medium">0</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Suggerimenti Leonardo</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-lightbulb text-blue-500 mt-1 mr-3"></i>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">Completa il tuo profilo</h5>
                    <p className="text-sm text-blue-700">
                      Aggiungi più dettagli sulla tua attività per ricevere richieste più mirate.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-star text-blue-500 mt-1 mr-3"></i>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">Rispondi velocemente</h5>
                    <p className="text-sm text-blue-700">
                      I clienti preferiscono negozianti che rispondono entro poche ore.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Character Introduction */}
      <CharacterIntro
        character="leonardo"
        show={showIntro}
        onComplete={completeIntro}
      />
    </main>
  );
}