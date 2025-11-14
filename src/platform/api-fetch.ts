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

  // Get auth token from multiple sources for Authorization header (outside try block for error handling)
  let authToken: string | null = null;

  try {
    if (typeof window !== 'undefined') {
      try {
        // Method 1: Try UnifiedAuthService.getSession() first (most reliable)
        try {
          const { UnifiedAuthService } = await import('@/platform/auth/service');
          const session = await UnifiedAuthService.getSession();
          if (session?.accessToken) {
            authToken = session.accessToken;
            if (process.env.NODE_ENV === 'development') {
              console.log('🔑 [API-FETCH] Got token from UnifiedAuthService');
            }
          }
        } catch (serviceError) {
          // UnifiedAuthService not available or failed, continue to cookie method
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [API-FETCH] UnifiedAuthService not available, trying cookies:', serviceError);
          }
        }

        // Method 2: Fallback to cookies if UnifiedAuthService didn't provide token
        if (!authToken) {
          try {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              if (key && value) {
                try {
                  acc[key] = decodeURIComponent(value);
                } catch {
                  acc[key] = value;
                }
              }
              return acc;
            }, {} as Record<string, string>);
            
            // Try to get auth token from cookies (support both cookie names)
            authToken = cookies['auth-token'] || cookies['adrata_unified_session'] || null;
            
            // If unified_session is a JSON object, try to extract the token
            if (!authToken && cookies['adrata_unified_session']) {
              try {
                const sessionData = JSON.parse(cookies['adrata_unified_session']);
                authToken = sessionData.accessToken || sessionData.token || null;
              } catch {
                // Not JSON, use as-is
                authToken = cookies['adrata_unified_session'];
              }
            }
            
            if (authToken && process.env.NODE_ENV === 'development') {
              console.log('🔑 [API-FETCH] Got token from cookies');
            }
          } catch (cookieError) {
            // Failed to read cookies, continue without Authorization header
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ [API-FETCH] Failed to read cookies for auth token:', cookieError);
            }
          }
        }
      } catch (error) {
        // Failed to read cookies, continue without Authorization header
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [API-FETCH] Failed to get auth token:', error);
        }
      }
    }

    // Prepare headers with optional Authorization header
    // Convert Headers object to plain object if needed
    let existingHeaders: Record<string, string> | undefined;
    if (fetchOptions.headers) {
      if (fetchOptions.headers instanceof Headers) {
        existingHeaders = {};
        fetchOptions.headers.forEach((value, key) => {
          existingHeaders![key] = value;
        });
      } else if (Array.isArray(fetchOptions.headers)) {
        existingHeaders = Object.fromEntries(fetchOptions.headers);
      } else {
        existingHeaders = fetchOptions.headers as Record<string, string>;
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...existingHeaders,
    };
    
    // Check if Authorization header already exists (case-insensitive)
    const hasExistingAuthHeader = 
      (headers as any)['Authorization'] || 
      (headers as any)['authorization'] ||
      existingHeaders?.['Authorization'] || 
      existingHeaders?.['authorization'];
    
    // Add Authorization header if we have a token and no Authorization header is already provided
    if (authToken && !hasExistingAuthHeader) {
      (headers as any)['Authorization'] = `Bearer ${authToken}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 [API-FETCH] Added Authorization header:', {
          hasToken: !!authToken,
          tokenLength: authToken.length,
          tokenPrefix: authToken.substring(0, 20) + '...',
          url: String(url),
          headerAdded: true
        });
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [API-FETCH] Authorization header NOT added:', {
        hasAuthToken: !!authToken,
        hasExistingAuthHeader: !!hasExistingAuthHeader,
        url: String(url),
        reason: !authToken ? 'No token' : 'Existing header found'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      const authHeaderValue = (headers as any)['Authorization'] || (headers as any)['authorization'];
      console.log('📤 [API-FETCH] Making request:', {
        url: String(url),
        method: fetchOptions.method || 'GET',
        hasAuthHeader: !!authHeaderValue,
        authHeaderPrefix: authHeaderValue ? authHeaderValue.substring(0, 30) + '...' : 'none',
        authHeaderLength: authHeaderValue ? authHeaderValue.length : 0,
        headersKeys: Object.keys(headers as any),
        hasCookies: typeof window !== 'undefined' && document.cookie.length > 0,
        cookieCount: typeof window !== 'undefined' ? document.cookie.split(';').length : 0
      });
    }

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include', // Include cookies for authentication
      headers,
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
        
        // Enhanced diagnostics - check if we sent Authorization header
        const sentAuthHeader = typeof window !== 'undefined' && authToken ? 'Yes (Bearer token)' : 'No';
        
        console.warn('🔐 Authentication required for API call:', {
          url,
          status: response.status,
          statusText: response.statusText,
          hasCookies: typeof window !== 'undefined' && document.cookie.length > 0,
          cookieCount: cookieNames.length,
          cookieNames: process.env.NODE_ENV === 'development' ? cookieNames : 'hidden',
          hasAuthCookie,
          cookieHeader: process.env.NODE_ENV === 'development' ? cookieHeader.substring(0, 100) : 'hidden',
          sentAuthorizationHeader: sentAuthHeader,
          authTokenLength: authToken ? authToken.length : 0,
          authTokenPrefix: authToken && process.env.NODE_ENV === 'development' ? authToken.substring(0, 20) + '...' : 'hidden',
          fallbackAvailable: finalFallback !== undefined,
          responseBody,
          timestamp: new Date().toISOString()
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
      
      // Clone response before parsing to allow multiple reads
      const clonedResponse = response.clone();
      
      try {
        // Read response as text first to avoid "Unexpected end of JSON input" errors
        const responseText = await clonedResponse.text();
        
        // If response is empty, use default error message
        if (!responseText || responseText.trim().length === 0) {
          // Only log warning if no fallback (errors with fallbacks are expected and handled gracefully)
          if (finalFallback === undefined) {
            console.warn(`⚠️ Empty error response body for ${url}`);
          }
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        } else {
          // Try to parse the text as JSON
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorCode = errorData.code || errorCode;
            responseBody = errorData;
            
            // Only log error if no fallback (errors with fallbacks are expected and handled gracefully)
            if (finalFallback === undefined) {
              console.error(`❌ API Error Response:`, {
                url: String(url),
                status: response.status,
                statusText: response.statusText,
                errorMessage: errorMessage,
                errorCode: errorCode,
                errorData: errorData
              });
            }
          } catch (parseError) {
            // Response text exists but isn't valid JSON - use the text itself
            // Only log warning if no fallback
            if (finalFallback === undefined) {
              console.warn(`⚠️ Error response is not valid JSON for ${url}`);
              console.error(`❌ Error response text:`, responseText.substring(0, 500));
            }
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
            if (responseText.length > 0 && responseText.length < 200) {
              errorMessage += ` - ${responseText}`;
            }
          }
        }
      } catch (textError) {
        // Complete failure - couldn't read response at all
        // Only log error if no fallback
        if (finalFallback === undefined) {
          console.error(`❌ Could not read error response:`, textError);
        }
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }

      // Return fallback if available (before logging errors)
      if (finalFallback !== undefined) {
        // Silently use fallback - errors with fallbacks are expected and handled gracefully
        return finalFallback;
      }
      
      // Enhanced error logging with more context (only if no fallback)
      console.error(`❌ API call failed: ${url}`);
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Error Message:', errorMessage);
      console.error('Error Code:', errorCode);
      console.error('Response Body:', responseBody);
      console.error('Headers:', Object.fromEntries(response.headers.entries()));
      
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
