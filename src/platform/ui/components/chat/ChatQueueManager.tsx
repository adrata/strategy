"use client";

import React, { useState, useEffect } from "react";
import { 
  QueueListIcon, 
  PlayIcon, 
  PauseIcon,
  XMarkIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";

interface QueueItem {
  id: string;
  query: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  todos?: string[];
  response?: string;
}

interface ChatQueueManagerProps {
  onProcessNext?: (query: string) => Promise<void>;
  className?: string;
}

export function ChatQueueManager({ 
  onProcessNext,
  className = "" 
}: ChatQueueManagerProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-process next item in queue
  useEffect(() => {
    if (!isProcessing && queue.length > 0) {
      const nextItem = queue.find(item => item['status'] === 'pending');
      
      if (nextItem && onProcessNext) {
        setIsProcessing(true);
        
        // Update item status to processing
        setQueue(prev => prev.map(item => 
          item['id'] === nextItem.id 
            ? { ...item, status: 'processing' as const }
            : item
        ));

        // Process the item
        onProcessNext(nextItem.query)
          .then(() => {
            // Mark as completed
            setQueue(prev => prev.map(item => 
              item['id'] === nextItem.id 
                ? { ...item, status: 'completed' as const }
                : item
            ));
          })
          .catch((error) => {
            console.error('Queue processing error:', error);
            // Mark as cancelled on error
            setQueue(prev => prev.map(item => 
              item['id'] === nextItem.id 
                ? { ...item, status: 'cancelled' as const }
                : item
            ));
          })
          .finally(() => {
            setIsProcessing(false);
          });
      }
    }
  }, [queue, isProcessing, onProcessNext]);

  // Add item to queue
  const addToQueue = (query: string) => {
    const newItem: QueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setQueue(prev => [...prev, newItem]);
    setIsVisible(true);
    
    console.log('📋 [QUEUE] Added item:', query);
    return newItem.id;
  };

  // Remove item from queue
  const removeFromQueue = (itemId: string) => {
    setQueue(prev => prev.filter(item => item.id !== itemId));
    console.log('🗑️ [QUEUE] Removed item:', itemId);
  };

  // Reorder queue items
  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      return newQueue;
    });
  };

  // Clear completed items
  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => 
      item.status !== 'completed' && item.status !== 'cancelled'
    ));
  };

  const pendingCount = queue.filter(item => item['status'] === 'pending').length;
  const processingCount = queue.filter(item => item['status'] === 'processing').length;

  // Hide queue if empty
  useEffect(() => {
    if (queue['length'] === 0) {
      setIsVisible(false);
    }
  }, [queue.length]);

  // Expose methods for external use
  React.useEffect(() => {
    (window as any).chatQueue = {
      addToQueue,
      removeFromQueue,
      getQueue: () => queue,
      clearQueue: () => setQueue([])
    };
  }, [queue]);

  if (!isVisible || queue['length'] === 0) {
    return null;
  }

  return (
    <div className={`bg-[var(--background)] border-b border-[var(--border)] ${className}`}>
      {/* Queue Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--hover-bg)]/30">
        <div className="flex items-center gap-2">
          <QueueListIcon className="w-4 h-4 text-[var(--muted)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            Queue
          </span>
          {pendingCount > 0 && (
            <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5">
              {pendingCount}
            </span>
          )}
          {processingCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">
                Processing
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {queue.some(item => item['status'] === 'completed') && (
            <button
              onClick={clearCompleted}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
            >
              Clear completed
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <div className="max-h-32 overflow-y-auto">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] last:border-b-0 ${
              item['status'] === 'processing' 
                ? 'bg-blue-50 dark:bg-blue-900/20' 
                : item['status'] === 'completed'
                ? 'bg-green-50 dark:bg-green-900/20 opacity-60'
                : ''
            }`}
          >
            {/* Drag Handle */}
            <div className="cursor-move text-[var(--muted)]">
              <Bars3Icon className="w-3 h-3" />
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0">
              {item['status'] === 'processing' ? (
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : item['status'] === 'completed' ? (
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              ) : item['status'] === 'cancelled' ? (
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
              )}
            </div>

            {/* Query Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--foreground)] truncate">
                {item.query}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {item.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {/* Remove Button */}
            {item['status'] === 'pending' && (
              <button
                onClick={() => removeFromQueue(item.id)}
                className="text-[var(--muted)] hover:text-red-500 p-1 rounded hover:bg-[var(--hover-bg)] transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
