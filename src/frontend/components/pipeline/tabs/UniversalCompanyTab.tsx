"use client";

import React, { useState } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';

interface UniversalCompanyTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalCompanyTab({ recordType, record: recordProp, onSave }: UniversalCompanyTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const formatEmptyValue = (value: any): string => {
    if (!value || value === '' || value === 'null' || value === 'undefined') {
      return '-';
    }
    return value;
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

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading company details..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Company Data Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      website: record?.website,
      linkedinUrl: record?.linkedinUrl,
      linkedin: record?.linkedin
    });
  }

  // Helper function to get value or null (no fallback to '-')
  const getValue = (value: any) => value || null;
  
  // Helper component for displaying values with proper empty state
  const DisplayValue = ({ value, children, className = "text-sm font-medium text-[var(--foreground)]" }: { 
    value: any, 
    children?: React.ReactNode, 
    className?: string 
  }) => {
    if (value) {
      return <span className={className}>{children || value}</span>;
    }
    return <span className="text-sm text-[var(--muted)]">-</span>;
  };
  
  // Use real company data from record - no fallback to '-'
  const companyData = {
    name: getValue(record.name),
    industry: getValue(record.industry),
    size: getValue(record.size || record.employeeCount),
    revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : null,
    location: record.city && record.state ? `${record.city}, ${record.state}` : getValue(record.address),
    website: getValue(record.website),
    linkedin: getValue(record?.customFields?.linkedinUrl || 
              record?.customFields?.linkedin || 
              record?.linkedinUrl || 
              record?.linkedin),
    founded: getValue(record.foundedYear || record.founded),
    ceo: getValue(record.ceo),
    description: (() => {
      // Prioritize the longer, more detailed description for better seller context
      const originalDesc = record.description && record.description.trim() !== '' ? record.description.trim() : '';
      const enrichedDesc = record.descriptionEnriched && record.descriptionEnriched.trim() !== '' ? record.descriptionEnriched.trim() : '';
      
      // Use the longer description for better context, or enriched if original is not available
      if (originalDesc && enrichedDesc) {
        return originalDesc.length > enrichedDesc.length ? originalDesc : enrichedDesc;
      } else if (originalDesc) {
        return originalDesc;
      } else if (enrichedDesc) {
        return enrichedDesc;
      }
      
      // Return null instead of fallback text to let InlineEditField show its placeholder
      return null;
    })(),
    marketCap: getValue(record.marketCap),
    employees: getValue(record.employeeCount || record.size),
    headquarters: (() => {
      // Try enriched CoreSignal data first
      const hqLocation = record.hqLocation || '';
      const hqCity = record.hqCity || '';
      const hqState = record.hqState || '';
      const hqFullAddress = record.hqFullAddress || '';
      
      // Fallback to basic fields
      const address = record.address || '';
      const city = record.city || '';
      const state = record.state || '';
      
      // Use enriched data if available
      if (hqLocation) {
        return hqLocation;
      } else if (hqFullAddress) {
        return hqFullAddress;
      } else if (hqCity && hqState) {
        return `${hqCity}, ${hqState}`;
      } else if (address && city && state) {
        return `${address}, ${city}, ${state}`;
      } else if (city && state) {
        return `${city}, ${state}`;
      } else if (address) {
        return address;
      } else if (city) {
        return city;
      }
      return null;
    })(),
    businessModel: getValue(record.businessModel),
    keyProducts: record.keyProducts || [],
    competitors: record.competitors || [],
    recentNews: record.recentNews || [],
    financials: {
      revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : null,
      growth: getValue(record.growth),
      profitMargin: getValue(record.profitMargin),
      debtToEquity: getValue(record.debtToEquity),
      peRatio: getValue(record.peRatio)
    },
    technology: {
      cloudAdoption: getValue(record.cloudAdoption),
      aiUsage: getValue(record.aiUsage),
      securityRating: getValue(record.securityRating),
      compliance: record.compliance || []
    }
  };

  // Generate engagement data from real CoreSignal data
  const generateEngagementData = () => {
    // Use real data from CoreSignal enrichment
    const linkedinFollowers = record?.linkedinFollowers || 0;
    const twitterFollowers = record?.twitterFollowers || 0;
    const owlerFollowers = record?.owlerFollowers || 0;
    const activeJobPostings = record?.activeJobPostings || 0;
    const companyUpdates = record?.companyUpdates || [];
    const technologiesUsed = record?.technologiesUsed || [];
    const competitors = record?.competitors || [];
    const employeeCount = record?.employeeCount || 0;
    
    // Calculate engagement based on real metrics
    const totalFollowers = linkedinFollowers + (twitterFollowers || 0) + (owlerFollowers || 0);
    const engagementLevel = totalFollowers > 100000 ? 'High' : totalFollowers > 10000 ? 'Medium' : 'Low';
    
    // Use real activity data
    const lastActivity = companyUpdates?.length > 0 ? 
      new Date(companyUpdates[0].date).toLocaleDateString() : null;
    
    // Use more realistic calculations based on actual company data
    const totalContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length * 2, 50) : 0;
    const activeContacts = companyUpdates?.length > 0 ? Math.min(companyUpdates.length, 20) : 0;
    const decisionMakers = employeeCount > 1000 ? Math.min(Math.floor(employeeCount / 1000), 10) : 
                          employeeCount > 100 ? Math.min(Math.floor(employeeCount / 100), 5) : 1;
    const nextAction = activeJobPostings > 0 ? 'Review job postings' : 
                      companyUpdates?.length > 0 ? 'Follow up on recent updates' : 'Research company updates';
    const opportunityStage = record?.isPublic ? 'Public Company' : 'Private Company';

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

  // Generate recent activity from real CoreSignal company updates
  const generateRecentActivity = () => {
    const companyUpdates = record?.companyUpdates || [];
    
    if (companyUpdates.length === 0) {
      return [{
        type: 'No recent activity',
        contact: 'Company Updates',
        time: null,
        description: 'No recent company updates available',
        color: 'gray'
      }];
    }

    // Take the first 4 most recent company updates and format them
    return companyUpdates.slice(0, 4).map((update: any, index: number) => {
      const colors = ['blue', 'green', 'purple', 'orange'];
      const activityTypes = ['Company Update', 'LinkedIn Post', 'Company News', 'Industry Update'];
      
      // Use real follower count from the update or fallback to company data
      const followerCount = update.followers || record?.linkedinFollowers || 0;
      
      return {
        type: activityTypes[index] || 'Company Update',
        contact: `${record?.name || 'Company'} (${followerCount.toLocaleString()} followers)`,
        time: new Date(update.date).toLocaleDateString(),
        description: update.description?.substring(0, 100) + (update.description?.length > 100 ? '...' : ''),
        color: colors[index] || 'blue'
      };
    });
  };

  const recentActivity = generateRecentActivity();

  return (
    <div className="space-y-8">
      {/* Company Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Summary</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <InlineEditField
            value={companyData.description}
            field="description"
            onSave={onSave || (() => Promise.resolve())}
            recordId={record.id}
            recordType={recordType}
            onSuccess={handleSuccess}
            type="textarea"
            className="text-sm text-[var(--foreground)] leading-relaxed font-medium"
            placeholder="Enter company description..."
          />
        </div>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Company Name:</span>
                <InlineEditField
                  value={companyData.name}
                  field="name"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Legal Name:</span>
                <InlineEditField
                  value={record?.legalName || ''}
                  field="legalName"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Trading Name:</span>
                <InlineEditField
                  value={record?.tradingName || ''}
                  field="tradingName"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Local Name:</span>
                <InlineEditField
                  value={record?.localName || ''}
                  field="localName"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Total Employees:</span>
                <InlineEditField
                  value={companyData.size}
                  field="size"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">HQ Location:</span>
                <DisplayValue value={companyData.headquarters} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Founded:</span>
                <DisplayValue value={record?.foundedYear}>
                  {(() => {
                    if (record?.foundedYear) {
                      const currentYear = new Date().getFullYear();
                      const yearsInBusiness = currentYear - record.foundedYear;
                      return `${yearsInBusiness} years ago (${record.foundedYear})`;
                    }
                    return null;
                  })()}
                </DisplayValue>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Company Type:</span>
                <DisplayValue value={record?.isPublic !== undefined}>
                  {record?.isPublic ? 'Public Company' : record?.isPublic === false ? 'Private Company' : null}
                </DisplayValue>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Phone:</span>
                <InlineEditField
                  value={record?.phone || ''}
                  field="phone"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Contact & Market</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Email:</span>
                <InlineEditField
                  value={record?.email || ''}
                  field="email"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="email"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Fax:</span>
                <InlineEditField
                  value={record?.fax || ''}
                  field="fax"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Website:</span>
                <InlineEditField
                  value={companyData.website}
                  field="website"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="text"
                  className="text-sm font-medium"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn:</span>
                <InlineEditField
                  value={companyData.linkedin || ''}
                  field="linkedinUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={record?.linkedinNavigatorUrl || ''}
                  field="linkedinNavigatorUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Market:</span>
                <DisplayValue value={record?.industry} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Category:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {(() => {
                    // AI-powered market category determination
                    const industry = record?.industry?.toLowerCase() || '';
                    const naicsCodes = record?.naicsCodes || [];
                    const sicCodes = record?.sicCodes || [];
                    const description = record?.description?.toLowerCase() || '';
                    const technologies = record?.technologiesUsed || [];
                    
                    // Determine market category based on industry and codes
                    if (industry.includes('utility') || naicsCodes.includes('61') || sicCodes.includes('49')) {
                      return 'Energy & Utilities';
                    } else if (industry.includes('telecommunications') || industry.includes('technology')) {
                      return 'Technology & Communications';
                    } else if (industry.includes('construction') || industry.includes('engineering')) {
                      return 'Infrastructure & Construction';
                    } else if (industry.includes('healthcare') || industry.includes('medical')) {
                      return 'Healthcare & Life Sciences';
                    } else if (industry.includes('financial') || industry.includes('banking')) {
                      return 'Financial Services';
                    } else if (industry.includes('retail') || industry.includes('consumer')) {
                      return 'Consumer & Retail';
                    } else if (industry.includes('manufacturing') || industry.includes('industrial')) {
                      return 'Manufacturing & Industrial';
                    } else {
                      return 'Professional Services';
                    }
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Segment:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {(() => {
                    // AI-powered market segment determination
                    const industry = record?.industry?.toLowerCase() || '';
                    const employeeCount = record?.employeeCount || 0;
                    const technologies = record?.technologiesUsed || [];
                    const description = record?.description?.toLowerCase() || '';
                    const isPublic = record?.isPublic;
                    
                    // Determine market segment based on company characteristics
                    if (industry.includes('utility') || industry.includes('utilities')) {
                      if (employeeCount > 10000) {
                        return 'Large Regional Utilities';
                      } else if (employeeCount > 1000) {
                        return 'Mid-Market Utilities';
                      } else {
                        return 'Small Utilities & Co-ops';
                      }
                    } else if (industry.includes('telecommunications')) {
                      if (technologies.length > 200) {
                        return 'Enterprise Telecom';
                      } else {
                        return 'Mid-Market Telecom';
                      }
                    } else if (industry.includes('technology')) {
                      if (isPublic || employeeCount > 5000) {
                        return 'Enterprise Technology';
                      } else {
                        return 'Mid-Market Technology';
                      }
                    } else if (industry.includes('construction') || industry.includes('engineering')) {
                      if (employeeCount > 5000) {
                        return 'Large Infrastructure';
                      } else {
                        return 'Mid-Market Construction';
                      }
                    } else {
                      // Generic segmentation based on size
                      if (employeeCount > 10000) {
                        return 'Enterprise';
                      } else if (employeeCount > 1000) {
                        return 'Mid-Market';
                      } else {
                        return 'Small Business';
                      }
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Location Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Basic Location */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Primary Address</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Address:</span>
                <InlineEditField
                  value={record?.address || ''}
                  field="address"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">City:</span>
                <InlineEditField
                  value={record?.city || ''}
                  field="city"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">State:</span>
                <InlineEditField
                  value={record?.state || ''}
                  field="state"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Country:</span>
                <InlineEditField
                  value={record?.country || ''}
                  field="country"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Postal Code:</span>
                <InlineEditField
                  value={record?.postalCode || ''}
                  field="postalCode"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Headquarters */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Headquarters</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">HQ Street:</span>
                <InlineEditField
                  value={record?.hqStreet || ''}
                  field="hqStreet"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">HQ City:</span>
                <InlineEditField
                  value={record?.hqCity || ''}
                  field="hqCity"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">HQ State:</span>
                <InlineEditField
                  value={record?.hqState || ''}
                  field="hqState"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">HQ Zip:</span>
                <InlineEditField
                  value={record?.hqZipcode || ''}
                  field="hqZipcode"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">HQ Full:</span>
                <InlineEditField
                  value={record?.hqFullAddress || ''}
                  field="hqFullAddress"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Profile */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Business Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Business Details */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Business Details</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Industry:</span>
                <InlineEditField
                  value={record?.industry || ''}
                  field="industry"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Target Industry:</span>
                <InlineEditField
                  value={record?.customFields?.targetIndustry || ''}
                  field="targetIndustry"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="e.g., Title Companies, Healthcare Providers"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Sector:</span>
                <InlineEditField
                  value={record?.sector || ''}
                  field="sector"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Revenue:</span>
                <InlineEditField
                  value={record?.revenue ? record.revenue.toString() : ''}
                  field="revenue"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Currency:</span>
                <InlineEditField
                  value={record?.currency || ''}
                  field="currency"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Founded:</span>
                <InlineEditField
                  value={record?.foundedYear ? record.foundedYear.toString() : ''}
                  field="foundedYear"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Employees:</span>
                <InlineEditField
                  value={record?.employeeCount ? record.employeeCount.toString() : ''}
                  field="employeeCount"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Legal & Registration */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Legal & Registration</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Domain:</span>
                <InlineEditField
                  value={record?.domain || ''}
                  field="domain"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Reg Number:</span>
                <InlineEditField
                  value={record?.registrationNumber || ''}
                  field="registrationNumber"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Tax ID:</span>
                <InlineEditField
                  value={record?.taxId || ''}
                  field="taxId"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">VAT Number:</span>
                <InlineEditField
                  value={record?.vatNumber || ''}
                  field="vatNumber"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Logo URL:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.logoUrl)}
                  field="logoUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media & Online Presence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Social Media & Online Presence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Social URLs */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Social Media URLs</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.linkedinUrl)}
                  field="linkedinUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn Navigator:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.linkedinNavigatorUrl)}
                  field="linkedinNavigatorUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Twitter:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.twitterUrl)}
                  field="twitterUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Facebook:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.facebookUrl)}
                  field="facebookUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Instagram:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.instagramUrl)}
                  field="instagramUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">GitHub:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.githubUrl)}
                  field="githubUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">YouTube:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.youtubeUrl)}
                  field="youtubeUrl"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Follower Counts */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Follower Counts</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">LinkedIn:</span>
                <InlineEditField
                  value={record?.linkedinFollowers ? record.linkedinFollowers.toString() : ''}
                  field="linkedinFollowers"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Twitter:</span>
                <InlineEditField
                  value={record?.twitterFollowers ? record.twitterFollowers.toString() : ''}
                  field="twitterFollowers"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Job Postings:</span>
                <InlineEditField
                  value={record?.activeJobPostings ? record.activeJobPostings.toString() : ''}
                  field="activeJobPostings"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Tech Count:</span>
                <InlineEditField
                  value={record?.numTechnologiesUsed ? record.numTechnologiesUsed.toString() : ''}
                  field="numTechnologiesUsed"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Digital Maturity:</span>
                <InlineEditField
                  value={record?.digitalMaturity ? record.digitalMaturity.toString() : ''}
                  field="digitalMaturity"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Intelligence - Key Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Seller Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Technology Stack</h4>
            <div className="text-2xl font-bold text-green-600">{record?.technologiesUsed?.length || 0}</div>
            <div className="text-xs text-[var(--muted)] mt-1">Systems in use</div>
            <div className="text-xs text-[var(--muted)] mt-1">Complexity indicator</div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Hiring Activity</h4>
            <div className="text-2xl font-bold text-purple-600">{record?.activeJobPostings || 0}</div>
            <div className="text-xs text-[var(--muted)] mt-1">Active job postings</div>
            <div className="text-xs text-[var(--muted)] mt-1">Growth indicator</div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Social Reach</h4>
            <div className="text-2xl font-bold text-blue-600">
              {record?.linkedinFollowers ? `${(record.linkedinFollowers / 1000).toFixed(0)}K` : '-'}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">LinkedIn followers</div>
            <div className="text-xs text-[var(--muted)] mt-1">Brand strength</div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Competitive Landscape</h4>
            <div className="text-2xl font-bold text-orange-600">{record?.competitors?.length || 0}</div>
            <div className="text-xs text-[var(--muted)] mt-1">Competitors identified</div>
            <div className="text-xs text-[var(--muted)] mt-1">Market positioning</div>
          </div>
        </div>
      </div>

      {/* Strategic Seller Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Strategic Seller Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Technology Complexity</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Total Technologies:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{record?.technologiesUsed?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Integration Complexity:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {(record?.technologiesUsed?.length || 0) > 200 ? 'High' : (record?.technologiesUsed?.length || 0) > 50 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">
                {(record?.technologiesUsed?.length || 0) > 200 ? 'Complex integration challenges - TOP\'s expertise valuable' : 
                 (record?.technologiesUsed?.length || 0) > 50 ? 'Moderate complexity - strategic planning needed' : 
                 'Simple stack - focus on efficiency gains'}
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Market Position</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Company Type:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {record?.isPublic ? 'Public Company' : 'Private Company'}
                  {record?.stockSymbol && ` (${record.stockSymbol})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Competitive Pressure:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {(record?.competitors?.length || 0) > 15 ? 'High' : (record?.competitors?.length || 0) > 5 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-2">
                {(record?.competitors?.length || 0) > 15 ? 'Highly competitive market - differentiation key' : 
                 (record?.competitors?.length || 0) > 5 ? 'Moderate competition - value proposition important' : 
                 'Less competitive - relationship building crucial'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Position & Metadata */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Market Position & Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Market Position */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Market Position</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Market Position:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.marketPosition)}
                  field="marketPosition"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Stock Symbol:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.stockSymbol)}
                  field="stockSymbol"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Public Company:</span>
                <InlineEditField
                  value={record?.isPublic !== undefined ? (record.isPublic ? 'Yes' : 'No') : ''}
                  field="isPublic"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' }
                  ]}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Key Influencers:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.keyInfluencers)}
                  field="keyInfluencers"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Status & Priority */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Status & Priority</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Status:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.status)}
                  field="status"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'PROSPECT', label: 'Prospect' },
                    { value: 'CUSTOMER', label: 'Customer' }
                  ]}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Priority:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.priority)}
                  field="priority"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  inputType="select"
                  options={[
                    { value: 'HIGH', label: 'High' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'LOW', label: 'Low' }
                  ]}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Tags:</span>
                <InlineEditField
                  value={record?.tags ? record.tags.join(', ') : ''}
                  field="tags"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Notes:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.notes)}
                  field="notes"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Company Activity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent Company Activity</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <div className="space-y-3">
            {recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  activity.color === 'blue' ? 'bg-blue-500' :
                  activity.color === 'green' ? 'bg-green-500' :
                  activity.color === 'purple' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    {activity.type} from {activity.contact}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {activity.time} • {activity.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Tracking & Funding */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Action Tracking & Funding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Action Tracking */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Action Tracking</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Last Action:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.lastAction)}
                  field="lastAction"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Last Action Date:</span>
                <InlineEditField
                  value={record?.lastActionDate ? new Date(record.lastActionDate).toISOString().split('T')[0] : ''}
                  field="lastActionDate"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  variant="date"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Next Action:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.nextAction)}
                  field="nextAction"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Next Action Date:</span>
                <InlineEditField
                  value={record?.nextActionDate ? new Date(record.nextActionDate).toISOString().split('T')[0] : ''}
                  field="nextActionDate"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  variant="date"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Action Status:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.actionStatus)}
                  field="actionStatus"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Next Action Type:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.nextActionType)}
                  field="nextActionType"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Funding & Financial */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Funding & Financial</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Last Funding:</span>
                <InlineEditField
                  value={record?.lastFundingAmount ? record.lastFundingAmount.toString() : ''}
                  field="lastFundingAmount"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Funding Date:</span>
                <InlineEditField
                  value={record?.lastFundingDate ? new Date(record.lastFundingDate).toISOString().split('T')[0] : ''}
                  field="lastFundingDate"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  variant="date"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Opportunity Amount:</span>
                <InlineEditField
                  value={record?.opportunityAmount ? record.opportunityAmount.toString() : ''}
                  field="opportunityAmount"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Opportunity Probability:</span>
                <InlineEditField
                  value={record?.opportunityProbability ? record.opportunityProbability.toString() : ''}
                  field="opportunityProbability"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="number"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Opportunity Stage:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.opportunityStage)}
                  field="opportunityStage"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Decision Timeline:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.decisionTimeline)}
                  field="decisionTimeline"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Company & Strategy */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Parent Company & Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Parent Company */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Parent Company</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Parent Name:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.parentCompanyName)}
                  field="parentCompanyName"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Parent Domain:</span>
                <InlineEditField
                  value={formatEmptyValue(record?.parentCompanyDomain)}
                  field="parentCompanyDomain"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Business Challenges:</span>
                <InlineEditField
                  value={record?.businessChallenges ? record.businessChallenges.join(', ') : ''}
                  field="businessChallenges"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter challenges separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Business Priorities:</span>
                <InlineEditField
                  value={record?.businessPriorities ? record.businessPriorities.join(', ') : ''}
                  field="businessPriorities"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter priorities separated by commas"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Strategy & Competitive */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Strategy & Competitive</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Competitive Advantages:</span>
                <InlineEditField
                  value={record?.competitiveAdvantages ? record.competitiveAdvantages.join(', ') : ''}
                  field="competitiveAdvantages"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter advantages separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Strategic Initiatives:</span>
                <InlineEditField
                  value={record?.strategicInitiatives ? record.strategicInitiatives.join(', ') : ''}
                  field="strategicInitiatives"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter initiatives separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Growth Opportunities:</span>
                <InlineEditField
                  value={record?.growthOpportunities ? record.growthOpportunities.join(', ') : ''}
                  field="growthOpportunities"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter opportunities separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Success Metrics:</span>
                <InlineEditField
                  value={record?.successMetrics ? record.successMetrics.join(', ') : ''}
                  field="successMetrics"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter metrics separated by commas"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classification Codes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Classification Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Industry Codes */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Industry Codes</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">NAICS Codes:</span>
                <InlineEditField
                  value={record?.naicsCodes ? record.naicsCodes.join(', ') : ''}
                  field="naicsCodes"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter NAICS codes separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">SIC Codes:</span>
                <InlineEditField
                  value={record?.sicCodes ? record.sicCodes.join(', ') : ''}
                  field="sicCodes"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter SIC codes separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Sources:</span>
                <InlineEditField
                  value={record?.sources ? record.sources.join(', ') : ''}
                  field="sources"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter sources separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Competitors:</span>
                <InlineEditField
                  value={record?.competitors ? record.competitors.join(', ') : ''}
                  field="competitors"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter competitors separated by commas"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Technology & Additional */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Technology & Additional</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Tech Stack:</span>
                <InlineEditField
                  value={record?.techStack ? record.techStack.join(', ') : ''}
                  field="techStack"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter technologies separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Technologies Used:</span>
                <InlineEditField
                  value={record?.technologiesUsed ? record.technologiesUsed.join(', ') : ''}
                  field="technologiesUsed"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter technologies separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Market Threats:</span>
                <InlineEditField
                  value={record?.marketThreats ? record.marketThreats.join(', ') : ''}
                  field="marketThreats"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  type="textarea"
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter threats separated by commas"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">HQ Region:</span>
                <InlineEditField
                  value={record?.hqRegion ? record.hqRegion.join(', ') : ''}
                  field="hqRegion"
                  onSave={onSave || (() => Promise.resolve())}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  className="text-sm font-medium text-[var(--foreground)]"
                  placeholder="Enter regions separated by commas"
                />
              </div>
            </div>
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


    </div>
  );
}