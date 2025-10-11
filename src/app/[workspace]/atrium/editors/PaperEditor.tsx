"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAtrium } from "../layout";
import { AtriumDocument } from "../types/document";
import { 
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Lexical imports
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';

interface PaperEditorProps {
  document: AtriumDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenBoolean',
    builtin: 'editor-tokenBuiltin',
    cdata: 'editor-tokenCdata',
    char: 'editor-tokenChar',
    class: 'editor-tokenClass',
    'class-name': 'editor-tokenClassName',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenConstant',
    deleted: 'editor-tokenDeleted',
    doctype: 'editor-tokenDoctype',
    entity: 'editor-tokenEntity',
    function: 'editor-tokenFunction',
    important: 'editor-tokenImportant',
    inserted: 'editor-tokenInserted',
    keyword: 'editor-tokenKeyword',
    namespace: 'editor-tokenNamespace',
    number: 'editor-tokenNumber',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenProlog',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenRegex',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenString',
    symbol: 'editor-tokenSymbol',
    tag: 'editor-tokenTag',
    url: 'editor-tokenUrl',
    variable: 'editor-tokenVariable',
  },
};

function onError(error: Error) {
  console.error(error);
}

function Placeholder() {
  return (
    <div className="editor-placeholder">
      Start writing your document...
    </div>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText(format);
      }
    });
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $createLinkNode(url).insertAfter(selection);
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--background)]">
      <button
        type="button"
        onClick={() => formatText('bold')}
        className={`p-2 rounded hover:bg-[var(--hover)] ${isBold ? 'bg-[var(--loading-bg)]' : ''}`}
        title="Bold"
      >
        <BoldIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className={`p-2 rounded hover:bg-[var(--hover)] ${isItalic ? 'bg-[var(--loading-bg)]' : ''}`}
        title="Italic"
      >
        <ItalicIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => formatText('underline')}
        className={`p-2 rounded hover:bg-[var(--hover)] ${isUnderline ? 'bg-[var(--loading-bg)]' : ''}`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => formatText('bullet')}
        className="p-2 rounded hover:bg-[var(--hover)]"
        title="Bullet List"
      >
        <ListBulletIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={insertLink}
        className="p-2 rounded hover:bg-[var(--hover)]"
        title="Insert Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => formatText('code')}
        className="p-2 rounded hover:bg-[var(--hover)]"
        title="Code"
      >
        <CodeBracketIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function AutoSavePlugin({ onAutoSave }: { onAutoSave: (content: any) => void }) {
  const [editor] = useLexicalComposerContext();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          const root = $getRoot();
          const content = root.getTextContent();
          onAutoSave({ content, editorState: editorState.toJSON() });
        });
      }, 3000); // Auto-save every 3 seconds
    });
  }, [editor, onAutoSave]);

  return null;
}

export function PaperEditor({ document, onSave, onAutoSave }: PaperEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const initialConfig = {
    namespace: 'PaperEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // This will be handled by the editor context
      await onSave({});
      setSaveStatus('saved');
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const handleAutoSave = useCallback((content: any) => {
    onAutoSave(content);
  }, [onAutoSave]);

  const updateCounts = useCallback(() => {
    // This will be handled by the editor context
    setCharCount(0);
    setWordCount(0);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{document.title}</h1>
            <p className="text-sm text-[var(--muted)]">Paper Document</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Word/Character Count */}
          <div className="text-sm text-[var(--muted)]">
            {wordCount} words • {charCount} characters
          </div>
          
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
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <LexicalComposer initialConfig={initialConfig}>
          <div className="flex-1 flex flex-col">
            <ToolbarPlugin />
            <div className="flex-1 relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="editor-input p-6 min-h-full focus:outline-none"
                    style={{
                      minHeight: '400px',
                      fontSize: '16px',
                      lineHeight: '1.6',
                    }}
                  />
                }
                placeholder={<Placeholder />}
                ErrorBoundary={ErrorBoundary}
              />
              <HistoryPlugin />
              <AutoFocusPlugin />
              <LinkPlugin />
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <AutoSavePlugin onAutoSave={handleAutoSave} />
            </div>
          </div>
        </LexicalComposer>
      </div>
    </div>
  );
}
