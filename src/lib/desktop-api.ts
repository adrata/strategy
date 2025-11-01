/**
 * Desktop API Configuration for Tauri
 * 
 * This file provides desktop-specific API endpoints that work with Tauri's Rust backend
 * using the invoke() command system instead of HTTP API routes.
 */

// Desktop API client that uses Tauri invoke commands
export class DesktopAPIClient {
  private static instance: DesktopAPIClient;
  
  static getInstance(): DesktopAPIClient {
    if (!DesktopAPIClient.instance) {
      DesktopAPIClient.instance = new DesktopAPIClient();
    }
    return DesktopAPIClient.instance;
  }

  // Check if we're running in Tauri
  private isTauri(): boolean {
    return typeof window !== 'undefined' && !!(window as any).__TAURI__;
  }

  // Browser methods
  async openBrowser(url: string, title?: string, width?: number, height?: number): Promise<{ success: boolean; message: string }> {
    if (!this.isTauri()) {
      return {
        success: false,
        message: 'Nova Browser is only available in the desktop app'
      };
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('create_browser_window', {
        config: {
          url,
          title: title || 'Nova Browser',
          width: width || 1200,
          height: height || 800
        }
      });
    } catch (error) {
      console.error('Failed to open browser:', error);
      return {
        success: false,
        message: `Failed to open browser: ${error}`
      };
    }
  }

  async navigateBrowser(windowId: string, url: string): Promise<{ success: boolean; message: string }> {
    if (!this.isTauri()) {
      return {
        success: false,
        message: 'Nova Browser is only available in the desktop app'
      };
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('navigate_browser_window', { windowId, url });
    } catch (error) {
      console.error('Failed to navigate browser:', error);
      return {
        success: false,
        message: `Failed to navigate browser: ${error}`
      };
    }
  }

  async closeBrowser(windowId: string): Promise<{ success: boolean; message: string }> {
    if (!this.isTauri()) {
      return {
        success: false,
        message: 'Nova Browser is only available in the desktop app'
      };
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('close_browser_window', { windowId });
    } catch (error) {
      console.error('Failed to close browser:', error);
      return {
        success: false,
        message: `Failed to close browser: ${error}`
      };
    }
  }

  async listBrowserWindows(): Promise<string[]> {
    if (!this.isTauri()) {
      return [];
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('list_browser_windows');
    } catch (error) {
      console.error('Failed to list browser windows:', error);
      return [];
    }
  }

  // Generic API call that routes to backend API (online-only)
  async call<T>(endpoint: string, data?: any): Promise<T> {
    // Always use HTTP for API calls - desktop app is online-only
    // Tauri commands are only for native features (notifications, file system, etc.)
    return this.callHTTP<T>(endpoint, data);
  }

  // Tauri commands are now only used for native features (browser windows, notifications, etc.)
  // All API calls go directly to the backend server

  // HTTP call to backend API (online-only desktop app)
  private async callHTTP<T>(endpoint: string, data?: any): Promise<T> {
    // Get API base URL from desktop config
    const { getAPIBaseURL } = await import('./desktop-config');
    const apiBaseUrl = getAPIBaseURL();
    
    // Construct full URL
    const fullUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    console.log(`🌐 [DESKTOP API] Making HTTP call to: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ [DESKTOP API] HTTP error ${response.status}: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const desktopAPI = DesktopAPIClient.getInstance();

// Desktop-specific API endpoints with proper typing
export const desktopEndpoints = {
  // Companies
  getCompanies: (filters?: any) => 
    desktopAPI.call('/api/v1/companies', filters),
  
  getCompany: (id: string) => 
    desktopAPI.call(`/api/v1/companies/${id}`),
  
  // People
  getPeople: (filters?: any) => 
    desktopAPI.call('/api/v1/people', filters),
  
  getPerson: (id: string) => 
    desktopAPI.call(`/api/v1/people/${id}`),
  
  // Actions
  getActions: (filters?: any) => 
    desktopAPI.call('/api/v1/actions', filters),
  
  getAction: (id: string) => 
    desktopAPI.call(`/api/v1/actions/${id}`),
  
  // Speedrun
  getSpeedrunData: (filters?: any) => 
    desktopAPI.call('/api/v1/speedrun', filters),
  
  getSpeedrunProspects: (filters?: any) => 
    desktopAPI.call('/api/v1/speedrun/prospects', filters),
  
  // Chronicle
  generateChronicle: (data: any) => 
    desktopAPI.call('/api/v1/chronicle/generate', data),
  
  getChronicleReports: (filters?: any) => 
    desktopAPI.call('/api/v1/chronicle/reports', filters),
  
  // Intelligence
  generateIntelligence: (data: any) => 
    desktopAPI.call('/api/v1/intelligence', data),
  
  generateBuyerGroupIntelligence: (data: any) => 
    desktopAPI.call('/api/v1/intelligence/buyer-group', data),
  
  // Auth
  signIn: (credentials: any) => 
    desktopAPI.call('/api/v1/auth/sign-in', credentials),
  
  signOut: () => 
    desktopAPI.call('/api/v1/auth/sign-out'),
  
  getAuthStatus: () => 
    desktopAPI.call('/api/v1/auth/status'),
  
  // Data
  searchData: (query: string, filters?: any) => 
    desktopAPI.call('/api/v1/data/search', { query, ...filters }),
  
  getDataCounts: () => 
    desktopAPI.call('/api/v1/data/counts'),
};

// React hook for using desktop API
export function useDesktopAPI() {
  return {
    api: desktopAPI,
    endpoints: desktopEndpoints,
    isTauri: typeof window !== 'undefined' && !!(window as any).__TAURI__,
  };
}

// Utility function to check if running in Tauri
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}
