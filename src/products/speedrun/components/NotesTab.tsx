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
  // Track unsaved changes to prevent external overwrites
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState<boolean>(false);
  const [lastSavedNotes, setLastSavedNotes] = React.useState<string>(notes);
  
  // Timing state for save indicator
  const [timeSinceSave, setTimeSinceSave] = React.useState<number>(0);
  const [saveStartTime, setSaveStartTime] = React.useState<Date | null>(null);

  // Update lastSavedNotes when notes change externally (but not from user input)
  React.useEffect(() => {
    if (notes === lastSavedNotes || !hasUnsavedChanges) {
      setLastSavedNotes(notes);
    }
  }, [notes, lastSavedNotes, hasUnsavedChanges]);

  // Track timing for save indicator color transition
  React.useEffect(() => {
    if (saveStatus === 'saved') {
      setSaveStartTime(new Date());
      setTimeSinceSave(0);
    } else {
      setSaveStartTime(null);
      setTimeSinceSave(0);
    }
  }, [saveStatus]);

  // Update time since save every second when in saved state
  React.useEffect(() => {
    if (saveStartTime && saveStatus === 'saved') {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - saveStartTime.getTime()) / 1000);
        setTimeSinceSave(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [saveStartTime, saveStatus]);

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

  // Handle notes change to track unsaved changes
  const handleNotesChange = React.useCallback((newNotes: string) => {
    setNotes(newNotes);
    setHasUnsavedChanges(newNotes !== lastSavedNotes);
  }, [setNotes, lastSavedNotes]);

  // Enhanced save handler that updates tracking state
  const handleSave = React.useCallback(async (value: string) => {
    if (onSave) {
      try {
        await onSave(value);
        setLastSavedNotes(value);
        setHasUnsavedChanges(false);
      } catch (error) {
        setHasUnsavedChanges(true);
        throw error; // Re-throw to let NotesEditor handle the error
      }
    }
  }, [onSave]);

  return (
    <div className="h-full flex flex-col">
      {/* Notes Header */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          {/* Show auto-save message instead of saving status */}
          <span className="text-xs text-muted">
            Notes are saved automatically
          </span>
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500 flex items-center gap-1">
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
          onChange={handleNotesChange}
          placeholder="Add your notes here..."
          autoSave={!!onSave}
          saveStatus={saveStatus}
          onSave={handleSave}
          debounceMs={1500}
          lastSavedAt={lastSavedAt}
          className="h-full"
        />
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-2 border-t border-border bg-background">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-4">
            <span>{getWordCount(notes)} words</span>
            <span>{getCharacterCount(notes)} characters</span>
          </div>
          <div className="text-muted">
            {notes.length > 0 && (
              <span>
                {Math.ceil(getWordCount(notes) / 200)} min read
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
