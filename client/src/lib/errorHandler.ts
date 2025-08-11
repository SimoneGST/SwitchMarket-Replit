import { toast } from "@/hooks/use-toast";

export interface AppError {
  code: string;
  message: string;
  redirectTo?: string;
}

export class ErrorHandler {
  static handleAuthError(error: any): AppError {
    console.error("Auth error:", error);

    // Firebase Auth specific errors
    if (error.code) {
      switch (error.code) {
        case 'auth/unauthorized-domain':
          return {
            code: 'DOMAIN_NOT_AUTHORIZED',
            message: 'Dominio non autorizzato. Usa l\'accesso con email.',
            redirectTo: '/auth'
          };
        case 'auth/popup-closed-by-user':
          return {
            code: 'LOGIN_CANCELLED',
            message: 'Accesso annullato.',
            redirectTo: '/auth'
          };
        case 'auth/popup-blocked':
          return {
            code: 'POPUP_BLOCKED',
            message: 'Popup bloccato. Abilita i popup o usa email.',
            redirectTo: '/auth'
          };
        case 'auth/network-request-failed':
          return {
            code: 'NETWORK_ERROR',
            message: 'Errore di connessione. Riprova.',
            redirectTo: '/auth'
          };
        case 'auth/user-disabled':
          return {
            code: 'USER_DISABLED',
            message: 'Account disabilitato. Contatta il supporto.',
            redirectTo: '/'
          };
        case 'auth/invalid-email':
          return {
            code: 'INVALID_EMAIL',
            message: 'Email non valida.',
            redirectTo: '/auth'
          };
        case 'auth/wrong-password':
          return {
            code: 'WRONG_PASSWORD',
            message: 'Password errata.',
            redirectTo: '/auth'
          };
        case 'auth/user-not-found':
          return {
            code: 'USER_NOT_FOUND',
            message: 'Utente non trovato. Registrati prima.',
            redirectTo: '/auth'
          };
        case 'auth/email-already-in-use':
          return {
            code: 'EMAIL_IN_USE',
            message: 'Email già registrata. Usa il login.',
            redirectTo: '/auth'
          };
        case 'auth/weak-password':
          return {
            code: 'WEAK_PASSWORD',
            message: 'Password troppo debole. Almeno 6 caratteri.',
            redirectTo: '/auth'
          };
        default:
          return {
            code: 'AUTH_ERROR',
            message: 'Errore di autenticazione. Riprova con email.',
            redirectTo: '/auth'
          };
      }
    }

    // Generic error
    return {
      code: 'UNKNOWN_AUTH_ERROR',
      message: 'Errore imprevisto. Riprova con email.',
      redirectTo: '/auth'
    };
  }

  static handleGenericError(error: any, context: string = 'app'): AppError {
    console.error(`${context} error:`, error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Problemi di connessione. Verifica internet.',
        redirectTo: '/'
      };
    }

    if (error.message?.includes('permission')) {
      return {
        code: 'PERMISSION_ERROR',
        message: 'Accesso negato. Effettua il login.',
        redirectTo: '/auth'
      };
    }

    return {
      code: 'GENERIC_ERROR',
      message: 'Errore imprevisto. Riprova.',
      redirectTo: '/'
    };
  }

  static showErrorAndRedirect(
    appError: AppError, 
    redirectFn: (path: string) => void,
    delay: number = 3000
  ) {
    // Show error toast
    toast({
      title: "Errore",
      description: appError.message,
      variant: "destructive",
    });

    // Redirect after delay
    if (appError.redirectTo) {
      setTimeout(() => {
        redirectFn(appError.redirectTo!);
      }, delay);
    }
  }

  static handleCriticalError(error: any, redirectFn: (path: string) => void) {
    console.error("Critical error:", error);
    
    toast({
      title: "Errore Critico",
      description: "Problema tecnico rilevato. Reindirizzamento alla home.",
      variant: "destructive",
    });

    // Immediate redirect to home for critical errors
    setTimeout(() => {
      redirectFn('/');
    }, 1000);
  }
}