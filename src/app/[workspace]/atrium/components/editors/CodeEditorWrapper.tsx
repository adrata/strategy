"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { AtriumDocument } from "../../types/document";
import Editor from '@monaco-editor/react';

interface CodeEditorWrapperProps {
  document: AtriumDocument;
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

export function CodeEditorWrapper({ document, onSave, onAutoSave }: CodeEditorWrapperProps) {
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light' | 'hc-black'>('vs-dark');
  const [language, setLanguage] = useState('javascript');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off' | 'wordWrapColumn' | 'bounded'>('on');
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState<'on' | 'off' | 'relative' | 'interval'>('on');
  
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
  }, [fontSize, wordWrap, minimap, lineNumbers, onAutoSave]);

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    
    try {
      const content = editorRef.current.getValue();
      await onSave({ content, language, theme });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [onSave, language, theme]);

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
        return `// Welcome to Atrium Code Editor
function hello() {
  console.log("Hello, World!");
}

hello();`;
      case 'python':
        return `# Welcome to Atrium Code Editor
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
        return `// Welcome to Atrium Code Editor
// Start coding here...`;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50">
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="vs-light">Light</option>
          <option value="vs-dark">Dark</option>
          <option value="hc-black">High Contrast</option>
        </select>
        
        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={12}>12px</option>
          <option value={14}>14px</option>
          <option value={16}>16px</option>
          <option value={18}>18px</option>
          <option value={20}>20px</option>
        </select>
      </div>

      {/* Editor */}
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
    </div>
  );
}
