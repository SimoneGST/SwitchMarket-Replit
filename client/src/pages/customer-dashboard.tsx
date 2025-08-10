import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import CharacterIntro from "@/components/character-intro";
import { useCharacterIntro } from "@/hooks/useCharacterIntro";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data: userRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/requests/my"],
  });
  
  const { showIntro, completeIntro, resetIntro } = useCharacterIntro('clemente');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section - Cliente (Verde) */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
        <div className="max-w-4xl">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
              <i className="fas fa-shopping-cart text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Dashboard Cliente
              </h1>
              <p className="text-green-100 text-lg">
                Ciao {user?.firstName}! Trova quello che cerchi con Clemente
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/create">
              <Button className="bg-white text-green-800 hover:bg-green-50 hover:text-green-900 px-6 py-3 rounded-xl font-bold shadow-2xl border-3 border-green-200 transition-all duration-200">
                <img 
                  src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                  alt="Clemente AI" 
                  className="w-5 h-5 mr-2"
                />
                Parla con Clemente
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" className="border-3 border-white bg-white/10 text-white hover:bg-white hover:text-green-800 px-6 py-3 rounded-xl font-bold shadow-2xl backdrop-blur-md transition-all duration-200">
                <i className="fas fa-search mr-2"></i>
                Cerca Prodotti
              </Button>
            </Link>
            <Link href="/customer-profile">
              <Button variant="outline" className="border-3 border-white bg-white/10 text-white hover:bg-white hover:text-green-800 px-6 py-3 rounded-xl font-bold shadow-2xl backdrop-blur-md transition-all duration-200">
                <i className="fas fa-user mr-2"></i>
                Il Mio Profilo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats - Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <i className="fas fa-clipboard-list text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Tue Richieste</p>
                <p className="text-2xl font-bold text-slate-900">{userRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <i className="fas fa-handshake text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Offerte Ricevute</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Acquisti Completati</p>
                <p className="text-2xl font-bold text-slate-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clemente Assistant Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-slate-200 bg-green-50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 p-1">
                <img 
                  src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                  alt="Clemente AI" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Clemente, il tuo assistente AI</h3>
                <p className="text-sm text-slate-600">Ti aiuta a trovare esattamente quello che cerchi</p>
              </div>
              <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <i className="fas fa-circle text-green-500 text-xs mr-2"></i>
                Online
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 italic">
                  "Ciao! Sono qui per aiutarti a trovare quello che cerchi. 
                  Dimmi cosa ti serve e ti aiuterò a creare la richiesta perfetta per i negozianti della tua zona."
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/create" className="flex-1">
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <i className="fas fa-comment mr-2"></i>
                    Inizia una conversazione
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Azioni Rapide</h3>
          </div>
          <div className="p-6 space-y-3">
            <Link href="/browse" className="block">
              <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <i className="fas fa-search text-green-500 w-5"></i>
                  <span className="ml-3 text-sm font-medium">Cerca prodotti</span>
                </div>
              </button>
            </Link>
            <Link href="/messages" className="block">
              <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <i className="fas fa-message text-green-500 w-5"></i>
                  <span className="ml-3 text-sm font-medium">I tuoi messaggi</span>
                </div>
              </button>
            </Link>
            <button className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center">
                <i className="fas fa-heart text-green-500 w-5"></i>
                <span className="ml-3 text-sm font-medium">Prodotti salvati</span>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Le Tue Richieste Recenti</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {userRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-green-50 rounded-xl inline-flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center p-1">
                  <img 
                    src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                    alt="Clemente AI" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Inizia con Clemente</h3>
              <p className="text-slate-500 mb-4">Non hai ancora creato nessuna richiesta. Parla con Clemente per trovare quello che cerchi!</p>
              <Link href="/create">
                <Button className="bg-green-500 hover:bg-green-600">
                  <i className="fas fa-robot mr-2"></i>
                  Parla con Clemente
                </Button>
              </Link>
            </div>
          ) : (
            userRequests.map((request: any) => (
              <div key={request.id} className="p-6 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900">{request.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      €{request.priceMin} - €{request.priceMax} • {request.location}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : request.status === 'negotiating'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <i className={`fas ${
                          request.status === 'open' ? 'fa-check-circle' :
                          request.status === 'negotiating' ? 'fa-clock' : 'fa-times-circle'
                        } mr-1`}></i>
                        {request.status === 'open' ? 'Aperta' : 
                         request.status === 'negotiating' ? 'In Negoziazione' : 'Chiusa'}
                      </span>
                      <span className="text-xs text-slate-500">0 offerte ricevute</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {new Date(request.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Character Introduction */}
      <CharacterIntro
        character="clemente"
        show={showIntro}
        onComplete={completeIntro}
      />
    </main>
  );
}