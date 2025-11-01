"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useWorkshop } from "../layout";
import { WorkshopDocument } from "../types/document";
import { 
  CodeBracketIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  document: WorkshopDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

const languageMap: Record<string, string> = {
  'javascript': 'javascript',
  'typescript': 'typescript',
  'python': 'python',
  'java': 'java',
  'cpp': 'cpp',
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
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'markdown': 'markdown',
  'sql': 'sql',
  'bash': 'shell',
  'powershell': 'powershell',
  'dockerfile': 'dockerfile',
  'plain': 'plaintext',
};

const themes = {
  'vs-dark': 'vs-dark',
  'vs-light': 'vs-light',
  'hc-black': 'hc-black',
};

export function CodeEditor({ document, onSave, onAutoSave }: CodeEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light' | 'hc-black'>('vs-dark');
  const [language, setLanguage] = useState('javascript');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off' | 'wordWrapColumn' | 'bounded'>('on');
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState<'on' | 'off' | 'relative' | 'interval'>('on');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect language from document content or file extension
  useEffect(() => {
    if (document.content) {
      const content = typeof document.content === 'string' ? document.content : JSON.stringify(document.content);
      
      // Try to detect language from content
      if (content.includes('function') && content.includes('=>')) {
        setLanguage('javascript');
      } else if (content.includes('def ') || content.includes('import ')) {
        setLanguage('python');
      } else if (content.includes('public class') || content.includes('import java')) {
        setLanguage('java');
      } else if (content.includes('<?php')) {
        setLanguage('php');
      } else if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        setLanguage('html');
      } else if (content.includes('{') && content.includes('}') && content.includes('"')) {
        setLanguage('json');
      } else {
        setLanguage('plaintext');
      }
    }
  }, [document.content]);

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
    });

    // Add auto-save functionality
    editor.onDidChangeModelContent(() => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        const content = editor.getValue();
        onAutoSave({ content, language, theme });
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
  }, [fontSize, wordWrap, minimap, lineNumbers, onAutoSave]);

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const content = editorRef.current.getValue();
      await onSave({ content, language, theme });
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, language, theme]);

  const handleRun = useCallback(async () => {
    if (!editorRef.current) return;
    
    setIsRunning(true);
    setOutput('Running code...\n');
    
    try {
      const code = editorRef.current.getValue();
      
      // This is a placeholder - in a real implementation, you'd send the code to a code execution service
      // For now, we'll simulate execution
      setTimeout(() => {
        setOutput(prev => prev + `Code executed successfully!\nOutput: ${code.substring(0, 100)}...\n`);
        setIsRunning(false);
      }, 2000);
    } catch (error) {
      setOutput(prev => prev + `Error: ${error}\n`);
      setIsRunning(false);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.getValue();
    navigator.clipboard.writeText(content);
  }, []);

  const handleFormat = useCallback(() => {
    if (!editorRef.current) return;
    
    editorRef.current.getAction('editor.action.formatDocument').run();
  }, []);

  const getInitialContent = () => {
    if (document.content) {
      if (typeof document.content === 'string') {
        return document.content;
      }
      if (document.content.content) {
        return document.content.content;
      }
      return JSON.stringify(document.content, null, 2);
    }
    
    // Default content based on language
    switch (language) {
      case 'javascript':
        return `// Welcome to Workshop Code Editor
function hello() {
  console.log("Hello, World!");
}

hello();`;
      case 'python':
        return `# Welcome to Workshop Code Editor
def hello():
    print("Hello, World!")

hello()`;
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`;
      case 'json':
        return `{
  "name": "example",
  "version": "1.0.0",
  "description": "A sample JSON file"
}`;
      default:
        return `// Welcome to Workshop Code Editor
// Start coding here...`;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <CodeBracketIcon className="w-6 h-6 text-[var(--muted)]" />
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{document.title}</h1>
            <p className="text-sm text-[var(--muted)]">Code Document</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1 border border-[var(--border)] rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(languageMap).map(([key, value]) => (
              <option key={key} value={value}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
          
          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="px-3 py-1 border border-[var(--border)] rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="vs-light">Light</option>
            <option value="vs-dark">Dark</option>
            <option value="hc-black">High Contrast</option>
          </select>
          
          {/* Save Status */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckIcon className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1 text-red-600">
                <XMarkIcon className="w-4 h-4" />
                <span className="text-sm">Error</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFormat}
              className="px-3 py-1 text-sm bg-[var(--hover)] text-gray-700 rounded hover:bg-[var(--loading-bg)] transition-colors"
              title="Format Code"
            >
              Format
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-sm bg-[var(--hover)] text-gray-700 rounded hover:bg-[var(--loading-bg)] transition-colors"
              title="Copy Code"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
              title="Run Code"
            >
              {isRunning ? (
                <StopIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor and Output */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={getInitialContent()}
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
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                glyphMargin: true,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                unfoldOnClickAfterEnd: false,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
              }}
            />
          </div>
          
          {/* Output Panel */}
          {output && (
            <div className="h-32 border-t border-[var(--border)] bg-[var(--panel-background)]">
              <div className="p-3 border-b border-[var(--border)] bg-[var(--hover)]">
                <h3 className="text-sm font-medium text-gray-700">Output</h3>
              </div>
              <div className="p-3 h-full overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
