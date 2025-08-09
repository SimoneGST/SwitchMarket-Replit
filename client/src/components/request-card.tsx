import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RequestCardProps {
  request: any;
}

export default function RequestCard({ request }: RequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-secondary/10 text-secondary';
      case 'negotiating':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return 'fa-check-circle';
      case 'negotiating':
        return 'fa-clock';
      default:
        return 'fa-times-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aperta';
      case 'negotiating':
        return 'In Negoziazione';
      default:
        return 'Chiusa';
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Meno di un\'ora fa';
    if (diffHours < 24) return `${diffHours} ore fa`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 giorno fa';
    return `${diffDays} giorni fa`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                <i className={`fas ${getStatusIcon(request.status)} mr-1`}></i>
                {getStatusText(request.status)}
              </span>
              <span className="text-xs text-slate-500">Pubblicata {timeAgo(request.createdAt)}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{request.title}</h3>
            <p className="text-sm text-slate-600 mb-3">{request.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-slate-500 mb-3">
              {request.priceMin && request.priceMax && (
                <span><i className="fas fa-euro-sign mr-1"></i>€{request.priceMin} - €{request.priceMax}</span>
              )}
              <span><i className="fas fa-map-marker-alt mr-1"></i>{request.location}</span>
              <span><i className="fas fa-tag mr-1"></i>{request.category}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img 
                    className="h-6 w-6 rounded-full object-cover bg-slate-200" 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=24&h=24" 
                    alt="Richiedente"
                  />
                  <span className="text-xs text-slate-600">Acquirente</span>
                  <div className="flex items-center">
                    <i className="fas fa-star text-yellow-400 text-xs"></i>
                    <span className="text-xs text-slate-500 ml-1">4.8</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <i className="fas fa-heart mr-1"></i>
                  Salva
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <i className="fas fa-paper-plane mr-1"></i>
                  Invia Offerta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
