/**
 * AI Actions Service Types
 * Separated to prevent circular dependencies
 */

export interface ActionRequest {
  type: string;
  parameters: any;
  workspaceId: string;
  userId: string;
  context?: any;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
