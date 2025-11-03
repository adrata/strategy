/**
 * Add DM Modal
 * 
 * Native modal for creating new direct messages
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
}

interface AddDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[]) => void;
  workspaceId: string;
}

export function AddDMModal({ isOpen, onClose, onConfirm }: AddDMModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real implementation, you'd fetch users from your API
      // For now, we'll use a mock list
      const mockUsers: User[] = [
        { id: '1', name: 'Dan Mirolli', email: 'dan@adrata.com', username: 'dan-mirolli' },
        { id: '2', name: 'Todd Nestor', email: 'todd@adrata.com', username: 'todd-nestor' },
        { id: '3', name: 'Ryan Hoffman', email: 'ryan@notary-everyday.com', username: 'ryan-hoffman' },
        { id: '4', name: 'Justin Johnson', email: 'justin@cloudcaddie.com', username: 'justin-johnson' },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length > 0) {
      onConfirm(selectedUsers);
      setSelectedUsers([]);
      setSearchTerm('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Start a Direct Message</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="user-search" className="block text-sm font-medium text-foreground mb-2">
                Search for people
              </label>
              <input
                id="user-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus
              />
            </div>

            {/* User List */}
            <div className="max-h-60 overflow-y-auto border border-border rounded-md">
              {loading ? (
                <div className="p-4 text-center text-muted">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 hover:bg-hover cursor-pointer ${
                      selectedUsers.includes(user.id) ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-muted-light rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-muted" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-foreground">{user.name}</div>
                      <div className="text-sm text-muted">{user.email}</div>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="text-sm text-muted">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedUsers.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
