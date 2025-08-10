import { useState } from "react";
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
        title: "Accesso effettuato!",
        description: "Benvenuto in Switch Market",
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Google auth error:", error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'accesso con Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-exchange-alt text-primary text-3xl mr-2"></i>
            <span className="text-2xl font-bold text-slate-900">Switch Market</span>
          </div>
          <p className="text-slate-600">Il tuo marketplace locale intelligente</p>
        </div>

        {/* User Type Selection */}
        {!isLogin && (
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3 text-center">Scegli il tipo di account:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={userType === 'customer' ? "default" : "outline"}
                onClick={() => setUserType('customer')}
                className={userType === 'customer' 
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                  : "border-green-600 text-green-600 hover:bg-green-50"
                }
              >
                <i className="fas fa-user mr-2"></i>
                Cliente
              </Button>
              <Button
                type="button"
                variant={userType === 'merchant' ? "default" : "outline"}
                onClick={() => setUserType('merchant')}
                className={userType === 'merchant' 
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" 
                  : "border-blue-600 text-blue-600 hover:bg-blue-50"
                }
              >
                <i className="fas fa-store mr-2"></i>
                Negoziante
              </Button>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <Card className={`border-2 ${
          userType === 'customer' 
            ? 'border-green-500 bg-green-50/30' 
            : 'border-blue-500 bg-blue-50/30'
        }`}>
          <CardHeader>
            <CardTitle className={`text-center ${
              userType === 'customer' ? 'text-green-800' : 'text-blue-800'
            }`}>
              {isLogin ? 'Accedi' : 'Registrati'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={isLoading}
            >
              <i className="fab fa-google mr-2"></i>
              {isLogin ? 'Accedi' : 'Registrati'} con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">oppure</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tua@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                {!isLogin && (
                  <p className="text-xs text-slate-500 mt-1">Minimo 6 caratteri</p>
                )}
              </div>

              <Button
                type="submit"
                className={`w-full ${
                  userType === 'customer' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isLogin ? 'Accesso...' : 'Registrazione...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Accedi' : 'Registrati'}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-600 hover:text-slate-900"
                disabled={isLoading}
              >
                {isLogin 
                  ? "Non hai un account? Registrati" 
                  : "Hai già un account? Accedi"
                }
              </Button>
            </div>

            {/* Password Reset */}
            {isLogin && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={async () => {
                    if (!email) {
                      toast({
                        title: "Email richiesta",
                        description: "Inserisci la tua email per reimpostare la password",
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      await authService.resetPassword(email);
                      toast({
                        title: "Email inviata",
                        description: "Controlla la tua email per reimpostare la password",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Errore",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  disabled={isLoading}
                >
                  Password dimenticata?
                </Button>
              </div>
            )}

            {/* Back to home */}
            <div className="text-center pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-slate-600 hover:text-slate-900"
                disabled={isLoading}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Torna alla home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}