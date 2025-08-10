import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-3">
                  <i className="fas fa-exchange-alt text-white text-lg"></i>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Switch Market
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 hidden sm:block">Hai già un account?</span>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/auth"}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 transition-all duration-200"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Accedi
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-8 text-center">
          <Badge variant="outline" className="mb-6 bg-green-50 text-green-700 border-green-200 px-4 py-2">
            <i className="fas fa-robot mr-2"></i>
            Powered by AI - Assistente Clemente
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Il Prodotto che Cerchi,{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Ora.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Smettila di cercare. Invia la tua richiesta e lascia che i negozi della tua zona 
            ti facciano la loro <strong>migliore offerta</strong>.
          </p>

          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-16">
            {/* Cliente Card */}
            <Card className="w-full max-w-sm transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-shopping-cart text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-3">
                  Inizia come Acquirente
                </h3>
                <p className="text-green-700 mb-6 leading-relaxed">
                  Trova prodotti e servizi nella tua zona con l'aiuto di Clemente AI
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-green-600">
                    <i className="fas fa-check-circle mr-2"></i>
                    <span>È completamente gratuito</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <i className="fas fa-robot mr-2"></i>
                    <span>Assistente AI personalizzato</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <i className="fas fa-clock mr-2"></i>
                    <span>Risposta in pochi minuti</span>
                  </div>
                </div>
                <Button 
                  size="lg"
                  onClick={() => {
                    localStorage.setItem('pendingUserType', 'customer');
                    window.location.href = "/auth";
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg py-3"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  Inizia Gratis
                </Button>
              </CardContent>
            </Card>

            {/* Negoziante Card */}
            <Card className="w-full max-w-sm transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-store text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-blue-800 mb-3">
                  Sei un Negoziante?
                </h3>
                <p className="text-blue-700 mb-6 leading-relaxed">
                  Ricevi richieste qualificate e aumenta le tue vendite locali
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-blue-600">
                    <i className="fas fa-check-circle mr-2"></i>
                    <span>Clienti già interessati</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <i className="fas fa-chart-line mr-2"></i>
                    <span>Aumenta le vendite</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <i className="fas fa-handshake mr-2"></i>
                    <span>Zero intermediari</span>
                  </div>
                </div>
                <Button 
                  size="lg"
                  onClick={() => {
                    localStorage.setItem('pendingUserType', 'merchant');
                    window.location.href = "/auth";
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg py-3"
                >
                  <i className="fas fa-store mr-2"></i>
                  Registra Negozio
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/how-it-works'}
              className="text-lg px-8 py-4 border-slate-300 text-slate-700 hover:bg-slate-100 transition-all duration-200"
            >
              <i className="fas fa-play mr-2"></i>
              Scopri Come Funziona
            </Button>
            <Button 
              size="lg"
              variant="ghost"
              className="text-lg px-8 py-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            >
              <i className="fas fa-question-circle mr-2"></i>
              Hai Domande?
            </Button>
          </div>
        </div>

        {/* Come Funziona */}
        <div className="py-20 bg-white/50 rounded-3xl mt-20 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Come Funziona</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              In 3 semplici passi, trovi quello che cerchi o vendi i tuoi prodotti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Invia Richiesta</h3>
              <p className="text-slate-600 leading-relaxed">
                Descrivi il prodotto che stai cercando. Clemente AI ti aiuta a rendere la richiesta precisa e dettagliata.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ricevi Offerte</h3>
              <p className="text-slate-600 leading-relaxed">
                I negozianti della tua zona ti inviano le loro proposte direttamente in-app con prezzi e dettagli.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Concludi l'Affare</h3>
              <p className="text-slate-600 leading-relaxed">
                Scegli l'offerta migliore e contatta il negoziante per acquistare o accordarti sui dettagli.
              </p>
            </div>
          </div>
        </div>

        {/* Vantaggi */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Perché Switch Market?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              La prima piattaforma che unisce intelligenza artificiale e commercio locale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-all duration-200 border-0 bg-green-50">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-gift text-green-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Zero Costi</h3>
                <p className="text-slate-600 text-sm">
                  Invia richieste e ricevi offerte completamente gratuito
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-all duration-200 border-0 bg-blue-50">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-blue-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Assistente AI</h3>
                <p className="text-slate-600 text-sm">
                  Clemente ti aiuta a creare richieste perfette
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-all duration-200 border-0 bg-purple-50">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clock text-purple-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Veloce</h3>
                <p className="text-slate-600 text-sm">
                  Ricevi offerte in pochi minuti, non giorni
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-all duration-200 border-0 bg-orange-50">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-handshake text-orange-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Locale</h3>
                <p className="text-slate-600 text-sm">
                  Supporta i negozi della tua zona
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA finale */}
        <div className="text-center py-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl text-white mb-20">
          <h2 className="text-4xl font-bold mb-4">Pronto a Iniziare?</h2>
          <p className="text-xl mb-8 opacity-90">
            Unisciti a migliaia di utenti che hanno già trovato quello che cercavano
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => {
                localStorage.setItem('pendingUserType', 'customer');
                window.location.href = "/auth";
              }}
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-lg"
            >
              <i className="fas fa-rocket mr-2"></i>
              Inizia come Cliente
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => {
                localStorage.setItem('pendingUserType', 'merchant');
                window.location.href = "/auth";
              }}
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
            >
              <i className="fas fa-store mr-2"></i>
              Registra Negozio
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-2">
                <i className="fas fa-exchange-alt text-white"></i>
              </div>
              <span className="text-xl font-bold">Switch Market</span>
            </div>
            <p className="text-slate-400 mb-4">
              Il marketplace locale intelligente powered by AI
            </p>
            <div className="flex justify-center space-x-6 text-slate-400">
              <span className="text-sm">Privacy Policy</span>
              <span className="text-sm">Termini di Servizio</span>
              <span className="text-sm">Supporto</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}