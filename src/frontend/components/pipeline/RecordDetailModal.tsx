"use client";

import React, { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, UserIcon, DocumentTextIcon, CalendarIcon, CurrencyDollarIcon, TagIcon, MapPinIcon, UsersIcon, GlobeAltIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';

interface RecordDetailModalProps {
  record: any;
  recordType: 'lead' | 'prospect' | 'opportunity' | 'account' | 'contact' | 'customer' | 'partner';
  isOpen: boolean;
  onClose: () => void;
}

export function RecordDetailModal({ record, recordType, isOpen, onClose }: RecordDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'account' | 'timeline' | 'notes'>('overview');

  if (!isOpen || !record) return null;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRecordTitle = () => {
    switch (recordType) {
      case 'lead':
      case 'prospect':
      case 'contact':
        return record.fullName || record.name || 'Unknown Contact';
      case 'opportunity':
        return record.name || 'Unnamed Opportunity';
      case 'account':
      case 'customer':
        return record.name || 'Unknown Company';
      case 'partner':
        return record.name || 'Unknown Partner';
      default:
        return 'Record Details';
    }
  };

  const getRecordSubtitle = () => {
    switch (recordType) {
      case 'lead':
      case 'prospect':
      case 'contact':
        return `${record.title || 'Unknown Title'} at ${record.company || 'Unknown Company'}`;
      case 'opportunity':
        return `${record.stage || 'Unknown Stage'} • ${record.amount ? formatCurrency(record.amount) : 'No amount'}`;
      case 'account':
      case 'customer':
        return record.industry || 'Unknown Industry';
      case 'partner':
        return record.partnerType || 'Strategic Partner';
      default:
        return '';
    }
  };

  const renderOverviewTab = () => {
    switch (recordType) {
      case 'lead':
      case 'prospect':
      case 'contact':
        return (
          <div className="space-y-4">
            {/* Unified Data Display */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TagIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Name</span>
                  <span className="text-sm text-[var(--muted)]">{record.fullName || record.name || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Email</span>
                  <span className="text-sm text-[var(--muted)]">{record.email || record.workEmail || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Phone</span>
                  <span className="text-sm text-[var(--muted)]">{record.phone || record.workPhone || record.mobilePhone || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Title</span>
                  <span className="text-sm text-[var(--muted)]">{record.title || record.jobTitle || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <BuildingOffice2Icon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Department</span>
                  <span className="text-sm text-[var(--muted)]">{record.department || 'Not provided'}</span>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Company</span>
                  <span className="text-sm text-[var(--muted)]">{record.company || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <TagIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Industry</span>
                  <span className="text-sm text-[var(--muted)]">{record.industry || record.vertical || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <UsersIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Total Employees</span>
                  <span className="text-sm text-[var(--muted)]">{record.companySize || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Website</span>
                  <span className="text-sm text-[var(--muted)]">{record.website || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-[var(--muted)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Location</span>
                  <span className="text-sm text-[var(--muted)]">{record.location || record.city || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            {/* Status and Priority Row */}
            <div className="flex items-center gap-6 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--foreground)]">Status</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                  {record.status || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--foreground)]">Priority</span>
                <span className="text-sm text-[var(--muted)]">{record.priority || 'Medium'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--foreground)]">Last Contact</span>
                <span className="text-sm text-[var(--muted)]">{formatDate(record.lastContactDate || record.lastEngagementDate)}</span>
              </div>
            </div>
          </div>
        );

      case 'opportunity':
        return (
          <div className="space-y-6">
            {/* Deal Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5" />
                Deal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <span className="text-lg font-semibold text-[var(--foreground)]">{record.amount ? formatCurrency(record.amount) : 'Not set'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                    {record.stage || 'Unknown'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Probability</label>
                  <span className="text-sm text-[var(--foreground)]">{record.probability || 0}%</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className="text-sm text-[var(--foreground)]">{record.priority || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Close Date</label>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(record.expectedCloseDate)}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(record.createdAt)}</span>
                </div>
                {record['actualCloseDate'] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actual Close Date</label>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(record.actualCloseDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {record['description'] && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Description</h3>
                <p className="text-sm text-gray-700 bg-[var(--panel-background)] p-3 rounded-lg">{record.description}</p>
              </div>
            )}
          </div>
        );

      case 'account':
      case 'customer':
        return (
          <div className="space-y-6">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <span className="text-sm text-[var(--foreground)]">{record.industry || 'Not provided'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  {record.website ? (
                    <a href={record.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      {record.website}
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--foreground)]">Not provided</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <span className="text-sm text-[var(--foreground)]">{record.phone || 'Not provided'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                    {record.accountType || 'Prospect'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            {(record.address || record.city || record.state) && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Location</h3>
                <div className="text-sm text-[var(--foreground)]">
                  {[record.address, record.city, record.state, record.country].filter(Boolean).join(', ') || 'Not provided'}
                </div>
              </div>
            )}

            {/* Relationships */}
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Relationships</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{record._count?.contacts || 0}</div>
                  <div className="text-sm text-[var(--muted)]">Contacts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{record._count?.opportunities || 0}</div>
                  <div className="text-sm text-[var(--muted)]">Opportunities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{record._count?.activities || 0}</div>
                  <div className="text-sm text-[var(--muted)]">Activities</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'partner':
        return (
          <div className="space-y-6">
            {/* Partnership Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Partnership Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Partner Type</label>
                  <span className="text-sm text-[var(--foreground)]">{record.partnerType || 'Not specified'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                    {record.relationshipStatus || 'Active'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Strength</label>
                  <span className="text-sm text-[var(--foreground)]">{record.relationshipStrength || 'Medium'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  {record.website ? (
                    <a href={record.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      {record.website}
                    </a>
                  ) : (
                    <span className="text-sm text-[var(--foreground)]">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(record.contactName || record.contactEmail || record.contactPhone) && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Primary Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  {record['contactName'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <span className="text-sm text-[var(--foreground)]">{record.contactName}</span>
                    </div>
                  )}
                  {record['contactTitle'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <span className="text-sm text-[var(--foreground)]">{record.contactTitle}</span>
                    </div>
                  )}
                  {record['contactEmail'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <span className="text-sm text-[var(--foreground)]">{record.contactEmail}</span>
                    </div>
                  )}
                  {record['contactPhone'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <span className="text-sm text-[var(--foreground)]">{record.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {record['notes'] && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Notes</h3>
                <p className="text-sm text-gray-700 bg-[var(--panel-background)] p-3 rounded-lg">{record.notes}</p>
              </div>
            )}
          </div>
        );

      default:
        return <div>Record type not supported</div>;
    }
  };

  const renderTimelineTab = () => {
    // Import the timeline component dynamically
    const UniversalActionsTab = React.lazy(() => 
      import('@/platform/ui/components/UniversalActionsTab').then(module => ({ default: module.UniversalActionsTab }))
    );

    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <UniversalActionsTab
          entityType={recordType === 'customer' ? 'account' : recordType === 'partner' ? 'account' : recordType}
          entityId={record.id}
          entityData={record}
        />
      </React.Suspense>
    );
  };

  const renderAccountTab = () => {
    // For leads/prospects/contacts, show company/account information
    if (recordType === 'lead' || recordType === 'prospect' || recordType === 'contact') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Company</span>
                <span className="text-sm text-[var(--muted)]">{record.company || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <TargetIcon className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Industry</span>
                <span className="text-sm text-[var(--muted)]">{record.industry || record.vertical || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Company Size</span>
                <span className="text-sm text-[var(--muted)]">{record.companySize || 'Not provided'}</span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Website</span>
                <span className="text-sm text-[var(--muted)]">{record.website || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Location</span>
                <span className="text-sm text-[var(--muted)]">{record.location || record.city || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-[var(--muted)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Estimated Value</span>
                <span className="text-sm text-[var(--muted)]">{record.estimatedValue ? formatCurrency(record.estimatedValue) : 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // For other record types, show a placeholder
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-[var(--muted)]">
          <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Account Information</h3>
          <p className="text-sm">Account details for this record type are not available.</p>
        </div>
      </div>
    );
  };

  const renderNotesTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-[var(--muted)]">
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Notes System Coming Soon</h3>
        <p className="text-sm">Note-taking and management features will be available in a future update.</p>
      </div>
    </div>
  );


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-[var(--panel-background)]0 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-[var(--background)] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-[var(--background)] px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{getRecordTitle()}</h2>
                <p className="text-sm text-[var(--muted)]">{getRecordSubtitle()}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-[var(--background)] text-[var(--muted)] hover:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                {['overview', 'account', 'timeline', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-gray-500 text-[var(--foreground)]'
                        : 'border-transparent text-[var(--muted)] hover:text-gray-700 hover:border-[var(--border)]'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-[var(--background)] px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'timeline' && renderTimelineTab()}
            {activeTab === 'notes' && renderNotesTab()}
          </div>

          {/* Footer */}
          <div className="bg-[var(--panel-background)] px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="bg-[var(--background)] py-2 px-4 border border-[var(--border)] rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
