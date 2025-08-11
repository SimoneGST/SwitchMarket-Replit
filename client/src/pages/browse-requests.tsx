import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import RequestCard from "@/components/request-card";

export default function BrowseRequests() {
  const [filters, setFilters] = useState({
    search: "",
    location: "Milano, MI",
    category: "",
    priceMin: "",
    priceMax: "",
    status: "open",
  });

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["/api/requests", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/requests?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Non autenticato, restituisce array vuoto invece di errore
          return [];
        }
        throw new Error(`Errore: ${response.status}`);
      }
      
      return response.json();
    },
  });

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Filtri</h3>
              
              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Posizione</label>
                <div className="relative">
                  <Input
                    placeholder="Inserisci città"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="pl-10"
                  />
                  <i className="fas fa-map-marker-alt text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"></i>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    <SelectItem value="Elettronica">Elettronica</SelectItem>
                    <SelectItem value="Casa e Giardino">Casa e Giardino</SelectItem>
                    <SelectItem value="Sport e Tempo Libero">Sport e Tempo Libero</SelectItem>
                    <SelectItem value="Veicoli">Veicoli</SelectItem>
                    <SelectItem value="Abbigliamento">Abbigliamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fascia di Prezzo</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Stato</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Checkbox 
                      checked={filters.status === 'open'}
                      onCheckedChange={(checked) => updateFilter('status', checked ? 'open' : '')}
                    />
                    <span className="ml-2 text-sm text-slate-600">Aperte</span>
                  </label>
                  <label className="flex items-center">
                    <Checkbox 
                      checked={filters.status === 'negotiating'}
                      onCheckedChange={(checked) => updateFilter('status', checked ? 'negotiating' : '')}
                    />
                    <span className="ml-2 text-sm text-slate-600">In negoziazione</span>
                  </label>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                <i className="fas fa-search mr-2"></i>
                Applica Filtri
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:w-3/4">
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Input
                  placeholder="Cosa stai cercando?"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-12 pr-20 py-3 text-lg"
                />
                <i className="fas fa-search text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 text-lg"></i>
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  Cerca
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img 
                src="/attached_assets/leonardo foto profilo_1754851361956.png" 
                alt="Leonardo AI" 
                className="w-8 h-8 rounded-full mr-3 border-2 border-blue-300"
              />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Richieste Trovate</h2>
                <p className="text-sm text-slate-500">
                  {requests.length} risultati per "{filters.search || 'tutte le richieste'}" a {filters.location}
                </p>
              </div>
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Più recenti</SelectItem>
                <SelectItem value="price-high">Prezzo più alto</SelectItem>
                <SelectItem value="price-low">Prezzo più basso</SelectItem>
                <SelectItem value="distance">Distanza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Request Cards Grid */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Caricamento richieste...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
                  <i className="fas fa-search text-slate-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nessuna richiesta trovata</h3>
                <p className="text-slate-500">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              requests.map((request: any) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </div>

          {/* Pagination */}
          {requests.length > 0 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-slate-500">Mostrando 1-{requests.length} di {requests.length} risultati</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button size="sm" className="bg-primary text-white">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
