/**
 * 🔐 DEMO ACCESS VALIDATOR
 * 
 * Centralized service to validate demo workspace access
 * Ensures ONLY Dan and Ross can access demo workspace
 */

export interface DemoAccessResult {
  hasAccess: boolean;
  isDanOrRoss: boolean;
  reason?: string;
}

export class DemoAccessValidator {
  
  /**
   * Validate if a user can access demo workspace
   * ONLY Dan and Ross are allowed
   */
  static validateDemoAccess(userId: string, userEmail?: string): DemoAccessResult {
    // Check if user is Dan or Ross
    const isDanOrRoss = this.isDanOrRoss(userId, userEmail);
    
    if (!isDanOrRoss) {
      return {
        hasAccess: false,
        isDanOrRoss: false,
        reason: 'Demo workspace access restricted to Dan and Ross only'
      };
    }
    
    return {
      hasAccess: true,
      isDanOrRoss: true
    };
  }
  
  /**
   * Check if user is Dan or Ross - ONLY these two users are allowed
   */
  static isDanOrRoss(userId: string, userEmail?: string): boolean {
    const danEmail = 'dan@adrata.com';
    const rossEmail = 'ross@adrata.com';
    const danUserId = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID
    const rossUserId = '01K1VBYZG41K9QA0D9CF06KNRG'; // Ross's user ID
    
    // STRICT: Only allow Dan and Ross - no exceptions
    const isDan = (userEmail === danEmail || userId === danUserId);
    const isRoss = (userEmail === rossEmail || userId === rossUserId);
    
    return isDan || isRoss;
  }
  
  /**
   * Validate demo workspace access with additional context
   * ONLY Dan and Ross can access demo workspaces
   */
  static validateDemoWorkspaceAccess(
    userId: string, 
    userEmail: string, 
    workspaceId: string
  ): DemoAccessResult {
    // First check if this is a demo workspace - ONLY the actual demo workspace
    const isDemoWorkspace = workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' ||
                           userId === 'demo-user-2025';
    
    if (!isDemoWorkspace) {
      return {
        hasAccess: true, // Not a demo workspace, allow access
        isDanOrRoss: false
      };
    }
    
    // For demo workspaces, STRICT validation - ONLY Dan and Ross
    return this.validateDemoAccess(userId, userEmail);
  }
  
  /**
   * Get demo workspace ID
   */
  static getDemoWorkspaceId(): string {
    return '01K1VBYX2YERMXBFJ60RC6J194';
  }
  
  /**
   * Check if workspace ID is demo workspace
   * ONLY the actual demo workspace is considered demo
   */
  static isDemoWorkspace(workspaceId: string): boolean {
    return workspaceId === this.getDemoWorkspaceId();
  }
}
