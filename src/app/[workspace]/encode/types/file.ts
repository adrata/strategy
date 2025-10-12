export interface EncodeProject {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  userId: string;
  files: EncodeFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EncodeFile {
  id: string;
  projectId: string;
  path: string; // Relative path within project
  name: string;
  content: string;
  language: string;
  isDirectory: boolean;
  parentId?: string;
  parent?: EncodeFile;
  children?: EncodeFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileTreeNode[];
  parent?: FileTreeNode;
  file?: EncodeFile;
}

export interface ProjectStats {
  totalFiles: number;
  totalSize: number;
  lastModified: Date;
  fileTypeBreakdown: Record<string, number>;
}

export interface CreateFileRequest {
  projectId: string;
  path: string;
  name: string;
  content?: string;
  isDirectory: boolean;
}

export interface UpdateFileRequest {
  name?: string;
  content?: string;
  path?: string;
}

export interface FileSystemOperation {
  type: 'create' | 'update' | 'delete' | 'move' | 'copy';
  fileId: string;
  data?: any;
}
