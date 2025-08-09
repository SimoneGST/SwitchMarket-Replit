import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface ClementeChatProps {
  onDataUpdate: (data: any) => void;
}

export default function ClementeChat({ onDataUpdate }: ClementeChatProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Ciao! Sono Clemente, il tuo assistente per trovare quello che cerchi. Cosa vorresti acquistare oggi?",
      isAI: true,
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [chatContext, setChatContext] = useState({});

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", "/api/clemente/chat", {
        message,
        context: chatContext,
      });
    },
    onSuccess: (data: any) => {
      // Add AI response to messages
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: data.response,
        isAI: true,
        timestamp: new Date(),
      }]);

      // Update context and extracted data
      setChatContext(prev => ({ ...prev, ...data.extractedData }));
      onDataUpdate(data.extractedData);
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      content: newMessage.trim(),
      isAI: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to AI
    chatMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedReplies = ["256GB", "€600-750", "Grafite", "Milano"];

  return (
    <>
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Clemente</h3>
            <p className="text-xs text-slate-500">Il tuo assistente AI</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <i className="fas fa-circle text-green-500 text-xs mr-1"></i>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.isAI ? '' : 'justify-end'}`}>
            {message.isAI && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
            )}
            <div className={`flex-1 ${message.isAI ? '' : 'flex justify-end'}`}>
              <div className={`rounded-xl p-3 max-w-sm ${
                message.isAI ? 'bg-slate-100' : 'bg-primary text-white'
              }`}>
                <p className={`text-sm ${message.isAI ? 'text-slate-900' : 'text-white'}`}>
                  {message.content}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {message.timestamp.toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            {!message.isAI && (
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user text-slate-600 text-sm"></i>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="bg-slate-100 rounded-xl p-3 max-w-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi la tua risposta..."
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={chatMutation.isPending || !newMessage.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          {suggestedReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => {
                setNewMessage(reply);
                setTimeout(() => handleSendMessage(), 100);
              }}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs hover:bg-slate-200 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
