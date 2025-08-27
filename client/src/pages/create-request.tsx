import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CharacterIntro from '@/components/character-intro';
import { useCharacterIntro } from '@/hooks/useCharacterIntro';
import VoiceSettings from '@/components/voice-settings';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { ClementeAI } from '@/lib/clemente';
import { useClementeAssistant } from '@/hooks/useClementeAssistant';
import AssistantProposal from '@/components/assistant-proposal';
import { findBestProductSchemaClient, normalizeProductTitle, productSchemas as clientSchemas } from '@/lib/product-schemas';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  aiGeneratedImage?: string;
}

interface RequestData {
  title?: string;
  category?: string;
  description?: string;
  [key: string]: any;
}

interface ProductSchemaState {
  isActive: boolean;
  currentSchema: any;
  collectedData: Record<string, any>;
}

export default function CreateRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { firebaseUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modalità fissa: solo chat con Clemente
  const [clemente] = useState(() => new ClementeAI());
  
  // Character intro state - mostrato per i primi 3 accessi
  const { showIntro, completeIntro, neverShowAgain } = useCharacterIntro('clemente');
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isClementeTyping, setIsClementeTyping] = useState(false);
  const [isClementeSpeaking, setIsClementeSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productSchema, setProductSchema] = useState<ProductSchemaState>({
    isActive: false,
    currentSchema: null,
    collectedData: {}
  });
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [autoFilledAt, setAutoFilledAt] = useState<Record<string, number>>({});
  const [highlightFields, setHighlightFields] = useState<Record<string, number>>({});
  // Visible fields for progressive/pyramidal form (show more sensible defaults)
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    title: true,
    description: true,
    category: true,
    location: true,
    budgetMin: true,
    budgetMax: true,
    urgencyLevel: true,
    'attributes.brand': true,
    'attributes.model': true,
    'attributes.size': true,
    'attributes.color': true,
    'attributes.material': true,
  });
  // Assistant hook
  const assistant = useClementeAssistant();
  
  // Impostazioni vocali
  const { settings: voiceSettings, updateSettings: updateVoiceSettings, speakWithSettings } = useVoiceSettings();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Request data state
  const [requestData, setRequestData] = useState<RequestData>({});
  const [province, setProvince] = useState<string>('');
  const [cap, setCap] = useState<string>('');
  const [geo, setGeo] = useState<{lat: number; lng: number} | null>(null);
  // Città come base; raggio opzionale solo se l'utente vuole allargare fuori città
  const [expandBeyondCity, setExpandBeyondCity] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(25);

  // Mutation per creare richiesta
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(`Errore nella creazione della richiesta (${response.status}) ${txt}`);
      }
  return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Richiesta pubblicata!",
        description: "La tua richiesta è stata inviata ai negozianti locali.",
      });
  queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
  queryClient.invalidateQueries({ queryKey: ['/api/requests/my'] });
      // Reindirizza alla dashboard corretta
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      toast({
        title: "Errore pubblicazione",
        description: error.message || "Si è verificato un errore durante la pubblicazione",
        variant: "destructive",
      });
    }
  });

  // Messaggio di benvenuto automatico
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ciao! Sono Clemente, il tuo assistente AI. Dimmi cosa stai cercando e ti aiuterò a creare una richiesta precisa per i negozianti della tua zona!',
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  // Gestione invio messaggio chat
  const handleChatMessage = async () => {
    if (!chatInput.trim() || isClementeTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsClementeTyping(true);

    try {
    const response = await fetch('/api/clemente/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput.trim(),
          conversationHistory: [...chatMessages, userMessage],
          context: {
            currentSchema: productSchema.isActive ? productSchema.currentSchema : null,
            collectedData: productSchema.collectedData
      }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

  const responseData = await response.json();
  const responseText = responseData.response?.message || responseData.message || 'Mi dispiace, non riesco a rispondere.';
      
      // Gestisci schede prodotto dinamiche
    if (responseData.response?.productSchema || responseData.response?.collectedData) {
        setProductSchema(prev => ({
          ...prev,
          isActive: true,
      currentSchema: responseData.response.productSchema || prev.currentSchema,
          collectedData: responseData.response.collectedData || prev.collectedData
        }));
      }

      // Merge progressivo nella scheda richiesta (safe merge + progressive reveal)
      if (responseData.response?.requestDraft) {
        const draft = responseData.response.requestDraft as Record<string, any>;
        setRequestData(prev => {
          const merged: Record<string, any> = { ...prev };
          const newlyFilled: string[] = [];
          for (const [k, v] of Object.entries(draft)) {
            const prevVal = (merged as any)[k];
            const isEmptyPrev = prevVal == null || prevVal === '';
            if (k === 'description') {
              if (v) { merged.description = v; newlyFilled.push('description'); }
            } else if (k === 'attributes' && v && typeof v === 'object') {
              const prevAttrs = (merged as any).attributes && typeof (merged as any).attributes === 'object' ? { ...(merged as any).attributes } : {};
              let changed = false;
              for (const [ak, av] of Object.entries(v as any)) {
                const had = prevAttrs[ak as any];
                if (av !== undefined && av !== null && av !== '' && (had == null || had === '')) {
                  prevAttrs[ak as any] = av as any;
                  newlyFilled.push(`attributes.${ak}`);
                  changed = true;
                }
              }
              if (changed) (merged as any).attributes = prevAttrs;
            } else if (v !== undefined && v !== null && v !== '' && isEmptyPrev) {
              (merged as any)[k] = v;
              newlyFilled.push(k);
            }
          }
          if (newlyFilled.length) {
            const now = Date.now();
            setAutoFilledAt(prevMap => {
              const copy = { ...prevMap };
              newlyFilled.forEach(key => { copy[key] = now; });
              return copy;
            });
            // Reveal fields pyramidally and highlight
            revealFields(newlyFilled);
          }
          return merged;
        });
      }

      if (typeof responseData.response?.readyToGenerate === 'boolean') {
        setReadyToGenerate(!!responseData.response.readyToGenerate);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        aiGeneratedImage: responseData.response?.generatedImage
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      
  // Non auto-generare: lasciamo che sia l'utente a cliccare il bottone
      
      // Sintesi vocale se abilitata
      if (voiceSettings.voiceEnabled) {
        setTimeout(() => {
          speakClementeMessage(responseText);
        }, 500);
      }
    } catch (error) {
      console.error('❌ Errore comunicazione chat:', error);
      toast({
        title: "Errore chat",
        description: "Problema nella comunicazione con Clemente",
        variant: "destructive",
      });
    } finally {
      setIsClementeTyping(false);
    }
  };

  // Request suggestion from Assistant (uses new /api/assistant)
  const requestSuggestion = async () => {
    try {
      const context = { currentSchema: productSchema.currentSchema, collectedData: productSchema.collectedData, conversation: chatMessages };
      const data = await assistant.sendMessage(chatInput || (requestData.title || ''));
      // if suggestion present, show it (hook already sets it)
    } catch (err) {
      console.error('assistant suggestion error', err);
      toast({ title: 'Errore assistant', description: 'Impossibile ottenere suggerimento da Clemente', variant: 'destructive' });
    }
  };

  // Telemetry helper to record copilot events (authenticated)
  const postCopilotEvent = async (eventType: string, payload?: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      // sanitize payload to avoid storing PII or full suggestion objects
      let safePayload: any = payload;
      if (payload && payload.suggestion) {
        const s = payload.suggestion;
        safePayload = {
          suggestionId: s.id || s.suggestionId || null,
          fieldConfidence: s.fieldConfidence || undefined,
          autofillThreshold: s.autofillThreshold || undefined,
          priceSuggestion: s.priceSuggestion ? { min: s.priceSuggestion.min, max: s.priceSuggestion.max } : undefined,
          // do not include texts or user-provided content
        };
      }
      await fetch('/api/copilot/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ eventType, payload: safePayload }),
      });
    } catch (err) {
      console.warn('Telemetry event failed:', err);
    }
  };

  // Field priority for progressive reveal (lower index = higher priority)
  const FIELD_PRIORITY = [
    'title',
    'description',
    'category',
    'location',
    'urgencyLevel',
    'budgetMin',
    'budgetMax',
    'priceMin',
    'priceMax',
    // common attribute keys (higher priority)
    'attributes.brand',
    'attributes.model',
    'attributes.size',
    'attributes.color',
    'attributes.material',
    'attributes.condition',
    'attributes.warranty',
  ];

  const sortByPriority = (keys: string[]) => {
    return [...keys].sort((a, b) => {
      const ia = FIELD_PRIORITY.indexOf(a);
      const ib = FIELD_PRIORITY.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  };

  // Reveal fields and trigger blink highlight
  const revealFields = (keys: string[]) => {
    if (!keys || keys.length === 0) return;
    const now = Date.now();
    const ordered = sortByPriority(keys);
    setVisibleFields(prev => {
      const copy = { ...prev };
      ordered.forEach(k => { copy[k] = true; });
      return copy;
    });
    setHighlightFields(prev => {
      const copy = { ...prev };
      ordered.forEach(k => { copy[k] = now; });
      return copy;
    });
  };

  // Allegati: selezione file e invio a Clemente
  const onPickFile = () => fileInputRef.current?.click();
  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side validation: size and type
    const maxMB = 20;
    const allowedTypes = [
      'image/jpeg','image/png','image/webp','application/pdf',
    ];
    if (file.size > maxMB * 1024 * 1024) {
      toast({ title: 'File troppo grande', description: `Dimensione massima ${maxMB} MB`, variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Tipo file non supportato', description: 'Consigliati: JPG, PNG, WEBP o PDF.', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      setIsClementeTyping(true);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const attachedFile = { base64, mimeType: file.type, name: file.name };
      const response = await fetch('/api/clemente/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          conversationHistory: chatMessages,
          context: { currentSchema: productSchema.currentSchema, collectedData: productSchema.collectedData },
          attachedFile,
        })
      });
      if (!response.ok) {
        let msg = `Errore server (${response.status})`;
        try { const err = await response.json(); msg = err?.message || msg; } catch {}
        throw new Error(msg);
      }
      const data = await response.json();
      if (data?.response?.requestDraft) {
        const draft = data.response.requestDraft as Record<string, any>;
        setRequestData(prev => {
          const next: any = { ...prev, ...draft };
          // deep-merge attributes to avoid losing AI-filled fields
          if (draft.attributes && typeof draft.attributes === 'object') {
            next.attributes = { ...(prev as any).attributes, ...draft.attributes };
          }
          return next;
        });
        toast({ title: 'File analizzato', description: 'Clemente ha estratto dettagli dal file.' });
      }
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.response?.message || 'Ho analizzato il file e aggiornato la scheda.',
        timestamp: new Date(),
        aiGeneratedImage: data?.response?.generatedImage
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Errore invio file a Clemente:', err);
      toast({ title: 'Errore file', description: err?.message || 'Non riesco ad analizzare il file.', variant: 'destructive' });
    } finally {
      setIsClementeTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Pulizia highlight dopo 3 secondi
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setAutoFilledAt(map => {
        const copy = { ...map };
        let changed = false;
        for (const [k, ts] of Object.entries(copy)) {
          if (now - ts > 3000) { delete copy[k]; changed = true; }
        }
        return changed ? copy : map;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Pulizia highlightFields dopo 3 secondi (gestisce l'animazione orange)
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setHighlightFields(map => {
        const copy = { ...map };
        let changed = false;
        for (const [k, ts] of Object.entries(copy)) {
          if (now - ts > 3000) { delete copy[k]; changed = true; }
        }
        return changed ? copy : map;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const isHighlighted = (field: string) => !!autoFilledAt[field] || !!highlightFields[field];

  const isVisible = (field: string) => !!visibleFields[field];

  // Auto-detect schema from title/productName to drive manual form fields
  useEffect(() => {
    const base = (requestData.title || requestData.productName || '').trim();
    if (!base) return;
    const detected = findBestProductSchemaClient(base);
    if (detected) {
      setProductSchema(prev => ({
        ...prev,
        isActive: true,
        currentSchema: prev.currentSchema || detected,
      }));
      // Reveal top schema attribute fields so user can edit them
      try {
        const topFields = (detected.fields || []).slice(0, 3).map((f: any) => `attributes.${f.key}`);
        if (topFields.length) revealFields(topFields);
      } catch (e) {
        // ignore
      }
      // Auto-fill category if missing
      setRequestData(prev => {
        if (prev.category) return prev;
        // Map to high-level categories used in backend listings
        const map: Record<string, string> = {
          occhiali: 'Abbigliamento e Accessori',
          scarpe: 'Sport e Tempo Libero',
          abbigliamento: 'Abbigliamento e Accessori',
          elettronica: 'Elettronica',
          mobili: 'Casa e Giardino',
        };
        const cat = map[(detected.category as string)] || 'Altro';
        return { ...prev, category: cat };
      });
    }
  }, [requestData.title, requestData.productName]);

  // Calcola progresso di completamento
  const completionPercent = (() => {
    const required = ['title','category','description','location'];
    const filled = required.filter(f => {
      const v = (requestData as any)[f];
      return v !== undefined && v !== null && String(v).trim() !== '';
    }).length;
    return Math.max(20, Math.round((filled / required.length) * 100));
  })();

  // Genera richiesta dalla chat
  const handleGenerateFromChat = async () => {
    try {
      const response = await fetch('/api/clemente/generate-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: chatMessages
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
  const responseData = await response.json();
      
      if (responseData.requestData) {
        const draft = responseData.requestData as Record<string, any>;
        // Deep-merge to avoid losing fields already compiled in the form
        setRequestData(prev => {
          const merged: any = { ...prev };
          const newlyFilled: string[] = [];
          const now = Date.now();

          const assignIfEmpty = (key: string, value: any) => {
            const prevVal = (merged as any)[key];
            const isEmptyPrev = prevVal == null || prevVal === '';
            if (value !== undefined && value !== null && value !== '' && isEmptyPrev) {
              (merged as any)[key] = value;
              newlyFilled.push(key);
            }
          };

          // top-level keys
          for (const [k, v] of Object.entries(draft)) {
            if (k === 'attributes' && v && typeof v === 'object') {
              const prevAttrs = (merged as any).attributes && typeof (merged as any).attributes === 'object' ? { ...(merged as any).attributes } : {};
              let changed = false;
              for (const [ak, av] of Object.entries(v as any)) {
                const had = prevAttrs[ak as any];
                if (av !== undefined && av !== null && av !== '' && (had == null || had === '')) {
                  prevAttrs[ak as any] = av as any;
                  newlyFilled.push(`attributes.${ak}`);
                  changed = true;
                }
              }
              if (changed) (merged as any).attributes = prevAttrs;
            } else if (k === 'description') {
              // allow improving description
              if (v) (merged as any)[k] = v;
            } else {
              assignIfEmpty(k, v);
            }
          }

          if (newlyFilled.length) {
            setAutoFilledAt(prevMap => {
              const copy = { ...prevMap };
              newlyFilled.forEach(key => { copy[key] = now; });
              return copy;
            });
            // Reveal fields and highlight pyramidally
            revealFields(newlyFilled);
          }
          return merged;
        });
        toast({
          title: "Richiesta generata dalla chat!",
          description: "Clemente ha estratto tutte le informazioni dalla conversazione.",
        });
        
  // Non pubblichiamo automaticamente: mostriamo la scheda precompilata per revisione
      } else {
        throw new Error('Dati richiesta non validi');
      }
    } catch (error) {
      console.error('Errore generazione da chat:', error);
      toast({
        title: "Errore generazione",
        description: "Non riesco a generare la richiesta dalla chat.",
        variant: "destructive",
      });
    }
  };

  // Acquisisci posizione corrente (facoltativa)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocalizzazione non supportata', description: 'Il tuo browser non supporta la geolocalizzazione.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeo({ lat: latitude, lng: longitude });
        toast({ title: 'Posizione acquisita', description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
      },
      (err) => {
        toast({ title: 'Impossibile ottenere la posizione', description: err.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Pubblica richiesta
  const handlePublish = () => {
    if (firebaseUser && !firebaseUser.emailVerified) {
      toast({ title: 'Verifica email necessaria', description: 'Verifica la tua email per poter pubblicare richieste. Controlla la posta o richiedi un nuovo link dalla dashboard.', variant: 'destructive' });
      window.location.href = '/dashboard';
      return;
    }
    // Verifica completamento profilo
    if (!user || !user.firstName || !user.lastName || !user.email) {
      toast({
        title: "Profilo incompleto",
        description: "Completa il tuo profilo prima di pubblicare una richiesta.",
        variant: "destructive",
      });
      window.location.href = '/profile';
      return;
    }

    if (!requestData.title || !requestData.category) {
      toast({
        title: "Dati mancanti",
        description: "Clemente deve raccogliere più informazioni prima di pubblicare",
        variant: "destructive",
      });
      return;
    }

    // Normalize title to base product name (e.g., "Occhiali da sole")
    const normalizedTitle = normalizeProductTitle(String(requestData.title));

    const finalRequestData: any = {
      ...requestData,
      title: normalizedTitle,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
      // invia il raggio solo se l'utente ha scelto di allargare fuori città
      ...(expandBeyondCity ? { actionRadius: radiusKm } : {}),
      // default consegna: ritiro in negozio
      deliveryPreference: requestData.deliveryPreference || 'pickup',
      ...(province ? { province } : {}),
      ...(cap ? { cap } : {}),
      aiContext: {
        messages: chatMessages,
        extractedSpecs: chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].content : ''
      }
    };

    createRequestMutation.mutate(finalRequestData);
  };

  // Scroll automatico
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isClementeTyping]);

  const speakClementeMessage = async (text: string) => {
    if (!voiceSettings?.voiceEnabled) return;
    
    setIsClementeSpeaking(true);
    
    try {
      await speakWithSettings(text, 'clemente');
    } catch (error) {
      console.error('Errore sintesi vocale:', error);
    } finally {
      setIsClementeSpeaking(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-4 overflow-hidden">
              <img 
                src="/attached_assets/Clemente foto profilo_1754847201275.png" 
                alt="Clemente AI" 
                className="w-14 h-14 rounded-lg object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Parla con Clemente
              </h1>
              <p className="text-green-100 text-lg">
                Trova quello che cerchi con il tuo assistente AI
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat con Clemente */}
        <Card className="order-1 lg:order-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-green-700">
              <div className="flex items-center">
                <img 
                  src="/attached_assets/clemente a busto intero_1754847733100.png" 
                  alt="Clemente AI" 
                  className="w-6 h-6 mr-2"
                />
                Chat con Clemente
                {isClementeSpeaking && (
                  <div className="ml-2 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    <span className="text-xs text-green-600">Parlando...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="bg-green-50"
                >
                  <i className="fas fa-cog mr-1"></i>
                  Voce
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateVoiceSettings({...voiceSettings, voiceEnabled: !voiceSettings.voiceEnabled})}
                  className={voiceSettings.voiceEnabled ? 'bg-green-50' : 'bg-slate-50'}
                >
                  {voiceSettings.voiceEnabled ? '🔊' : '🔇'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          {/* Pannello Impostazioni Vocali */}
          {showVoiceSettings && (
            <div className="px-6 pb-4 border-b">
              <VoiceSettings 
                settings={voiceSettings}
                onSettingsChange={updateVoiceSettings}
              />
            </div>
          )}
          
          <CardContent>
            {/* Messaggi chat */}
            <div className="h-96 overflow-y-auto border rounded-lg mb-4 bg-slate-50 flex flex-col p-4">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <div className="flex-1 flex items-center justify-center w-full max-h-64">
                    <img 
                      src="/attached_assets/clemente a busto intero_1754847733100.png" 
                      alt="Clemente AI" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="font-semibold">Ciao! Sono Clemente, il tuo assistente AI.</p>
                    <p>Dimmi cosa stai cercando e ti aiuterò a creare una richiesta precisa!</p>
                  </div>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white border border-slate-200'
                  }`}>
                    <div className="text-sm">{msg.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isClementeTyping && (
                <div className="text-left mb-4">
                  <div className="inline-block bg-white border border-slate-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input chat */}
            <div className="flex gap-2">
              <Input
                placeholder="Scrivi qui cosa stai cercando..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                disabled={isClementeTyping}
                className="flex-1"
              />
              
              <Button 
                onClick={handleChatMessage}
                disabled={!chatInput.trim() || isClementeTyping}
                className="bg-green-600 hover:bg-green-700 px-4"
              >
                ✈️
              </Button>
              <Button
                onClick={requestSuggestion}
                disabled={isClementeTyping}
                variant="ghost"
                title="Suggerimento Clemente"
                className="px-3"
              >
                💡
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={onPickFile}
                disabled={isClementeTyping}
                className="px-3"
                title="Allega immagine o documento"
              >
                📎
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={onFileSelected} className="hidden" />
            </div>

            {/* Genera da chat */}
            {chatMessages.length > 2 && (
              <Button 
                onClick={handleGenerateFromChat}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-magic mr-2"></i>
                Genera Richiesta dalla Conversazione
              </Button>
            )}
          </CardContent>
        </Card>

  {/* Scheda Generazione Richiesta */}
        <Card className="order-2 lg:order-none h-fit">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center justify-between">
              <span>Scheda Richiesta</span>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 bg-slate-200 rounded overflow-hidden">
                  <div className="h-2 bg-green-500" style={{ width: `${completionPercent}%` }} />
                </div>
                <span className="text-xs text-slate-600">{completionPercent}%</span>
                {(readyToGenerate || requestData?.title) && (
                  <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded">
                    Precompilata dalla chat
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Assistant proposal panel */}
            {assistant.suggestion && (
              <div className="mb-3">
                <AssistantProposal
                  proposal={assistant.suggestion}
                  onAccept={(p: any) => {
                    // merge suggested fields into requestData only if allowed and confidence high
                    const allow = p.allowAutofill !== false;
                    const fc = p.fieldConfidence || {};
                    const threshold = (p.autofillThreshold ?? undefined) ?? undefined;
                    const effectiveThreshold = typeof threshold === 'number' ? Math.max(0, Math.min(1, threshold)) : undefined;
                    const now = Date.now();
                    setRequestData(prev => {
                      const next: any = { ...prev };
                      const newlyFilled: string[] = [];
                      for (const [k, v] of Object.entries(p)) {
                        if (k === 'priceSuggestion' || k === 'fieldConfidence' || k === 'allowAutofill' || k === 'actions') continue;
                        const current = (next as any)[k];
                        const conf = fc[k] ?? 0;
                        if (!allow) continue; // do not autofill if assistant flagged no-autofill
                        const usedThreshold = effectiveThreshold ?? 0.6;
                        if ((current == null || current === '') && v !== undefined && v !== null && v !== '' && conf >= usedThreshold) {
                          (next as any)[k] = v;
                          newlyFilled.push(k);
                        }
                      }
                      // price suggestion
                      if (p.priceSuggestion && allow) {
                        if (!next.priceMin && (p.priceSuggestion.min)) { next.priceMin = p.priceSuggestion.min; newlyFilled.push('priceMin'); }
                        if (!next.priceMax && (p.priceSuggestion.max)) { next.priceMax = p.priceSuggestion.max; newlyFilled.push('priceMax'); }
                      }
                      if (newlyFilled.length) {
                        // record autofill timestamps and reveal fields pyramidally
                        setAutoFilledAt(prevMap => {
                          const copy = { ...prevMap };
                          newlyFilled.forEach(key => { copy[key] = now; });
                          return copy;
                        });
                        revealFields(newlyFilled);
                      }
                      return next;
                    });
                    // clear suggestion
                    assistant.clear();
                    // Telemetry: suggestion accepted
                    postCopilotEvent('suggestionAccepted', { suggestion: p });
                  }}
                  onModify={(p: any) => {
                    // focus on title input by updating state (UI will show editable fields already)
                    setRequestData(prev => ({ ...prev, title: p.title || prev.title, description: p.description || prev.description }));
                    postCopilotEvent('suggestionModified', { suggestion: p });
                  }}
                  onClarify={(p: any) => {
                    // send follow-up to assistant to ask clarification
                    const follow = `Ho bisogno di chiarimenti su: ${p.title || p.name || ''}`;
                    assistant.sendMessage(follow).catch(()=>{});
                    toast({ title: 'Richiesta chiarimenti inviata', description: 'Clemente ti risponderà in chat.' });
                    postCopilotEvent('suggestionClarifyRequested', { suggestion: p });
                  }}
                />
              </div>
            )}
            {/* Titolo prodotto sempre per primo */}
            {isVisible('title') && (
              <Input
                placeholder="Titolo prodotto (es. Occhiali da sole)"
                value={requestData.title || ''}
                onChange={(e)=>setRequestData(prev=>({...prev, title: e.target.value}))}
                className={isHighlighted('title') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
              />
            )}

            {productSchema.isActive && productSchema.currentSchema && isVisible('description') && (
              <div className="p-3 border rounded-md bg-slate-50">
                <div className="text-sm font-semibold text-slate-800 mb-2">Scheda rilevata: {productSchema.currentSchema.name || productSchema.currentSchema.category}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(productSchema.currentSchema.fields || []).slice(0,8).map((f: any) => (
                    isVisible(`attributes.${f.key}`) ? (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">{f.label}{f.required ? ' *' : ''}</label>
                        {Array.isArray(f.options) && f.options.length > 0 ? (
                          <select
                            className={isHighlighted(`attributes.${f.key}`) ? 'border rounded h-9 px-2 ring-2 ring-orange-400 animate-pulse' : 'border rounded h-9 px-2'}
                            value={(requestData.attributes?.[f.key]) ?? ''}
                            onChange={(e) => setRequestData(prev => ({...prev, attributes: { ...(prev.attributes||{}), [f.key]: e.target.value }}))}
                          >
                            <option value="">Seleziona…</option>
                            {f.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : f.type === 'number' ? (
                          <Input
                            type="number"
                            value={(requestData.attributes?.[f.key]) ?? ''}
                            onChange={(e) => setRequestData(prev => ({...prev, attributes: { ...(prev.attributes||{}), [f.key]: e.target.value ? Number(e.target.value) : '' }}))}
                            placeholder={f.placeholder || ''}
                            className={isHighlighted(`attributes.${f.key}`) ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                          />
                        ) : (
                          <Input
                            value={(requestData.attributes?.[f.key]) ?? ''}
                            onChange={(e) => setRequestData(prev => ({...prev, attributes: { ...(prev.attributes||{}), [f.key]: e.target.value }}))}
                            placeholder={f.placeholder || ''}
                            className={isHighlighted(`attributes.${f.key}`) ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                          />
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}
            {!productSchema.isActive && isVisible('description') && (
              <div className="p-3 border rounded-md bg-slate-50">
                <div className="text-sm font-semibold text-slate-800 mb-2">Dettagli Prodotto</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Misura / Taglia (solo per categorie che richiedono taglia) */}
                  {(() => {
                    const t = (requestData.title || '').toLowerCase();
                    const needsSize = /(scarpe|sneakers|running|spinning|cycling|tennis|basket|maglietta|camicia|felpa|maglione|pantaloni|jeans|giacca|cappotto|vestito|gonna)/.test(t);
                    if (!needsSize) return null;
                    return (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-600">Misura / Taglia</label>
                        <Input
                          value={requestData.attributes?.size || ''}
                          onChange={(e) => setRequestData(prev => ({...prev, attributes: { ...(prev.attributes||{}), size: e.target.value }}))}
                          placeholder="Es: 43 EU | M"
                          className={isHighlighted('attributes.size') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                        />
                      </div>
                    );
                  })()}
                  {/* Materiale */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Materiale</label>
                    {isVisible('attributes.material') && (
                      <Input
                        value={requestData.attributes?.material || ''}
                        onChange={(e) => setRequestData(prev => ({...prev, attributes: { ...(prev.attributes||{}), material: e.target.value }}))}
                        placeholder="Es: legno, metallo, cotone, pelle"
                        className={isHighlighted('attributes.material') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                      />
                    )}
                  </div>
                  {/* Colore */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Colore</label>
                    {isVisible('attributes.color') && (
                      <Input
                        value={requestData.attributes?.color || ''}
                        onChange={(e) => setRequestData(prev => ({...prev, attributes: { ...(prev.attributes||{}), color: e.target.value }}))}
                        placeholder="Es: nero, blu, legno naturale"
                        className={isHighlighted('attributes.color') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            {isVisible('category') && (
              <Input
                placeholder="Categoria (es. Elettronica)"
                value={requestData.category || ''}
                onChange={(e)=>setRequestData(prev=>({...prev, category: e.target.value}))}
                className={isHighlighted('category') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
              />
            )}
            {isVisible('description') && (
              <Textarea
                placeholder="Breve descrizione (es. preferisco marca X modello aviator, ma aperto ad alternative)"
                value={requestData.description || ''}
                onChange={(e)=>setRequestData(prev=>({...prev, description: e.target.value}))}
                rows={6}
                className={isHighlighted('description') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
              />
            )}
            <div className="flex gap-2">
              {isVisible('budgetMin') && (
                <Input
                  type="number"
                  placeholder="Budget Min (€)"
                  value={(requestData as any).budgetMin || ''}
                  onChange={(e)=>setRequestData(prev=>({...prev, budgetMin: Number(e.target.value)||undefined}))}
                  className={isHighlighted('budgetMin') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                />
              )}
              {isVisible('budgetMax') && (
                <Input
                  type="number"
                  placeholder="Budget Max (€)"
                  value={(requestData as any).budgetMax || ''}
                  onChange={(e)=>setRequestData(prev=>({...prev, budgetMax: Number(e.target.value)||undefined}))}
                  className={isHighlighted('budgetMax') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
                />
              )}
            </div>
            {/* Urgenza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Urgenza</label>
                {isVisible('urgencyLevel') ? (
                  <select
                    className="border rounded h-9 px-2"
                    value={(requestData as any).urgencyLevel || ''}
                    onChange={(e)=>setRequestData(prev=>({...prev, urgencyLevel: (e.target.value || undefined) as any}))}
                  >
                    <option value="">Seleziona…</option>
                    <option value="immediate">Subito</option>
                    <option value="24h">Entro 24 ore</option>
                    <option value="48h">Entro 48 ore</option>
                    <option value="few_days">Pochi giorni</option>
                  </select>
                ) : (
                  <div className="h-9" />
                )}
              </div>
            </div>
            {isVisible('location') && (
              <Input
                placeholder="Città (es. Milano)"
                value={(requestData as any).location || ''}
                onChange={(e)=>setRequestData(prev=>({...prev, location: e.target.value}))}
                className={isHighlighted('location') ? 'ring-2 ring-orange-400 animate-pulse' : ''}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Provincia (es. MI)"
                value={province}
                onChange={(e)=>setProvince(e.target.value.toUpperCase().slice(0,2))}
              />
              <Input
                placeholder="CAP (5 cifre)"
                value={cap}
                onChange={(e)=>setCap(e.target.value.replace(/\D/g,'').slice(0,5))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={detectLocation}>
                  <i className="fas fa-location-crosshairs mr-2"></i>
                  Usa la mia posizione
                </Button>
                {geo && (
                  <span className="text-xs text-slate-600 self-center">{geo.lat.toFixed(3)}, {geo.lng.toFixed(3)}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={expandBeyondCity}
                    onChange={(e)=>setExpandBeyondCity(e.target.checked)}
                  />
                  Vuoi allargare ai negozianti fuori dalla tua città?
                </label>
                {expandBeyondCity && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Math.max(1, Math.min(100, Number(e.target.value) || 25)))}
                    />
                    <span className="text-sm text-slate-600">Raggio (km)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGenerateFromChat}
              >
                <i className="fas fa-magic mr-2"></i>
                Compila dalla Chat
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handlePublish}
                disabled={!requestData.title || !requestData.category}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Pubblica Richiesta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Character Introduction */}
      {showIntro && (
        <div className="fixed inset-0 z-50">
          <CharacterIntro
            character="clemente"
            show={showIntro}
            onComplete={completeIntro}
            onNeverShow={neverShowAgain}
          />
        </div>
      )}
    </main>
  );
}