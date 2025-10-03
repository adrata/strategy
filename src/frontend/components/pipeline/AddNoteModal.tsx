"use client";

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/platform/auth-fetch';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
      const response = await authFetch(`/api/data/search`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.contacts || []);
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
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Note</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
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
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <MagnifyingGlassIcon className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  <div className="text-sm text-gray-600">{contact.title} at {contact.company}</div>
                  <div className="text-xs text-gray-400">{contact.email}</div>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-2 text-gray-500">
              Searching...
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!selectedContact}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitNote}
            disabled={!selectedContact || !noteContent.trim() || isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
