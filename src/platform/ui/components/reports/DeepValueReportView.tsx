"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ShareIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { deepValueReportService, DeepValueReport } from "@/platform/services/deep-value-report-service";
import { useShareUrl } from "@/platform/ui/components/ShareBar";

// Lexical imports for rich text editing
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TRANSFORMERS } from '@lexical/markdown';

interface DeepValueReportViewProps {
  report: DeepValueReport;
  record: any;
  recordType: string;
  onBack: () => void;
  onEdit?: (content: string) => void;
  onSave?: (content: string) => void;
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
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
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
  console.error('Lexical error:', error);
}

function Placeholder({ hasContent }: { hasContent: boolean }) {
  return null;
}

function ToolbarPlugin({ onShare }: { onShare: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center gap-2">
        <DocumentTextIcon className="w-5 h-5 text-[var(--muted)]" />
        <span className="text-sm text-[var(--muted)]">Deep Value Report</span>
      </div>
      <button
        onClick={onShare}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
      >
        <ShareIcon className="w-4 h-4" />
        Share
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

export function DeepValueReportView({ 
  report, 
  record, 
  recordType, 
  onBack, 
  onEdit,
  onSave 
}: DeepValueReportViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(report.isGenerating || false);
  const [content, setContent] = useState(report.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);
  const shareUrl = useShareUrl();

  const initialConfig = {
    namespace: 'DeepValueReportView',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
    ],
  };

  // Auto-generate content if not present
  useEffect(() => {
    if (!content && !isGenerating && report.workspaceId && report.userId) {
      generateContent();
    }
  }, [content, isGenerating, report.workspaceId, report.userId]);

  const generateContent = async () => {
    if (!report.workspaceId || !report.userId) return;
    
    setIsGenerating(true);
    let fullContent = '';

    try {
      const context = deepValueReportService['buildRecordContext'](record, recordType);
      
      for await (const chunk of deepValueReportService.streamReportGeneration(
        report, 
        context, 
        report.workspaceId, 
        report.userId
      )) {
        if (chunk.type === 'chunk' && chunk.content) {
          fullContent += chunk.content;
          setContent(fullContent);
        } else if (chunk.type === 'complete') {
          setIsGenerating(false);
          // Auto-save to Workshop
          try {
            await deepValueReportService.saveReportToWorkshop(report, fullContent);
          } catch (error) {
            console.error('Failed to auto-save report:', error);
          }
        } else if (chunk.type === 'error') {
          setIsGenerating(false);
          setContent('Failed to generate report. Please try again.');
        }
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setIsGenerating(false);
      setContent('Failed to generate report. Please try again.');
    }
  };

  const handleAutoSave = useCallback(async (content: any) => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(content.content);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Copy share URL to clipboard
      await navigator.clipboard.writeText(shareUrl);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to copy share URL:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleAIEdit = async () => {
    if (!editInstruction.trim() || !report.workspaceId || !report.userId) return;
    
    setIsEditingWithAI(true);
    let updatedContent = '';

    try {
      const context = deepValueReportService['buildRecordContext'](record, recordType);
      
      for await (const chunk of deepValueReportService.updateReportWithAI(
        report.id,
        editInstruction,
        content,
        context,
        report.workspaceId,
        report.userId
      )) {
        if (chunk.type === 'chunk' && chunk.content) {
          updatedContent += chunk.content;
          setContent(updatedContent);
        } else if (chunk.type === 'complete') {
          setIsEditingWithAI(false);
          setEditInstruction('');
          // Auto-save updated content
          try {
            await deepValueReportService.saveReportToWorkshop(report, updatedContent);
          } catch (error) {
            console.error('Failed to save updated report:', error);
          }
        } else if (chunk.type === 'error') {
          setIsEditingWithAI(false);
          // TODO: Show error message
        }
      }
    } catch (error) {
      console.error('AI edit error:', error);
      setIsEditingWithAI(false);
    }
  };

  const getBreadcrumb = () => {
    const recordName = record.fullName || record.name || record.companyName || 'Record';
    return `${recordName} > ${report.title}`;
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span className="text-[var(--foreground)] font-medium">{getBreadcrumb()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-[var(--muted)]">Saving...</span>
          )}
          {isGenerating && (
            <span className="text-xs text-[var(--muted)]">Generating...</span>
          )}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      {/* AI Edit Section */}
      {!isGenerating && content && (
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--panel-background)]">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Ask Adrata to edit the report (e.g., 'Make this more concise', 'Add a section on...')"
              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isEditingWithAI}
            />
            <button
              onClick={handleAIEdit}
              disabled={!editInstruction.trim() || isEditingWithAI}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditingWithAI ? 'Editing...' : 'Edit with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isGenerating && !content ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-[var(--muted)]">Generating your deep value report...</p>
            </div>
          </div>
        ) : (
          <LexicalComposer initialConfig={initialConfig}>
            <div className="h-full flex flex-col">
              <ToolbarPlugin onShare={handleShare} />
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
                  placeholder={<Placeholder hasContent={!!content} />}
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <AutoFocusPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <AutoSavePlugin onAutoSave={handleAutoSave} />
              </div>
            </div>
          </LexicalComposer>
        )}
      </div>
    </div>
  );
}
