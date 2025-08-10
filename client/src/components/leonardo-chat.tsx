import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mic, FileText, Send, Bot, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: 'user' | 'leonardo';
  content: string;
  timestamp: Date;
}

interface LeonardoChatProps {
  context?: any;
  sessionId?: string;
}

export default function LeonardoChat({ context = {}, sessionId }: LeonardoChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'leonardo',
      content: 'Ciao! Sono Leonardo, il tuo assistente per vendere meglio. Come posso aiutarti oggi?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Se c'è un sessionId, usa l'API del copilot, altrimenti usa Leonardo base
      const endpoint = sessionId ? '/api/copilot/message' : '/api/leonardo/chat';
      const body = sessionId 
        ? { sessionId, message: inputMessage }
        : { message: inputMessage, context, attachedFiles: [] };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const leonardoMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'leonardo',
        content: data.response || "Mi dispiace, non sono riuscito a elaborare la tua richiesta.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, leonardoMessage]);

      // Se dovrebbe essere trasferito a un umano
      if (data.shouldTransferToHuman) {
        toast({
          title: "Trasferimento richiesto",
          description: "Leonardo suggerisce di trasferire questa conversazione a un operatore umano.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        sender: 'leonardo',
        content: 'Mi dispiace, c\'è stato un problema. Riprova tra poco.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Errore",
        description: "Impossibile inviare il messaggio. Riprova.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast({
          title: "Errore vocale",
          description: "Impossibile registrare l'audio. Controlla i permessi del microfono.",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Non supportato",
        description: "Il riconoscimento vocale non è supportato su questo browser.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <img 
            src="/attached_assets/leonardo_avatar_1754845138372.png" 
            alt="Leonardo AI" 
            className="w-5 h-5"
          />
          Chat con Leonardo
          {sessionId && <span className="text-xs bg-blue-100 px-2 py-1 rounded">Copilot Attivo</span>}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className={
                  message.sender === 'user' 
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                }>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <img 
                      src="/attached_assets/leonardo_avatar_1754845138372.png" 
                      alt="Leonardo AI" 
                      className="w-4 h-4 object-contain"
                    />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className={`max-w-[80%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 p-1">
                  <img 
                    src="/attached_assets/leonardo_avatar_1754845138372.png" 
                    alt="Leonardo AI" 
                    className="w-full h-full object-contain"
                  />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrivi la tua domanda a Leonardo..."
                className="resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleVoiceInput}
                disabled={isLoading || isRecording}
                className={`w-10 h-10 p-0 ${isRecording ? 'bg-red-100 border-red-300' : ''}`}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
              </Button>
              
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isRecording && (
            <div className="text-center text-sm text-red-500 mt-2">
              🎤 Sto ascoltando...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}