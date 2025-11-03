"use client";

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/platform/api-fetch';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  title: string;
}

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
}

export function AddNoteModal({ isOpen, onClose, workspaceId, userId }: AddNoteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search contacts as user types
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchContacts(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchContacts = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await authFetch(`/api/v1/people?search=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNote = async () => {
    if (!selectedContact || !noteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/notes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          userId,
          contactId: selectedContact.id,
          contactName: selectedContact.name,
          contactCompany: selectedContact.company,
          noteContent: noteContent.trim(),
          source: 'quick_add'
        })
      });

      if (response.ok) {
        console.log(`✅ Note added for ${selectedContact.name}`);
        
        // Reset form
        setSelectedContact(null);
        setNoteContent('');
        setSearchQuery('');
        setSearchResults([]);
        
        // Close modal
        onClose();
      } else {
        console.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setSearchQuery(contact.name);
    setSearchResults([]);
  };

  const handleClose = () => {
    setSelectedContact(null);
    setNoteContent('');
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Add Note</h3>
              <p className="text-sm text-muted">Add a note to a contact</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
          >
            <XMarkIcon className="w-4.5 h-4.5 text-muted" />
          </button>
        </div>

        {/* Contact Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Contact
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or email..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full text-left px-4 py-2 hover:bg-panel-background border-b last:border-b-0"
                >
                  <div className="font-medium text-foreground">{contact.name}</div>
                  <div className="text-sm text-muted">{contact.title} at {contact.company}</div>
                  <div className="text-xs text-muted">{contact.email}</div>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-3 text-muted">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
                <span>Searching contacts...</span>
              </div>
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isLoading && (
            <div className="text-center py-4 text-muted">
              <p className="text-sm">No contacts found matching "{searchQuery}"</p>
              <p className="text-xs mt-1 opacity-75">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Selected Contact */}
        {selectedContact && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border">
            <div className="font-medium text-blue-900">{selectedContact.name}</div>
            <div className="text-sm text-blue-700">{selectedContact.title} at {selectedContact.company}</div>
          </div>
        )}

        {/* Note Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note Content
          </label>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Enter your note..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!selectedContact}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitNote}
            disabled={!selectedContact || !noteContent.trim() || isSubmitting}
            className={`flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm ${
              selectedContact && noteContent.trim() && !isSubmitting
                ? 'bg-blue-200 border-blue-300 text-blue-700 hover:bg-blue-300' // Active state when ready
                : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200' // Default state
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
