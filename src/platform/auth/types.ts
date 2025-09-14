/**
 * Authentication Types
 * Core type definitions for the unified authentication system
 */

// Core Types
export interface Workspace {
  id: string;
  name: string;
  role: string;
}

export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  avatar?: string;
  deviceId?: string;
  lastSeen?: string;
}

export interface UnifiedSession {
  user: UnifiedUser;
  accessToken: string | undefined;
  refreshToken?: string;
  expires: string;
  lastActivity: string;
  platform: "web" | "desktop" | "mobile";
  deviceId: string;
  syncEnabled: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  session?: UnifiedSession;
  platformRoute?: {
    path: string;
    component: string;
    title: string;
    description: string;
  };
  redirectTo?: string;
}

export interface AuthConfig {
  sessionDuration: number;
  sessionKey: string;
  version: string;
}

export interface PlatformConfig {
  platform: "web" | "desktop" | "mobile";
  isDesktop: boolean;
  isMobile: boolean;
  isWeb: boolean;
}

export interface TauriEnvironment {
  hasTauriGlobal: boolean;
  hasTauriMetadata: boolean;
  hasTauriInternals: boolean;
  hasTauriInvoke: boolean;
  protocol: string;
  hostname: string;
  href: string;
  userAgent: string;
}
