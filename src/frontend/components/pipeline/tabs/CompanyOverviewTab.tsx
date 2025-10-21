"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton, Skeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { authFetch } from '@/platform/api-fetch';
import { useUnifiedAuth } from '@/platform/auth';
import { formatUrlForDisplay, getUrlDisplayName } from '@/platform/utils/urlFormatter';

interface CompanyOverviewTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function CompanyOverviewTab({ recordType, record: recordProp, onSave }: CompanyOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const { user: currentUser } = useUnifiedAuth();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Actions state
  const [actions, setActions] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);

  // Determine the actual company ID
  const companyId = useMemo(() => {
    // If recordType is companies, use record.id directly
    if (recordType === 'companies') {
      return record?.id;
    }
    // If it's a person record, get companyId
    return record?.companyId || record?.company?.id;
  }, [record, recordType]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Fetch actions from API
  const fetchActions = useCallback(async () => {
    if (!companyId) {
      setActions([]);
      return;
    }

    setActionsLoading(true);
    setActionsError(null);

    try {
      // Always fetch company actions using the company ID
      const actionsQuery = `companyId=${companyId}`;

      const response = await authFetch(`/api/v1/actions?${actionsQuery}&limit=5&sortBy=createdAt&sortOrder=desc`);
      
      if (response && response.success && Array.isArray(response.data)) {
        setActions(response.data);
      } else {
        setActions([]);
        setActionsError('Failed to fetch actions');
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
      setActions([]);
      setActionsError('Error loading actions');
    } finally {
      setActionsLoading(false);
    }
  }, [companyId]);

  // Fetch actions when component mounts or record changes
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Listen for action creation events to refresh actions
  useEffect(() => {
    // Only add event listeners on client side
    if (typeof window === 'undefined') return;
    
    const handleActionCreated = (event: CustomEvent) => {
      const { recordId } = event.detail || {};
      // Match on company ID, not the person ID
      if (recordId === companyId) {
        console.log('🔄 [COMPANY OVERVIEW] Action created event matches current company, refreshing actions');
        // Refresh actions immediately
        fetchActions();
      }
    };

    document.addEventListener('actionCreated', handleActionCreated as EventListener);
    
    return () => {
      document.removeEventListener('actionCreated', handleActionCreated as EventListener);
    };
  }, [companyId, fetchActions]);

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading company details..." />;
  }

  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined' || (Array.isArray(value) && value.length === 0)) {
      return '-';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  };

  const formatRevenue = (revenue: any): string => {
    if (!revenue) return '-';
    if (typeof revenue === 'string') return revenue;
    if (typeof revenue === 'number') return `$${revenue.toLocaleString()}`;
    return '-';
  };

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') return 'Never';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';

      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Never';
    }
  };

  const formatFullDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') return 'Never';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';

      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Never';
    }
  };

  const generateEngagementData = () => {
    const linkedinFollowers = record?.linkedinFollowers || 0;
    const twitterFollowers = record?.twitterFollowers || 0;
    const activeJobPostings = record?.activeJobPostings || 0;
    const companyUpdates = record?.companyUpdates || [];
    const employeeCount = record?.employeeCount || 0;

    const totalFollowers = linkedinFollowers + (twitterFollowers || 0);
    const engagementLevel = totalFollowers > 100000 ? 'High' : totalFollowers > 10000 ? 'Medium' : 'Low';

    const lastActivity = companyUpdates?.length > 0 ?
      new Date(companyUpdates[0].date).toLocaleDateString() : null;

    const totalContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length * 2, 50) : 0;
    const activeContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length, 20) : 0;
    const decisionMakers = employeeCount > 1000 ? Math.min(Math.floor(employeeCount / 1000), 10) :
                          employeeCount > 100 ? Math.min(Math.floor(employeeCount / 100), 5) : 1;
    const nextAction = activeJobPostings > 0 ? 'Review job postings' :
                      companyUpdates?.length > 0 ? 'Follow up on recent updates' : 'Research company updates';
    const opportunityStage = record?.isPublic ? 'Public Company' : record?.isPublic === false ? 'Private Company' : 'N/A';

    return {
      totalContacts,
      activeContacts,
      lastActivity,
      decisionMakers,
      nextAction: nextAction,
      engagementLevel,
      opportunityStage
    };
  };

  const engagementData = generateEngagementData();

  // Extract company name properly (handle both string and object)
  const companyName = record?.name || 
                     (typeof record?.company === 'string' ? record.company : record?.company?.name) || 
                     'Company';

  return (
    <div className="space-y-8">
      {/* Company Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{companyName} Summary</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <InlineEditField
            value={record?.description || ''}
            field="description"
            onSave={onSave || (() => Promise.resolve())}
            recordId={companyId}
            recordType="companies"
            onSuccess={handleSuccess}
            type="textarea"
            className="text-sm text-[var(--foreground)] leading-relaxed font-medium"
            placeholder="Enter company description..."
          />
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Key Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Revenue</h4>
              <div className="text-2xl font-bold text-green-600">{formatRevenue(record?.revenue)}</div>
            </div>
            <div className="text-xs text-[var(--muted)] mt-2">Annual reported revenue</div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Employees</h4>
              <div className="text-2xl font-bold text-blue-600">{formatEmptyValue(record?.employeeCount)}</div>
            </div>
            <div className="text-xs text-[var(--muted)] mt-2">Total employee count</div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">LinkedIn Followers</h4>
              <div className="text-2xl font-bold text-purple-600">
                {record?.linkedinFollowers ? `${(record.linkedinFollowers).toLocaleString()}` : '-'}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)] mt-2">Social media reach</div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] flex flex-col justify-between">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Tech Stack</h4>
              <div className="text-2xl font-bold text-orange-600">{record?.numTechnologiesUsed || record?.technologiesUsed?.length || 0}</div>
            </div>
            <div className="text-xs text-[var(--muted)] mt-2">Technologies identified</div>
          </div>
        </div>
      </div>

      {/* Company Information & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Company Details</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Legal Name:</span>
              <InlineEditField
                value={record?.legalName || ''}
                field="legalName"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Industry:</span>
              <InlineEditField
                value={record?.industry || ''}
                field="industry"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Sector:</span>
              <InlineEditField
                value={record?.sector || ''}
                field="sector"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Founded Year:</span>
              <InlineEditField
                value={record?.foundedYear?.toString() || ''}
                field="foundedYear"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Company Type:</span>
              <InlineEditField
                value={record?.isPublic !== undefined ? (record.isPublic ? 'Public' : 'Private') : ''}
                field="isPublic"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                inputType="select"
                options={[
                  { value: 'true', label: 'Public' },
                  { value: 'false', label: 'Private' }
                ]}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            {record?.stockSymbol && (
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-32">Stock Symbol:</span>
                <InlineEditField
                  value={record.stockSymbol || ''}
                  field="stockSymbol"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={companyId}
                  recordType="companies"
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contact & Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Contact & Location</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Website:</span>
              <InlineEditField
                value={formatUrlForDisplay(record?.website || '', { maxLength: 40, preserveEnding: 10 })}
                field="website"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="url"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Email:</span>
              <InlineEditField
                value={record?.email || ''}
                field="email"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="email"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Phone:</span>
              <InlineEditField
                value={record?.phone || ''}
                field="phone"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="tel"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">LinkedIn:</span>
              <InlineEditField
                value={formatUrlForDisplay(record?.linkedinUrl || '', { maxLength: 40, preserveEnding: 10 })}
                field="linkedinUrl"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="url"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-32">Headquarters:</span>
              <InlineEditField
                value={record?.hqFullAddress || `${record?.hqCity || ''}${record?.hqCity && record?.hqState ? ', ' : ''}${record?.hqState || ''}`}
                field="hqFullAddress"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seller Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Seller Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Market & Growth</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Market Position:</span>
              <InlineEditField
                value={record?.marketPosition || ''}
                field="marketPosition"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Competitive Pressure:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {(record?.competitors?.length || 0) > 15 ? 'High' : (record?.competitors?.length || 0) > 5 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Hiring Activity:</span>
              <InlineEditField
                value={record?.activeJobPostings?.toString() || ''}
                field="activeJobPostings"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Last Funding:</span>
              <InlineEditField
                value={record?.lastFundingAmount?.toLocaleString() || ''}
                field="lastFundingAmount"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Funding Date:</span>
              <InlineEditField
                value={record?.lastFundingDate ? new Date(record.lastFundingDate).toISOString().split('T')[0] : ''}
                field="lastFundingDate"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                variant="date"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
          </div>

          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] space-y-3">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Engagement & Strategy</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Engagement Level:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{engagementData.engagementLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Decision Makers:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{engagementData.decisionMakers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Next Action:</span>
              <InlineEditField
                value={record?.nextAction || engagementData.nextAction}
                field="nextAction"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Next Action Date:</span>
              <InlineEditField
                value={record?.nextActionDate ? new Date(record.nextActionDate).toISOString().split('T')[0] : ''}
                field="nextActionDate"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                variant="date"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Digital Maturity:</span>
              <InlineEditField
                value={record?.digitalMaturity?.toString() || ''}
                field="digitalMaturity"
                onSave={onSave || (() => Promise.resolve())}
                recordId={companyId}
                recordType="companies"
                onSuccess={handleSuccess}
                type="number"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Actions</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          {actionsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)] mx-auto mb-2"></div>
              <p className="text-sm text-[var(--muted)]">Loading actions...</p>
            </div>
          ) : actionsError ? (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--error)] mb-3">Error loading actions</p>
              <p className="text-xs text-[var(--muted)]">{actionsError}</p>
            </div>
          ) : actions.length > 0 ? (
            <ul className="space-y-2">
              {actions.map((action, index) => (
                <li key={index} className="text-sm text-[var(--muted)] flex items-center gap-2">
                  <span>•</span>
                  {action.type && (
                    <span className="px-2 py-1 bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-medium rounded-full">
                      {action.type}
                    </span>
                  )}
                  <span>{action.action} - {formatRelativeDate(action.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--muted)] mb-3">No actions logged yet</p>
              <p className="text-xs text-[var(--muted)]">Actions will appear here when logged through the Actions tab</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes & Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Notes & Tags</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Internal Notes</h4>
            <InlineEditField
              value={record?.notes || ''}
              field="notes"
              onSave={onSave || (() => Promise.resolve())}
              recordId={companyId}
              recordType="companies"
              onSuccess={handleSuccess}
              type="textarea"
              className="text-sm text-[var(--foreground)] leading-relaxed"
              placeholder="Add internal notes about this company..."
            />
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Tags</h4>
            <InlineEditField
              value={record?.tags?.join(', ') || ''}
              field="tags"
              onSave={onSave || (() => Promise.resolve())}
              recordId={companyId}
              recordType="companies"
              onSuccess={handleSuccess}
              className="text-sm font-medium text-[var(--foreground)]"
              placeholder="Enter tags separated by commas"
            />
          </div>
        </div>
      </div>

      {/* Record Information */}
      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide mb-4">Record Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wide w-28">Created:</span>
            <span className="text-sm text-[var(--foreground)]" title={formatFullDate(record?.createdAt)}>
              {formatRelativeDate(record?.createdAt)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-[var(--muted)] uppercase tracking-wide w-28">Last Updated:</span>
            <span className="text-sm text-[var(--foreground)]" title={formatFullDate(record?.updatedAt)}>
              {formatRelativeDate(record?.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="px-4 py-2 rounded-lg shadow-lg bg-green-50 border border-green-200 text-green-800">
            <div className="flex items-center space-x-2">
              <span>✓</span>
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}