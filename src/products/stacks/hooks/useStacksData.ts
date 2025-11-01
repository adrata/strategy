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

interface Epic {
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
  epicId?: string;
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
  const [epics, setEpics] = useState<Epic[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bugs, setBugs] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch functions
  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    if (!user?.activeWorkspaceId) {
      throw new Error('No workspace ID available');
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
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = await response.json();
      setProjects(data.projects || []);
      return data.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.activeWorkspaceId]);

  const fetchEpics = useCallback(async (): Promise<Epic[]> => {
    if (!user?.activeWorkspaceId) {
      throw new Error('No workspace ID available');
    }

    try {
      const response = await fetch(`/api/stacks/epics?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch epics: ${response.statusText}`);
      }

      const data = await response.json();
      setEpics(data.epics || []);
      return data.epics || [];
    } catch (error) {
      console.error('Error fetching epics:', error);
      throw error;
    }
  }, [user?.activeWorkspaceId]);

  const fetchStories = useCallback(async (): Promise<Story[]> => {
    if (!user?.activeWorkspaceId) {
      throw new Error('No workspace ID available');
    }

    try {
      const response = await fetch(`/api/v1/stacks/stories?workspaceId=${user.activeWorkspaceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.statusText}`);
      }

      const data = await response.json();
      setStories(data.stories || []);
      return data.stories || [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
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

  const createEpic = useCallback(async (data: any): Promise<void> => {
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
        throw new Error(`Failed to create epic: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating epic:', error);
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

  const updateEpic = useCallback(async (id: string, data: any): Promise<void> => {
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
        throw new Error(`Failed to update epic: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating epic:', error);
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

  const deleteEpic = useCallback(async (id: string): Promise<void> => {
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
        throw new Error(`Failed to delete epic: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting epic:', error);
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
    epics,
    stories,
    tasks,
    bugs,
    isLoading,
    fetchProjects,
    fetchEpics,
    fetchStories,
    fetchTasks,
    createProject,
    createEpic,
    createStory,
    createTask,
    updateProject,
    updateEpic,
    updateStory,
    updateTask,
    deleteProject,
    deleteEpic,
    deleteStory,
    deleteTask,
  };
}
