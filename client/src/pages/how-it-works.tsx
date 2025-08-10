import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="mr-4"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Indietro
              </Button>
              <div className="flex items-center">
                <img 
                  src="/attached_assets/SWITCHMARKET_logo_1754845138370.png" 
                  alt="Switch Market Logo" 
                  className="h-8 w-auto mr-3"
                />
                <span className="text-xl font-bold">Switch Market</span>
              </div>
            </div>
            <div className="flex items-center">
              <Button 
                onClick={async () => {
                  const { authService } = await import("@/lib/auth");
                  try {
                    await authService.signInWithGoogle();
                  } catch (error) {
                    console.error("Login failed:", error);
                  }
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <i className="fab fa-google mr-2"></i>
                Accedi con Google
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Come Funziona <span className="text-primary">Switch Market</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Scopri come i nostri assistenti AI rivoluzionano il commercio locale
          </p>
        </div>

        {/* Step by Step Guide */}
        <div className="space-y-16">
          {/* Step 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/2">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Registrati e Scegli il Tuo Ruolo</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Accedi con Google e scegli se sei un <strong>Cliente</strong> in cerca di prodotti 
                o un <strong>Negoziante</strong> che vuole vendere.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-2"></i>
                  Registrazione sicura con Google
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-2"></i>
                  Profilo personalizzato
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-2"></i>
                  Dashboard dedicata
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="text-center">
                  <i className="fas fa-user-circle text-6xl text-primary mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Profilo Utente</h3>
                  <p className="text-muted-foreground">
                    Crea il tuo profilo in pochi secondi
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
            <div className="lg:w-1/2">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Incontra i Tuoi Assistenti AI</h2>
              <p className="text-lg text-muted-foreground mb-6">
                <strong>Clemente</strong> aiuta i clienti a creare richieste perfette, mentre 
                <strong> Leonardo</strong> assiste i negozianti nelle vendite e strategie.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <CardContent className="text-center pt-0">
                    <img 
                      src="/attached_assets/clemente foto profilo_1754847201275.png" 
                      alt="Clemente AI" 
                      className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-green-300"
                    />
                    <h4 className="font-semibold text-green-700">Clemente</h4>
                    <p className="text-sm text-muted-foreground">Per i Clienti</p>
                  </CardContent>
                </Card>
                <Card className="p-4">
                  <CardContent className="text-center pt-0">
                    <img 
                      src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                      alt="Leonardo AI" 
                      className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-blue-300"
                    />
                    <h4 className="font-semibold text-blue-700">Leonardo</h4>
                    <p className="text-sm text-muted-foreground">Per i Negozianti</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="lg:w-1/2">
              <Card className="p-8 bg-gradient-to-br from-secondary/5 to-accent/5">
                <CardContent className="text-center">
                  <i className="fas fa-robot text-6xl text-secondary mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Assistenti AI</h3>
                  <p className="text-muted-foreground">
                    Intelligenza artificiale al tuo servizio
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/2">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Crea Richieste o Offerte</h2>
              <p className="text-lg text-muted-foreground mb-6">
                I clienti creano richieste dettagliate con l'aiuto di Clemente, 
                mentre i negozianti pubblicano le loro offerte con Leonardo.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <i className="fas fa-check text-accent mr-2"></i>
                  Descrizioni ottimizzate dall'AI
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-accent mr-2"></i>
                  Matching geografico intelligente
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-accent mr-2"></i>
                  Supporto foto e documenti
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Card className="p-8 bg-gradient-to-br from-accent/5 to-primary/5">
                <CardContent className="text-center">
                  <i className="fas fa-handshake text-6xl text-accent mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Matching</h3>
                  <p className="text-muted-foreground">
                    Connessioni perfette tra domanda e offerta
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
            <div className="lg:w-1/2">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Concludi la Transazione</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Comunica direttamente attraverso la chat integrata, negozia i dettagli 
                e concludi l'acquisto in tutta sicurezza.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-2"></i>
                  Chat sicura e privata
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-2"></i>
                  Negoziazione assistita
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-2"></i>
                  Pagamenti protetti
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="text-center">
                  <i className="fas fa-credit-card text-6xl text-primary mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">Transazione</h3>
                  <p className="text-muted-foreground">
                    Pagamenti sicuri e garantiti
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-12">Caratteristiche Uniche</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <CardContent className="text-center pt-0">
                <i className="fas fa-map-marker-alt text-primary text-3xl mb-4"></i>
                <h3 className="font-semibold mb-2">Raggio di Azione</h3>
                <p className="text-sm text-muted-foreground">
                  Imposta il tuo raggio massimo per ritiri locali
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="text-center pt-0">
                <i className="fas fa-truck text-secondary text-3xl mb-4"></i>
                <h3 className="font-semibold mb-2">Consegna Flessibile</h3>
                <p className="text-sm text-muted-foreground">
                  Ritiro, spedizione o entrambe le opzioni
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="text-center pt-0">
                <i className="fas fa-clock text-accent text-3xl mb-4"></i>
                <h3 className="font-semibold mb-2">Urgenza Personalizzata</h3>
                <p className="text-sm text-muted-foreground">
                  24h, 48h o qualche giorno - tu decidi
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="text-center pt-0">
                <i className="fas fa-microphone text-primary text-3xl mb-4"></i>
                <h3 className="font-semibold mb-2">Comandi Vocali</h3>
                <p className="text-sm text-muted-foreground">
                  Dettatura vocale in italiano integrata
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto a Iniziare?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Unisciti a Switch Market e scopri il futuro del commercio locale
          </p>
          <Button 
            size="lg"
            onClick={async () => {
              const { authService } = await import("@/lib/auth");
              try {
                await authService.signInWithGoogle();
              } catch (error) {
                console.error("Login failed:", error);
              }
            }}
            className="bg-primary hover:bg-primary/90 text-lg px-12 py-6"
          >
            <i className="fab fa-google mr-2"></i>
            Inizia Subito con Google
          </Button>
        </div>
      </main>
    </div>
  );
}