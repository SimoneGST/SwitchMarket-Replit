import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast({
        title: "Disconnesso",
        description: "Sei stato disconnesso con successo",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Errore",
        description: "Errore durante la disconnessione",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => location === path;
  
  // Define colors based on user type
  const themeColor = user?.userType === 'customer' ? 'green' : 'blue';
  const primaryColor = user?.userType === 'customer' ? 'text-green-600' : 'text-blue-600';
  const borderColor = user?.userType === 'customer' ? 'border-green-600' : 'border-blue-600';

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
              <img 
                src="/attached_assets/SWITCHMARKET_logo_1754845138370.png" 
                alt="Switch Market" 
                className="h-10 w-auto"
                onError={(e) => {
                  console.error('Logo failed to load in header:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
            <div className="hidden md:ml-10 md:flex space-x-8">
              <Link href="/">
                <button className={`px-1 pb-4 text-sm font-medium border-b-2 ${
                  isActive('/') 
                    ? `${primaryColor} ${borderColor}` 
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                }`}>
                  {user?.userType === 'customer' ? 'Dashboard' : 'Attività'}
                </button>
              </Link>
              <Link href="/browse">
                <button className={`px-1 pb-4 text-sm font-medium border-b-2 ${
                  isActive('/browse') 
                    ? `${primaryColor} ${borderColor}` 
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                }`}>
                  {user?.userType === 'customer' ? 'Cerca Prodotti' : 'Trova Richieste'}
                </button>
              </Link>
              {user?.userType === 'customer' && (
                <Link href="/create">
                  <button className={`px-1 pb-4 text-sm font-medium border-b-2 ${
                    isActive('/create') 
                      ? `${primaryColor} ${borderColor}` 
                      : 'text-slate-500 hover:text-slate-700 border-transparent'
                  }`}>
                    Parla con Clemente
                  </button>
                </Link>
              )}
              <Link href="/messages">
                <button className={`px-1 pb-4 text-sm font-medium border-b-2 ${
                  isActive('/messages') 
                    ? `${primaryColor} ${borderColor}` 
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                }`}>
                  Messaggi
                </button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-500">
              <i className="fas fa-bell text-lg"></i>
              <span className="sr-only">Notifiche</span>
            </button>
            <Link href="/messages">
              <button className="p-2 text-slate-400 hover:text-slate-500 relative">
                <i className="fas fa-message text-lg"></i>
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
            </Link>
            <div className="flex items-center space-x-3">
              <img 
                className="h-8 w-8 rounded-full object-cover bg-slate-200" 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                alt="Profile"
              />
              <span className="text-sm font-medium text-slate-700">
                {user?.firstName ? `${user.firstName} ${user.lastName?.[0] || ''}.` : 'Utente'}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt mr-1"></i>
                Esci
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
