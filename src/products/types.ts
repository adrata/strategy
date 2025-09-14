// Expansion System Types

export interface ExpansionManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  integration_points: IntegrationPoint[];
  widgets: WidgetDefinition[];
  permissions: string[];
  dependencies?: string[];
}

export interface IntegrationPoint {
  product: string;
  location: string;
  type: "widget" | "action" | "menu" | "panel";
}

export interface WidgetDefinition {
  id: string;
  name: string;
  component: string;
  props?: Record<string, any>;
}

export interface ExpansionContext {
  userId: string;
  workspaceId: string;
  currentProduct: string;
  permissions: string[];
}
