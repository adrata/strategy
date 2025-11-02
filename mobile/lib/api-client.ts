/**
 * Unified API Client for Mobile
 * Handles all HTTP requests to the Next.js API backend
 */

import { getAPIBaseURL } from './platform-detection';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = getAPIBaseURL();
const AUTH_TOKEN_KEY = 'adrata_auth_token';
const REFRESH_TOKEN_KEY = 'adrata_refresh_token';

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
}

export class APIClient {
  private static instance: APIClient;
  private baseURL: string;

  private constructor() {
    this.baseURL = API_BASE_URL;
  }

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  /**
   * Get authentication token from secure storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Save authentication token to secure storage
   */
  async setAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  /**
   * Remove authentication token
   */
  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  /**
   * Build full URL for API endpoint
   */
  private buildURL(endpoint: string): string {
    // If endpoint already includes full URL, use it
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${path}`;
  }

  /**
   * Make authenticated HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildURL(endpoint);
    const token = await this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for CSRF protection
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text() as unknown as T;
      }

      const data = await response.json();

      // Handle API errors
      if (!response.ok) {
        const error: APIError = {
          error: data.error || 'Unknown error',
          message: data.message || `HTTP ${response.status}`,
          statusCode: response.status,
        };

        // Handle authentication errors
        if (response.status === 401) {
          await this.clearAuthToken();
          // Could trigger auth flow here
        }

        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error; // Re-throw API errors
      }
      // Network or other errors
      throw {
        error: 'NetworkError',
        message: error instanceof Error ? error.message : 'Network request failed',
        statusCode: 0,
      } as APIError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = APIClient.getInstance();

