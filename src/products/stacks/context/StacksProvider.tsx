"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useStacksData } from '../hooks/useStacksData';

interface StacksContextType {
  // State
  activeSubSection: string;
  selectedItem: any;
  projects: any[];
  epics: any[];
  stories: any[];
  tasks: any[];
  bugs: any[];
  loading: boolean;
  isLoading: boolean;
  refreshTrigger: number; // Counter that increments to trigger refreshes

  // Actions
  setActiveSubSection: (section: string) => void;
  onSubSectionChange: (section: string) => void;
  onItemClick: (item: any) => void;
  createProject: (data: any) => Promise<void>;
  createEpic: (data: any) => Promise<void>;
  createStory: (data: any) => Promise<void>;
  createTask: (data: any) => Promise<void>;
  updateItem: (type: string, id: string, data: any) => Promise<void>;
  deleteItem: (type: string, id: string) => Promise<void>;
  triggerRefresh: () => void; // Manually trigger refresh across all components
}

const StacksContext = createContext<StacksContextType | undefined>(undefined);

interface StacksProviderProps {
  children: ReactNode;
}

export function StacksProvider({ children }: StacksProviderProps) {
  const { user } = useUnifiedAuth();
  const [activeSubSection, setActiveSubSection] = useState('stacks');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    projects,
    epics,
    stories,
    tasks,
    bugs,
    isLoading,
    fetchProjects,
    fetchEpics,
    fetchStories,
    fetchTasks,
    createProject: apiCreateProject,
    createEpic: apiCreateEpic,
    createStory: apiCreateStory,
    createTask: apiCreateTask,
    updateProject,
    updateEpic,
    updateStory,
    updateTask,
    deleteProject,
    deleteEpic,
    deleteStory,
    deleteTask,
  } = useStacksData();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.activeWorkspaceId) return;
      
      setLoading(true);
      try {
        // Use Promise.allSettled to continue loading even if some endpoints fail
        const results = await Promise.allSettled([
          fetchProjects(),
          fetchEpics(),
          fetchStories(),
          fetchTasks(),
        ]);

        // Log any failures but don't block the UI
        results.forEach((result, index) => {
          const endpointNames = ['projects', 'epics', 'stories', 'tasks'];
          if (result.status === 'rejected') {
            console.warn(`⚠️ [STACKS PROVIDER] Failed to load ${endpointNames[index]}:`, result.reason);
          }
        });
      } catch (error) {
        console.warn('⚠️ [STACKS PROVIDER] Error loading Stacks data:', error);
        // Don't throw - allow the provider to continue with empty data
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.activeWorkspaceId, fetchProjects, fetchEpics, fetchStories, fetchTasks]);

  // Action handlers
  const onSubSectionChange = (section: string) => {
    setActiveSubSection(section);
    setSelectedItem(null); // Clear selection when changing sections
  };

  const onItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const createProject = async (data: any) => {
    try {
      await apiCreateProject(data);
      await fetchProjects(); // Refresh list
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  const createEpic = async (data: any) => {
    try {
      await apiCreateEpic(data);
      await fetchEpics(); // Refresh list
    } catch (error) {
      console.error('Failed to create epic:', error);
      throw error;
    }
  };

  const createStory = async (data: any) => {
    try {
      await apiCreateStory(data);
      await fetchStories(); // Refresh list
      setRefreshTrigger(prev => prev + 1); // Trigger refresh across components
    } catch (error) {
      console.error('Failed to create story:', error);
      throw error;
    }
  };

  const createTask = async (data: any) => {
    try {
      await apiCreateTask(data);
      await fetchTasks(); // Refresh list
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const updateItem = async (type: string, id: string, data: any) => {
    try {
      switch (type) {
        case 'project':
          await updateProject(id, data);
          await fetchProjects();
          break;
        case 'epic':
          await updateEpic(id, data);
          await fetchEpics();
          break;
        case 'story':
          await updateStory(id, data);
          await fetchStories();
          break;
        case 'task':
          await updateTask(id, data);
          await fetchTasks();
          break;
        default:
          throw new Error(`Unknown item type: ${type}`);
      }
      
      // Update selected item if it's the one being updated
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, ...data });
      }
      
      setRefreshTrigger(prev => prev + 1); // Trigger refresh across components
    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
      throw error;
    }
  };

  const deleteItem = async (type: string, id: string) => {
    try {
      switch (type) {
        case 'project':
          await deleteProject(id);
          await fetchProjects();
          break;
        case 'epic':
          await deleteEpic(id);
          await fetchEpics();
          break;
        case 'story':
          await deleteStory(id);
          await fetchStories();
          break;
        case 'task':
          await deleteTask(id);
          await fetchTasks();
          break;
        default:
          throw new Error(`Unknown item type: ${type}`);
      }
      
      // Clear selection if the deleted item was selected
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
      
      setRefreshTrigger(prev => prev + 1); // Trigger refresh across components
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      throw error;
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const contextValue: StacksContextType = {
    // State
    activeSubSection,
    selectedItem,
    projects,
    epics,
    stories,
    tasks,
    bugs,
    loading,
    isLoading,
    refreshTrigger,

    // Actions
    setActiveSubSection,
    onSubSectionChange,
    onItemClick,
    createProject,
    createEpic,
    createStory,
    createTask,
    updateItem,
    deleteItem,
    triggerRefresh,
  };

  return (
    <StacksContext.Provider value={contextValue}>
      {children}
    </StacksContext.Provider>
  );
}

export function useStacks() {
  const context = useContext(StacksContext);
  if (context === undefined) {
    throw new Error('useStacks must be used within a StacksProvider');
  }
  return context;
}
