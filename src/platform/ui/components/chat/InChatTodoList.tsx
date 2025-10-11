"use client";

import React, { useState, useEffect } from "react";
import { CheckIcon, ClockIcon, PlayIcon } from "@heroicons/react/24/outline";

interface InChatTodoListProps {
  todos: string[];
  onTaskComplete?: (taskIndex: number) => void;
  autoProgress?: boolean;
  className?: string;
}

export function InChatTodoList({ 
  todos, 
  onTaskComplete, 
  autoProgress = true,
  className = "" 
}: InChatTodoListProps) {
  const [completedTasks, setCompletedTasks] = useState<boolean[]>(new Array(todos.length).fill(false));
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-progress through tasks if enabled
  useEffect(() => {
    if (!autoProgress || isProcessing) return;

    const processNextTask = async () => {
      if (currentTaskIndex < todos['length'] && !completedTasks[currentTaskIndex]) {
        setIsProcessing(true);
        
        // Simulate task processing with realistic timing
        const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
        
        setTimeout(() => {
          setCompletedTasks(prev => {
            const newCompleted = [...prev];
            newCompleted[currentTaskIndex] = true;
            return newCompleted;
          });
          
          onTaskComplete?.(currentTaskIndex);
          setCurrentTaskIndex(prev => prev + 1);
          setIsProcessing(false);
        }, processingTime);
      }
    };

    const timer = setTimeout(processNextTask, 500); // Small delay before starting next task
    return () => clearTimeout(timer);
  }, [currentTaskIndex, completedTasks, todos.length, autoProgress, isProcessing, onTaskComplete]);

  const handleTaskClick = (index: number) => {
    if (!autoProgress && !completedTasks[index]) {
      setCompletedTasks(prev => {
        const newCompleted = [...prev];
        newCompleted[index] = true;
        return newCompleted;
      });
      onTaskComplete?.(index);
    }
  };

  const getTaskStatus = (index: number) => {
    if (completedTasks[index]) return 'completed';
    if (index === currentTaskIndex && isProcessing) return 'processing';
    if (index === currentTaskIndex) return 'current';
    if (index < currentTaskIndex) return 'completed';
    return 'pending';
  };

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'current':
        return <PlayIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-[var(--muted)]" />;
    }
  };

  const getTaskStyle = (status: string) => {
    const baseStyle = "flex items-center gap-3 p-2 rounded-lg transition-all duration-300 border border-transparent";
    
    switch (status) {
      case 'completed':
        return `${baseStyle} bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 line-through`;
      case 'processing':
        return `${baseStyle} bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 shadow-sm`;
      case 'current':
        return `${baseStyle} bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700`;
      default:
        return `${baseStyle} bg-[var(--panel-background)] text-[var(--muted)] dark:text-[var(--muted)]`;
    }
  };

  const completedCount = completedTasks.filter(Boolean).length;
  const progressPercentage = (completedCount / todos.length) * 100;

  return (
    <div className={`bg-[var(--background)] dark:bg-[var(--foreground)] border border-[var(--border)] dark:border-[var(--border)] rounded-lg p-4 my-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Task Breakdown
          </span>
        </div>
        <span className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
          {completedCount}/{todos.length} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-[var(--loading-bg)] rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.map((todo, index) => {
          const status = getTaskStatus(index);
          return (
            <div
              key={index}
              className={getTaskStyle(status)}
              onClick={() => handleTaskClick(index)}
              style={{ cursor: autoProgress ? 'default' : 'pointer' }}
            >
              <div className="flex-shrink-0">
                {getTaskIcon(status)}
              </div>
              <span className="text-sm font-medium flex-1">
                {todo}
              </span>
              {status === 'processing' && (
                <span className="text-xs text-blue-500 dark:text-blue-400">
                  Processing...
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Status */}
      {completedCount === todos['length'] && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] dark:border-[var(--border)]">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckIcon className="w-4 h-4" />
            <span className="text-sm font-medium">All tasks completed!</span>
          </div>
        </div>
      )}
    </div>
  );
}
