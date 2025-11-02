import React from 'react';
import { FileText, Image, FileSpreadsheet, FileCode, File } from 'lucide-react';

interface FileDisplayWidgetProps {
  fileName: string;
  fileSize: number;
  fileType?: string;
  onRemove?: () => void;
  className?: string;
}

export function FileDisplayWidget({ 
  fileName, 
  fileSize, 
  fileType, 
  onRemove,
  className = "" 
}: FileDisplayWidgetProps) {
  
  const getFileIcon = () => {
    if (!fileType) return File;
    
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('spreadsheet') || fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) return FileSpreadsheet;
    if (fileType.includes('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) return FileText;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.json')) return FileCode;
    
    return File;
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
  
  const FileIcon = getFileIcon();
  
  return (
    <div className={`inline-flex items-center gap-2 bg-hover rounded-lg px-3 py-2 text-sm border border-border dark:border-border ${className}`}>
      <FileIcon className="h-4 w-4 text-muted dark:text-muted flex-shrink-0" />
      
      <div className="flex flex-col min-w-0">
        <span className="text-foreground dark:text-foreground font-medium truncate max-w-[200px]" title={fileName}>
          {fileName}
        </span>
        <span className="text-muted dark:text-muted text-xs">
          {formatFileSize(fileSize)}
        </span>
      </div>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-muted hover:text-red-500 dark:text-muted dark:hover:text-red-400 ml-1 flex-shrink-0"
          title="Remove file"
        >
          ×
        </button>
      )}
    </div>
  );
}
