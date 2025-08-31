import { useMemo } from 'react';
import { useEnhancedToast } from '@/components/ui/enhanced-toast';
import { showToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '@/lib/toast-notifications';

// Hook centralizzato per gestire le notifiche nell'app
export function useNotifications() {
  const enhancedToast = useEnhancedToast();

  // Notifiche per autenticazione
  const auth = useMemo(() => ({
    loginSuccess: () => showToast('auth', 'loginSuccess'),
    loginError: (error?: string) => showToast('auth', 'loginError', error),
    logoutSuccess: () => showToast('auth', 'logoutSuccess'),
  }), []);

  // Notifiche per verifica merchant
  const verification = useMemo(() => ({
    processing: () => showToast('verification', 'processing'),
    success: () => showToast('verification', 'success'),
    error: (error?: string) => showToast('verification', 'error', error),
    invalidPiva: () => showToast('verification', 'invalidPiva'),
    invalidCF: () => showToast('verification', 'invalidCF'),
  }), []);

  // Notifiche per richieste
  const requests = useMemo(() => ({
    created: () => showToast('requests', 'created'),
    updated: () => showToast('requests', 'updated'),
    deleted: () => showToast('requests', 'deleted'),
    error: (error?: string) => showToast('requests', 'error', error),
  }), []);

  // Notifiche per offerte
  const offers = useMemo(() => ({
    created: () => showToast('offers', 'created'),
    accepted: () => showToast('offers', 'accepted'),
    rejected: () => showToast('offers', 'rejected'),
  }), []);

  // Notifiche per chat
  const chat = useMemo(() => ({
    messageSent: () => showToast('chat', 'messageSent'),
    messageError: () => showToast('chat', 'messageError'),
    connectionLost: () => showToast('chat', 'connectionLost'),
    connectionRestored: () => showToast('chat', 'connectionRestored'),
  }), []);

  // Notifiche per profilo
  const profile = useMemo(() => ({
    updated: () => showToast('profile', 'updated'),
    photoUploaded: () => showToast('profile', 'photoUploaded'),
    error: (error?: string) => showToast('profile', 'error', error),
  }), []);

  // Notifiche di sistema
  const system = useMemo(() => ({
    loading: () => showToast('system', 'loading'),
    networkError: () => showToast('system', 'networkError'),
    serverError: () => showToast('system', 'serverError'),
    featureUnavailable: () => showToast('system', 'featureUnavailable'),
  }), []);

  // Notifiche generiche
  const generic = useMemo(() => ({
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
  }), []);

  // Notifiche enhanced con icone
  const enhanced = enhancedToast;

  return {
    auth,
    verification,
    requests,
    offers,
    chat,
    profile,
    system,
    generic,
    enhanced
  };
}