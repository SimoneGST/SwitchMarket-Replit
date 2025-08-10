import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { trackPageView, trackUserAction, ANALYTICS_EVENTS } from '@/lib/analytics-events';

export default function ConversionTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Track page view
    trackPageView(location);

    // Track specific conversion events based on page
    switch (location) {
      case '/customer-dashboard':
        trackUserAction(ANALYTICS_EVENTS.CUSTOMER_SIGNUP, 'user_journey', 'dashboard_reached');
        break;
      
      case '/merchant-dashboard':
        trackUserAction(ANALYTICS_EVENTS.MERCHANT_SIGNUP, 'user_journey', 'dashboard_reached');
        break;
      
      case '/create':
        trackUserAction(ANALYTICS_EVENTS.REQUEST_CREATE_START, 'user_journey', 'request_page_visited');
        break;
    }

    // Track time spent on page
    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      trackUserAction('time_on_page', 'engagement', location, Math.round(timeSpent / 1000));
    };
  }, [location]);

  return null;
}

// Hook per tracking eventi custom
export function useConversionTracking() {
  const trackConversion = (event: string, value?: number, metadata?: any) => {
    trackUserAction(event, 'conversion', metadata?.label, value);
    
    // Eventi di business value
    if (['request_created', 'offer_sent', 'connection_made'].includes(event)) {
      trackUserAction(ANALYTICS_EVENTS.LEAD_GENERATED, 'business_value', event, value);
    }
  };

  const trackAIUsage = (assistant: 'clemente' | 'leonardo', action: string, metadata?: any) => {
    trackUserAction(`${assistant}_${action}`, 'ai_interaction', metadata?.type, metadata?.value);
  };

  const trackFeatureUsage = (feature: string, context?: string) => {
    trackUserAction(`feature_${feature}`, 'feature_usage', context);
  };

  return {
    trackConversion,
    trackAIUsage,
    trackFeatureUsage
  };
}