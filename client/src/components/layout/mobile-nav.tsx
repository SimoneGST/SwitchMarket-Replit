import { Link, useLocation } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2">
      <div className="flex justify-around">
        <Link href="/">
          <button className={`flex flex-col items-center py-2 px-3 ${
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
        <Link href="/browse">
          <button className={`flex flex-col items-center py-2 px-3 ${
            isActive('/browse') ? 'text-primary' : 'text-slate-400'
          }`}>
            <i className="fas fa-search text-lg"></i>
            <span className="text-xs mt-1">Cerca</span>
          </button>
        </Link>
        <Link href="/create">
          <button className={`flex flex-col items-center py-2 px-3 ${
            isActive('/create') ? 'text-primary' : 'text-slate-400'
          }`}>
            <i className="fas fa-plus-circle text-lg"></i>
            <span className="text-xs mt-1">Crea</span>
          </button>
        </Link>
        <Link href="/messages">
          <button className={`flex flex-col items-center py-2 px-3 relative ${
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
