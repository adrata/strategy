import { demoScenarioService } from './DemoScenarioService';

/**
 * Demo Scenario Navigation Service
 * Handles URL routing and navigation for demo scenarios
 */
export class DemoScenarioNavigationService {
  
  /**
   * Navigate to a demo scenario
   * This will redirect the user to the demo scenario URL structure
   */
  static async navigateToDemoScenario(scenarioSlug: string, currentPath?: string): Promise<void> {
    try {
      console.log(`🎯 [DEMO NAV] Navigating to demo scenario: ${scenarioSlug}`);
      
      // Set the current scenario in the demo service
      demoScenarioService.setCurrentScenario(scenarioSlug);
      
      // Get the current path or default to dashboard
      const basePath = currentPath || '/dashboard';
      
      // Remove workspace prefix if present (e.g., /adrata/dashboard -> /dashboard)
      const cleanPath = basePath.replace(/^\/[^\/]+/, '');
      
      // Create the demo scenario URL
      const demoUrl = `/demo/${scenarioSlug}${cleanPath}`;
      
      console.log(`🔄 [DEMO NAV] Redirecting to: ${demoUrl}`);
      
      // Navigate to the demo scenario URL
      if (typeof window !== 'undefined') {
        window['location']['href'] = demoUrl;
      }
      
    } catch (error) {
      console.error('❌ [DEMO NAV] Error navigating to demo scenario:', error);
      throw error;
    }
  }
  
  /**
   * Check if the current URL is a demo scenario URL
   */
  static isDemoScenarioUrl(pathname: string): boolean {
    return pathname.startsWith('/demo/');
  }
  
  /**
   * Extract scenario slug from demo URL
   */
  static extractScenarioFromUrl(pathname: string): { scenarioSlug: string; remainingPath: string } | null {
    const demoMatch = pathname.match(/^\/demo\/([^\/]+)(.*)$/);
    
    if (demoMatch) {
      return {
        scenarioSlug: demoMatch[1],
        remainingPath: demoMatch[2] || '/dashboard'
      };
    }
    
    return null;
  }
  
  /**
   * Convert a regular workspace URL to a demo scenario URL
   */
  static convertToDemoUrl(workspaceUrl: string, scenarioSlug: string): string {
    // Remove workspace prefix if present
    const cleanUrl = workspaceUrl.replace(/^\/[^\/]+/, '');
    
    // Add demo scenario prefix
    return `/demo/${scenarioSlug}${cleanUrl}`;
  }
  
  /**
   * Convert a demo scenario URL back to a regular workspace URL
   */
  static convertFromDemoUrl(demoUrl: string, workspaceSlug: string): string {
    // Remove demo scenario prefix
    const cleanUrl = demoUrl.replace(/^\/demo\/[^\/]+/, '');
    
    // Add workspace prefix
    return `/${workspaceSlug}${cleanUrl}`;
  }
  
  /**
   * Get the current demo scenario from URL or localStorage
   */
  static getCurrentDemoScenario(): string | null {
    if (typeof window === 'undefined') return null;
    
    // First check URL
    const urlMatch = this.extractScenarioFromUrl(window.location.pathname);
    if (urlMatch) {
      return urlMatch.scenarioSlug;
    }
    
    // Fallback to demo service
    return demoScenarioService.getCurrentScenario();
  }
  
  /**
   * Handle demo scenario selection from ProfileBox
   */
  static async handleDemoScenarioSelection(scenarioSlug: string): Promise<void> {
    try {
      console.log(`🎯 [DEMO NAV] Handling demo scenario selection: ${scenarioSlug}`);
      
      // Always start with dashboard for demo scenarios
      const demoUrl = `/demo/${scenarioSlug}/dashboard`;
      
      console.log(`🔄 [DEMO NAV] Redirecting to: ${demoUrl}`);
      
      // Navigate to the demo scenario URL
      if (typeof window !== 'undefined') {
        window['location']['href'] = demoUrl;
      }
      
    } catch (error) {
      console.error('❌ [DEMO NAV] Error handling demo scenario selection:', error);
      throw error;
    }
  }
}
