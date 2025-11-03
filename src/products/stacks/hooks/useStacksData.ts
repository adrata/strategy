"use client";

import { useState, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface Epoch {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface Story {
  id: string;
  epochId?: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  storyId?: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useStacksData() {
  const { user } = useUnifiedAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bugs, setBugs] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch functions
  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    if (!user?.activeWorkspaceId) {
      console.warn('⚠️ [STACKS DATA] No workspace ID available for fetching projects');
      return [];
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/stacks/projects?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.warn(`⚠️ [STACKS DATA] Failed to fetch projects: ${response.status} ${response.statusText}`, errorData);
        // Return empty array instead of throwing to allow app to continue
        return [];
      }

      const data = await response.json();
      const projects = data.projects || [];
      setProjects(projects);
      return projects;
    } catch (error) {
      console.warn('⚠️ [STACKS DATA] Error fetching projects:', error);
      // Return empty array instead of throwing to allow app to continue
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.activeWorkspaceId]);

  const fetchEpochs = useCallback(async (): Promise<Epoch[]> => {
    if (!user?.activeWorkspaceId) {
      console.warn('⚠️ [STACKS DATA] No workspace ID available for fetching epochs');
      return [];
    }

    try {
      const response = await fetch(`/api/stacks/epics?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.warn(`⚠️ [STACKS DATA] Failed to fetch epics: ${response.status} ${response.statusText}`, errorData);
        // Return empty array instead of throwing to allow app to continue
        return [];
      }

      const data = await response.json();
      // Support both epics (backwards compatibility) and epochs
      const epochsList = data.epochs || data.epics || [];
      setEpochs(epochsList);
      return epochsList;
    } catch (error) {
      console.warn('⚠️ [STACKS DATA] Error fetching epochs:', error);
      // Return empty array instead of throwing to allow app to continue
      return [];
    }
  }, [user?.activeWorkspaceId]);

  const fetchStories = useCallback(async (): Promise<Story[]> => {
    if (!user?.activeWorkspaceId) {
      console.warn('⚠️ [STACKS DATA] No workspace ID available for fetching stories');
      return [];
    }

    try {
      const response = await fetch(`/api/v1/stacks/stories?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.warn(`⚠️ [STACKS DATA] Failed to fetch stories: ${response.status} ${response.statusText}`, errorData);
        // Return empty array instead of throwing to allow app to continue
        return [];
      }

      const data = await response.json();
      const stories = data.stories || [];
      setStories(stories);
      return stories;
    } catch (error) {
      console.warn('⚠️ [STACKS DATA] Error fetching stories:', error);
      // Return empty array instead of throwing to allow app to continue
      return [];
    }
  }, [user?.activeWorkspaceId]);

  const fetchTasks = useCallback(async (): Promise<Task[]> => {
    if (!user?.activeWorkspaceId) {
      throw new Error('No workspace ID available');
    }

    try {
      const response = await fetch(`/api/stacks/tasks?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      const allTasks = data.tasks || [];
      setTasks(allTasks);
      
      // Filter bugs (tasks with type 'bug')
      const bugTasks = allTasks.filter((task: Task) => task.type === 'bug');
      setBugs(bugTasks);
      
      return allTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId]);

  // Create functions
  const createProject = useCallback(async (data: any): Promise<void> => {
    if (!user?.activeWorkspaceId || !user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/stacks/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workspaceId: user.activeWorkspaceId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId, user?.id]);

  const createEpoch = useCallback(async (data: any): Promise<void> => {
    if (!user?.activeWorkspaceId || !user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/stacks/epics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workspaceId: user.activeWorkspaceId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create epoch: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating epoch:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId, user?.id]);

  const createStory = useCallback(async (data: any): Promise<void> => {
    if (!user?.activeWorkspaceId || !user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/stacks/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workspaceId: user.activeWorkspaceId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create story: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId, user?.id]);

  const createTask = useCallback(async (data: any): Promise<void> => {
    if (!user?.activeWorkspaceId || !user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/stacks/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          workspaceId: user.activeWorkspaceId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId, user?.id]);

  // Update functions
  const updateProject = useCallback(async (id: string, data: any): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [user?.id]);

  const updateEpoch = useCallback(async (id: string, data: any): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/epics/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update epoch: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating epoch:', error);
      throw error;
    }
  }, [user?.id]);

  const updateStory = useCallback(async (id: string, data: any): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/stories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update story: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }, [user?.id]);

  const updateTask = useCallback(async (id: string, data: any): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [user?.id]);

  // Delete functions
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [user?.id]);

  const deleteEpoch = useCallback(async (id: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/epics/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete epoch: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting epoch:', error);
      throw error;
    }
  }, [user?.id]);

  const deleteStory = useCallback(async (id: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/stories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete story: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }, [user?.id]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`/api/stacks/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [user?.id]);

  return {
    projects,
    epochs,
    epics: epochs, // Backwards compatibility alias
    stories,
    tasks,
    bugs,
    isLoading,
    fetchProjects,
    fetchEpochs,
    fetchEpics: fetchEpochs, // Backwards compatibility alias
    fetchStories,
    fetchTasks,
    createProject,
    createEpoch,
    createEpic: createEpoch, // Backwards compatibility alias
    createStory,
    createTask,
    updateProject,
    updateEpoch,
    updateEpic: updateEpoch, // Backwards compatibility alias
    updateStory,
    updateTask,
    deleteProject,
    deleteEpoch,
    deleteEpic: deleteEpoch, // Backwards compatibility alias
    deleteStory,
    deleteTask,
  };
}
