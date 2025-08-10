import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="fas fa-exchange-alt text-primary text-2xl mr-2"></i>
                <span className="text-xl font-bold text-slate-900">Switch Market</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Hai già un account?</span>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/auth";
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Accedi
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Il Futuro del <br className="hidden sm:block" />
            <span className="text-primary">Commercio Locale</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Trova quello che cerchi con l'aiuto di Clemente, il tuo assistente AI personale. 
            Connetti acquirenti e venditori nella tua zona.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {/* Login Cliente - Verde */}
            <Card className="w-full sm:w-80 border-2 border-green-500 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <i className="fas fa-user text-green-600 text-4xl mb-2"></i>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Sono un Cliente</h3>
                  <p className="text-green-700 text-sm">Trova prodotti e servizi nella tua zona</p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => {
                    localStorage.setItem('pendingUserType', 'customer');
                    window.location.href = "/auth";
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <i className="fab fa-google mr-2"></i>
                  Accedi con Google
                </Button>
              </CardContent>
            </Card>

            {/* Login Negoziante - Blu */}
            <Card className="w-full sm:w-80 border-2 border-blue-500 bg-blue-50">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <i className="fas fa-store text-blue-600 text-4xl mb-2"></i>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">Sono un Negoziante</h3>
                  <p className="text-blue-700 text-sm">Vendi i tuoi prodotti e servizi</p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => {
                    localStorage.setItem('pendingUserType', 'merchant');
                    window.location.href = "/auth";
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <i className="fab fa-google mr-2"></i>
                  Accedi con Google
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/how-it-works'}
              className="text-lg px-8 py-4 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <i className="fas fa-play mr-2"></i>
              Scopri Come Funziona
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-robot text-primary text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Assistente AI</h3>
              <p className="text-slate-600">
                Clemente ti aiuta a creare richieste perfette e a trovare esattamente quello che cerchi.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-map-marker-alt text-secondary text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Commercio Locale</h3>
              <p className="text-slate-600">
                Scopri prodotti e servizi nella tua zona, supporta i negozianti locali.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-handshake text-accent text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Matching Intelligente</h3>
              <p className="text-slate-600">
                Il nostro algoritmo trova le migliori corrispondenze tra domanda e offerta.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
