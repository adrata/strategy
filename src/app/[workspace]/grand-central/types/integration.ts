export interface IntegrationNode {
  id: string;
  type: 'trigger' | 'action' | 'transform' | 'condition';
  provider: string; // e.g., 'salesforce', 'hubspot', 'slack'
  operation: string; // e.g., 'create_contact', 'send_message'
  title: string;
  description: string;
  position: { x: number; y: number };
  isActive: boolean;
  config?: Record<string, any>; // Node-specific configuration
  inputs?: string[]; // Input field names
  outputs?: string[]; // Output field names
}

export interface IntegrationConnection {
  id: string;
  from: string; // Node ID
  to: string; // Node ID
  fromSide: 'right' | 'left' | 'top' | 'bottom';
  toSide: 'right' | 'left' | 'top' | 'bottom';
  dataMapping?: Record<string, string>; // Map output fields to input fields
}

export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  authType: 'oauth2' | 'api_key' | 'basic';
  isConnected: boolean;
  isAvailable?: boolean;
  connectionId?: string;
  operations: IntegrationOperation[];
}

export interface IntegrationOperation {
  id: string;
  name: string;
  description: string;
  type: 'trigger' | 'action';
  inputs: FieldSchema[];
  outputs: FieldSchema[];
}

export interface FieldSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  required: boolean;
  description?: string;
  default?: any;
}

export interface IntegrationCategory {
  category: string;
  color: string;
  providers: IntegrationProvider[];
}

export type ActiveTool = 'cursor' | 'hand';

