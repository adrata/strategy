"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCompanyLists, CompanyList } from '@/platform/hooks/useCompanyLists';
import { CreateCompanyListModal } from './CreateCompanyListModal';

interface CompanyListsDropdownProps {
  section: string;
  selectedListId: string | null;
  onListSelect: (list: CompanyList | null) => void;
  currentFilters?: {
    searchQuery?: string;
    statusFilter?: string;
    priorityFilter?: string;
    verticalFilter?: string;
    revenueFilter?: string;
    lastContactedFilter?: string;
    timezoneFilter?: string;
    companySizeFilter?: string;
    locationFilter?: string;
    technologyFilter?: string;
    sortField?: string;
    sortDirection?: string;
  };
  onUpdateList?: (listId: string) => void;
  workspaceId?: string;
}

export function CompanyListsDropdown({
  section,
  selectedListId,
  onListSelect,
  currentFilters,
  onUpdateList,
  workspaceId
}: CompanyListsDropdownProps) {
  // Only show for companies section
  if (section !== 'companies') {
    return null;
  }

  const { lists, loading, deleteList } = useCompanyLists(workspaceId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<CompanyList | null>(null);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownContentRef.current &&
        !dropdownContentRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get default lists (virtual, not stored in DB)
  const defaultLists: CompanyList[] = [
    {
      id: 'all-companies',
      workspaceId: workspaceId || '',
      userId: '',
      name: 'All Companies',
      description: null,
      isDefault: true,
      filters: null,
      sortField: null,
      sortDirection: null,
      searchQuery: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    },
    {
      id: 'uncontacted',
      workspaceId: workspaceId || '',
      userId: '',
      name: 'Uncontacted',
      description: 'Companies with no recent contact',
      isDefault: true,
      filters: {
        lastContactedFilter: 'uncontacted'
      },
      sortField: 'rank',
      sortDirection: 'desc',
      searchQuery: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
  ];

  // Combine default and custom lists
  const allLists = [...defaultLists, ...lists.filter(list => !list.isDefault)];

  const selectedList = allLists.find(list => list.id === selectedListId) || defaultLists[0];

  const handleListSelect = (list: CompanyList) => {
    onListSelect(list);
    setIsDropdownOpen(false);
  };

  const handleCreateNew = () => {
    setEditingList(null);
    setIsCreateModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleEditList = (list: CompanyList, e: React.MouseEvent) => {
    e.stopPropagation();
    if (list.isDefault && list.id !== 'all-companies' && list.id !== 'uncontacted') {
      // Can't edit default lists
      return;
    }
    setEditingList(list);
    setIsCreateModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleDeleteList = async (list: CompanyList, e: React.MouseEvent) => {
    e.stopPropagation();
    if (list.isDefault || list.id === 'all-companies' || list.id === 'uncontacted') {
      return;
    }
    if (confirm(`Are you sure you want to delete "${list.name}"?`)) {
      try {
        await deleteList(list.id);
        if (selectedListId === list.id) {
          onListSelect(defaultLists[0]); // Reset to "All Companies"
        }
      } catch (error) {
        console.error('Failed to delete list:', error);
        alert('Failed to delete list. Please try again.');
      }
    }
  };

  const handleModalSave = () => {
    setIsCreateModalOpen(false);
    setEditingList(null);
  };

  // Check if current filters differ from selected list
  const filtersDiffer = selectedListId && selectedListId !== 'all-companies' && currentFilters && selectedList.filters;
  const showUpdateButton = filtersDiffer && onUpdateList && selectedListId;

  return (
    <>
      <div className="relative min-w-40" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
        >
          <span className="block truncate text-foreground flex-1">
            {loading ? 'Loading...' : selectedList.name}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-muted flex-shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && isClient && createPortal(
          <div
            ref={dropdownContentRef}
            className="fixed z-[9999] mt-1 w-64 bg-background border border-border rounded-lg shadow-lg"
            style={{
              top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0
            }}
            role="menu"
            aria-orientation="vertical"
          >
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase mb-1">
                Lists
              </div>
              
              {/* Default Lists */}
              {defaultLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => handleListSelect(list)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                    selectedListId === list.id
                      ? 'bg-hover text-gray-800 border border-border'
                      : 'hover:bg-panel-background focus:outline-none focus:bg-panel-background'
                  }`}
                  role="menuitem"
                >
                  <span>{list.name}</span>
                </button>
              ))}

              {/* Custom Lists */}
              {lists.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase mt-2 mb-1">
                    Your Lists
                  </div>
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      className="group relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleListSelect(list)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                          selectedListId === list.id
                            ? 'bg-hover text-gray-800 border border-border'
                            : 'hover:bg-panel-background focus:outline-none focus:bg-panel-background'
                        }`}
                        role="menuitem"
                      >
                        <span className="flex-1 truncate">{list.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleEditList(list, e)}
                            className="p-1 hover:bg-panel-background rounded"
                            title="Edit list"
                          >
                            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteList(list, e)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete list"
                          >
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Add List Button */}
              <div className="border-t border-border mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 hover:bg-panel-background focus:outline-none focus:bg-panel-background text-primary"
                  role="menuitem"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add a list</span>
                </button>
              </div>

              {/* Update List Button */}
              {showUpdateButton && selectedList && (
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingList(selectedList);
                      setIsCreateModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 hover:bg-panel-background focus:outline-none focus:bg-panel-background text-blue-600 dark:text-blue-400"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Update list with current filters</span>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <CreateCompanyListModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingList(null);
          }}
          onSave={handleModalSave}
          editingList={editingList}
          currentFilters={currentFilters}
          useCurrentFilters={!editingList}
        />
      )}
    </>
  );
}

