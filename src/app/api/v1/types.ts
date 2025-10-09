/**
 * Type definitions for V1 API
 */

export interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database?: {
    connected: boolean;
    responseTime?: number;
  };
  services?: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
    };
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  priority?: string;
  [key: string]: any;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationParams;
  filters: FilterParams;
  timestamp: string;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
  };
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'LEAD';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CLIENT' | 'OPPORTUNITY';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  id: string;
  type: string;
  subject: string;
  description?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledAt?: string;
  completedAt?: string;
  companyId?: string;
  personId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
