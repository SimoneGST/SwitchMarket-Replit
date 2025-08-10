import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Phone, Mail, Calendar, ShoppingBag, MessageCircle, Star } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function CustomerProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  const { data: requests } = useQuery({
    queryKey: ['/api/requests/my'],
    enabled: !!user
  });

  const { data: conversations } = useQuery({
    queryKey: ['/api/conversations/my'],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profilo non trovato</p>
          <Link href="/profile-verification">
            <Button className="bg-green-600 hover:bg-green-700">
              Completa il Profilo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src={user.profileImageUrl || ''} alt={profile.firstName} />
              <AvatarFallback className="bg-green-500 text-white text-2xl">
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              <div className="flex items-center gap-4 text-green-100">
                <Badge variant="secondary" className="bg-white text-green-600">
                  <User className="w-4 h-4 mr-1" />
                  Cliente
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Membro dal {new Date(user.createdAt).toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informazioni Personali */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informazioni Personali
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="font-medium">{user.email}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Telefono</span>
                  </div>
                  <p className="font-medium">{profile.phone || 'Non specificato'}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Indirizzo</span>
                  </div>
                  <p className="font-medium">
                    {profile.address && `${profile.address}, `}
                    {profile.city}
                    {profile.postalCode && ` ${profile.postalCode}`}
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistiche Rapide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Le tue Statistiche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {requests?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Richieste</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {conversations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Conversazioni</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attività Recenti */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Le tue Richieste */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Le tue Richieste
                    <Badge variant="outline">{requests?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {requests?.length ? (
                    <div className="space-y-4">
                      {requests.slice(0, 5).map((request: any) => (
                        <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{request.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>€{request.priceMin} - €{request.priceMax}</span>
                              <span>{request.location}</span>
                              <Badge variant="outline" className="text-xs">
                                {request.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {requests.length > 5 && (
                        <Link href="/my-requests">
                          <Button variant="outline" className="w-full">
                            Vedi tutte le richieste ({requests.length})
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Non hai ancora creato richieste</p>
                      <Link href="/create">
                        <Button className="mt-4 bg-green-600 hover:bg-green-700">
                          Crea la tua prima richiesta
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversazioni Recenti */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Conversazioni Recenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conversations?.length ? (
                    <div className="space-y-4">
                      {conversations.slice(0, 3).map((conversation: any) => (
                        <div key={conversation.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {conversation.merchantName?.charAt(0) || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{conversation.merchantName || 'Negoziante'}</h4>
                            <p className="text-sm text-gray-600">{conversation.lastMessage}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {new Date(conversation.lastMessageAt).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                      ))}
                      
                      <Link href="/messages">
                        <Button variant="outline" className="w-full">
                          Vedi tutti i messaggi
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nessuna conversazione ancora</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Azioni Rapide */}
              <Card>
                <CardHeader>
                  <CardTitle>Azioni Rapide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/create">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Nuova Richiesta
                      </Button>
                    </Link>
                    <Link href="/browse">
                      <Button variant="outline" className="w-full">
                        <Star className="w-4 h-4 mr-2" />
                        Esplora Offerte
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}