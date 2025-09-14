import { useEffect, useCallback } from 'react';

interface CalendlyHookOptions {
  onEventScheduled?: (payload: any) => void;
  onDateTimeSelected?: (payload: any) => void;
  onProfilePageViewed?: (payload: any) => void;
  onPageHeightChanged?: (payload: any) => void;
  onEventTypeViewed?: (payload: any) => void;
}

export const useCalendly = (options: CalendlyHookOptions = {}) => {
  const {
    onEventScheduled,
    onDateTimeSelected,
    onProfilePageViewed,
    onPageHeightChanged,
    onEventTypeViewed,
  } = options;

  const handleCalendlyEvent = useCallback((e: MessageEvent) => {
    // Only handle messages from Calendly
    if (e.origin !== 'https://calendly.com') return;

    const { event, payload } = e.data;

    switch (event) {
      case 'calendly.event_scheduled':
        console.log('📅 Event scheduled:', payload);
        onEventScheduled?.(payload);
        break;
      
      case 'calendly.date_and_time_selected':
        console.log('🕐 Date and time selected:', payload);
        onDateTimeSelected?.(payload);
        break;
      
      case 'calendly.profile_page_viewed':
        console.log('👤 Profile page viewed:', payload);
        onProfilePageViewed?.(payload);
        break;
      
      case 'calendly.page_height':
        console.log('📏 Page height changed:', payload);
        onPageHeightChanged?.(payload);
        break;
      
      case 'calendly.event_type_viewed':
        console.log('📋 Event type viewed:', payload);
        onEventTypeViewed?.(payload);
        break;
      
      default:
        console.log('🔔 Calendly event:', event, payload);
    }
  }, [
    onEventScheduled,
    onDateTimeSelected,
    onProfilePageViewed,
    onPageHeightChanged,
    onEventTypeViewed,
  ]);

  useEffect(() => {
    window.addEventListener('message', handleCalendlyEvent);
    
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [handleCalendlyEvent]);

  return {};
}; 