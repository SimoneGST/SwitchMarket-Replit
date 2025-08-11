import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const productSchema = z.object({
  name: z.string().min(2, "Nome prodotto richiesto"),
  description: z.string().min(10, "Descrizione di almeno 10 caratteri"),
  category: z.string().min(1, "Categoria richiesta"),
  subcategory: z.string().optional(),
  price: z.number().min(0.01, "Prezzo deve essere maggiore di 0"),
  condition: z.string().min(1, "Condizioni richieste"),
  stock: z.number().min(1, "Stock deve essere almeno 1"),
  sku: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  weight: z.number().optional(),
  warranty: z.string().optional(),
  keywords: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface ProductFormPageProps {
  productId?: string;
}

export default function ProductFormPage({ productId }: ProductFormPageProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const isEdit = !!productId;

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: isEdit,
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      subcategory: "",
      price: 0,
      condition: "new",
      stock: 1,
      sku: "",
      brand: "",
      model: "",
      weight: 0,
      warranty: "",
      keywords: "",
    },
  });

  useEffect(() => {
    if (product && isEdit) {
      form.reset({
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory || "",
        price: parseFloat(product.price),
        condition: product.condition,
        stock: product.stock,
        sku: product.sku || "",
        brand: product.brand || "",
        model: product.model || "",
        weight: product.weight ? parseFloat(product.weight) : 0,
        warranty: product.warranty || "",
        keywords: product.keywords?.join(", ") || "",
      });
      setImages(product.images || []);
    }
  }, [product, isEdit, form]);

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const payload = {
        ...data,
        images,
        keywords: data.keywords ? data.keywords.split(",").map(k => k.trim()).filter(k => k) : [],
      };

      if (isEdit) {
        return apiRequest(`/api/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        return apiRequest("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Prodotto aggiornato" : "Prodotto creato",
        description: isEdit ? "Le modifiche sono state salvate" : "Il prodotto è stato aggiunto alla vetrina",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products/my"] });
      setLocation("/store-showcase");
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante il salvataggio del prodotto`,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    
    try {
      // In a real implementation, you would upload to a cloud storage service
      // For now, we'll simulate with placeholder URLs
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In real implementation, upload file and get URL
        const imageUrl = `https://images.unsplash.com/photo-1506729623306-b5a934d88b53?w=400&h=400&fit=crop&crop=center&q=80&random=${Date.now()}_${i}`;
        newImages.push(imageUrl);
      }
      
      setImages(prev => [...prev, ...newImages]);
      toast({
        title: "Immagini caricate",
        description: `${newImages.length} immagine/i caricate con successo`,
      });
    } catch (error) {
      toast({
        title: "Errore upload",
        description: "Errore durante il caricamento delle immagini",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: ProductForm) => {
    saveProductMutation.mutate(data);
  };

  const categories = [
    "Abbigliamento", "Scarpe", "Accessori", "Elettronica", "Casa e Giardino", 
    "Sport e Tempo Libero", "Auto e Moto", "Libri", "Strumenti Musicali", 
    "Giocattoli", "Bellezza e Salute", "Alimentari", "Altro"
  ];

  const conditions = [
    { value: "new", label: "Nuovo" },
    { value: "excellent", label: "Eccellente" }, 
    { value: "good", label: "Buono" },
    { value: "fair", label: "Discreto" },
    { value: "poor", label: "Da riparare" }
  ];

  if (isEdit && productLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">
          {isEdit ? "Modifica Prodotto" : "Aggiungi Prodotto"}
        </h1>
        <p className="text-slate-600 mt-2">
          {isEdit ? "Aggiorna le informazioni del prodotto" : "Aggiungi un nuovo prodotto alla tua vetrina"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Informazioni Prodotto</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Prodotto *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Es: iPhone 15 Pro Max" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Descrivi il prodotto in dettaglio..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sottocategoria</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es: Smartphone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prezzo (€) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder="0.00" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condizioni *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Condizioni" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {conditions.map(condition => (
                                <SelectItem key={condition.value} value={condition.value}>
                                  {condition.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disponibilità *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              placeholder="1" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Codice SKU</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SKU123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es: Apple" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modello</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es: Pro Max" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder="0.000" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="warranty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Garanzia</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Es: 24 mesi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parole chiave (separate da virgola)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="smartphone, apple, telefono, nuovo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={saveProductMutation.isPending}
                    >
                      {saveProductMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Salvataggio...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          {isEdit ? "Salva Modifiche" : "Aggiungi Prodotto"}
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/store-showcase")}
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-700">Immagini Prodotto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="block w-full p-4 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner fa-spin text-blue-600"></i>
                      <span className="text-blue-600">Caricamento...</span>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-cloud-upload-alt text-blue-600 text-2xl mb-2"></i>
                      <p className="text-blue-600 font-medium">Carica Immagini</p>
                      <p className="text-sm text-slate-500">JPG, PNG, WebP fino a 5MB</p>
                    </div>
                  )}
                </label>
              </div>

              {images.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700">Immagini caricate:</h4>
                  <div className="grid gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Prodotto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </Button>
                        {index === 0 && (
                          <Badge className="absolute bottom-1 left-1 text-xs">
                            Principale
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}