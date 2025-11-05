/**
 * Stacks System TypeScript Interfaces
 * 
 * Centralized type definitions for all stacks entities and components
 */

import { STACK_STATUS, STACK_PRIORITY, TASK_TYPE } from './constants';

// Status and Priority Types
export type StackStatus = typeof STACK_STATUS[keyof typeof STACK_STATUS];
export type StackPriority = typeof STACK_PRIORITY[keyof typeof STACK_PRIORITY];
export type TaskType = typeof TASK_TYPE[keyof typeof TASK_TYPE];

// Base Entity Interfaces
export interface StacksProject {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StacksEpic {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  epochId?: string | null;
  isEpoch?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  project?: StacksProject;
  epoch?: StacksEpoch;
}

export interface StacksEpoch {
  id: string;
  title: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
}

// Story Interface
export interface StacksStory {
  id: string;
  epochId?: string | null;
  projectId: string;
  title: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  status: StackStatus;
  priority: StackPriority;
  assigneeId?: string | null;
  product?: string | null;
  section?: string | null;
  viewType?: 'detail' | 'list' | 'grid' | 'bug';
  isFlagged?: boolean;
  points?: number | null;
  rank?: number | null;
  statusChangedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  epoch?: StacksEpoch | null;
  assignee?: User | null;
  project?: StacksProject | null;
  tags?: string[];
  type?: 'story';
  originalType?: string;
}

// Task Interface
export interface StacksTask {
  id: string;
  storyId?: string | null;
  projectId: string;
  title: string;
  description?: string | null;
  status: StackStatus;
  priority: StackPriority;
  type: TaskType;
  assigneeId?: string | null;
  product?: string | null;
  section?: string | null;
  rank?: number | null;
  attachments?: any[] | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  project?: StacksProject | null;
  story?: StacksStory | null;
  assignee?: User | null;
  tags?: string[];
  originalType?: string;
}

// Component-Specific Interfaces
export interface StackCard {
  id: string;
  title: string;
  description?: string;
  priority: StackPriority;
  status: StackStatus;
  viewType?: 'detail' | 'list' | 'grid' | 'bug';
  product?: string | null;
  section?: string | null;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  epoch?: {
    id: string;
    title: string;
    description?: string;
  };
  timeInStatus?: number;
  isFlagged?: boolean;
  points?: number | null;
  createdAt?: string;
  updatedAt?: string;
  rank?: number;
  type?: 'story' | 'task';
  originalType?: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  description?: string | null;
  priority: StackPriority;
  status: StackStatus;
  assignee?: string | null;
  dueDate?: string | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  rank: number;
  type: 'story' | 'task';
  originalType?: string;
}

// API Response Interfaces
export interface StacksStoriesResponse {
  stories: StacksStory[];
}

export interface StacksTasksResponse {
  tasks: StacksTask[];
}

export interface StacksStoryResponse {
  story: StacksStory;
  type?: 'story' | 'task';
}

export interface StacksTaskResponse {
  task: StacksTask;
}

export interface StacksProjectsResponse {
  projects: StacksProject[];
}

export interface StacksEpicsResponse {
  epics: StacksEpic[];
}

// Context Interfaces
export interface StacksContextValue {
  projects: StacksProject[];
  epics: StacksEpic[];
  stories: StacksStory[];
  tasks: StacksTask[];
  selectedItem: StacksStory | StacksTask | null;
  setSelectedItem: (item: StacksStory | StacksTask | null) => void;
  createStory: (data: CreateStoryInput) => Promise<StacksStory>;
  updateStory: (id: string, data: UpdateStoryInput) => Promise<StacksStory>;
  deleteStory: (id: string) => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<StacksTask>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<StacksTask>;
  deleteTask: (id: string) => Promise<void>;
  refreshTrigger: number;
}

// Input Interfaces
export interface CreateStoryInput {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  status?: StackStatus;
  priority?: StackPriority;
  epochId?: string;
  assigneeId?: string;
  product?: string;
  section?: string;
  points?: number;
}

export interface UpdateStoryInput {
  title?: string;
  description?: string;
  acceptanceCriteria?: string;
  status?: StackStatus;
  priority?: StackPriority;
  epochId?: string;
  assigneeId?: string;
  product?: string;
  section?: string;
  points?: number;
  isFlagged?: boolean;
  rank?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: StackStatus;
  priority?: StackPriority;
  type?: TaskType;
  storyId?: string;
  assigneeId?: string;
  product?: string;
  section?: string;
  attachments?: any[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: StackStatus;
  priority?: StackPriority;
  type?: TaskType;
  assigneeId?: string;
  product?: string;
  section?: string;
  attachments?: any[];
  rank?: number;
}

// Filter and Sort Interfaces
export interface StacksFilters {
  priority: StackPriority | 'all';
  status: StackStatus | 'all';
  workstream: string | 'all';
  assignee: string | 'all';
}

export interface StacksSort {
  field: 'priority' | 'createdAt' | 'updatedAt' | 'title' | 'assignee' | 'epic' | 'status';
  direction: 'asc' | 'desc';
}

// Error Interfaces
export interface StacksError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

