/**
 * UNIFIED API FETCH UTILITY - Production Ready
 * 
 * Combines the best features from auth-fetch.ts and safe-api-fetch.ts:
 * - Automatic authentication handling
 * - Robust error recovery with fallbacks
 * - Platform-specific optimizations
 * - Retry logic with exponential backoff
 * - Rate limiting handling
 */

export interface ApiFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  fallbackResponse?: any;
}

/**
 * Unified API fetch function that handles authentication, errors, and fallbacks
 */
export async function apiFetch<T = any>(
  url: string | URL,
  options: ApiFetchOptions = {},
  fallbackResponse?: T
): Promise<T> {
  const { timeout = 10000, retries = 3, fallbackResponse: optionsFallback, ...fetchOptions } = options;
  
  // Use fallback from options if provided, otherwise use the third parameter
  const finalFallback = optionsFallback !== undefined ? optionsFallback : fallbackResponse;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // 🔍 COMPREHENSIVE COOKIE DIAGNOSTICS & AUTH HEADER FALLBACK
  let authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // 🔐 ALWAYS try Authorization header from localStorage as backup (even if cookies exist)
  // This handles cases where cookies exist but are invalid/expired
  if (typeof window !== 'undefined') {
    const cookieHeader = document.cookie;
    const hasAuthCookie = cookieHeader.includes('auth-token') || cookieHeader.includes('adrata_unified_session');
    
    // ALWAYS try to get token from localStorage and send as Authorization header
    // This provides robust authentication even if cookies are invalid
    try {
      const sessionStr = localStorage.getItem('adrata_unified_session_v3');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.accessToken) {
          authHeaders['Authorization'] = `Bearer ${session.accessToken}`;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [API-FETCH] Using Authorization header (from localStorage):', {
              hasCookie: hasAuthCookie,
              tokenLength: session.accessToken.length
            });
          }
        }
      }
    } catch (error) {
      // Silent fail - continue without auth header
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [API-FETCH] Failed to read token from localStorage:', error);
      }
    }
    
    // Enhanced cookie diagnostics in development
    if (process.env.NODE_ENV === 'development') {
      const cookieNames = cookieHeader ? cookieHeader.split(';').map(c => c.split('=')[0].trim()).filter(Boolean) : [];
      console.log('🔍 [API-FETCH] Pre-request diagnostics:', {
        url: url.toString(),
        hasCookies: cookieHeader.length > 0,
        cookieCount: cookieNames.length,
        cookieNames: cookieNames.slice(0, 10),
        hasAuthCookie,
        usingAuthHeader: !!authHeaders['Authorization'],
        authHeaderPresent: authHeaders['Authorization'] ? 'Yes' : 'No'
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include', // Include cookies for authentication
      headers: authHeaders,
    });

    clearTimeout(timeoutId);

    // Handle different response statuses
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Enhanced diagnostics for 401 errors
        const cookieHeader = typeof window !== 'undefined' ? document.cookie : 'N/A (server-side)';
        const hasAuthCookie = cookieHeader.includes('auth-token') || cookieHeader.includes('next-auth.session-token');
        const cookieNames = typeof window !== 'undefined' 
          ? document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean)
          : [];
        
        // Try to get response body for more context
        let responseBody = null;
        try {
          const responseText = await response.clone().text();
          if (responseText) {
            try {
              responseBody = JSON.parse(responseText);
            } catch {
              responseBody = { raw: responseText.substring(0, 200) };
            }
          }
        } catch {
          // Ignore errors reading response body
        }
        
        // Check if we tried to send Authorization header
        const triedAuthHeader = typeof window !== 'undefined' && 
          (authHeaders['Authorization'] || fetchOptions.headers?.['Authorization']);
        
        // Get the actual Authorization header value for debugging (truncated)
        const actualAuthHeader = typeof window !== 'undefined' && 
          (authHeaders['Authorization'] || fetchOptions.headers?.['Authorization'] || '');
        const authHeaderPreview = actualAuthHeader 
          ? `${actualAuthHeader.substring(0, 50)}...` 
          : 'NOT SET';
        
        console.warn('🔐 Authentication required for API call:', {
          url,
          status: response.status,
          statusText: response.statusText,
          hasCookies: typeof window !== 'undefined' && document.cookie.length > 0,
          cookieCount: cookieNames.length,
          cookieNames: process.env.NODE_ENV === 'development' ? cookieNames : 'hidden',
          hasAuthCookie,
          cookieHeader: process.env.NODE_ENV === 'development' ? cookieHeader.substring(0, 100) : 'hidden',
          triedAuthHeader,
          authHeaderSent: triedAuthHeader ? 'Yes' : 'No',
          authHeaderPreview: process.env.NODE_ENV === 'development' ? authHeaderPreview : 'hidden',
          authHeaderLength: actualAuthHeader ? actualAuthHeader.length : 0,
          fallbackAvailable: finalFallback !== undefined,
          responseBody,
          timestamp: new Date().toISOString(),
          // Include diagnostic message for debugging
          diagnostic: triedAuthHeader 
            ? 'Authorization header was sent but server rejected it - token may be invalid/expired'
            : 'No Authorization header was sent - localStorage token may be missing',
          // Check if localStorage has token
          localStorageTokenExists: typeof window !== 'undefined' ? !!localStorage.getItem('adrata_unified_session_v3') : 'N/A'
        });
        
        if (finalFallback !== undefined) {
          console.log('🔄 Using fallback response for 401 error:', url);
          return finalFallback;
        }
        
        // Throw error with more context
        throw new Error(`Authentication required (401): ${response.statusText || 'Unauthorized'}`);
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter && retries > 0) {
          const delay = parseInt(retryAfter) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return apiFetch(url, { ...options, retries: retries - 1 }, finalFallback);
        }
      }

      // Handle server errors with retry
      if (response.status >= 500 && retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiFetch(url, { ...options, retries: retries - 1 }, finalFallback);
      }

      // For other client errors, try to parse error message
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = 'UNKNOWN_ERROR';
      let responseBody = null;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorCode = errorData.code || errorCode;
        responseBody = errorData;
        
        // Log the full error response for debugging
        console.error(`❌ API Error Response:`, {
          url,
          status: response.status,
          errorData,
          errorMessage,
          errorCode
        });
      } catch (jsonError) {
        // If we can't parse JSON, try to get text response
        console.error(`❌ Failed to parse error response as JSON:`, jsonError);
        try {
          const errorText = await response.text();
          console.error(`❌ Error response text:`, errorText);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        } catch {
          // Complete failure
          console.error(`❌ Could not read error response at all`);
        }
      }

      // Enhanced error logging with more context
      console.error(`❌ API call failed: ${url}`, {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        errorCode,
        responseBody,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Return fallback if available
      if (finalFallback !== undefined) {
        console.log(`🔄 Using fallback response for: ${url}`);
        return finalFallback;
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    } else {
      // For non-JSON responses, return the response object
      return response as unknown as T;
    }

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle network errors with retry
    if (
      (error instanceof TypeError || (error as any)?.name === 'AbortError') &&
      retries > 0
    ) {
      const delay = Math.pow(2, 3 - retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiFetch(url, { ...options, retries: retries - 1 }, finalFallback);
    }

    console.error(`❌ Network error for API call: ${url}`, error);
    
    // Return fallback if available
    if (finalFallback !== undefined) {
      console.log(`🔄 Using fallback response for network error: ${url}`);
      return finalFallback;
    }
    
    throw error;
  }
}

/**
 * Convenience method for GET requests with fallback
 */
export async function apiGet<T = any>(
  url: string | URL,
  fallbackResponse?: T,
  options: ApiFetchOptions = {}
): Promise<T> {
  return apiFetch(url, { ...options, method: 'GET' }, fallbackResponse);
}

/**
 * Convenience method for POST requests with fallback
 */
export async function apiPost<T = any>(
  url: string | URL,
  data?: any,
  fallbackResponse?: T,
  options: ApiFetchOptions = {}
): Promise<T> {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }, fallbackResponse);
}

/**
 * Convenience method for PUT requests with fallback
 */
export async function apiPut<T = any>(
  url: string | URL,
  data?: any,
  fallbackResponse?: T,
  options: ApiFetchOptions = {}
): Promise<T> {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }, fallbackResponse);
}

/**
 * Convenience method for DELETE requests with fallback
 */
export async function apiDelete<T = any>(
  url: string | URL,
  fallbackResponse?: T,
  options: ApiFetchOptions = {}
): Promise<T> {
  return apiFetch(url, { ...options, method: 'DELETE' }, fallbackResponse);
}

/**
 * Check if we're in a desktop environment where APIs might not be available
 */
export function isDesktopEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.location.href.includes('localhost') &&
    (window.navigator.userAgent.includes('Adrata Desktop') ||
     window.location.pathname.includes('grand-central') ||
     (window as any).__TAURI__)
  );
}

/**
 * API fetch that automatically detects desktop environment and provides appropriate fallbacks
 */
export async function apiFetchWithDesktopDetection<T = any>(
  url: string | URL,
  options: ApiFetchOptions = {},
  fallbackResponse?: T
): Promise<T> {
  // If we're in desktop mode, return fallback immediately
  if (isDesktopEnvironment()) {
    console.log(`🖥️ Desktop mode detected, using fallback for: ${url}`);
    return fallbackResponse !== undefined ? fallbackResponse : {} as T;
  }

  return apiFetch(url, options, fallbackResponse);
}

// Legacy aliases for backward compatibility
export const authFetch = apiFetch;
export const authGet = apiGet;
export const authPost = apiPost;
export const authPut = apiPut;
export const authDelete = apiDelete;

export const safeApiFetch = apiFetch;
export const safeApiGet = apiGet;
export const safeApiPost = apiPost;
export const safeApiPut = apiPut;
export const safeApiDelete = apiDelete;
export const safeApiFetchWithDesktopDetection = apiFetchWithDesktopDetection;
