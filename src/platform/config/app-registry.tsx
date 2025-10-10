/**
 * APP REGISTRY - Configuration-driven app routing
 * 
 * This file replaces switch statements in ActionPlatformMiddlePanel
 * with a data-driven approach. It maintains exact same functionality
 * while improving code maintainability.
 */

import React from 'react';

// Import app components
import { PipelineView } from '@/frontend/components/pipeline/PipelineView';
// Note: Other components imported dynamically to avoid build issues

// App configuration interface
export interface AppConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
  requiresWorkspace?: boolean;
  defaultRoute?: string;
  availableRoutes?: string[];
}

// App registry - maps app IDs to React components
export const APP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'pipeline': PipelineView,
  // Other components loaded dynamically
};

// App configurations
export const APP_CONFIGURATIONS: Record<string, AppConfig> = {
  pipeline: {
    id: 'pipeline',
    label: 'Pipeline',
    component: PipelineView,
    requiresAuth: true,
    requiresWorkspace: true,
    defaultRoute: 'leads',
    availableRoutes: ['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners', 'sellers', 'metrics', 'speedrun']
  },
  
  speedrun: {
    id: 'speedrun',
    label: 'Speedrun',
    component: null as any, // Loaded dynamically
    requiresAuth: true,
    requiresWorkspace: true,
    defaultRoute: 'sprint',
    availableRoutes: ['sprint', 'dashboard', 'analytics']
  },
  
  monaco: {
    id: 'monaco',
    label: 'Monaco',
    component: null as any, // Loaded dynamically
    requiresAuth: true,
    requiresWorkspace: true,
    defaultRoute: 'dashboard',
    availableRoutes: ['dashboard', 'pipeline', 'analytics', 'settings']
  }
};

// Helper functions
export function getAppConfig(appId: string): AppConfig | null {
  return APP_CONFIGURATIONS[appId] || null;
}

export function getAppComponent(appId: string): React.ComponentType<any> | null {
  const config = getAppConfig(appId);
  return config?.component || null;
}

export function getAppLabel(appId: string): string {
  const config = getAppConfig(appId);
  return config?.label || appId;
}

export function getAppDefaultRoute(appId: string): string | null {
  const config = getAppConfig(appId);
  return config?.defaultRoute || null;
}

export function getAppAvailableRoutes(appId: string): string[] {
  const config = getAppConfig(appId);
  return config?.availableRoutes || [];
}

export function isAppRequiresAuth(appId: string): boolean {
  const config = getAppConfig(appId);
  return config?.requiresAuth || false;
}

export function isAppRequiresWorkspace(appId: string): boolean {
  const config = getAppConfig(appId);
  return config?.requiresWorkspace || false;
}

// Route to appropriate app component
export function renderAppComponent(appId: string, props: any = {}): React.ReactElement | null {
  const Component = getAppComponent(appId);
  
  if (!Component) {
    console.warn(`No component found for app: ${appId}`);
    return null;
  }
  
  return React.createElement(Component, props);
}

// Get all available apps
export function getAllApps(): AppConfig[] {
  return Object.values(APP_CONFIGURATIONS);
}

// Get apps that require authentication
export function getAuthenticatedApps(): AppConfig[] {
  return getAllApps().filter(app => app.requiresAuth);
}

// Get apps that require workspace
export function getWorkspaceApps(): AppConfig[] {
  return getAllApps().filter(app => app.requiresWorkspace);
}