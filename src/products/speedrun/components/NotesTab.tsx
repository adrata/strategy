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
}

export function NotesTab({
  person,
  notes,
  setNotes,
  isSaving = false,
  saveStatus = 'idle',
  onSave,
}: NotesTabProps) {
  return (
    <div className="h-full">
      <NotesEditor
        value={notes}
        onChange={setNotes}
        placeholder="Add your notes here..."
        autoSave={!!onSave}
        saveStatus={saveStatus}
        onSave={onSave}
        debounceMs={1500}
        className="h-full"
      />
    </div>
  );
}
