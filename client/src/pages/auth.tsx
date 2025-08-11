import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { authService } from "@/lib/auth";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Controlla se c'è un tipo di utente pending dal localStorage
  useEffect(() => {
    const pendingType = localStorage.getItem('pendingUserType');
    if (pendingType === 'customer' || pendingType === 'merchant') {
      setUserType(pendingType);
      localStorage.removeItem('pendingUserType');
    }
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await authService.signInWithEmail(email, password);
        toast({
          title: "Accesso effettuato!",
          description: "Benvenuto in Switch Market",
        });
      } else {
        await authService.signUpWithEmail(email, password, userType);
        toast({
          title: "Account creato!",
          description: "Il tuo account è stato creato con successo",
        });
      }
      setLocation("/");
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'autenticazione",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto in Switch Market",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'accesso. Prova con email e password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/attached_assets/SWITCHMARKET_logo_1754845138370.png" 
              alt="Switch Market Logo" 
              className="h-12 w-auto mr-3"
            />
            <span className="text-3xl font-bold text-slate-900">
              Switch Market
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isLogin ? 'Bentornato!' : 'Crea il tuo account'}
          </h1>
          <p className="text-slate-600">
            {isLogin 
              ? 'Accedi per continuare nel tuo marketplace locale intelligente' 
              : 'Unisciti alla community di Switch Market'
            }
          </p>
        </div>

        {/* Selezione Tipo Utente per Registrazione */}
        {!isLogin && (
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-700 mb-4 text-center">
              Scegli il tipo di account:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={userType === 'customer' ? "default" : "outline"}
                onClick={() => setUserType('customer')}
                className={`p-6 h-auto transition-all duration-200 ${
                  userType === 'customer' 
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl border-0" 
                    : "border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                }`}
              >
                <div className="text-center">
                  <img 
                    src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                    alt="Clemente AI" 
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                  />
                  <span className="font-semibold">Cliente</span>
                  <div className="text-xs mt-1 opacity-80">con Clemente AI</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={userType === 'merchant' ? "default" : "outline"}
                onClick={() => setUserType('merchant')}
                className={`p-6 h-auto transition-all duration-200 ${
                  userType === 'merchant' 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl border-0" 
                    : "border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <div className="text-center">
                  <img 
                    src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                    alt="Leonardo AI" 
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                  />
                  <span className="font-semibold">Negoziante</span>
                  <div className="text-xs mt-1 opacity-80">con Leonardo AI</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Card Autenticazione */}
        <Card className={`shadow-2xl border-2 transition-all duration-300 ${
          userType === 'customer' 
            ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-white' 
            : 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white'
        }`}>
          <CardHeader className="space-y-4">
            <CardTitle className={`text-center text-xl ${
              userType === 'customer' ? 'text-green-800' : 'text-blue-800'
            }`}>
              <i className={`fas ${userType === 'customer' ? 'fa-shopping-cart' : 'fa-store'} mr-2`}></i>
              {isLogin ? 'Accedi' : 'Registrati'} come {userType === 'customer' ? 'Cliente' : 'Negoziante'}
            </CardTitle>

            {/* Google Sign In */}
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className={`w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                userType === 'customer'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  Accesso in corso...
                </>
              ) : (
                <>
                  <i className="fab fa-google mr-3"></i>
                  {isLogin ? 'Accedi' : 'Registrati'} con Google
                </>
              )}
            </Button>
            


            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-500 font-medium">oppure</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="la-tua-email@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-lg border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="La tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-lg border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                />
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-lg font-semibold transition-all duration-200 ${
                  userType === 'customer'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                } shadow-lg hover:shadow-xl`}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isLogin ? 'Accesso...' : 'Registrazione...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} mr-2`}></i>
                    {isLogin ? 'Accedi' : 'Crea Account'}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                {isLogin ? (
                  <>
                    Non hai un account?{' '}
                    <span className={`font-semibold ${
                      userType === 'customer' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'
                    }`}>
                      Registrati
                    </span>
                  </>
                ) : (
                  <>
                    Hai già un account?{' '}
                    <span className={`font-semibold ${
                      userType === 'customer' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'
                    }`}>
                      Accedi
                    </span>
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Link indietro */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-600 hover:text-slate-900 transition-colors duration-200"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
}