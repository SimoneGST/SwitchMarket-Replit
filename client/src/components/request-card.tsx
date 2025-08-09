import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    priceMin: number;
    priceMax: number;
    location: string;
    actionRadius?: number;
    deliveryPreference?: string;
    urgencyLevel?: string;
    status: string;
    createdAt: string;
  };
}

export default function RequestCard({ request }: RequestCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{request.title}</h3>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">{request.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center">
                <i className="fas fa-euro-sign mr-1"></i>
                €{request.priceMin} - €{request.priceMax}
              </span>
              <span className="flex items-center">
                <i className="fas fa-map-marker-alt mr-1"></i>
                {request.location}
              </span>
              {request.actionRadius && (request.deliveryPreference === 'pickup' || request.deliveryPreference === 'both') && (
                <span className="flex items-center">
                  <i className="fas fa-walking mr-1"></i>
                  Ritiro {request.actionRadius}km
                </span>
              )}
              {request.deliveryPreference && (
                <span className="flex items-center">
                  <i className={`fas ${
                    request.deliveryPreference === 'pickup' ? 'fa-walking' :
                    request.deliveryPreference === 'delivery' ? 'fa-truck' : 'fa-arrows-alt'
                  } mr-1`}></i>
                  {request.deliveryPreference === 'pickup' ? 'Solo Ritiro' :
                   request.deliveryPreference === 'delivery' ? 'Solo Spedizione' : 'Ritiro + Spedizione'}
                </span>
              )}
              {request.urgencyLevel && (request.deliveryPreference === 'delivery' || request.deliveryPreference === 'both') && (
                <span className="flex items-center">
                  <i className={`fas ${
                    request.urgencyLevel === '24h' ? 'fa-bolt text-red-500' :
                    request.urgencyLevel === '48h' ? 'fa-truck-fast text-orange-500' : 'fa-clock text-green-500'
                  } mr-1`}></i>
                  <span className={request.urgencyLevel === '24h' ? 'text-red-600' : request.urgencyLevel === '48h' ? 'text-orange-600' : 'text-green-600'}>
                    {request.urgencyLevel === '24h' ? 'Express 24h' :
                     request.urgencyLevel === '48h' ? 'Veloce 48h' : 'Standard'}
                  </span>
                </span>
              )}
              <span className="flex items-center">
                <i className="fas fa-calendar mr-1"></i>
                {new Date(request.createdAt).toLocaleDateString('it-IT')}
              </span>
            </div>
          </div>
          <div className="ml-4 flex flex-col items-end space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              request.status === 'open' 
                ? 'bg-green-100 text-green-800' 
                : request.status === 'negotiating'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {request.status === 'open' ? 'Aperta' : 
               request.status === 'negotiating' ? 'In Negoziazione' : 'Chiusa'}
            </span>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <i className="fas fa-paper-plane mr-2"></i>
              Invia Offerta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}