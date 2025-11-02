"use client";

import { useEffect, useRef, useState } from 'react';

interface CalendlyWidgetProps {
  url: string;
  height?: number;
  textColor?: string;
  primaryColor?: string;
  hideGdprBanner?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    customAnswers?: Record<string, string>;
  };
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  className?: string;
  onEventScheduled?: (event: any) => void;
  onDateTimeSelected?: (event: any) => void;
}

// Declare global Calendly interface
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: any;
        utm?: any;
      }) => void;
    };
  }
}

export default function CalendlyWidget({ 
  url, 
  height = 700,
  textColor = "000000",
  primaryColor = "205ad8",
  hideGdprBanner = true,
  prefill,
  utm,
  className = "",
  onEventScheduled,
  onDateTimeSelected
}: CalendlyWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Build the complete URL with parameters
  const buildCalendlyUrl = () => {
    const baseUrl = url.includes('?') ? url : `${url}?`;
    const params = new URLSearchParams();
    
    // Add styling parameters
    if (hideGdprBanner) params['append']('hide_gdpr_banner', '1');
    params['append']('text_color', textColor);
    params['append']('primary_color', primaryColor);
    
    // Add prefill parameters
    if (prefill) {
      Object.entries(prefill).forEach(([key, value]) => {
        if (value) {
          if (typeof value === 'string') {
            params['append'](key, value);
          } else {
            // Handle custom answers as JSON string
            params['append'](key, JSON.stringify(value));
          }
        }
      });
    }
    
    // Add UTM parameters
    if (utm) {
      Object.entries(utm).forEach(([key, value]) => {
        if (value) params['append'](key, value);
      });
    }
    
    return `${baseUrl}&${params['toString']()}`;
  };

  // Load Calendly script
  useEffect(() => {
    const script = document.createElement('script');
    script['src'] = 'https://assets.calendly.com/assets/external/widget.js';
    script['async'] = true;
    script['onload'] = () => {
      setIsScriptLoaded(true);
    };
    script['onerror'] = () => {
      setError('Failed to load Calendly script');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script on unmount
      document.head.removeChild(script);
    };
  }, []);

  // Initialize Calendly widget when script is loaded
  useEffect(() => {
    if (isScriptLoaded && widgetRef['current'] && window.Calendly) {
      try {
        // Clear any existing content
        widgetRef['current']['innerHTML'] = '';
        
        // Initialize the widget
        window.Calendly.initInlineWidget({
          url: buildCalendlyUrl(),
          parentElement: widgetRef.current,
          prefill: prefill || {},
          utm: utm || {}
        });
        
        setIsLoaded(true);
        setError(null);
        
        // Set a backup timeout to show widget even if events don't fire
        setTimeout(() => {
          setIsLoaded(true);
        }, 3000);
        
      } catch (err) {
        console.error('Failed to initialize Calendly widget:', err);
        setError('Failed to initialize calendar widget');
      }
    }
  }, [isScriptLoaded, url, prefill, utm, textColor, primaryColor, hideGdprBanner]);

  // Set up event listeners for Calendly events
  useEffect(() => {
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.origin !== 'https://calendly.com') return;
      
      const { event, payload } = e.data;
      
      switch (event) {
        case 'calendly.event_scheduled':
          console.log('Event scheduled:', payload);
          onEventScheduled?.(payload);
          break;
        case 'calendly.date_and_time_selected':
          console.log('Date and time selected:', payload);
          onDateTimeSelected?.(payload);
          break;
        case 'calendly.profile_page_viewed':
          console.log('Calendly widget loaded');
          setIsLoaded(true);
          break;
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [onEventScheduled, onDateTimeSelected]);

  if (error) {
    return (
      <div className={`min-h-[${height}px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-red-600 p-8">
          <div className="text-2xl mb-4">⚠️</div>
          <h3 className="font-semibold mb-2">Calendar Loading Error</h3>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoaded(false);
              setIsScriptLoaded(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className={`absolute inset-0 bg-background flex items-center justify-center z-10 min-h-[${height}px] rounded-lg border border-border`}>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-border border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted font-medium">Loading calendar...</p>
            <p className="text-muted text-sm mt-2">Please wait while we prepare your booking page</p>
          </div>
        </div>
      )}
      
      {/* Calendly Widget Container */}
      <div 
        ref={widgetRef}
        className="calendly-inline-widget"
        style={{
          minWidth: '320px',
          height: `${height}px`,
          width: '100%',
        }}
      />
    </div>
  );
} 