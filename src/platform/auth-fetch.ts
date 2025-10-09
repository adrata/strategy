/**
 * Authenticated Fetch Utility
 * 
 * Provides a standardized way to make authenticated API requests
 * with proper error handling and authentication token management.
 */

export interface AuthFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * Authenticated fetch function that automatically includes authentication
 * and handles common error scenarios
 */
export async function authFetch(
  url: string | URL,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, retries = 3, ...fetchOptions } = options;

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

    // Handle authentication errors
    if (response.status === 401) {
      console.warn('🔐 Authentication required - redirecting to login');
      // Could trigger a redirect to login page here if needed
      throw new Error('Authentication required');
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter && retries > 0) {
        const delay = parseInt(retryAfter) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return authFetch(url, { ...options, retries: retries - 1 });
      }
    }

    // Retry on server errors
    if (response.status >= 500 && retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return authFetch(url, { ...options, retries: retries - 1 });
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle network errors with retry
    if (
      (error instanceof TypeError || (error as any)?.name === 'AbortError') &&
      retries > 0
    ) {
      const delay = Math.pow(2, 3 - retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return authFetch(url, { ...options, retries: retries - 1 });
    }

    throw error;
  }
}

/**
 * Convenience method for GET requests
 */
export async function authGet(url: string | URL, options: AuthFetchOptions = {}) {
  return authFetch(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function authPost(
  url: string | URL,
  data?: any,
  options: AuthFetchOptions = {}
) {
  return authFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function authPut(
  url: string | URL,
  data?: any,
  options: AuthFetchOptions = {}
) {
  return authFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function authDelete(url: string | URL, options: AuthFetchOptions = {}) {
  return authFetch(url, { ...options, method: 'DELETE' });
}
