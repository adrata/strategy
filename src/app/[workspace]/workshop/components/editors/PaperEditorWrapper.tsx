"use client";

import React, { useState, useCallback, useRef } from "react";
import { WorkshopDocument } from "../../types/document";
import { 
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  CodeBracketIcon,
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
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';

interface PaperEditorWrapperProps {
  document: WorkshopDocument;
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

function Placeholder({ hasContent }: { hasContent: boolean }) {
  return null;
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

  React.useEffect(() => {
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

  React.useEffect(() => {
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

export function PaperEditorWrapper({ document, onSave, onAutoSave }: PaperEditorWrapperProps) {
  const initialConfig = {
    namespace: 'PaperEditorWrapper',
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

  const handleAutoSave = useCallback((content: any) => {
    onAutoSave(content);
  }, [onAutoSave]);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
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
                      fontFamily: 'inherit',
                    }}
                  />
                }
                placeholder={<Placeholder hasContent={false} />}
                ErrorBoundary={LexicalErrorBoundary}
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
