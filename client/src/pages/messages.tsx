import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/chat-interface";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex h-96 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-slate-200">
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
              conversations.map((conversation: any) => (
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
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40" 
                      alt="Contatto"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-900 truncate">TechStore Milano</h4>
                        <span className="text-xs text-slate-500">10:30</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">iPhone 13 Pro 256GB Grafite</p>
                      <p className="text-xs text-slate-500 truncate mt-1">Ho quello che cerchi, posso fartelo vedere...</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          <i className="fas fa-handshake mr-1"></i>
                          Offerta ricevuta
                        </span>
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-primary text-white text-xs rounded-full">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
      </div>
    </main>
  );
}
