import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const { data: userRequests = [] } = useQuery({
    queryKey: ["/api/requests/my"],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 mb-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Il Futuro del <br className="hidden sm:block" />
            Commercio Locale
          </h1>
          <div className="text-xl md:text-2xl opacity-90 mb-8 flex items-center justify-center">
            <span>Trova quello che cerchi con l'aiuto di</span>
            <img 
              src="/attached_assets/Clemente foto profilo_1754847201275.png" 
              alt="Clemente" 
              className="w-8 h-8 rounded-full mx-3 border-2 border-white/30"
            />
            <span>Clemente, il tuo assistente AI personale</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/create">
              <Button className="bg-white text-primary hover:bg-slate-50 px-6 py-3 rounded-xl font-semibold">
                <i className="fas fa-plus mr-2"></i>
                Pubblica una Richiesta
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-6 py-3 rounded-xl font-semibold">
                <i className="fas fa-search mr-2"></i>
                Esplora Richieste
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 rounded-xl">
                <i className="fas fa-handshake text-primary text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Richieste Attive</p>
                <p className="text-2xl font-bold text-slate-900">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary/10 rounded-xl">
                <i className="fas fa-store text-secondary text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Negozianti</p>
                <p className="text-2xl font-bold text-slate-900">892</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent/10 rounded-xl">
                <i className="fas fa-chart-line text-accent text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Match Riusciti</p>
                <p className="text-2xl font-bold text-slate-900">3,419</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Le Tue Richieste Recenti</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {(Array.isArray(userRequests) ? userRequests.length : 0) === 0 ? (
            <div className="p-6 text-center">
              <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
                <i className="fas fa-inbox text-slate-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nessuna richiesta ancora</h3>
              <p className="text-slate-500 mb-4">Inizia creando la tua prima richiesta con l'aiuto di Clemente</p>
              <Link href="/create">
                <Button className="bg-primary hover:bg-primary/90">
                  <i className="fas fa-plus mr-2"></i>
                  Crea la Prima Richiesta
                </Button>
              </Link>
            </div>
          ) : (
            (Array.isArray(userRequests) ? userRequests : []).map((request: any) => (
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
                          ? 'bg-secondary/10 text-secondary' 
                          : request.status === 'negotiating'
                          ? 'bg-accent/10 text-accent'
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
        {(Array.isArray(userRequests) ? userRequests.length : 0) > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <Link href="/browse">
              <button className="text-primary text-sm font-medium hover:underline">
                Visualizza tutte le richieste
              </button>
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
