"use client";

import React, { useState } from "react";
import { 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  CalendarIcon,
  TagIcon,
  FlagIcon
} from "@heroicons/react/24/outline";

interface StacksDetailPanelProps {
  item: any;
}

export function StacksDetailPanel({ item }: StacksDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    status: item?.status || "todo",
    priority: item?.priority || "medium",
    assignee: item?.assignee || "",
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving item:", editForm);
    setIsEditing(false);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log("Deleting item:", item.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-[var(--hover)] text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-[var(--hover)] text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-[var(--muted)]';
    }
  };

  return (
    <div className="h-full bg-[var(--background)] border-l border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {item?.type === 'epic' ? 'Epic' : item?.type === 'story' ? 'Story' : 'Task'} Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Title"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Description"
              rows={3}
            />
            <div className="flex gap-2">
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
              {item?.title}
            </h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              {item?.description || "No description provided"}
            </p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TagIcon className="h-4 w-4 text-[var(--muted)]" />
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Status</div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item?.status)}`}>
                {item?.status?.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FlagIcon className="h-4 w-4 text-[var(--muted)]" />
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Priority</div>
              <span className={`text-sm font-medium ${getPriorityColor(item?.priority)}`}>
                {item?.priority} priority
              </span>
            </div>
          </div>

          {item?.assignee && (
            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-[var(--muted)]" />
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Assignee</div>
                <div className="text-sm text-[var(--muted)]">{item.assignee}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-[var(--muted)]" />
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Created</div>
              <div className="text-sm text-[var(--muted)]">
                {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>

          {item?.updatedAt && (
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-4 w-4 text-[var(--muted)]" />
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Last Updated</div>
                <div className="text-sm text-[var(--muted)]">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
