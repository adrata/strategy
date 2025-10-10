import React from 'react';

/**
 * App Registry Configuration
 * 
 * Replaces large switch statements in ActionPlatformMiddlePanel with a configuration-driven approach.
 * Each app has its own configuration with component mappings.
 */

export interface AppConfig {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  description?: string;
  icon?: string;
  category?: string;
}

export interface AppRegistry {
  [appId: string]: AppConfig;
}

// Import all app components
import { PipelineMiddlePanel } from '@/products/pipeline/components/MiddlePanel';
import { MonacoMiddlePanel } from '@/products/monaco/components/MonacoMiddlePanel';
import { SpeedrunMiddlePanel } from '@/products/speedrun/components/SpeedrunMiddlePanel';

/**
 * App Registry
 * 
 * Centralized configuration for all applications in the Action Platform.
 * This replaces the large switch statement in ActionPlatformMiddlePanel.
 */
export const APP_REGISTRY: AppRegistry = {
  'pipeline': {
    id: 'pipeline',
    name: 'Pipeline',
    component: PipelineMiddlePanel,
    description: 'Sales pipeline management and CRM',
    icon: '📊',
    category: 'sales'
  },
  'standalone-pipeline': {
    id: 'standalone-pipeline',
    name: 'Pipeline',
    component: PipelineMiddlePanel,
    description: 'Standalone pipeline application',
    icon: '📊',
    category: 'sales'
  },
  'monaco': {
    id: 'monaco',
    name: 'Monaco',
    component: MonacoMiddlePanel,
    description: 'AI-powered data enrichment and intelligence',
    icon: '🤖',
    category: 'ai'
  },
  'Speedrun': {
    id: 'Speedrun',
    name: 'Speedrun',
    component: SpeedrunMiddlePanel,
    description: 'Rapid sales execution and sprint management',
    icon: '⚡',
    category: 'sales'
  },
  'rtp': {
    id: 'rtp',
    name: 'RTP',
    component: SpeedrunMiddlePanel,
    description: 'Real-time pipeline management',
    icon: '⚡',
    category: 'sales'
  },
  'speedrun': {
    id: 'speedrun',
    name: 'Speedrun',
    component: SpeedrunMiddlePanel,
    description: 'Speedrun application',
    icon: '⚡',
    category: 'sales'
  }
};

/**
 * Get app configuration by ID
 */
export function getAppConfig(appId: string): AppConfig | null {
  return APP_REGISTRY[appId] || null;
}

/**
 * Get app component by ID
 */
export function getAppComponent(appId: string): React.ComponentType<any> | null {
  const config = getAppConfig(appId);
  return config?.component || null;
}

/**
 * Get all apps by category
 */
export function getAppsByCategory(category: string): AppConfig[] {
  return Object.values(APP_REGISTRY).filter(app => app.category === category);
}

/**
 * Get all available apps
 */
export function getAllApps(): AppConfig[] {
  return Object.values(APP_REGISTRY);
}

/**
 * Check if an app exists
 */
export function hasApp(appId: string): boolean {
  return appId in APP_REGISTRY;
}

/**
 * Get default app (fallback)
 */
export function getDefaultApp(): AppConfig {
  return APP_REGISTRY['pipeline'] || Object.values(APP_REGISTRY)[0];
}
