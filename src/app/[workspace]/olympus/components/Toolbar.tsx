import React from 'react';
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
  getTypeIcon
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-lg">
        {/* Cursor Pointer */}
        <button 
          onClick={() => onToolClick('cursor')}
          className={`p-1.5 rounded transition-colors ${
            activeTool === 'cursor' 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
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
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
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
              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
              : 'text-gray-400 cursor-not-allowed'
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
              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
              : 'text-gray-400 cursor-not-allowed'
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
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Add Items Popup */}
          {showAddPopup && (
            <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden min-w-[300px] max-h-[400px] overflow-y-auto">
              {workflowCategories.map((category) => (
                <div key={category.category}>
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">{category.category}</span>
                  </div>
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onAddItem(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center">
                        {(() => {
                          const IconComponent = getTypeIcon(item.id);
                          return <IconComponent className="w-3 h-3 text-gray-400" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Play Button with Popup */}
        <div className="relative play-popup-container">
          <button 
            onClick={onExecute}
            disabled={isExecuting}
            onMouseEnter={onTogglePlayPopup}
            onMouseLeave={onTogglePlayPopup}
            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          
          {/* Play Options Popup */}
          {showPlayPopup && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] z-20">
              <button
                onClick={onExecute}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Start</span>
                </div>
              </button>
              <button
                onClick={onExecuteWithCommentary}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Start with AI Commentary</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
