import React from "react";

interface NotesSectionProps {
  notesContent: string;
  setNotesContent: (content: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notesContent,
  setNotesContent,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Date header */}
        <div className="pt-2 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted font-medium">
              Today
            </span>
            <div className="flex-1 border-t-2 border-border"></div>
          </div>
        </div>
        {/* Notes content */}
        <div className="flex-1 pb-6">
          <textarea
            value={notesContent}
            onChange={(e) => setNotesContent(e.target.value)}
            placeholder="Start writing..."
            className="w-full h-full min-h-[500px] resize-none border-none outline-none bg-transparent text-foreground placeholder-[var(--muted)] text-base leading-relaxed"
            style={{
              fontFamily:
                'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </div>
      </div>
    </div>
  );
};
