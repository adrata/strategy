"use client";

import React from 'react';

interface StacksItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'idea';
  priority: 'low' | 'medium' | 'high';
  type: 'epic' | 'story' | 'bug' | 'future';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

interface StacksItemListProps {
  items: StacksItem[];
  onItemClick: (item: StacksItem) => void;
  isLoading?: boolean;
  searchQuery?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return 'bg-hover text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'done': return 'bg-green-100 text-green-800';
    case 'idea': return 'bg-purple-100 text-purple-800';
    default: return 'bg-hover text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-muted';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'epic': return '📦';
    case 'story': return '📄';
    case 'bug': return '🐛';
    case 'future': return '💡';
    default: return '📋';
  }
};

export function StacksItemList({ items, onItemClick, isLoading, searchQuery }: StacksItemListProps) {
  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.assignee?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-muted">Loading items...</p>
        </div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No items found
        </h3>
        <p className="text-muted mb-4">
          {searchQuery ? 'Try adjusting your search terms' : 'No items available yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="p-4 border border-border rounded-lg bg-[var(--card)] hover:bg-hover cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {item.title}
                    <span className="text-xs font-mono text-muted bg-hover px-2 py-1 rounded">
                      {item.id.slice(-8)}
                    </span>
                  </h3>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                {item.status.replace('-', ' ')}
              </span>
            </div>
            
            <p className="text-sm text-muted mb-3 line-clamp-2 ml-8">
              {item.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted ml-8">
              <div className="flex items-center gap-4">
                <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority} priority
                </span>
                {item.assignee && (
                  <span>Assigned to {item.assignee}</span>
                )}
                <span className="capitalize">{item.type}</span>
              </div>
              <span>Updated {item.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
