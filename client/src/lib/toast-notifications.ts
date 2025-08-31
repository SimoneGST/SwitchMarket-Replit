import * as React from 'react';
import { toast } from "@/hooks/use-toast";
import { ToastAction } from '@/components/ui/toast';

// Tipi di notifiche standardizzate per Switch Market
export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading';

// Configurazioni predefinite per diversi tipi di azioni
const TOAST_CONFIGS = {
  // Autenticazione e account
  auth: {
    loginSuccess: {
      title: "Login effettuato",
      description: "Benvenuto su Switch Market!",
      type: 'success' as const
    },
    loginError: {
      title: "Errore di accesso",
      description: "Credenziali non valide. Riprova.",
      type: 'error' as const
    },
    logoutSuccess: {
      title: "Logout effettuato",
      description: "A presto su Switch Market!",
      type: 'info' as const
    }
  },
  
  // Verifica merchant
  verification: {
    processing: {
      title: "Verifica in corso...",
      description: "Stiamo controllando i tuoi dati",
      type: 'loading' as const
    },
    success: {
      title: "Verifica completata!",
      description: "La tua attività è stata verificata con successo",
      type: 'success' as const
    },
    error: {
      title: "Errore verifica",
      description: "Controlla i dati inseriti e riprova",
      type: 'error' as const
    },
    invalidPiva: {
      title: "P.IVA non valida",
      description: "Controlla il formato della Partita IVA",
      type: 'warning' as const
    },
    invalidCF: {
      title: "Codice Fiscale non valido",
      description: "Controlla il formato del Codice Fiscale",
      type: 'warning' as const
    }
  },
  
  // Richieste e offerte
  requests: {
    created: {
      title: "Richiesta pubblicata",
      description: "I negozianti della zona possono ora rispondere",
      type: 'success' as const
    },
    updated: {
      title: "Richiesta aggiornata",
      description: "Le modifiche sono state salvate",
      type: 'success' as const
    },
    deleted: {
      title: "Richiesta eliminata",
      description: "La richiesta è stata rimossa",
      type: 'info' as const
    },
    error: {
      title: "Errore richiesta",
      description: "Non è stato possibile completare l'operazione",
      type: 'error' as const
    }
  },
  
  offers: {
    created: {
      title: "Offerta inviata",
      description: "Il cliente riceverà una notifica",
      type: 'success' as const
    },
    accepted: {
      title: "Offerta accettata",
      description: "Puoi contattare il negoziante per i dettagli",
      type: 'success' as const
    },
    rejected: {
      title: "Offerta rifiutata",
      description: "Continua a cercare altre opportunità",
      type: 'info' as const
    }
  },
  
  // Chat e messaggi
  chat: {
    messageSent: {
      title: "Messaggio inviato",
      description: "Il destinatario riceverà una notifica",
      type: 'success' as const
    },
    messageError: {
      title: "Errore invio",
      description: "Messaggio non inviato. Riprova.",
      type: 'error' as const
    },
    connectionLost: {
      title: "Connessione persa",
      description: "Reconnessione in corso...",
      type: 'warning' as const
    },
    connectionRestored: {
      title: "Connessione ripristinata",
      description: "Puoi continuare a chattare",
      type: 'success' as const
    }
  },
  
  // Profilo e dati
  profile: {
    updated: {
      title: "Profilo aggiornato",
      description: "Le tue informazioni sono state salvate",
      type: 'success' as const
    },
    photoUploaded: {
      title: "Foto caricata",
      description: "La tua immagine profilo è stata aggiornata",
      type: 'success' as const
    },
    error: {
      title: "Errore salvataggio",
      description: "Non è stato possibile salvare le modifiche",
      type: 'error' as const
    }
  },
  
  // Sistema generale
  system: {
    loading: {
      title: "Caricamento...",
      description: "Attendere prego",
      type: 'loading' as const
    },
    networkError: {
      title: "Errore di rete",
      description: "Controlla la connessione internet",
      type: 'error' as const
    },
    serverError: {
      title: "Errore del server",
      description: "Riprova tra qualche momento",
      type: 'error' as const
    },
    featureUnavailable: {
      title: "Funzione non disponibile",
      description: "Questa funzionalità sarà presto attiva",
      type: 'info' as const
    }
  }
};

// Funzione principale per mostrare toast con configurazioni predefinite
export function showToast(category: keyof typeof TOAST_CONFIGS, action: string, customMessage?: string) {
  // Use safe any lookup to avoid complex inferred union types causing "never" errors
  const anyConfigs: any = TOAST_CONFIGS;
  const config = anyConfigs[category]?.[action];

  if (!config) {
    console.warn(`Toast configuration not found for ${category}.${action}`);
    return;
  }

  const description = customMessage || config.description;

  toast({
    title: config.title,
    description,
    variant: config.type === 'error' ? 'destructive' : 'default',
    duration: getToastDuration(config.type)
  });
}

// Funzioni helper per tipi specifici
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'default',
    duration: 4000
  });
}

export function showErrorToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'destructive',
    duration: 6000
  });
}

export function showWarningToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'default',
    duration: 5000
  });
}

export function showInfoToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'default',
    duration: 3000
  });
}

export function showLoadingToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: 'default',
    duration: 10000 // Più lungo per i loading
  });
}

// Durata dinamica basata sul tipo
function getToastDuration(type: NotificationType): number {
  switch (type) {
    case 'success':
      return 4000;
    case 'error':
      return 6000;
    case 'warning':
      return 5000;
    case 'info':
      return 3000;
    case 'loading':
      return 10000;
    default:
      return 4000;
  }
}

// Toast per progress/operazioni lunghe
export function showProgressToast(title: string, progress: number) {
  toast({
    title,
    description: `Progresso: ${progress}%`,
    variant: 'default',
    duration: 2000
  });
}

// Toast con azioni personalizzate
export function showActionToast(
  title: string, 
  description: string, 
  actionText: string, 
  onAction: () => void
) {
  // Build a ToastAction React element so it matches the expected ToastActionElement type
  const actionElement = React.createElement(ToastAction, { onClick: onAction, altText: actionText }, actionText);
  toast({
    title,
    description,
    // cast to any because ToastActionElement typing is strict in our primitives
    action: actionElement as any
  });
}

// Esporta le configurazioni per uso diretto se necessario
export { TOAST_CONFIGS };