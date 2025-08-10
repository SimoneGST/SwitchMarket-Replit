// Analytics Events per Switch Market
// Tracciamento eventi SEO e conversioni

export const ANALYTICS_EVENTS = {
  // Page Views
  PAGE_VIEW: 'page_view',
  
  // User Registration & Onboarding
  REGISTER_START: 'register_start',
  REGISTER_COMPLETE: 'register_complete',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  CUSTOMER_SIGNUP: 'customer_signup',
  MERCHANT_SIGNUP: 'merchant_signup',
  
  // Product Requests (Core Conversion)
  REQUEST_CREATE_START: 'request_create_start',
  REQUEST_CREATE_COMPLETE: 'request_create_complete',
  REQUEST_WITH_CLEMENTE: 'request_with_clemente',
  REQUEST_MANUAL: 'request_manual',
  REQUEST_WITH_IMAGE: 'request_with_image',
  REQUEST_WITH_VOICE: 'request_with_voice',
  
  // AI Interactions
  CLEMENTE_CHAT_START: 'clemente_chat_start',
  CLEMENTE_MESSAGE_SENT: 'clemente_message_sent',
  CLEMENTE_REQUEST_GENERATED: 'clemente_request_generated',
  LEONARDO_CHAT_START: 'leonardo_chat_start',
  LEONARDO_MESSAGE_SENT: 'leonardo_message_sent',
  
  // Merchant Actions
  OFFER_CREATE: 'offer_create',
  OFFER_SEND: 'offer_send',
  INTEGRATION_SETUP: 'integration_setup',
  
  // Search & Discovery
  PRODUCT_SEARCH: 'product_search',
  LOCATION_SEARCH: 'location_search',
  CATEGORY_FILTER: 'category_filter',
  
  // Engagement
  PROFILE_COMPLETE: 'profile_complete',
  VERIFICATION_START: 'verification_start',
  VERIFICATION_COMPLETE: 'verification_complete',
  
  // Voice Features
  VOICE_COMMAND_USED: 'voice_command_used',
  VOICE_MESSAGE_SENT: 'voice_message_sent',
  TTS_ENABLED: 'tts_enabled',
  
  // Business Value
  LEAD_GENERATED: 'lead_generated',
  CONNECTION_MADE: 'connection_made',
  TRANSACTION_INTENT: 'transaction_intent'
};

// Funzioni di tracking per eventi chiave
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      custom_parameter_1: parameters?.category || 'general',
      custom_parameter_2: parameters?.action || eventName,
      custom_parameter_3: parameters?.label || '',
      value: parameters?.value || 0,
      ...parameters
    });
  }
  
  // Console log per debug (rimuovere in produzione)
  console.log('Analytics Event:', eventName, parameters);
}

export function trackPageView(pagePath: string, pageTitle?: string) {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    category: 'page_view'
  });
}

export function trackUserAction(action: string, category: string, label?: string, value?: number) {
  trackEvent(action, {
    category,
    action,
    label,
    value
  });
}

export function trackAIInteraction(assistant: 'clemente' | 'leonardo', action: string, details?: any) {
  trackEvent(action, {
    category: 'ai_interaction',
    assistant,
    action,
    ...details
  });
}

export function trackBusinessValue(event: string, value?: number, details?: any) {
  trackEvent(event, {
    category: 'business_value',
    value,
    currency: 'EUR',
    ...details
  });
}