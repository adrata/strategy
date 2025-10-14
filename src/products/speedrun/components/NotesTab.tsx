import React from "react";
import { SpeedrunPerson } from "../types/SpeedrunTypes";
import { NotesEditor } from "@/platform/ui/components/NotesEditor";

interface NotesTabProps {
  person: SpeedrunPerson;
  notes: string;
  setNotes: (notes: string) => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'loading';
  onSave?: (value: string) => Promise<void>;
  lastSavedAt?: Date | null;
}

export function NotesTab({
  person,
  notes,
  setNotes,
  isSaving = false,
  saveStatus = 'idle',
  onSave,
  lastSavedAt = null,
}: NotesTabProps) {
  // Utility functions for notes statistics
  const getWordCount = (text: string) => {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = (text: string) => {
    return text ? text.length : 0;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Notes Statistics Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
          {lastSavedAt && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Last saved {formatTimeAgo(lastSavedAt)}
            </span>
          )}
          <span>{getWordCount(notes)} {getWordCount(notes) === 1 ? 'word' : 'words'}</span>
          <span>{getCharacterCount(notes)} characters</span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Save failed
            </span>
          )}
        </div>
      </div>
      
      {/* Notes Editor */}
      <div className="flex-1">
        <NotesEditor
          value={notes}
          onChange={setNotes}
          placeholder="Add your notes here..."
          autoSave={!!onSave}
          saveStatus={saveStatus}
          onSave={onSave}
          debounceMs={1500}
          lastSavedAt={lastSavedAt}
          className="h-full"
        />
      </div>
    </div>
  );
}
