import { toast } from "@/hooks/use-toast";

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    toast({
      title: "Errore Imprevisto",
      description: "Si è verificato un problema.",
      variant: "destructive",
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
    toast({
      title: "Errore di Caricamento",
      description: "Problema durante il caricamento.",
      variant: "destructive",
    });
  });

  // Handle navigation errors (like Firebase auth redirects that fail)
  window.addEventListener('beforeunload', () => {
    // Clear any pending error states
    sessionStorage.removeItem('authError');
  });

  // Check for auth errors on page load
  const authError = sessionStorage.getItem('authError');
  if (authError) {
    toast({
      title: "Errore Autenticazione",
      description: "Problema durante l'accesso. Prova con email e password.",
      variant: "destructive",
    });
    sessionStorage.removeItem('authError');
  }
}

// Function to manually trigger error handling
export function handleCriticalError(error: any, message: string = "Errore critico rilevato") {
  console.error('Critical error:', error);
  
  toast({
    title: "Errore Critico",
    description: message,
    variant: "destructive",
  });

  // Force redirect to home
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}