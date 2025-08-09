import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ChatInterfaceProps {
  conversation: any;
}

export default function ChatInterface({ conversation }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", conversation.id, "messages"],
    enabled: !!conversation.id,
  });

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

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              className="w-8 h-8 rounded-full object-cover bg-slate-200" 
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
              alt="TechStore Milano"
            />
            <div>
              <h4 className="font-medium text-slate-900">TechStore Milano</h4>
              <p className="text-xs text-slate-500">iPhone 13 Pro 256GB Grafite</p>
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
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-slate-50 rounded-xl inline-flex items-center justify-center mb-4">
              <i className="fas fa-comments text-slate-400 text-2xl"></i>
            </div>
            <p className="text-slate-500">Nessun messaggio ancora. Inizia la conversazione!</p>
          </div>
        ) : (
          messages.map((message: any) => (
            <div key={message.id} className={`flex gap-3 ${
              message.senderId === user?.id ? 'justify-end' : ''
            }`}>
              {message.senderId !== user?.id && (
                <img 
                  className="w-8 h-8 rounded-full object-cover bg-slate-200" 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
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
                    <div className="bg-gradient-to-r from-accent to-orange-400 rounded-xl p-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <i className="fas fa-handshake text-accent"></i>
                          <span className="font-semibold text-slate-900">Offerta Formale</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Prodotto:</span>
                            <span className="text-sm font-medium">iPhone 13 Pro 256GB Grafite</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Condizioni:</span>
                            <span className="text-sm font-medium">Eccellenti (9/10)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Prezzo:</span>
                            <span className="text-lg font-bold text-accent">€720</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Garanzia:</span>
                            <span className="text-sm font-medium">6 mesi</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-sm">
                            <i className="fas fa-check mr-1"></i>
                            Accetta
                          </Button>
                          <Button variant="outline" className="flex-1 text-sm">
                            <i className="fas fa-comment mr-1"></i>
                            Negozia
                          </Button>
                        </div>
                      </div>
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
          <button className="p-2 text-slate-400 hover:text-slate-600">
            <i className="fas fa-paperclip"></i>
          </button>
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
