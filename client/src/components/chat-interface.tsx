import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";

interface ChatInterfaceProps {
  conversation: any;
}

export default function ChatInterface({ conversation }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", conversation.id, "messages"],
    enabled: !!conversation.id,
  });

  // Type guard per i messaggi
  const typedMessages = Array.isArray(messages) ? messages : [];

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversation.id, "messages"] 
      });
      setNewMessage("");
    },
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Attach image handler
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const path = `chats/${conversation.id}/${Date.now()}_${file.name}`;
      const objRef = storageRef(storage, path);
      const snap = await uploadBytes(objRef, file);
      const url = await getDownloadURL(snap.ref);
      // Send a message that references the image URL
      await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
        content: "[immagine]",
        imageUrl: url,
        messageType: "image",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversation.id, "messages"] });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              className="w-8 h-8 rounded-full object-cover bg-slate-200" 
              src={(user?.id === conversation?.sellerId ? conversation?.buyerPhotoUrl : conversation?.sellerPhotoUrl) || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"}
              alt="Avatar"
            />
            <div>
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                {conversation?.requestTitle || 'Conversazione'}
              </h4>
              <p className="text-xs text-slate-500">Richiesta: {conversation?.requestTitle || conversation?.requestId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <i className="fas fa-phone"></i>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <i className="fas fa-video"></i>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {typedMessages.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
              <i className="fas fa-comments text-slate-400 text-2xl"></i>
            </div>
            <p className="text-slate-500">Nessun messaggio ancora. Inizia la conversazione!</p>
          </div>
        ) : (
          typedMessages.map((message: any) => (
            <div key={message.id} className={`flex gap-3 ${
              message.senderId === user?.id ? 'justify-end' : ''
            }`}>
              {message.senderId !== user?.id && (
                <img 
                  className="w-8 h-8 rounded-full object-cover bg-slate-200" 
                  src={(message.senderId === conversation?.buyerId ? conversation?.buyerPhotoUrl : conversation?.sellerPhotoUrl) || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"}
                  alt="Contatto"
                />
              )}
              <div className={`flex-1 ${message.senderId === user?.id ? 'flex justify-end' : ''}`}>
                <div className={`rounded-xl p-3 max-w-sm ${
                  message.senderId === user?.id 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  {message.messageType === 'offer' ? (
                    <div className="text-xs opacity-70">[Proposta aggiornata nella scheda laterale]</div>
                  ) : message.messageType === 'image' && message.imageUrl ? (
                    <div className="space-y-2">
                      <img src={message.imageUrl} alt="Allegato" className="max-w-full max-h-64 rounded-md border" />
                      {message.content && message.content !== '[immagine]' && (
                        <p className="text-xs opacity-80">{message.content}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
              {message.senderId === user?.id && (
                <img 
                  className="w-8 h-8 rounded-full object-cover bg-slate-200" 
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                  alt="Tu"
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50" onClick={handleAttachClick} disabled={isUploading}>
            <i className="fas fa-paperclip"></i>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi un messaggio..."
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </div>
    </>
  );
}
