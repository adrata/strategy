import { EncodeProject, EncodeFile, CreateFileRequest, UpdateFileRequest, FileTreeNode, ProjectStats } from '../types/file';
import { invoke } from '@tauri-apps/api/core';

export class FileSystemService {
  private static instance: FileSystemService;
  private isDesktop: boolean = false;
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  constructor() {
    // Check if we're running in Tauri desktop environment
    this.isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;
  }

  // Project operations
  async createProject(name: string, description?: string, workspaceId?: string, userId?: string): Promise<EncodeProject> {
    const response = await fetch('/api/encode/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, workspaceId, userId })
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  }

  async getProjects(): Promise<EncodeProject[]> {
    const response = await fetch('/api/encode/projects');
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  }

  async getProject(projectId: string): Promise<EncodeProject> {
    const response = await fetch(`/api/encode/projects/${projectId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  }

  async updateProject(projectId: string, updates: Partial<EncodeProject>): Promise<EncodeProject> {
    const response = await fetch(`/api/encode/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  }

  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`/api/encode/projects/${projectId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }

  // File operations
  async createFile(request: CreateFileRequest): Promise<EncodeFile> {
    if (this.isDesktop && request.path.startsWith('/real/')) {
      // Handle real filesystem operations for desktop
      const realPath = request.path.replace('/real/', '');
      await invoke('encode_write_file', { 
        path: realPath, 
        content: request.content || '' 
      });
      
      // Return a mock file object for real filesystem files
      return {
        id: `real_${Date.now()}`,
        projectId: request.projectId,
        path: request.path,
        name: request.name,
        content: request.content || '',
        language: this.detectLanguage(request.name),
        isDirectory: request.isDirectory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Handle virtual filesystem operations (web/database)
    const response = await fetch('/api/encode/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to create file');
    }

    return response.json();
  }

  async getFile(fileId: string): Promise<EncodeFile> {
    const response = await fetch(`/api/encode/files/${fileId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }

    return response.json();
  }

  async updateFile(fileId: string, updates: UpdateFileRequest): Promise<EncodeFile> {
    if (this.isDesktop && fileId.startsWith('real_')) {
      // Handle real filesystem operations for desktop
      const realPath = updates.path?.replace('/real/', '') || '';
      if (updates.content !== undefined) {
        await invoke('encode_write_file', { 
          path: realPath, 
          content: updates.content 
        });
      }
      
      // Return updated file info
      const fileInfo = await invoke('encode_get_file_info', { path: realPath });
      return {
        id: fileId,
        projectId: 'real',
        path: updates.path || realPath,
        name: updates.name || (fileInfo as any).name,
        content: updates.content || '',
        language: this.detectLanguage(updates.name || (fileInfo as any).name),
        isDirectory: (fileInfo as any).is_directory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Handle virtual filesystem operations (web/database)
    const response = await fetch(`/api/encode/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update file');
    }

    return response.json();
  }

  async deleteFile(fileId: string): Promise<void> {
    if (this.isDesktop && fileId.startsWith('real_')) {
      // Handle real filesystem operations for desktop
      const realPath = fileId.replace('real_', '');
      await invoke('encode_delete_path', { path: realPath });
      return;
    }

    // Handle virtual filesystem operations (web/database)
    const response = await fetch(`/api/encode/files/${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  async getProjectFiles(projectId: string): Promise<EncodeFile[]> {
    const response = await fetch(`/api/encode/projects/${projectId}/files`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch project files');
    }

    return response.json();
  }

  // File tree operations
  buildFileTree(files: EncodeFile[]): FileTreeNode[] {
    const fileMap = new Map<string, FileTreeNode>();
    const rootNodes: FileTreeNode[] = [];

    // Create nodes for all files
    files.forEach(file => {
      const node: FileTreeNode = {
        id: file.id,
        name: file.name,
        path: file.path,
        isDirectory: file.isDirectory,
        children: [],
        file
      };
      fileMap.set(file.id, node);
    });

    // Build hierarchy
    files.forEach(file => {
      const node = fileMap.get(file.id)!;
      
      if (file.parentId) {
        const parent = fileMap.get(file.parentId);
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children
    const sortNodes = (nodes: FileTreeNode[]) => {
      nodes.sort((a, b) => {
        // Directories first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });
      
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(rootNodes);
    return rootNodes;
  }

  // Utility functions
  detectLanguage(fileName: string, content?: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'txt': 'plaintext',
      'log': 'plaintext'
    };

    if (extension && languageMap[extension]) {
      return languageMap[extension];
    }

    // Try to detect from content
    if (content) {
      if (content.includes('function') && content.includes('=>')) {
        return 'javascript';
      }
      if (content.includes('def ') || content.includes('import ')) {
        return 'python';
      }
      if (content.includes('public class') || content.includes('import java')) {
        return 'java';
      }
      if (content.includes('<?php')) {
        return 'php';
      }
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        return 'html';
      }
      if (content.includes('{') && content.includes('}') && content.includes('"')) {
        return 'json';
      }
    }

    return 'plaintext';
  }

  calculateProjectStats(files: EncodeFile[]): ProjectStats {
    const totalFiles = files.filter(f => !f.isDirectory).length;
    const totalSize = files.reduce((size, file) => size + file.content.length, 0);
    const lastModified = files.reduce((latest, file) => 
      file.updatedAt > latest ? file.updatedAt : latest, 
      new Date(0)
    );
    
    const fileTypeBreakdown = files
      .filter(f => !f.isDirectory)
      .reduce((breakdown, file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        breakdown[ext] = (breakdown[ext] || 0) + 1;
        return breakdown;
      }, {} as Record<string, number>);

    return {
      totalFiles,
      totalSize,
      lastModified,
      fileTypeBreakdown
    };
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Search functionality
  searchFiles(files: EncodeFile[], query: string): EncodeFile[] {
    if (!query.trim()) return files;

    const lowercaseQuery = query.toLowerCase();
    
    return files.filter(file => 
      file.name.toLowerCase().includes(lowercaseQuery) ||
      file.path.toLowerCase().includes(lowercaseQuery) ||
      (!file.isDirectory && file.content.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Path utilities
  joinPath(...parts: string[]): string {
    return parts
      .filter(part => part && part !== '.')
      .join('/')
      .replace(/\/+/g, '/');
  }

  getParentPath(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }

  getFileName(path: string): string {
    return path.split('/').pop() || '';
  }

  getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()! : '';
  }

  // Real filesystem operations (Desktop only)
  async readRealDirectory(path: string): Promise<EncodeFile[]> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      const files = await invoke('encode_read_directory', { path });
      return (files as any[]).map(file => ({
        id: `real_${file.path}`,
        projectId: 'real',
        path: `/real${file.path}`,
        name: file.name,
        content: '',
        language: file.is_directory ? 'folder' : this.detectLanguage(file.name),
        isDirectory: file.is_directory,
        createdAt: new Date(),
        updatedAt: new Date(file.modified),
      }));
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  }

  async readRealFile(path: string): Promise<string> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      return await invoke('encode_read_file', { path });
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  async writeRealFile(path: string, content: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      await invoke('encode_write_file', { path, content });
    } catch (error) {
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  async createRealDirectory(path: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      await invoke('encode_create_directory', { path });
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  async deleteRealPath(path: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      await invoke('encode_delete_path', { path });
    } catch (error) {
      throw new Error(`Failed to delete path: ${error}`);
    }
  }

  async renameRealPath(oldPath: string, newPath: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      await invoke('encode_rename_path', { oldPath, newPath });
    } catch (error) {
      throw new Error(`Failed to rename path: ${error}`);
    }
  }

  async copyRealPath(sourcePath: string, destPath: string): Promise<void> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      await invoke('encode_copy_path', { sourcePath, destPath });
    } catch (error) {
      throw new Error(`Failed to copy path: ${error}`);
    }
  }

  async getRealFileInfo(path: string): Promise<any> {
    if (!this.isDesktop) {
      throw new Error('Real filesystem access only available in desktop mode');
    }

    try {
      return await invoke('encode_get_file_info', { path });
    } catch (error) {
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  async checkRealPathExists(path: string): Promise<boolean> {
    if (!this.isDesktop) {
      return false;
    }

    try {
      return await invoke('encode_path_exists', { path });
    } catch (error) {
      return false;
    }
  }

  // Directory utilities
  async getHomeDirectory(): Promise<string> {
    if (!this.isDesktop) {
      return '/home';
    }

    try {
      return await invoke('encode_get_home_dir');
    } catch (error) {
      return '/home';
    }
  }

  async getDocumentsDirectory(): Promise<string> {
    if (!this.isDesktop) {
      return '/documents';
    }

    try {
      return await invoke('encode_get_documents_dir');
    } catch (error) {
      return '/documents';
    }
  }

  async getDesktopDirectory(): Promise<string> {
    if (!this.isDesktop) {
      return '/desktop';
    }

    try {
      return await invoke('encode_get_desktop_dir');
    } catch (error) {
      return '/desktop';
    }
  }

  async getDownloadsDirectory(): Promise<string> {
    if (!this.isDesktop) {
      return '/downloads';
    }

    try {
      return await invoke('encode_get_downloads_dir');
    } catch (error) {
      return '/downloads';
    }
  }

  async getCurrentDirectory(): Promise<string> {
    if (!this.isDesktop) {
      return '/';
    }

    try {
      return await invoke('encode_get_current_dir');
    } catch (error) {
      return '/';
    }
  }

  async setCurrentDirectory(path: string): Promise<void> {
    if (!this.isDesktop) {
      return;
    }

    try {
      await invoke('encode_set_current_dir', { path });
    } catch (error) {
      throw new Error(`Failed to set current directory: ${error}`);
    }
  }

  // Check if running in desktop mode
  isDesktopMode(): boolean {
    return this.isDesktop;
  }
}
