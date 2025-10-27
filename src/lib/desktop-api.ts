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
    return typeof window !== 'undefined' && !!window.__TAURI__;
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

  // Generic API call that routes to Tauri commands
  async call<T>(endpoint: string, data?: any): Promise<T> {
    if (this.isTauri()) {
      // Use Tauri invoke commands for desktop
      return this.callTauriCommand<T>(endpoint, data);
    } else {
      // Fallback to HTTP for web development
      return this.callHTTP<T>(endpoint, data);
    }
  }

  // Call Tauri command using invoke()
  private async callTauriCommand<T>(endpoint: string, data?: any): Promise<T> {
    const { invoke } = await import('@tauri-apps/api/core');
    
    // Map API endpoints to Tauri commands
    const commandMap: Record<string, string> = {
      // Companies API
      '/api/v1/companies': 'get_companies',
      '/api/v1/companies/[id]': 'get_company',
      
      // People API  
      '/api/v1/people': 'get_people',
      '/api/v1/people/[id]': 'get_person',
      
      // Actions API
      '/api/v1/actions': 'get_actions',
      '/api/v1/actions/[id]': 'get_action',
      
      // Speedrun API
      '/api/v1/speedrun': 'get_speedrun_data',
      '/api/v1/speedrun/prospects': 'get_speedrun_prospects',
      
      // Chronicle API
      '/api/v1/chronicle/generate': 'generate_chronicle_report',
      '/api/v1/chronicle/reports': 'get_chronicle_reports',
      
      // Intelligence API
      '/api/v1/intelligence': 'generate_intelligence',
      '/api/v1/intelligence/buyer-group': 'generate_buyer_group_intelligence',
      
      // Auth API
      '/api/v1/auth/sign-in': 'authenticate_user',
      '/api/v1/auth/sign-out': 'sign_out_user',
      '/api/v1/auth/status': 'get_auth_status',
      
      // Data API
      '/api/v1/data/search': 'search_data',
      '/api/v1/data/counts': 'get_data_counts',
    };

    // Extract command name from endpoint
    let command = 'generic_api_call';
    for (const [pattern, cmd] of Object.entries(commandMap)) {
      if (endpoint.includes(pattern.replace('/[id]', ''))) {
        command = cmd;
        break;
      }
    }
    
    try {
      console.log(`🔄 Calling Tauri command: ${command} for endpoint: ${endpoint}`);
      
      const result = await invoke(command, { 
        endpoint, 
        data: data || {},
        method: data ? 'POST' : 'GET'
      });
      
      console.log(`✅ Tauri command ${command} completed successfully`);
      return result as T;
    } catch (error) {
      console.error(`❌ Tauri command failed for ${endpoint}:`, error);
      throw new Error(`Desktop API call failed: ${error}`);
    }
  }

  // Fallback HTTP call for web development
  private async callHTTP<T>(endpoint: string, data?: any): Promise<T> {
    console.log(`🌐 Making HTTP call to: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    isTauri: typeof window !== 'undefined' && !!window.__TAURI__,
  };
}

// Utility function to check if running in Tauri
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.__TAURI__;
}
