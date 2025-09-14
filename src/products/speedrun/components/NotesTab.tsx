import React from "react";
import { SpeedrunPerson, Note } from "../types/SpeedrunTypes";

interface NotesTabProps {
  person: SpeedrunPerson;
  notes: Note[];
  newNote: string;
  setNewNote: (note: string) => void;
  addNote: () => void;
  formatTimestamp: (timestamp: string) => string;
}

export function NotesTab({
  person,
  notes,
  newNote,
  setNewNote,
  addNote,
  formatTimestamp,
}: NotesTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Notes
        </h2>
        <span className="text-sm text-[var(--muted)]">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Add New Note */}
      <div className="mb-6 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
        <label className="block text-sm font-medium text-[var(--muted)] mb-2">
          Add a new note
        </label>
        <div className="flex gap-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add your thoughts, meeting notes, or observations..."
            className="flex-1 p-3 border border-[var(--border)] rounded-lg text-[var(--foreground)] bg-[var(--background)] placeholder-[var(--muted)] focus:outline-none resize-vertical min-h-[80px]"
            onKeyDown={(e) => {
              if (e['key'] === "Enter" && (e.metaKey || e.ctrlKey)) {
                addNote();
              }
            }}
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
          >
            Add Note
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          Tip: Press Cmd/Ctrl + Enter to save quickly
        </p>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes['length'] === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
              No notes yet
            </h3>
            <p className="text-[var(--muted)]">
              Add your first note to track important information about{" "}
              {person.name}
            </p>
          </div>
        ) : (
          notes
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .map((note) => (
              <div
                key={note.id}
                className={`border rounded-lg p-4 ${
                  note['author'] === "System"
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-[var(--background)] border-[var(--border)]"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        note['author'] === "System"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {note.author}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {formatTimestamp(note.timestamp)}
                    </span>
                  </div>
                </div>
                <div className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </div>
              </div>
            ))
        )}
      </div>
    </>
  );
}
