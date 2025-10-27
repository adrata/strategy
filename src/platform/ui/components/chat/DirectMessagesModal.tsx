"use client";

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { useUnifiedAuth } from "@/platform/auth";

interface DirectMessage {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isOnline?: boolean;
}

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDM: (dm: DirectMessage) => void;
  modalRef: React.RefObject<HTMLDivElement>;
}

export function DirectMessagesModal({ 
  isOpen, 
  onClose, 
  onSelectDM, 
  modalRef 
}: DirectMessagesModalProps) {
  const { user: authUser } = useUnifiedAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dms, setDms] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    if (isOpen) {
      // Simulate loading
      setLoading(true);
      setTimeout(() => {
        setDms([
          {
            id: '1',
            name: 'John Doe',
            lastMessage: 'Hey, how are you?',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            unreadCount: 2,
            isOnline: true
          },
          {
            id: '2',
            name: 'Jane Smith',
            lastMessage: 'Thanks for the update!',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            unreadCount: 0,
            isOnline: false
          },
          {
            id: '3',
            name: 'Mike Johnson',
            lastMessage: 'Let me know when you\'re ready',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            unreadCount: 1,
            isOnline: true
          },
          {
            id: '4',
            name: 'Sarah Wilson',
            lastMessage: 'Perfect, see you tomorrow',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            unreadCount: 0,
            isOnline: false
          }
        ]);
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const filteredDMs = dms.filter(dm => 
    dm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-[400px] max-h-[600px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Direct Messages</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center rounded-md hover:bg-[var(--panel-background)]"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--panel-background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* DM List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[var(--muted)]">
              Loading conversations...
            </div>
          ) : filteredDMs.length === 0 ? (
            <div className="p-4 text-center text-[var(--muted)]">
              {searchQuery ? 'No people found' : 'No direct messages yet'}
            </div>
          ) : (
            <div className="p-2">
              {filteredDMs.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => {
                    onSelectDM(dm);
                    onClose();
                  }}
                  className="w-full flex items-center p-3 rounded-md hover:bg-[var(--panel-background)] transition-colors text-left"
                >
                  <div className="relative mr-3">
                    <div className="w-10 h-10 bg-[var(--panel-background)] rounded-full flex items-center justify-center">
                      {dm.avatar ? (
                        <img 
                          src={dm.avatar} 
                          alt={dm.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-8 h-8 text-[var(--muted)]" />
                      )}
                    </div>
                    {dm.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--background)] rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[var(--foreground)] truncate">
                        {dm.name}
                      </h3>
                      {dm.lastMessageTime && (
                        <span className="text-xs text-[var(--muted)] ml-2">
                          {formatTimeAgo(dm.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-[var(--muted)] truncate flex-1">
                        {dm.lastMessage || 'No messages yet'}
                      </p>
                      {dm.unreadCount && dm.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full min-w-[1.25rem] text-center">
                          {dm.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <button className="w-full flex items-center justify-center px-4 py-2 bg-[var(--panel-background)] hover:bg-[var(--hover)] text-[var(--foreground)] rounded-md transition-colors">
            <PlusIcon className="w-4 h-4 mr-2" />
            Start New Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
