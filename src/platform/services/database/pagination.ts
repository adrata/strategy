/**
 * Standardized Pagination Service for Adrata
 * Provides consistent pagination across all data APIs
 */

export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
  maxTotalRecords: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginationResult {
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalRecords?: number;
}

// 🚀 PERFORMANCE: Optimized pagination configs for different data types
export const PAGINATION_CONFIGS: Record<string, PaginationConfig> = {
  // Dashboard data - small, fast loading
  dashboard: {
    defaultPageSize: 50,
    maxPageSize: 100,
    maxTotalRecords: 100
  },
  
  // People data - medium size, optimized for performance
  people: {
    defaultPageSize: 100,
    maxPageSize: 200,
    maxTotalRecords: 50000
  },
  
  // Companies data - medium size, optimized for performance
  companies: {
    defaultPageSize: 100,
    maxPageSize: 200,
    maxTotalRecords: 50000
  },
  
  // Leads data - can be large, but paginated
  leads: {
    defaultPageSize: 200,
    maxPageSize: 500,
    maxTotalRecords: 5000
  },
  
  // Prospects data - can be large, but paginated
  prospects: {
    defaultPageSize: 200,
    maxPageSize: 500,
    maxTotalRecords: 5000
  },
  
  // Opportunities data - can be large, but paginated
  opportunities: {
    defaultPageSize: 200,
    maxPageSize: 500,
    maxTotalRecords: 5000
  },
  
  // Search results - small, fast loading
  search: {
    defaultPageSize: 50,
    maxPageSize: 100,
    maxTotalRecords: 500
  },
  
  // Default fallback
  default: {
    defaultPageSize: 100,
    maxPageSize: 200,
    maxTotalRecords: 50000
  }
};

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(
  params: PaginationParams,
  dataType: string = 'default'
): PaginationResult {
  const config = PAGINATION_CONFIGS[dataType] || PAGINATION_CONFIGS.default;
  
  // Parse page and pageSize (preferred method)
  let page = Math.max(1, params.page || 1);
  let pageSize = Math.min(
    Math.max(1, params.pageSize || config.defaultPageSize),
    config.maxPageSize
  );
  
  // Parse limit and offset (legacy method)
  if (params.limit !== undefined || params.offset !== undefined) {
    pageSize = Math.min(
      Math.max(1, params.limit || config.defaultPageSize),
      config.maxPageSize
    );
    page = Math.max(1, Math.floor((params.offset || 0) / pageSize) + 1);
  }
  
  const offset = (page - 1) * pageSize;
  
  return {
    limit: pageSize,
    offset,
    page,
    pageSize,
    hasMore: false // Will be set by the calling function
  };
}

/**
 * Apply pagination to Prisma query
 */
export function applyPagination(
  query: any,
  pagination: PaginationResult
): any {
  return {
    ...query,
    take: pagination.limit,
    skip: pagination.offset
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMetadata(
  pagination: PaginationResult,
  totalRecords: number
): PaginationResult & {
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalPages = Math.ceil(totalRecords / pagination.pageSize);
  
  return {
    ...pagination,
    totalRecords,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPrevPage: pagination.page > 1,
    hasMore: pagination.page < totalPages
  };
}

/**
 * Get optimized pagination for data type
 */
export function getOptimizedPagination(
  dataType: string,
  params: PaginationParams = {}
): PaginationResult {
  return parsePagination(params, dataType);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  params: PaginationParams,
  dataType: string = 'default'
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = PAGINATION_CONFIGS[dataType] || PAGINATION_CONFIGS.default;
  
  if (params.limit && params.limit > config.maxPageSize) {
    errors.push(`Limit cannot exceed ${config.maxPageSize} for ${dataType}`);
  }
  
  if (params.pageSize && params.pageSize > config.maxPageSize) {
    errors.push(`Page size cannot exceed ${config.maxPageSize} for ${dataType}`);
  }
  
  if (params.page && params.page < 1) {
    errors.push('Page must be greater than 0');
  }
  
  if (params.offset && params.offset < 0) {
    errors.push('Offset cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
