// Safari compatibility utilities

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
}

export function isMobileSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
}

export function applySafariFixes(): void {
  if (typeof window === 'undefined') return;
  
  // Fix viewport height on mobile Safari
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  if (isMobileSafari()) {
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100);
    });
  }
  
  // Fix Safari flexbox issues
  if (isSafari()) {
    // Add Safari-specific class to body
    document.body.classList.add('safari');
    
    // Fix Safari font rendering
    document.documentElement.style.setProperty('-webkit-font-smoothing', 'antialiased');
    document.documentElement.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
  }
}

export function getSafariVersion(): number | null {
  if (typeof window === 'undefined' || !isSafari()) return null;
  
  const userAgent = window.navigator.userAgent;
  const match = userAgent.match(/Version\/(\d+(?:\.\d+)?)/);
  return match && match[1] ? parseFloat(match[1]) : null;
}

// Polyfill for Safari compatibility
export function loadSafariPolyfills(): void {
  if (typeof window === 'undefined') return;
  
  // Add any necessary polyfills for Safari
  if (isSafari()) {
    // CSS.supports polyfill for older Safari versions
    if (!window.CSS || !window.CSS.supports) {
      // Simple polyfill for CSS.supports
      window['CSS'] = window.CSS || {};
      window['CSS']['supports'] = function(property: string, value?: string) {
        const el = document.createElement('div');
        if (typeof value === 'string') {
          el.style.setProperty(property, value);
          return el.style.getPropertyValue(property) === value;
        }
        return false;
      };
    }
  }
}

declare global {
  interface Window {
    MSStream?: any;
    CSS: {
      supports: (property: string, value?: string) => boolean;
    };
  }
} 