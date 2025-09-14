// Action OS (AOS) Core Types and Interfaces
// This module provides the core types and interfaces for the Action OS platform

export interface FilterOptions {
  [key: string]: any;
}

export interface Lead extends ActionPlatformResource {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  score: number;
  tags: string[];
  notes: string;
  assignedTo?: string;
  lastActivity?: string;
}

export interface Opportunity extends ActionPlatformResource {
  name: string;
  accountId: string;
  leadId?: string;
  contactId: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;
  description: string;
  ownerId: string;
  competitorIds: string[];
  products: string[];
  nextStep: string;
  lastActivity?: string;
}

export interface Contact extends ActionPlatformResource {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  accountId: string;
  leadSource?: string;
  status: 'active' | 'inactive' | 'bounced';
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  tags: string[];
  notes: string;
  lastActivity?: string;
}

export interface Account extends ActionPlatformResource {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: number;
  employees?: number;
  type: 'prospect' | 'customer' | 'partner' | 'competitor';
  status: 'active' | 'inactive' | 'churned';
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  website?: string;
  description?: string;
  ownerId: string;
  parentAccountId?: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface Partnership extends ActionPlatformResource {
  name: string;
  partnerAccountId: string;
  type: 'technology' | 'channel' | 'reseller' | 'referral';
  status: 'active' | 'inactive' | 'pending' | 'terminated';
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  startDate: string;
  endDate?: string;
  contactId: string;
  revenue: number;
  commissionRate: number;
  terms: string;
  tags: string[];
  notes: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    pageSize: number;
  };
}

export interface ActionPlatformConfig {
  apiUrl: string;
  apiBaseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTimeout: number;
  workspaceId: string;
  userId: string;
  enableRealTime: boolean;
  enableOfflineMode: boolean;
}

export interface ActionPlatformOptions {
  signal?: AbortSignal;
  timeout?: number;
}

export interface ActionPlatformError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ActionPlatformRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ActionPlatformResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ActionPlatformPaginationParams {
  page?: number;
  limit?: number;
  sort?: SortOptions;
  filter?: FilterOptions;
}

export interface ActionPlatformSearchParams {
  query?: string;
  fields?: string[];
  pagination?: ActionPlatformPaginationParams;
}

export interface ActionPlatformResource {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface ActionPlatformListResponse<T extends ActionPlatformResource> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ActionPlatformBatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  data: T[];
}

export interface ActionPlatformBatchResponse<T> {
  success: T[];
  errors: Array<{
    item: T;
    error: string;
  }>;
}

export interface ActionPlatformMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: string;
}

export interface ActionPlatformHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastHealthCheck: string;
  metrics: ActionPlatformMetrics;
}

export interface ActionPlatformEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  source: string;
}

export interface ActionPlatformSubscription {
  id: string;
  eventType: string;
  callback: (event: ActionPlatformEvent) => void;
  filters?: FilterOptions;
}

export interface ActionPlatformWebhook {
  id: string;
  url: string;
  eventTypes: string[];
  secret: string;
  active: boolean;
  lastTriggered?: string;
}

export interface ActionPlatformAuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  timestamp: string;
  details: any;
}

export interface ActionPlatformRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface ActionPlatformCache {
  key: string;
  value: any;
  ttl: number;
  createdAt: string;
  expiresAt: string;
}

export interface ActionPlatformSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  metadata: Record<string, any>;
}

export interface ActionPlatformUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface ActionPlatformWorkspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: ActionPlatformUser[];
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ActionPlatformIntegration {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  active: boolean;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionPlatformNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface ActionPlatformBackup {
  id: string;
  workspaceId: string;
  type: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

// Default configuration
export const defaultActionPlatformConfig: ActionPlatformConfig = {
  apiUrl: process['env']['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api',
  apiBaseUrl: process['env']['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheTimeout: 300000, // 5 minutes
  workspaceId: process['env']['NEXT_PUBLIC_WORKSPACE_ID'] || 'default-workspace',
  userId: process['env']['NEXT_PUBLIC_USER_ID'] || 'default-user',
  enableRealTime: process['env']['NODE_ENV'] === 'production',
  enableOfflineMode: true,
};

// Utility types
export type ActionPlatformEntity = ActionPlatformResource & {
  type: string;
  status: string;
};

export type ActionPlatformQuery<T = any> = {
  select?: (keyof T)[];
  where?: FilterOptions;
  orderBy?: SortOptions;
  take?: number;
  skip?: number;
  include?: Record<string, boolean>;
};

export type ActionPlatformMutation<T = any> = {
  create?: Partial<T>;
  update?: Partial<T>;
  delete?: string | string[];
  upsert?: Partial<T>;
};

export type ActionPlatformResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
};

export type ActionPlatformCallback<T = any> = (result: ActionPlatformResult<T>) => void;

export type ActionPlatformMiddleware = (
  request: ActionPlatformRequest,
  next: () => Promise<ActionPlatformResponse>
) => Promise<ActionPlatformResponse>;

export type ActionPlatformPlugin = {
  name: string;
  version: string;
  install: (config: ActionPlatformConfig) => void;
  uninstall: () => void;
};

export type ActionPlatformHook<T = any> = {
  before?: (context: T) => Promise<T>;
  after?: (context: T, result: any) => Promise<void>;
  error?: (context: T, error: any) => Promise<void>;
};

export type ActionPlatformValidator<T = any> = {
  validate: (data: T) => boolean;
  errors: string[];
};

export type ActionPlatformTransformer<T = any, U = any> = {
  transform: (input: T) => U;
  reverse?: (output: U) => T;
};

export type ActionPlatformSerializer<T = any> = {
  serialize: (data: T) => string;
  deserialize: (data: string) => T;
};

export type ActionPlatformLogger = {
  debug: (message: string, context?: any) => void;
  info: (message: string, context?: any) => void;
  warn: (message: string, context?: any) => void;
  error: (message: string, context?: any) => void;
};

export type ActionPlatformProvider = {
  name: string;
  initialize: (config: ActionPlatformConfig) => Promise<void>;
  execute: (operation: string, params: any) => Promise<any>;
  cleanup: () => Promise<void>;
};

export type ActionPlatformContext = {
  user?: ActionPlatformUser;
  workspace?: ActionPlatformWorkspace;
  session?: ActionPlatformSession;
  metadata?: Record<string, any>;
};

export type ActionPlatformOperation = {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}; 