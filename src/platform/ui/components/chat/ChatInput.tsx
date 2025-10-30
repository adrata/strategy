"use client";

import React, { useRef, useEffect } from 'react';
import { DocumentIcon, PowerIcon } from "@heroicons/react/24/outline";
import { AIModelSelector, type AIModel } from './AIModelSelector';
import { ContextFiles } from './ContextFiles';
import { AddFilesPopup } from './AddFilesPopup';
import { VoiceModeModal } from './VoiceModeModal';
import { RiVoiceAiFill } from "react-icons/ri";
import { useUnifiedAuth } from "@/platform/auth";

interface ContextFile {
  id: string;
  name: string;
  size?: number;
  data?: string;
  type?: string;
}

interface ChatInputProps {
  rightChatInput: string;
  setRightChatInput: (value: string) => void;
  textareaHeight: number;
  setTextareaHeight: (height: number) => void;
  contextFiles: ContextFile[];
  setContextFiles: React.Dispatch<React.SetStateAction<ContextFile[]>>;
  selectedAIModel: AIModel;
  setSelectedAIModel: (model: AIModel) => void;
  isDragOver: boolean;
  showAddFilesPopup: boolean;
  setShowAddFilesPopup: (show: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  workspaceId?: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  addFilesPopupRef: React.RefObject<HTMLDivElement>;
  isEnterHandledRef: React.MutableRefObject<boolean>;
  processMessageWithQueue: (message: string) => void;
  scrollToBottom: () => void;
  chatHistory?: string[]; // Add chat history for terminal-like navigation
  onLogVoiceConversation?: (messages: { role: 'user' | 'assistant', content: string }[]) => void;
  onVoiceModeClick?: () => void; // Add voice mode click handler
  isVoiceModeActive?: boolean; // Add voice mode active state
  isModalListening?: boolean; // Add modal listening state
}

export function ChatInput({
  rightChatInput,
  setRightChatInput,
  textareaHeight,
  setTextareaHeight,
  contextFiles,
  setContextFiles,
  selectedAIModel,
  setSelectedAIModel,
  isDragOver,
  showAddFilesPopup,
  setShowAddFilesPopup,
  onSubmit,
  workspaceId,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  textareaRef,
  addFilesPopupRef,
  isEnterHandledRef,
  processMessageWithQueue,
  scrollToBottom,
  chatHistory = [],
  onLogVoiceConversation,
  onVoiceModeClick,
  isVoiceModeActive = false,
  isModalListening = false
}: ChatInputProps) {
  
  // Get current user from auth system
  const { user } = useUnifiedAuth();
  
  // Debug logging
  console.log('🔍 [VOICE MODE DEBUG] User object:', user);
  console.log('🔍 [VOICE MODE DEBUG] Workspace ID:', workspaceId);
  console.log('🔍 [VOICE MODE DEBUG] User name:', user?.name);
  console.log('🔍 [VOICE MODE DEBUG] User email:', user?.email);
  
  // Get the active workspace name for proper Adrata workspace detection
  const activeWorkspace = user?.workspaces?.find(w => w.id === user?.activeWorkspaceId);
  const workspaceName = activeWorkspace?.name?.toLowerCase();
  console.log('🔍 [VOICE MODE DEBUG] Active workspace name:', workspaceName);
  
  // Access control: Only show voice mode for Adrata workspace and user Ross
  // Check both email and name for compatibility
  const isVoiceModeAllowed = workspaceName === 'adrata' && (
    user?.email === 'ross@adrata.com' || 
    user?.name?.toLowerCase() === 'ross'
  );
  
  console.log('🔍 [VOICE MODE DEBUG] Is voice mode allowed:', isVoiceModeAllowed);
  
  // Terminal-like command history navigation
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [currentInput, setCurrentInput] = React.useState('');
  
  

  
  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const baseHeight = 182; // Updated base height
      const maxHeight = Math.floor(baseHeight * 1.3); // 30% expansion
      
      // Reset height to measure scrollHeight
      textarea['style']['height'] = `${baseHeight}px`;
      const scrollHeight = textarea.scrollHeight;
      
      if (scrollHeight > baseHeight) {
        const newHeight = Math.min(scrollHeight, maxHeight);
        setTextareaHeight(newHeight);
        textarea['style']['height'] = `${newHeight}px`;
      } else {
        setTextareaHeight(baseHeight);
        textarea['style']['height'] = `${baseHeight}px`;
      }
    }
  };

  // Auto-resize on input change
  useEffect(() => {
    autoResizeTextarea();
  }, [rightChatInput]);

  return (
    <>
    <div className="w-full bg-[var(--background)] flex-shrink-0" style={{ paddingBottom: '3px' }}>
      <form className="flex items-center p-4 pt-[16px] mt-0" onSubmit={onSubmit}>
        <div className="relative flex-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.svg,.webp,.tiff,.ico,image/*,text/*,.zip,.rar,.7z,.tar,.gz,.xml,.html,.rtf,.odt,.ods,.odp,.pages,.numbers,.key,.sketch,.fig,.ai,.psd,.eps,.dwg,.dxf,.obj,.stl,.ply,.fbx,.dae,.3ds,.blend,.max,.ma,.mb,.c4d,.lwo,.lws,.lxo,.modo,.sib,.x3d,.wrl,.u3d,.3mf,.amf,.ply,.off,.stl,.obj,.dae,.fbx,.3ds,.blend,.max,.ma,.mb,.c4d,.lwo,.lws,.lxo,.modo,.sib,.x3d,.wrl,.u3d,.3mf,.amf"
            onChange={onFileSelect}
            className="hidden"
          />
          
          {/* Context Files - handles Add Files button when empty */}
          <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
            <div className="relative">
              <ContextFiles
                files={contextFiles}
                onRemoveFile={(fileId) => setContextFiles(prev => {
                  const updated = prev.filter(f => f.id !== fileId);
                  // Persist to localStorage - WORKSPACE ISOLATED
                  try {
                    if (workspaceId) {
                      const storageKey = `adrata-context-files-${workspaceId}`;
                      localStorage.setItem(storageKey, JSON.stringify(updated));
                    }
                  } catch (error) {
                    console.warn('Failed to persist context files:', error);
                  }
                  return updated;
                })}
                onAddFiles={() => setShowAddFilesPopup(true)}
              />
              
              {/* Compact Add Files Popup */}
              <div ref={addFilesPopupRef}>
                <AddFilesPopup
                  isOpen={showAddFilesPopup}
                  onClose={() => setShowAddFilesPopup(false)}
                  onFileSelect={(files) => {
                    const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                    onFileSelect(event);
                    setShowAddFilesPopup(false);
                  }}
                  onAddFiles={(files) => {
                    setContextFiles(prev => [...prev, ...files]);
                    setShowAddFilesPopup(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Voice Mode Button - Only for Adrata workspace and Ross */}
          {isVoiceModeAllowed && (
            <div className="absolute right-2 top-2 z-10">
              <button
                onClick={onVoiceModeClick}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border transition-all duration-200 cursor-pointer ${
                isVoiceModeActive || isModalListening
                  ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
              }`}
              >
                <RiVoiceAiFill className="w-4 h-4" />
                <span className="font-medium text-xs">Voice Mode</span>
              </button>
            </div>
          )}


          
          <div className="relative">
            <textarea
              ref={textareaRef}
              placeholder="Think, execute, repeat"
              rows={4}
              value={rightChatInput}
              onChange={e => {
                setRightChatInput(e.target.value);
                // Auto-resize on input change
                setTimeout(autoResizeTextarea, 0);
              }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`w-full text-base rounded-md resize-none overflow-y-auto placeholder-[var(--muted)] text-[var(--foreground)] focus:outline-none focus:border-[var(--border)] ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}`}
              onKeyDown={e => {
                const isStandardShortcut = (
                  (e.metaKey || e.ctrlKey) && ['v', 'c', 'x', 'a', 'z', 'y'].includes(e.key.toLowerCase())
                );
                
                // Terminal-like navigation: Up/Down arrows for command history
                if (e['key'] === 'ArrowUp' && !e['shiftKey'] && !e['altKey'] && !e['ctrlKey'] && !e.metaKey) {
                  e.preventDefault();
                  if (chatHistory.length > 0) {
                    if (historyIndex === -1) {
                      // Save current input before navigating history
                      setCurrentInput(rightChatInput);
                      setHistoryIndex(chatHistory.length - 1);
                      setRightChatInput(chatHistory[chatHistory.length - 1] || '');
                    } else if (historyIndex > 0) {
                      setHistoryIndex(historyIndex - 1);
                      setRightChatInput(chatHistory[historyIndex - 1] || '');
                    }
                  }
                  return;
                }
                
                if (e['key'] === 'ArrowDown' && !e['shiftKey'] && !e['altKey'] && !e['ctrlKey'] && !e.metaKey) {
                  e.preventDefault();
                  if (historyIndex !== -1) {
                    if (historyIndex < chatHistory.length - 1) {
                      setHistoryIndex(historyIndex + 1);
                      setRightChatInput(chatHistory[historyIndex + 1] || '');
                    } else {
                      // Return to current input
                      setHistoryIndex(-1);
                      setRightChatInput(currentInput);
                    }
                  }
                  return;
                }
                
                // Standard editing shortcuts (Cmd+C, Cmd+X, Cmd+V, Cmd+Z, etc.)
                if ((e.metaKey || e.ctrlKey) && ['c', 'x', 'v', 'z', 'y', 'a'].includes(e.key.toLowerCase())) {
                  // Reset history navigation when using standard editing shortcuts
                  setHistoryIndex(-1);
                  setCurrentInput('');
                  // Let browser handle the standard shortcuts naturally
                  return;
                }
                
                // Reset history navigation on any other key
                if (!['ArrowUp', 'ArrowDown'].includes(e.key)) {
                  setHistoryIndex(-1);
                  setCurrentInput('');
                }
                
                if (e['key'] === 'Enter' && !e['shiftKey'] && !isStandardShortcut) {
                  // Check if signals popup is visible by looking for slide up element
                  const slideUpElement = document.querySelector('[data-slide-up]') || 
                                       document.querySelector('.slide-up-visible') ||
                                       // Check if any modal or popup is open that should take precedence
                                       document.querySelector('[role="dialog"]');
                  
                  if (slideUpElement) {
                    return; // Don't intercept Enter if signals popup or modal is visible
                  }
                  
                  e.preventDefault();
                  if (rightChatInput.trim()) {
                    if (isEnterHandledRef.current) return;
                    isEnterHandledRef['current'] = true;
                    
                    const messageToSend = rightChatInput.trim();
                    processMessageWithQueue(messageToSend);
                    setRightChatInput('');
                    
                    // Reset history navigation
                    setHistoryIndex(-1);
                    setCurrentInput('');
                    
                    // Reset textarea height immediately after sending
                    setTextareaHeight(182); // Updated base height
                    if (textareaRef.current) {
                      textareaRef.current['style']['height'] = '182px';
                    }
                    
                    setTimeout(scrollToBottom, 100);
                    
                    setTimeout(() => {
                      isEnterHandledRef['current'] = false;
                    }, 500);
                  }
                }
              }}
              style={{ 
                height: `${textareaHeight}px`,
                minHeight: '182px', // 20% higher than original 152px
                maxHeight: `${Math.floor(182 * 1.3)}px`, // 30% expansion from new base
                paddingLeft: '14px',
                paddingRight: '48px',
                paddingTop: '43px',
                paddingBottom: '60px',
                border: '1px solid #e5e7eb',
                borderColor: '#e5e7eb',
                overflowY: textareaHeight >= Math.floor(182 * 1.3) ? 'scroll' : 'hidden'
              }}
            />
            
            {/* Minimal file drop indicator */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-50/80 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center pointer-events-none">
                <div className="text-blue-600 text-sm font-medium">
                  Drop files here
                </div>
              </div>
            )}
            



            {/* Send Button */}
            <button
              type="submit"
              style={{ 
                width: '31px', 
                height: '31px', 
                right: '11px',
                bottom: '20.5px',
                background: rightChatInput.trim().length > 0 ? '#f3f4f6' : '#fff',
                color: rightChatInput.trim().length > 0 ? '#374151' : '#222',
                transition: 'background-color 50ms ease-out, color 50ms ease-out',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
              className="absolute p-2 rounded-md flex items-center justify-center cursor-pointer"
              aria-label="Send"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0-15l6.75 6.75M12 4.5L5.25 11.25" />
              </svg>
            </button>
            
            {/* AI Model Selector */}
            <div className="absolute left-5 z-10" style={{ bottom: '22px' }}>
              <AIModelSelector
                selectedModel={selectedAIModel}
                onModelChange={setSelectedAIModel}
                className="scale-75 origin-left"
              />
            </div>
          </div>
        </div>
      </form>
    </div>


    </>
  );
}
