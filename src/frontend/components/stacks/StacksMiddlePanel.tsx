"use client";

/**
 * Stacks Middle Panel Component
 * 
 * Main content area for Stacks section with chat-like interface.
 * Follows 2025 best practices with proper state management and performance.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface StacksMiddlePanelProps {
  activeSubSection: string;
  selectedItem: any;
  onItemClick: (item: any) => void;
  isLoading: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration
const mockTasks: TaskItem[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add secure login and registration functionality',
    status: 'in-progress',
    priority: 'high',
    assignee: 'John Doe',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Design dashboard layout',
    description: 'Create responsive dashboard with modern UI',
    status: 'todo',
    priority: 'medium',
    assignee: 'Jane Smith',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-18'
  },
  {
    id: '3',
    title: 'Fix mobile responsiveness',
    description: 'Ensure all components work on mobile devices',
    status: 'done',
    priority: 'high',
    assignee: 'Mike Johnson',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-19'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return 'bg-gray-100 text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'done': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export function StacksMiddlePanel({ 
  activeSubSection, 
  selectedItem, 
  onItemClick, 
  isLoading 
}: StacksMiddlePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tasks, setTasks] = useState<TaskItem[]>(mockTasks);

  // Filter tasks based on search and status
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, filterStatus]);

  const handleCreateTask = () => {
    // TODO: Implement task creation modal
    console.log('Create new task');
  };

  const handleTaskClick = (task: TaskItem) => {
    onItemClick(task);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] capitalize">
              {activeSubSection}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Manage your {activeSubSection} tasks and projects
            </p>
          </div>
          <button
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Task
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-[var(--muted)]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  No tasks found
                </h3>
                <p className="text-[var(--muted)] mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first task to get started'}
                </p>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Create Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[var(--foreground)] flex-1">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-4">
                        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority} priority
                        </span>
                        {task.assignee && (
                          <span>Assigned to {task.assignee}</span>
                        )}
                      </div>
                      <span>Updated {task.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

