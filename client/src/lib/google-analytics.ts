// Google Analytics Setup per Switch Market
// Configurazione professionale per tracking conversioni

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Inizializza Google Analytics
export function initializeGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics non configurato. Aggiungi VITE_GA_MEASUREMENT_ID ai secrets.');
    return;
  }

  // Carica lo script Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Inizializza gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer?.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Configurazioni avanzate per e-commerce
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    send_page_view: true,
    // Enhanced e-commerce per marketplace
    custom_map: {
      'custom_parameter_1': 'user_type',
      'custom_parameter_2': 'ai_assistant',
      'custom_parameter_3': 'business_category'
    }
  });

  console.log('Google Analytics inizializzato per Switch Market');
}

// Traccia eventi personalizzati per Switch Market
export function trackEvent(action: string, parameters?: Record<string, any>) {
  if (!window.gtag) return;

  window.gtag('event', action, {
    event_category: parameters?.category || 'general',
    event_label: parameters?.label,
    value: parameters?.value,
    currency: parameters?.currency || 'EUR',
    // Parametri custom per Switch Market
    user_type: parameters?.userType,
    ai_assistant: parameters?.aiAssistant,
    business_category: parameters?.businessCategory,
    location: parameters?.location,
    ...parameters
  });
}

// Traccia conversioni specifiche per marketplace
export function trackConversion(conversionType: string, value?: number, details?: any) {
  if (!window.gtag) return;

  window.gtag('event', 'conversion', {
    send_to: GA_MEASUREMENT_ID,
    event_category: 'conversion',
    event_label: conversionType,
    value: value || 0,
    currency: 'EUR',
    conversion_type: conversionType,
    ...details
  });
}

// Traccia valore del business per ROI
export function trackBusinessValue(event: string, value: number, metadata?: any) {
  if (!window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: metadata?.transactionId || `${Date.now()}`,
    value: value,
    currency: 'EUR',
    event_category: 'business_value',
    event_label: event,
    items: [{
      item_id: metadata?.itemId || event,
      item_name: metadata?.itemName || event,
      category: metadata?.category || 'marketplace_action',
      quantity: 1,
      price: value
    }],
    ...metadata
  });
}

// Enhanced E-commerce per marketplace events
export function trackMarketplaceEvent(eventType: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase', data: any) {
  if (!window.gtag) return;

  switch (eventType) {
    case 'view_item':
      window.gtag('event', 'view_item', {
        currency: 'EUR',
        value: data.value || 0,
        items: [{
          item_id: data.requestId,
          item_name: data.title,
          category: data.category,
          price: data.value || 0
        }]
      });
      break;

    case 'purchase':
      window.gtag('event', 'purchase', {
        transaction_id: data.transactionId,
        value: data.value,
        currency: 'EUR',
        items: data.items
      });
      break;
  }
}