"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useEncode } from "../layout";
import Editor from '@monaco-editor/react';
import { 
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface MonacoEditorProps {
  className?: string;
}

const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'python': 'python',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'csharp': 'csharp',
  'go': 'go',
  'rust': 'rust',
  'php': 'php',
  'ruby': 'ruby',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  'markdown': 'markdown',
  'sql': 'sql',
  'shell': 'shell',
  'bash': 'shell',
  'powershell': 'powershell',
  'dockerfile': 'dockerfile',
  'plaintext': 'plaintext',
};

const themes = {
  'vs-dark': 'vs-dark',
  'vs-light': 'vs-light',
  'hc-black': 'hc-black',
};

export function MonacoEditor({ className = "" }: MonacoEditorProps) {
  const {
    activeFile,
    editorContent,
    setEditorContent,
    language,
    setLanguage,
    isDirty,
    setIsDirty,
    saveFile,
  } = useEncode();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light' | 'hc-black'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off' | 'wordWrapColumn' | 'bounded'>('on');
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState<'on' | 'off' | 'relative' | 'interval'>('on');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect language from file extension
  useEffect(() => {
    if (activeFile) {
      const detectedLanguage = detectLanguage(activeFile.name);
      setLanguage(detectedLanguage);
    }
  }, [activeFile, setLanguage]);

  const detectLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return languageMap[extension || ''] || 'plaintext';
  };

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      fontSize,
      wordWrap,
      minimap: { enabled: minimap },
      lineNumbers,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      renderControlCharacters: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnSave: true,
      formatOnPaste: true,
      formatOnType: true,
    });

    // Add auto-save functionality
    editor.onDidChangeModelContent(() => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (activeFile && isDirty) {
          handleAutoSave();
        }
      }, 3000); // Auto-save every 3 seconds
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      // Toggle command palette (placeholder)
      console.log('Command palette');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F, () => {
      // Find
      editor.getAction('actions.find').run();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      // Find and replace
      editor.getAction('editor.action.startFindReplaceAction').run();
    });

    // Track content changes for dirty state
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      setEditorContent(content);
      setIsDirty(content !== activeFile?.content);
    });

  }, [fontSize, wordWrap, minimap, lineNumbers, activeFile, isDirty, setEditorContent, setIsDirty]);

  const handleSave = useCallback(async () => {
    if (!activeFile || !editorRef.current) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const content = editorRef.current.getValue();
      await saveFile(activeFile.id, content);
      setSaveStatus('saved');
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, saveFile, isDirty, setIsDirty]);

  const handleAutoSave = useCallback(async () => {
    if (!activeFile || !editorRef.current) return;
    
    try {
      const content = editorRef.current.getValue();
      await saveFile(activeFile.id, content);
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [activeFile, saveFile, setIsDirty]);

  const handleRun = useCallback(async () => {
    if (!activeFile || !editorRef.current) return;
    
    setIsRunning(true);
    setOutput('');
    
    try {
      const code = editorRef.current.getValue();
      
      // TODO: Integrate with Daytona service for code execution
      const response = await fetch('/api/encode/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: language,
          projectId: activeFile.projectId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setOutput(result.output || '');
      } else {
        setOutput('Error: Failed to execute code');
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [activeFile, language]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setOutput('');
  }, []);

  const handleCopy = useCallback(() => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const text = selection.isEmpty() 
        ? editorRef.current.getValue()
        : editorRef.current.getModel()?.getValueInRange(selection);
      
      navigator.clipboard.writeText(text || '');
    }
  }, []);

  const handleDuplicate = useCallback(() => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const text = selection.isEmpty() 
        ? editorRef.current.getValue()
        : editorRef.current.getModel()?.getValueInRange(selection);
      
      if (text) {
        editorRef.current.trigger('keyboard', 'type', { text: text + '\n' + text });
      }
    }
  }, []);

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'saved':
        return <CheckIcon className="w-3 h-3 text-green-500" />;
      case 'error':
        return <XMarkIcon className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (!activeFile) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-[var(--background)] ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium text-[var(--muted)] mb-2">No file selected</div>
          <div className="text-sm text-[var(--muted)]">
            Open a file from the file tree to start editing
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[var(--background)] ${className}`}>
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--panel-background)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {activeFile.name}
            </span>
            {isDirty && (
              <span className="text-xs text-orange-500">•</span>
            )}
            {getSaveStatusIcon()}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>{language}</span>
            <span>•</span>
            <span>UTF-8</span>
            <span>•</span>
            <span>LF</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-[var(--hover)] rounded transition-colors"
            title="Copy"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDuplicate}
            className="p-1.5 hover:bg-[var(--hover)] rounded transition-colors"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-[var(--hover)] rounded transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
          
          {!isRunning ? (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              title="Run Code"
            >
              <PlayIcon className="w-4 h-4" />
              <span className="text-sm">Run</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              title="Stop"
            >
              <StopIcon className="w-4 h-4" />
              <span className="text-sm">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--panel-background)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Font Size
              </label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
                min="8"
                max="24"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Word Wrap
              </label>
              <select
                value={wordWrap}
                onChange={(e) => setWordWrap(e.target.value as any)}
                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
                <option value="wordWrapColumn">Word Wrap Column</option>
                <option value="bounded">Bounded</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="minimap"
                checked={minimap}
                onChange={(e) => setMinimap(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="minimap" className="text-xs font-medium text-[var(--muted)]">
                Minimap
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={languageMap[language] || 'plaintext'}
          theme={themes[theme]}
          value={editorContent}
          onChange={(value) => {
            setEditorContent(value || '');
            setIsDirty(value !== activeFile?.content);
          }}
          onMount={handleEditorDidMount}
          options={{
            fontSize,
            wordWrap,
            minimap: { enabled: minimap },
            lineNumbers,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            renderControlCharacters: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnSave: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            mouseWheelZoom: true,
            multiCursorModifier: 'ctrlCmd',
            selectionClipboard: true,
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'always'
            }
          }}
        />
      </div>

      {/* Output Panel */}
      {output && (
        <div className="border-t border-[var(--border)] bg-[var(--panel-background)]">
          <div className="px-4 py-2 border-b border-[var(--border)]">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Output</h3>
          </div>
          <div className="p-4">
            <pre className="text-sm font-mono text-[var(--foreground)] whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
