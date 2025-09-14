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
                  <TagIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Name</span>
                  <span className="text-sm text-gray-600">{record.fullName || record.name || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Email</span>
                  <span className="text-sm text-gray-600">{record.email || record.workEmail || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Phone</span>
                  <span className="text-sm text-gray-600">{record.phone || record.workPhone || record.mobilePhone || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Title</span>
                  <span className="text-sm text-gray-600">{record.title || record.jobTitle || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <BuildingOffice2Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Department</span>
                  <span className="text-sm text-gray-600">{record.department || 'Not provided'}</span>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Company</span>
                  <span className="text-sm text-gray-600">{record.company || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <TagIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Industry</span>
                  <span className="text-sm text-gray-600">{record.industry || record.vertical || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <UsersIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Company Size</span>
                  <span className="text-sm text-gray-600">{record.companySize || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Website</span>
                  <span className="text-sm text-gray-600">{record.website || 'Not provided'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Location</span>
                  <span className="text-sm text-gray-600">{record.location || record.city || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            {/* Status and Priority Row */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">Status</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                  {record.status || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">Priority</span>
                <span className="text-sm text-gray-600">{record.priority || 'Medium'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">Last Contact</span>
                <span className="text-sm text-gray-600">{formatDate(record.lastContactDate || record.lastEngagementDate)}</span>
              </div>
            </div>
          </div>
        );

      case 'opportunity':
        return (
          <div className="space-y-6">
            {/* Deal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5" />
                Deal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <span className="text-lg font-semibold text-gray-900">{record.amount ? formatCurrency(record.amount) : 'Not set'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                    {record.stage || 'Unknown'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Probability</label>
                  <span className="text-sm text-gray-900">{record.probability || 0}%</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className="text-sm text-gray-900">{record.priority || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Close Date</label>
                  <span className="text-sm text-gray-900">{formatDate(record.expectedCloseDate)}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <span className="text-sm text-gray-900">{formatDate(record.createdAt)}</span>
                </div>
                {record['actualCloseDate'] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actual Close Date</label>
                    <span className="text-sm text-gray-900">{formatDate(record.actualCloseDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {record['description'] && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{record.description}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <span className="text-sm text-gray-900">{record.industry || 'Not provided'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  {record.website ? (
                    <a href={record.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      {record.website}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-900">Not provided</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <span className="text-sm text-gray-900">{record.phone || 'Not provided'}</span>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
                <div className="text-sm text-gray-900">
                  {[record.address, record.city, record.state, record.country].filter(Boolean).join(', ') || 'Not provided'}
                </div>
              </div>
            )}

            {/* Relationships */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Relationships</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{record._count?.contacts || 0}</div>
                  <div className="text-sm text-gray-500">Contacts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{record._count?.opportunities || 0}</div>
                  <div className="text-sm text-gray-500">Opportunities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{record._count?.activities || 0}</div>
                  <div className="text-sm text-gray-500">Activities</div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Partnership Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Partner Type</label>
                  <span className="text-sm text-gray-900">{record.partnerType || 'Not specified'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                    {record.relationshipStatus || 'Active'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Strength</label>
                  <span className="text-sm text-gray-900">{record.relationshipStrength || 'Medium'}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  {record.website ? (
                    <a href={record.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                      {record.website}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-900">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(record.contactName || record.contactEmail || record.contactPhone) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  {record['contactName'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <span className="text-sm text-gray-900">{record.contactName}</span>
                    </div>
                  )}
                  {record['contactTitle'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <span className="text-sm text-gray-900">{record.contactTitle}</span>
                    </div>
                  )}
                  {record['contactEmail'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <span className="text-sm text-gray-900">{record.contactEmail}</span>
                    </div>
                  )}
                  {record['contactPhone'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <span className="text-sm text-gray-900">{record.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {record['notes'] && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{record.notes}</p>
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
    const UniversalTimelineTab = React.lazy(() => 
      import('@/platform/ui/components/UniversalTimelineTab').then(module => ({ default: module.UniversalTimelineTab }))
    );

    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <UniversalTimelineTab
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
                <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Company</span>
                <span className="text-sm text-gray-600">{record.company || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <TargetIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Industry</span>
                <span className="text-sm text-gray-600">{record.industry || record.vertical || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Company Size</span>
                <span className="text-sm text-gray-600">{record.companySize || 'Not provided'}</span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Website</span>
                <span className="text-sm text-gray-600">{record.website || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Location</span>
                <span className="text-sm text-gray-600">{record.location || record.city || 'Not provided'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Estimated Value</span>
                <span className="text-sm text-gray-600">{record.estimatedValue ? formatCurrency(record.estimatedValue) : 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // For other record types, show a placeholder
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
          <p className="text-sm">Account details for this record type are not available.</p>
        </div>
      </div>
    );
  };

  const renderNotesTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Notes System Coming Soon</h3>
        <p className="text-sm">Note-taking and management features will be available in a future update.</p>
      </div>
    </div>
  );


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{getRecordTitle()}</h2>
                <p className="text-sm text-gray-500">{getRecordSubtitle()}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                        ? 'border-gray-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'timeline' && renderTimelineTab()}
            {activeTab === 'notes' && renderNotesTab()}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
