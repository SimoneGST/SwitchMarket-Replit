import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { showToast } from '@/lib/toast-notifications';

// Componente per gestire le notifiche toast globali
export function ToastContainer() {
  useEffect(() => {
    // Event listener per errori di rete globali
    const handleOnlineOffline = () => {
      if (navigator.onLine) {
        showToast('chat', 'connectionRestored');
      } else {
        showToast('chat', 'connectionLost');
      }
    };

    // Event listener per errori non gestiti
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error);
      
      if (event.error?.message?.includes('fetch')) {
        showToast('system', 'networkError');
      } else {
        showToast('system', 'serverError');
      }
    };

    // Event listener per promise rejection non gestite
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (event.reason?.message?.includes('NetworkError')) {
        showToast('system', 'networkError');
      }
    };

    window.addEventListener('online', handleOnlineOffline);
    window.addEventListener('offline', handleOnlineOffline);
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('online', handleOnlineOffline);
      window.removeEventListener('offline', handleOnlineOffline);
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <Toaster />;
}