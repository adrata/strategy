export interface WorkshopFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
  
  // Ownership & Workspace
  ownerId: string;
  workspaceId: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (populated when fetched)
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  parent?: {
    id: string;
    name: string;
  };
  children?: WorkshopFolder[];
  documents?: any[]; // WorkshopDocument[]
  
  // Counts
  _count?: {
    documents: number;
    children: number;
  };
}

// Folder creation/update types
export interface CreateFolderData {
  name: string;
  description?: string;
  parentId?: string;
  workspaceId: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

// Folder tree structure for navigation
export interface FolderTreeNode {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  children: FolderTreeNode[];
  documentCount: number;
  isExpanded?: boolean;
  isSelected?: boolean;
}

// Folder navigation types
export interface FolderNavigationItem {
  id: string;
  name: string;
  type: 'folder' | 'root';
  parentId?: string;
  children?: FolderNavigationItem[];
  documentCount?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
}
