/**
 * Unified Authentication System
 * Modular authentication system with multi-platform support
 */

// Types
export type {
  Workspace,
  UnifiedUser,
  UnifiedSession,
  AuthResult,
  AuthConfig,
  PlatformConfig,
  TauriEnvironment,
} from "./types";

// Platform Detection
export {
  getPlatform,
  getDeviceId,
  getPlatformConfig,
  getTauriEnvironment,
  hasTauriIndicators,
} from "./platform";

// Session Management
export {
  AUTH_CONFIG,
  storeSession,
  getSession,
  clearSession,
  isSessionValid,
  createSession,
  signOut,
} from "./session";

// Authentication Service
export { UnifiedAuthService } from "./service";

// React Hooks
export { useUnifiedAuth } from "./hooks";

// Routes
export {
  AUTH_UI_ROUTES,
  AUTH_API_ROUTES,
  REALTIME_AUTH_ROUTES,
  getAllAuthRoutes,
} from "./routes";
