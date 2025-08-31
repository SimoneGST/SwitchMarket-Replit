import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StoreShowcase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/my"],
    enabled: !!user,
  });

  const productsList: Product[] = products || [];

  const toggleProductMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      return apiRequest(`/api/products/${productId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/my"] });
      toast({
        title: "Prodotto aggiornato",
        description: "Lo stato del prodotto è stato modificato",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest(`/api/products/${productId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/my"] });
      toast({
        title: "Prodotto eliminato",
        description: "Il prodotto è stato rimosso dalla vetrina",
      });
    },
  });

  const filteredProducts = productsList.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesCondition = conditionFilter === "all" || product.condition === conditionFilter;
    
    return matchesSearch && matchesCategory && matchesCondition;
  }) || [];

  const allCategories = productsList.map((p: Product) => p.category || '');
  const categories = allCategories.filter((v, i, a) => v && a.indexOf(v) === i);
  const allConditions = productsList.map((p: Product) => p.condition || '');
  const conditions = allConditions.filter((v, i, a) => v && a.indexOf(v) === i);

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, any> = {
      new: "default",
      excellent: "default", 
      good: "secondary",
      fair: "outline",
      poor: "destructive"
    };
    return variants[condition] || "outline";
  };

  const getConditionText = (condition: string) => {
    const texts: Record<string, string> = {
      new: "Nuovo",
      excellent: "Eccellente",
      good: "Buono", 
      fair: "Discreto",
      poor: "Da riparare"
    };
    return texts[condition] || condition;
  };

  if (!user?.pivaVerified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Verifica Richiesta</h3>
                <p className="text-yellow-700 mb-4">Devi completare la verifica della tua attività per accedere alla vetrina prodotti</p>
                <Link href="/merchant-verification">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Completa Verifica
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Vetrina Prodotti</h1>
            <p className="text-slate-600 mt-2">
              Gestisci i prodotti della tua attività e le immagini della vetrina
            </p>
          </div>
          <Link href="/product/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-plus mr-2"></i>
              Aggiungi Prodotto
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtri */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Cerca prodotti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Condizioni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le condizioni</SelectItem>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {getConditionText(condition)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {filteredProducts.length} prodott{filteredProducts.length === 1 ? 'o' : 'i'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-slate-200 rounded-t-lg"></div>
              <CardContent className="pt-4">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-24 w-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <i className="fas fa-box-open text-slate-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nessun prodotto trovato</h3>
            <p className="text-slate-600 mb-4">
              {productsList.length === 0
                ? "Inizia ad aggiungere prodotti alla tua vetrina"
                : "Nessun prodotto corrisponde ai filtri selezionati"
              }
            </p>
            <Link href="/product/add">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <i className="fas fa-plus mr-2"></i>
                Aggiungi Primo Prodotto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1506729623306-b5a934d88b53?w=400";
                    }}
                  />
                ) : (
                  <div className="h-48 bg-slate-100 flex items-center justify-center">
                    <i className="fas fa-image text-slate-400 text-3xl"></i>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Attivo" : "Inattivo"}
                  </Badge>
                  <Badge variant={getConditionBadge(product.condition)}>
                    {getConditionText(product.condition)}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="pt-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-slate-800 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{product.category}</span>
                    {product.brand && (
                      <>
                        <span>•</span>
                        <span>{product.brand}</span>
                      </>
                    )}
                    {product.sku && (
                      <>
                        <span>•</span>
                        <span>SKU: {product.sku}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-blue-600">
                      €{Number(product.price || 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-500">
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/product/edit/${product.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <i className="fas fa-edit mr-1"></i>
                      Modifica
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProductMutation.mutate({
                      productId: product.id,
                      isActive: !product.isActive
                    })}
                    disabled={toggleProductMutation.isPending}
                  >
                    <i className={`fas ${product.isActive ? 'fa-eye-slash' : 'fa-eye'} mr-1`}></i>
                    {product.isActive ? 'Nascondi' : 'Mostra'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
                        deleteProductMutation.mutate(product.id);
                      }
                    }}
                    disabled={deleteProductMutation.isPending}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}