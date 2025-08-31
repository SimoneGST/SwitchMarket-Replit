import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/chat-interface";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const convId = useMemo(() => {
    try {
      const u = new URL(location, window.location.origin);
      return u.searchParams.get('conv');
    } catch {
      return null;
    }
  }, [location]);
  
  const { data: convData } = useQuery({
    queryKey: ["/api/conversations"],
  });
  const conversations: any[] = Array.isArray(convData) ? convData : [];

  useEffect(() => {
    if (conversations.length) {
      if (convId) {
        const found = conversations.find((c: any) => c.id === convId);
        if (found) {
          setSelectedConversation(found);
          return;
        }
      }
      if (!selectedConversation) setSelectedConversation(conversations[0]);
    }
  }, [conversations, convId]);

  // Offer data for the selected conversation
  const { data: offersForRequest = [] } = useQuery({
    queryKey: selectedConversation ? ["/api/requests", selectedConversation.requestId, "offers"] : ["/api/requests", "none", "offers"],
    enabled: !!selectedConversation?.requestId,
  });
  const offer = Array.isArray(offersForRequest)
    ? offersForRequest.find((o: any) => o.sellerId === selectedConversation?.sellerId)
    : null;
  const isAccepted = (offer?.status || '').toLowerCase() === 'accepted';

  // Mutations for accept/reject and save
  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => apiRequest("POST", `/api/offers/${offerId}/accept`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/offers/received"] }),
      ]);
    }
  });
  const rejectMutation = useMutation({
    mutationFn: async (offerId: string) => apiRequest("POST", `/api/offers/${offerId}/reject`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/requests", selectedConversation?.requestId, "offers"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/offers/received"] }),
      ]);
    }
  });

  const [editState, setEditState] = useState<{ title: string; description: string; price: string; imageUrl?: string } | null>(null);
  useEffect(() => {
    if (offer) {
      setEditState({
        title: offer.title || selectedConversation?.requestTitle || "Offerta",
        description: offer.description || "",
        price: String(offer.price ?? ""),
        imageUrl: offer.imageUrl || undefined,
      });
    } else {
      setEditState(null);
    }
  }, [offer, selectedConversation?.id]);

  const saveOfferMutation = useMutation({
    mutationFn: async (payload: any) => apiRequest("POST", "/api/offers", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/requests", selectedConversation?.requestId, "offers"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] }),
      ]);
    }
  });

  const onUploadImage = async (file: File) => {
    if (!file || !selectedConversation) return;
    const path = `offers/${user?.id || "me"}/${Date.now()}_${file.name}`;
    const ref = storageRef(storage, path);
    const snap = await uploadBytes(ref, file);
    const url = await getDownloadURL(snap.ref);
    setEditState(s => s ? { ...s, imageUrl: url } : s);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex h-[32rem] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/4 border-r border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Messaggi</h3>
            <div className="relative mt-2">
              <Input
                placeholder="Cerca conversazioni..."
                className="pl-8 text-sm"
              />
              <i className="fas fa-search text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"></i>
            </div>
          </div>

          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
                  <i className="fas fa-message text-slate-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nessun messaggio</h3>
                <p className="text-slate-500 text-sm">Le tue conversazioni appariranno qui quando riceverai delle offerte</p>
              </div>
            ) : (
              conversations.map((conversation: any) => {
                const otherPhoto = (user?.id === conversation?.sellerId ? conversation?.buyerPhotoUrl : conversation?.sellerPhotoUrl) ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40";
                return (
                <div 
                  key={conversation.id}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                    selectedConversation?.id === conversation.id ? 'bg-slate-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      className="w-10 h-10 rounded-full object-cover bg-slate-200"
                      src={otherPhoto}
                      alt="Contatto"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-900 truncate">{conversation.requestTitle || 'Conversazione'}</h4>
                        <span className="text-xs text-slate-500"></span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Richiesta: {conversation.requestTitle || conversation.requestId}</p>
                      <p className="text-xs text-slate-500 truncate mt-1">Clicca per aprire la chat</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          <i className="fas fa-handshake mr-1"></i>
                          Conversazione
                        </span>
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-xs rounded-full"></span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

  {/* Chat Interface */}
  <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ChatInterface conversation={selectedConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
                  <i className="fas fa-comments text-slate-400 text-3xl"></i>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Seleziona una conversazione</h3>
                <p className="text-slate-500">Scegli una conversazione dalla lista per iniziare a chattare</p>
              </div>
            </div>
          )}
        </div>

        {/* Offer Sidebar */}
        <div className="w-80 border-l border-slate-200 bg-slate-50 hidden md:flex md:flex-col">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <i className="fas fa-handshake text-accent"></i>
              Proposta del negoziante
            </h3>
          </div>
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Nessuna conversazione</div>
      ) : !offer && user?.id === selectedConversation?.sellerId ? (
            <div className="p-4 text-sm text-slate-600">
        <p className="mb-3">Invia una proposta formale visibile al cliente.</p>
              <div className="space-y-2">
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Titolo"
                  value={editState?.title || ""}
                  onChange={(e) => setEditState(s => ({ ...(s||{ title:"", description:"", price:"" }), title: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Dettagli offerta"
                  value={editState?.description || ""}
                  onChange={(e) => setEditState(s => ({ ...(s||{ title:"", description:"", price:"" }), description: e.target.value }))}
                />
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Prezzo"
                  value={editState?.price || ""}
                  onChange={(e) => setEditState(s => ({ ...(s||{ title:"", description:"", price:"" }), price: e.target.value }))}
                />
                <div className="space-y-2">
                  {editState?.imageUrl && (
                    <img src={editState.imageUrl} alt="Anteprima" className="w-full h-32 object-cover rounded border" />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
                </div>
                <Button
                  className="w-full bg-primary"
                  disabled={!editState?.price || saveOfferMutation.isPending}
                  onClick={() => saveOfferMutation.mutate({
                    requestId: selectedConversation.requestId,
                    title: editState?.title,
                    description: editState?.description,
                    price: Number(editState?.price || 0),
                    imageUrl: editState?.imageUrl,
                  })}
                >
                  Invia proposta
                </Button>
              </div>
            </div>
          ) : !offer ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-4">Nessuna proposta disponibile.</div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${isAccepted ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {isAccepted ? 'Accettata' : (offer?.status || 'In negoziazione')}
                </span>
              </div>
              {user?.id === selectedConversation?.sellerId ? (
                <div className="text-xs text-slate-500">{isAccepted ? 'Offerta accettata: non modificabile.' : 'Modifica la tua proposta. Il cliente vedrà sempre questa scheda.'}</div>
              ) : null}
              {editState?.imageUrl && (
                <img src={editState.imageUrl} alt="Prodotto" className="w-full h-36 object-cover rounded border" />
              )}
              <div>
                <input
                  disabled={user?.id !== selectedConversation?.sellerId || isAccepted}
                  className="w-full border rounded px-2 py-1 text-sm disabled:bg-slate-100"
                  value={editState?.title || ""}
                  onChange={(e) => setEditState(s => s ? { ...s, title: e.target.value } : s)}
                />
              </div>
              <div>
                <textarea
                  disabled={user?.id !== selectedConversation?.sellerId || isAccepted}
                  className="w-full border rounded px-2 py-1 text-sm disabled:bg-slate-100"
                  value={editState?.description || ""}
                  onChange={(e) => setEditState(s => s ? { ...s, description: e.target.value } : s)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Prezzo</span>
                <input
                  type="number"
                  disabled={user?.id !== selectedConversation?.sellerId || isAccepted}
                  className="w-36 border rounded px-2 py-1 text-sm text-right disabled:bg-slate-100"
                  value={editState?.price || ""}
                  onChange={(e) => setEditState(s => s ? { ...s, price: e.target.value } : s)}
                />
              </div>
              {user?.id === selectedConversation?.sellerId ? (
                <div className="space-y-2">
                  <input disabled={isAccepted} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
                  <Button
                    className="w-full bg-primary"
                    disabled={isAccepted || !editState?.price || saveOfferMutation.isPending}
                    onClick={() => saveOfferMutation.mutate({
                      requestId: selectedConversation.requestId,
                      title: editState?.title,
                      description: editState?.description,
                      price: Number(editState?.price || 0),
                      imageUrl: editState?.imageUrl,
                    })}
                  >
                    Salva modifiche
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isAccepted || acceptMutation.isPending}
                    onClick={() => offer?.id && acceptMutation.mutate(offer.id)}
                  >
                    <i className="fas fa-check mr-1"></i>
                    Accetta
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isAccepted || rejectMutation.isPending}
                    onClick={() => offer?.id && rejectMutation.mutate(offer.id)}
                  >
                    <i className="fas fa-times mr-1"></i>
                    Rifiuta
                  </Button>
                </div>
              )}
              <div className="pt-2 text-xs text-slate-500">
                Stato: <span className="font-medium">{offer?.status || 'active'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
