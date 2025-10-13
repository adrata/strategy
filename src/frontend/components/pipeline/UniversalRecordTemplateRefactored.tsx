"use client";

/**
 * UNIVERSAL RECORD TEMPLATE - REFACTORED
 * 
 * Refactored version that uses the tab registry instead of large switch statements.
 * This makes the component more maintainable and easier to extend.
 */

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { getTabsForRecordType, getTabComponent, getTabConfig } from './config/tab-registry';
import { useRecordContext } from '@/platform/ui/context/RecordContext';
import { useInlineEdit } from '@/platform/hooks/useInlineEdit';
import { URLFixer } from './URLFixer';

export interface UniversalRecordTemplateProps {
  record: any;
  recordType: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'sellers' | 'deals' | 'speedrun';
  onBack: () => void;
  onComplete?: () => void;
  onSnooze?: (recordId: string, duration: string) => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onRecordUpdate?: (updatedRecord: any) => void;
  recordIndex?: number;
  totalRecords?: number;
  // Optional customization props
  customTabs?: Array<{ id: string; label: string; icon?: string }>;
  showDialer?: boolean;
  showReports?: boolean;
  contextualActions?: Array<{ id: string; label: string; action: () => void; icon?: string }>;
}

export function UniversalRecordTemplateRefactored({ 
  record, 
  recordType, 
  onBack, 
  onComplete, 
  onSnooze, 
  onNavigatePrevious,
  onNavigateNext,
  onRecordUpdate,
  recordIndex, 
  totalRecords,
  customTabs,
  showDialer = false,
  showReports = false,
  contextualActions = []
}: UniversalRecordTemplateProps) {
  const router = useRouter();
  const { setCurrentRecord, clearCurrentRecord } = useRecordContext();
  
  // Get available tabs for this record type
  const availableTabs = getTabsForRecordType(recordType);
  const defaultTab = availableTabs[0]?.id || 'overview';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  
  // Ref for content container to reset scroll position
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use universal inline edit hook
  const {
    showSuccessMessage,
    successMessage,
    messageType,
    handleEditSave,
    closeMessage,
    showMessage,
  } = useInlineEdit();
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('overview');
  const [hasLoggedAction, setHasLoggedAction] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Use custom tabs if provided, otherwise use registry tabs
  const tabs = customTabs || availableTabs;
  
  // Reset active tab when tabs change to ensure valid tab is selected
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  // Set current record in context
  useEffect(() => {
    if (record) {
      setCurrentRecord(record, recordType || 'unknown');
    }
    return () => {
      clearCurrentRecord();
    };
  }, [record, recordType, setCurrentRecord, clearCurrentRecord]);

  // Reset scroll position when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Handle inline field save
  const handleInlineFieldSave = async (field: string, value: string) => {
    if (!record?.id) return;
    
    try {
      await handleEditSave(field, value, record.id, recordType);
      
      // Update the record in context
      if (onRecordUpdate) {
        onRecordUpdate({
          ...record,
          [field]: value
        });
      }
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Render tab content using the registry
  const renderTabContent = () => {
    const TabComponent = getTabComponent(recordType, activeTab);
    const tabConfig = getTabConfig(recordType, activeTab);
    
    if (!TabComponent) {
      return (
        <div className="p-6 text-center text-[var(--muted)]">
          <p>Tab "{activeTab}" not found for record type "{recordType}"</p>
        </div>
      );
    }

    return (
      <div className="h-full">
        <TabComponent 
          record={record}
          recordType={recordType}
          onSave={handleInlineFieldSave}
        />
      </div>
    );
  };

  // Get record display name
  const getRecordName = () => {
    return record?.name || record?.fullName || record?.firstName || 'Untitled';
  };

  // Get record icon
  const getRecordIcon = () => {
    switch (recordType) {
      case 'people':
      case 'leads':
      case 'prospects':
        return <UserIcon className="h-6 w-6" />;
      case 'companies':
        return <BuildingOfficeIcon className="h-6 w-6" />;
      case 'opportunities':
        return <DocumentTextIcon className="h-6 w-6" />;
      default:
        return <DocumentTextIcon className="h-6 w-6" />;
    }
  };

  if (!record) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--muted)] text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Record Selected</h3>
          <p className="text-[var(--muted)]">Select a record to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <URLFixer />
      
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                title="Go back"
              >
                <XMarkIcon className="h-5 w-5 text-[var(--muted)]" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getRecordIcon()}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[var(--foreground)]">
                    {getRecordName()}
                  </h1>
                  <p className="text-sm text-[var(--muted)]">
                    {recordType.charAt(0).toUpperCase() + recordType.slice(1)}
                    {recordIndex !== undefined && totalRecords && (
                      <span className="ml-2 text-[var(--muted)]">
                        {recordIndex + 1} of {totalRecords}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Navigation buttons */}
              {onNavigatePrevious && (
                <button
                  onClick={onNavigatePrevious}
                  className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                  title="Previous record"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-[var(--muted)]" />
                </button>
              )}
              
              {onNavigateNext && (
                <button
                  onClick={onNavigateNext}
                  className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                  title="Next record"
                >
                  <ChevronRightIcon className="h-5 w-5 text-[var(--muted)]" />
                </button>
              )}

              {/* Contextual actions */}
              {contextualActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="px-3 py-2 text-sm bg-[var(--hover)] hover:bg-[var(--loading-bg)] rounded-lg transition-colors"
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </button>
              ))}

              {/* Dialer button */}
              {showDialer && record.phone && (
                <button
                  onClick={() => window.open(`tel:${record.phone}`)}
                  className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                  title="Call"
                >
                  <PhoneIcon className="h-5 w-5 text-[var(--muted)]" />
                </button>
              )}

              {/* Email button */}
              {record.email && (
                <button
                  onClick={() => window.open(`mailto:${record.email}`)}
                  className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                  title="Email"
                >
                  <EnvelopeIcon className="h-5 w-5 text-[var(--muted)]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-auto"
      >
        {renderTabContent()}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{messageType === 'success' ? '✅' : '❌'}</span>
              <span className="text-sm font-medium">{successMessage}</span>
              <button
                onClick={closeMessage}
                className="ml-2 text-[var(--muted)] hover:text-[var(--muted)]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
