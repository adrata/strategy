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
      const originalDesc = record.description && record.description.trim() !== '' ? record.description : '';
      const enrichedDesc = record.descriptionEnriched && record.descriptionEnriched.trim() !== '' ? record.descriptionEnriched : '';
      
      // Use the longer description for better context, or enriched if original is not available
      if (originalDesc && enrichedDesc) {
        return originalDesc.length > enrichedDesc.length ? originalDesc : enrichedDesc;
      } else if (originalDesc) {
        return originalDesc;
      } else if (enrichedDesc) {
        return enrichedDesc;
      }
      
      // Fallback to basic description if no data
      return 'No description available';
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
          <div className="text-sm text-[var(--foreground)] leading-relaxed font-medium">{companyData.description}</div>
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
                  value={formatEmptyValue(record?.phone)}
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
                  value={formatEmptyValue(companyData.linkedin)}
                  field="linkedinUrl"
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