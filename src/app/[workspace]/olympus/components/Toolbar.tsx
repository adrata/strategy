import React from 'react';
import { PlayIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { WorkflowCategory, WorkflowItem } from '../types';

interface ToolbarProps {
  activeTool: 'cursor' | 'hand';
  historyIndex: number;
  positionHistoryLength: number;
  showAddPopup: boolean;
  workflowCategories: WorkflowCategory[];
  isExecuting: boolean;
  showPlayPopup: boolean;
  onToolClick: (tool: 'cursor' | 'hand') => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleAddPopup: () => void;
  onAddItem: (item: WorkflowItem) => void;
  onExecute: () => void;
  onExecuteWithCommentary: () => void;
  onTogglePlayPopup: () => void;
  onOpenStartModal: () => void;
  getTypeIcon: (id: string) => React.ComponentType<any>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  historyIndex,
  positionHistoryLength,
  showAddPopup,
  workflowCategories,
  isExecuting,
  showPlayPopup,
  onToolClick,
  onUndo,
  onRedo,
  onToggleAddPopup,
  onAddItem,
  onExecute,
  onExecuteWithCommentary,
  onTogglePlayPopup,
  onOpenStartModal,
  getTypeIcon
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 shadow-lg">
        {/* Cursor Pointer */}
        <button 
          onClick={() => onToolClick('cursor')}
          className={`p-1.5 rounded transition-colors ${
            activeTool === 'cursor' 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>
        
        {/* Hand Pointer */}
        <button 
          onClick={() => onToolClick('hand')}
          className={`p-1.5 rounded transition-colors ${
            activeTool === 'hand' 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </button>
        
        {/* Undo Button */}
        <button 
          onClick={onUndo}
          disabled={historyIndex <= 0}
          className={`p-1.5 transition-colors ${
            historyIndex > 0 
              ? 'text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)]' 
              : 'text-[var(--muted)] cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        
        {/* Redo Button */}
        <button 
          onClick={onRedo}
          disabled={historyIndex >= positionHistoryLength - 1}
          className={`p-1.5 transition-colors ${
            historyIndex < positionHistoryLength - 1 
              ? 'text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)]' 
              : 'text-[var(--muted)] cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
        
        {/* Plus Button */}
        <div className="relative add-popup-container">
          <button 
            onClick={onToggleAddPopup}
            className="p-1.5 text-[var(--muted)] hover:text-gray-800 hover:bg-[var(--hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Add Items Popup */}
          {showAddPopup && (
            <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-md overflow-hidden min-w-[300px] max-h-[400px] overflow-y-auto">
              {workflowCategories.map((category) => (
                <div key={category.category}>
                  <div className="px-4 py-3 bg-[var(--panel-background)] border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">{category.category}</span>
                  </div>
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onAddItem(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--panel-background)] transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-5 h-5 border border-[var(--border)] rounded-md flex items-center justify-center">
                        {(() => {
                          const IconComponent = getTypeIcon(item.id);
                          return <IconComponent className="w-3 h-3 text-[var(--muted)]" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{item.title}</div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Start Button */}
        <button 
          onClick={onOpenStartModal}
          disabled={isExecuting}
          className="p-1.5 text-[var(--muted)] hover:text-gray-700 hover:bg-[var(--hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlayIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
