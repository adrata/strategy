"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { RevenueOSProvider, useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { EncodeLeftPanel } from "./components/EncodeLeftPanel";
import { EncodeRightPanel } from "./components/EncodeRightPanel";
import { EncodeProject, EncodeFile } from "./types/file";

const queryClient = new QueryClient();

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

interface EncodeContextType {
  // Project management
  currentProject: EncodeProject | null;
  setCurrentProject: (project: EncodeProject | null) => void;
  projects: EncodeProject[];
  setProjects: (projects: EncodeProject[]) => void;
  
  // File management
  files: EncodeFile[];
  setFiles: (files: EncodeFile[]) => void;
  selectedFile: EncodeFile | null;
  setSelectedFile: (file: EncodeFile | null) => void;
  openFiles: EncodeFile[];
  setOpenFiles: (files: EncodeFile[]) => void;
  activeFile: EncodeFile | null;
  setActiveFile: (file: EncodeFile | null) => void;
  
  // Editor state
  editorContent: string;
  setEditorContent: (content: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  language: string;
  setLanguage: (language: string) => void;
  
  // UI state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'tree' | 'list';
  setViewMode: (mode: 'tree' | 'list') => void;
  showTerminal: boolean;
  setShowTerminal: (show: boolean) => void;
  
  // File operations
  createFile: (path: string, name: string, content?: string) => Promise<void>;
  createFolder: (path: string, name: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  saveFile: (fileId: string, content: string) => Promise<void>;
  openFile: (file: EncodeFile) => void;
  closeFile: (fileId: string) => void;
}

const EncodeContext = createContext<EncodeContextType | undefined>(undefined);

export const useEncode = () => {
  const context = useContext(EncodeContext);
  if (!context) {
    throw new Error('useEncode must be used within EncodeProvider');
  }
  return context;
};

interface EncodeLayoutProps {
  children: React.ReactNode;
}

export default function EncodeLayout({ children }: EncodeLayoutProps) {
  const [currentProject, setCurrentProject] = useState<EncodeProject | null>(null);
  const [projects, setProjects] = useState<EncodeProject[]>([]);
  const [files, setFiles] = useState<EncodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<EncodeFile | null>(null);
  const [openFiles, setOpenFiles] = useState<EncodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<EncodeFile | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('javascript');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [showTerminal, setShowTerminal] = useState<boolean>(false);

  // File operations
  const createFile = useCallback(async (path: string, name: string, content: string = '') => {
    try {
      const response = await fetch('/api/encode/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id,
          path,
          name,
          content,
          isDirectory: false
        })
      });
      
      if (response.ok) {
        const newFile = await response.json();
        setFiles(prev => [...prev, newFile]);
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  }, [currentProject]);

  const createFolder = useCallback(async (path: string, name: string) => {
    try {
      const response = await fetch('/api/encode/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id,
          path,
          name,
          content: '',
          isDirectory: true
        })
      });
      
      if (response.ok) {
        const newFolder = await response.json();
        setFiles(prev => [...prev, newFolder]);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [currentProject]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/encode/files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        setOpenFiles(prev => prev.filter(f => f.id !== fileId));
        if (activeFile?.id === fileId) {
          setActiveFile(null);
          setEditorContent('');
        }
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }, [activeFile]);

  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      const response = await fetch(`/api/encode/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      if (response.ok) {
        const updatedFile = await response.json();
        setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
        setOpenFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
        if (activeFile?.id === fileId) {
          setActiveFile(updatedFile);
        }
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  }, [activeFile]);

  const saveFile = useCallback(async (fileId: string, content: string) => {
    try {
      const response = await fetch(`/api/encode/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        const updatedFile = await response.json();
        setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
        setOpenFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, []);

  const openFile = useCallback((file: EncodeFile) => {
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file]);
    }
    setActiveFile(file);
    setEditorContent(file.content);
    setLanguage(file.language);
    setIsDirty(false);
  }, [openFiles]);

  const closeFile = useCallback((fileId: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      const remainingFiles = openFiles.filter(f => f.id !== fileId);
      if (remainingFiles.length > 0) {
        const newActiveFile = remainingFiles[remainingFiles.length - 1];
        setActiveFile(newActiveFile);
        setEditorContent(newActiveFile.content);
        setLanguage(newActiveFile.language);
      } else {
        setActiveFile(null);
        setEditorContent('');
        setLanguage('javascript');
      }
      setIsDirty(false);
    }
  }, [activeFile, openFiles]);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/encode/projects');
        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData);
          if (projectsData.length > 0 && !currentProject) {
            setCurrentProject(projectsData[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, [currentProject]);

  // Load files when project changes
  useEffect(() => {
    const loadFiles = async () => {
      if (!currentProject) return;
      
      try {
        const response = await fetch(`/api/encode/projects/${currentProject.id}`);
        if (response.ok) {
          const projectData = await response.json();
          setFiles(projectData.files || []);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    };

    loadFiles();
  }, [currentProject]);

  return (
    <QueryClientProvider client={queryClient}>
      <EncodeContext.Provider value={{ 
        currentProject, 
        setCurrentProject,
        projects,
        setProjects,
        files,
        setFiles,
        selectedFile,
        setSelectedFile,
        openFiles,
        setOpenFiles,
        activeFile,
        setActiveFile,
        editorContent,
        setEditorContent,
        isDirty,
        setIsDirty,
        language,
        setLanguage,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        showTerminal,
        setShowTerminal,
        createFile,
        createFolder,
        deleteFile,
        renameFile,
        saveFile,
        openFile,
        closeFile,
      }}>
        <RevenueOSProvider>
          <ZoomProvider>
            <ProfilePopupProvider>
              <EncodeLayoutContent>
                {children}
              </EncodeLayoutContent>
            </ProfilePopupProvider>
          </ZoomProvider>
        </RevenueOSProvider>
      </EncodeContext.Provider>
    </QueryClientProvider>
  );
}

// Layout content component that can use context hooks
function EncodeLayoutContent({ children }: { children: React.ReactNode }) {
  const { ui } = useRevenueOS();

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<EncodeLeftPanel />}
      middlePanel={children}
      rightPanel={<EncodeRightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
