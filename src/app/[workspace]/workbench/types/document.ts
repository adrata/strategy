export interface WorkbenchDocument {
  id: string;
  title: string;
  description?: string;
  content?: any;
  fileUrl?: string;
  fileType: string;
  fileSize?: number;
  documentType: 'paper' | 'pitch' | 'grid' | 'code' | 'matrix';
  status: 'draft' | 'published' | 'archived' | 'deleted';
  version: string;
  
  // Security & Classification
  isEncrypted: boolean;
  classification: string;
  requiresAuth: boolean;
  
  // Organization
  folderId?: string;
  tags: string[];
  isStarred: boolean;
  isTemplate: boolean;
  
  // Ownership & Workspace
  ownerId: string;
  workspaceId: string;
  companyId?: string;
  
  // Analytics
  viewCount: number;
  downloadCount: number;
  lastAccessedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  
  // Relations (populated when fetched)
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
  shares?: WorkbenchShare[];
  versions?: WorkbenchVersion[];
  comments?: WorkbenchComment[];
  activities?: WorkbenchActivity[];
  
  // Counts
  _count?: {
    shares: number;
    versions: number;
    comments: number;
    activities: number;
  };
}

export interface WorkbenchShare {
  id: string;
  documentId: string;
  shareType: 'internal' | 'external' | 'public';
  permission: 'view' | 'comment' | 'edit' | 'admin';
  
  // Share Link Configuration
  shareToken: string;
  shareUrl?: string;
  password?: string;
  expiresAt?: Date;
  maxViews?: number;
  viewCount: number;
  
  // Access Control
  allowedEmails: string[];
  allowedDomains: string[];
  requireAuth: boolean;
  
  // Settings
  allowDownload: boolean;
  allowComments: boolean;
  watermark: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  
  // Relations
  document?: {
    id: string;
    title: string;
  };
}

export interface WorkbenchVersion {
  id: string;
  documentId: string;
  version: string;
  parentVersionId?: string;
  changelog?: string;
  
  // Content
  content?: any;
  fileUrl?: string;
  fileSize?: number;
  
  // Metadata
  createdById: string;
  isAutoSave: boolean;
  
  // Timestamps
  createdAt: Date;
  
  // Relations
  document?: WorkbenchDocument;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  parentVersion?: {
    id: string;
    version: string;
    createdAt: Date;
  };
  childVersions?: WorkbenchVersion[];
}

export interface WorkbenchComment {
  id: string;
  documentId: string;
  content: string;
  parentCommentId?: string;
  
  // Position (for document comments)
  position?: any;
  selection?: any;
  
  // Status
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedById?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  document?: WorkbenchDocument;
  author: {
    id: string;
    name: string;
    email: string;
  };
  authorId: string;
  parentComment?: WorkbenchComment;
  replies?: WorkbenchComment[];
  resolvedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WorkbenchActivity {
  id: string;
  documentId: string;
  activityType: string;
  description: string;
  
  // Metadata
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  createdAt: Date;
  
  // Relations
  document?: WorkbenchDocument;
  user: {
    id: string;
    name: string;
    email: string;
  };
  userId: string;
}

// Document creation/update types
export interface CreateDocumentData {
  title: string;
  description?: string;
  documentType: 'paper' | 'pitch' | 'grid' | 'code' | 'matrix';
  folderId?: string;
  workspaceId: string;
  companyId?: string;
  tags?: string[];
  isTemplate?: boolean;
  content?: any;
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  content?: any;
  folderId?: string;
  tags?: string[];
  isStarred?: boolean;
  status?: 'draft' | 'published' | 'archived';
  classification?: string;
}

// Document filter types
export interface DocumentFilters {
  documentType?: 'paper' | 'pitch' | 'grid' | 'code';
  status?: 'draft' | 'published' | 'archived';
  folderId?: string;
  ownerId?: string;
  tags?: string[];
  isStarred?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

// Document search types
export interface DocumentSearchParams {
  query?: string;
  workspaceId: string;
  filters?: DocumentFilters;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentSearchResult {
  documents: WorkbenchDocument[];
  searchMetadata: {
    query?: string;
    totalResults: number;
    searchTime: number;
    filters?: DocumentFilters;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
