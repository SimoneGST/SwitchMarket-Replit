import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface LeonardoChatProps {
  onSuggestion?: (suggestion: any) => void;
}

export default function LeonardoChat({ onSuggestion }: LeonardoChatProps) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Ciao! Sono Leonardo, il tuo assistente per la vendita. Come posso aiutarti oggi? Posso aiutarti ad analizzare richieste, suggerire prezzi competitivi o creare offerte vincenti per i tuoi clienti."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; context: any }) => {
      return apiRequest("POST", "/api/leonardo/chat", data);
    },
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
      
      if (data.suggestions && onSuggestion) {
        onSuggestion(data.suggestions);
      }
    },
    onError: (error: Error) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Mi dispiace, ho avuto un problema. Puoi riprovare?"
      }]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage("");

    chatMutation.mutate({
      message: userMessage,
      context: { messages: messages.slice(-5) } // Ultimi 5 messaggi per contesto
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                    <i className="fas fa-user-tie text-white text-xs"></i>
                  </div>
                  <span className="text-xs font-semibold text-blue-600">Leonardo</span>
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                  <i className="fas fa-user-tie text-white text-xs"></i>
                </div>
                <span className="text-xs font-semibold text-blue-600">Leonardo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Chiedimi consigli per vendere meglio..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={chatMutation.isPending || !inputMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 px-6"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </form>
      </div>
    </div>
  );
}