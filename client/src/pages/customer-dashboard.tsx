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
  
  const { showIntro, completeIntro, neverShowAgain } = useCharacterIntro('clemente');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Character Introduction */}
      {showIntro && (
        <div className="fixed inset-0 z-50">
          <CharacterIntro
            character="clemente"
            show={showIntro}
            onComplete={completeIntro}
            onNeverShow={neverShowAgain}
          />
        </div>
      )}
      {/* Hero Section - Cliente (Verde) */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
        <div className="max-w-4xl">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4 overflow-hidden">
              <img 
                src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                alt="Clemente AI" 
                className="w-14 h-14 rounded-lg object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Ciao {user?.firstName}!
              </h1>
              <p className="text-green-100 text-lg">
                Parla con Clemente per trovare quello che cerchi
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <Link href="/create">
              <Button className="bg-white text-green-800 hover:bg-green-50 hover:text-green-900 px-8 py-4 rounded-xl font-bold shadow-2xl border-3 border-green-200 transition-all duration-200">
                <i className="fas fa-comments mr-2"></i>
                Parla con Clemente
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-all duration-200 border-2 border-blue-100 hover:border-blue-300 group cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <i className="fas fa-bookmark text-blue-600 text-xl"></i>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Prodotti Salvati</h3>
            <p className="text-sm text-slate-600">I tuoi preferiti e wishlist</p>
          </CardContent>
        </Card>
        
        <Link href="/messages">
          <Card className="hover:shadow-lg transition-all duration-200 border-2 border-purple-100 hover:border-purple-300 group cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <i className="fas fa-comments text-purple-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">I Tuoi Messaggi</h3>
              <p className="text-sm text-slate-600">Chat con i negozianti</p>
            </CardContent>
          </Card>
        </Link>
        
        <Card className="hover:shadow-lg transition-all duration-200 border-2 border-orange-100 hover:border-orange-300 group cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
              <i className="fas fa-store text-orange-600 text-xl"></i>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Negozi Salvati</h3>
            <p className="text-sm text-slate-600">I tuoi negozianti preferiti</p>
          </CardContent>
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Crea la tua prima richiesta</h3>
              <p className="text-slate-500 mb-4">Non hai ancora creato nessuna richiesta. Chatta con Clemente per trovare quello che cerchi!</p>
              <Link href="/create">
                <Button className="bg-green-500 hover:bg-green-600">
                  <i className="fas fa-comments mr-2"></i>
                  Crea Richiesta
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