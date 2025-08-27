import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
      <div className="flex justify-around max-w-screen-sm mx-auto">
        <Link href="/">
          <button aria-label="Home" className={`flex flex-col items-center py-2 px-3 ${
            isActive('/') ? 'text-primary' : 'text-slate-400'
          }`}>
            <img 
              src="/attached_assets/SWITCHMARKET_logo_1754845138370.png" 
              alt="Switch Market" 
              className="w-5 h-5"
            />
            <span className="text-xs mt-1">Home</span>
          </button>
        </Link>
        {user?.userType === 'merchant' && (
          <Link href="/browse">
            <button aria-label="Richieste" className={`flex flex-col items-center py-2 px-3 ${
              isActive('/browse') ? 'text-primary' : 'text-slate-400'
            }`}>
              <i className="fas fa-search text-lg"></i>
              <span className="text-xs mt-1">Richieste</span>
            </button>
          </Link>
        )}
        <Link href="/create">
          <button aria-label="Crea" className={`flex flex-col items-center py-2 px-3 ${
            isActive('/create') ? 'text-primary' : 'text-slate-400'
          }`}>
            <i className={`fas ${user?.userType === 'merchant' ? 'fa-search' : 'fa-plus-circle'} text-lg`}></i>
            <span className="text-xs mt-1">{user?.userType === 'merchant' ? 'Fornitori' : 'Crea'}</span>
          </button>
        </Link>
        <Link href="/messages">
          <button aria-label="Messaggi" className={`flex flex-col items-center py-2 px-3 relative ${
            isActive('/messages') ? 'text-primary' : 'text-slate-400'
          }`}>
            <i className="fas fa-message text-lg"></i>
            <span className="text-xs mt-1">Messaggi</span>
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-white text-xs rounded-full flex items-center justify-center">3</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
