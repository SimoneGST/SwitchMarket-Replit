import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, User, Store } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AddressAutocomplete from "@/components/address-autocomplete";

export default function ProfileVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    // Campi merchant
    businessName: '',
    businessType: '',
    partitaIva: '',
    codiceFiscale: '',
    businessAddress: '',
    businessCity: '',
    businessPostalCode: '',
    businessDescription: ''
  });
  const [confirmed, setConfirmed] = useState(false);

  // Carica profilo esistente se presente
  const { data: existingProfile } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  // Popolamento dati dal profilo Google/esistente
  useEffect(() => {
    if (user) {
      console.log('👤 Dati utente ricevuti da Firebase:', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        displayName: user.firstName + ' ' + user.lastName
      });
      
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }));
    }
    
    if (existingProfile) {
      console.log('📋 Profilo esistente caricato:', existingProfile);
      setProfileData(prev => ({ ...prev, ...existingProfile }));
      setUserType((existingProfile as any).userType || 'customer');
      setConfirmed((existingProfile as any).profileVerified || false);
    }
  }, [user, existingProfile]);

  // Mutation per salvare profilo
  const saveProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('💾 Tentativo salvataggio profilo:', data);
      const response = await apiRequest('POST', '/api/profile/verify', data);
      const result = await response.json();
      console.log('✅ Profilo salvato con successo:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Success callback chiamato:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profilo Verificato",
        description: "I tuoi dati sono stati confermati e salvati con successo!",
      });
      // Reindirizza alla home o al profilo dopo il salvataggio
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    },
    onError: (error: any) => {
      console.error('❌ Errore salvataggio profilo:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il profilo. Riprova.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!confirmed) {
      toast({
        title: "Conferma richiesta",
        description: "Devi confermare che i dati sono corretti prima di salvare.",
        variant: "destructive"
      });
      return;
    }

    const dataToSave = {
      userType,
      ...profileData,
      profileVerified: true
    };

    saveProfileMutation.mutate(dataToSave);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Devi effettuare il login per accedere a questa pagina</p>
          <Button onClick={() => window.location.href = '/api/login'}>
            Accedi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verifica il tuo Profilo
          </h1>
          <p className="text-gray-600">
            Conferma i tuoi dati per completare la registrazione su Switch Market
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dati Google Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={user.email || ''} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={user.firstName || ''} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Cognome</Label>
                <Input value={user.lastName || ''} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Foto Profilo</Label>
                <div className="flex items-center gap-2">
                  {user.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full" 
                    />
                  )}
                  <span className="text-sm text-gray-600">
                    {user.profileImageUrl ? 'Presente' : 'Nessuna immagine'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipo di Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  userType === 'customer' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {userType === 'customer' ? (
                    <User className={`w-6 h-6 text-green-600`} />
                  ) : (
                    <Store className={`w-6 h-6 text-blue-600`} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {userType === 'customer' ? 'Cliente' : 'Negoziante'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {userType === 'customer' 
                      ? 'Cerchi prodotti e servizi nei negozi locali' 
                      : 'Vendi prodotti e servizi nella tua zona'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Il tipo di account è stato scelto durante la registrazione e non può essere modificato
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dati Personali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({...prev, firstName: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({...prev, lastName: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono *</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                  placeholder="+39 123 456 7890"
                />
              </div>
              <div>
                <Label htmlFor="address">Indirizzo *</Label>
                <AddressAutocomplete
                  value={profileData.address}
                  onChange={(value, coordinates) => {
                    setProfileData(prev => ({
                      ...prev, 
                      address: value,
                      // Aggiungi coordinate se disponibili per futuri usi
                      ...(coordinates && {
                        latitude: coordinates.lat,
                        longitude: coordinates.lng
                      })
                    }));
                  }}
                  placeholder="Inserisci il tuo indirizzo completo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inserisci un indirizzo completo per permettere ai negozianti di trovarti
                </p>
              </div>
              <div>
                <Label htmlFor="city">Città *</Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => setProfileData(prev => ({...prev, city: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">CAP</Label>
                <Input
                  id="postalCode"
                  value={profileData.postalCode}
                  onChange={(e) => setProfileData(prev => ({...prev, postalCode: e.target.value}))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {userType === 'merchant' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Dati Attività Commerciale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="businessName">Nome Attività *</Label>
                  <Input
                    id="businessName"
                    value={profileData.businessName}
                    onChange={(e) => setProfileData(prev => ({...prev, businessName: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Tipo di Attività *</Label>
                  <Select value={profileData.businessType} onValueChange={(value) => 
                    setProfileData(prev => ({...prev, businessType: value}))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Commercio al Dettaglio</SelectItem>
                      <SelectItem value="restaurant">Ristorazione</SelectItem>
                      <SelectItem value="services">Servizi</SelectItem>
                      <SelectItem value="crafts">Artigianato</SelectItem>
                      <SelectItem value="tech">Tecnologia</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="partitaIva">Partita IVA *</Label>
                  <Input
                    id="partitaIva"
                    value={profileData.partitaIva}
                    onChange={(e) => setProfileData(prev => ({...prev, partitaIva: e.target.value}))}
                    placeholder="IT12345678901"
                  />
                </div>
                <div>
                  <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                  <Input
                    id="codiceFiscale"
                    value={profileData.codiceFiscale}
                    onChange={(e) => setProfileData(prev => ({...prev, codiceFiscale: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="businessAddress">Indirizzo Attività *</Label>
                  <AddressAutocomplete
                    value={profileData.businessAddress}
                    onChange={(value, coordinates) => {
                      setProfileData(prev => ({
                        ...prev, 
                        businessAddress: value,
                        // Aggiungi coordinate business se disponibili
                        ...(coordinates && {
                          businessLatitude: coordinates.lat,
                          businessLongitude: coordinates.lng
                        })
                      }));
                    }}
                    placeholder="Inserisci l'indirizzo completo del negozio"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Indirizzo dove i clienti possono trovarti fisicamente
                  </p>
                </div>
                <div>
                  <Label htmlFor="businessCity">Città Attività *</Label>
                  <Input
                    id="businessCity"
                    value={profileData.businessCity}
                    onChange={(e) => setProfileData(prev => ({...prev, businessCity: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="businessPostalCode">CAP Attività</Label>
                  <Input
                    id="businessPostalCode"
                    value={profileData.businessPostalCode}
                    onChange={(e) => setProfileData(prev => ({...prev, businessPostalCode: e.target.value}))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="businessDescription">Descrizione Attività</Label>
                  <Textarea
                    id="businessDescription"
                    value={profileData.businessDescription}
                    onChange={(e) => setProfileData(prev => ({...prev, businessDescription: e.target.value}))}
                    placeholder="Descrivi brevemente la tua attività..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attenzione:</strong> Una volta confermati, questi dati diventeranno definitivi e non potranno essere modificati. 
            Verifica attentamente tutte le informazioni prima di procedere.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="confirm" 
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(!!checked)}
              />
              <Label htmlFor="confirm" className="text-sm font-medium">
                Confermo che tutti i dati inseriti sono corretti e veritieri. 
                Comprendo che questi dati diventeranno definitivi dopo la conferma.
              </Label>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={!confirmed || saveProfileMutation.isPending}
                className={`${userType === 'customer' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {saveProfileMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Conferma e Salva Profilo
                  </div>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}