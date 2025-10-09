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

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    // Handle different response statuses
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        console.warn('🔐 Authentication required for API call:', url);
        if (finalFallback !== undefined) {
          return finalFallback;
        }
        throw new Error('Authentication required');
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
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the status text
      }

      console.error(`❌ API call failed: ${url}`, errorMessage);
      
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
