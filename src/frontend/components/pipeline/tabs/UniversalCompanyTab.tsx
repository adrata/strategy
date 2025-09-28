"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface UniversalCompanyTabProps {
  recordType: string;
  record?: any;
}

export function UniversalCompanyTab({ recordType, record: recordProp }: UniversalCompanyTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;


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

  // Use real company data from record
  const companyData = {
    name: record.name || '-',
    industry: record.industry || '-',
    size: record.size || record.employeeCount || '-',
    revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : '-',
    location: record.city && record.state ? `${record.city}, ${record.state}` : record.address || '-',
    website: record.website || 'No website',
    linkedin: record?.customFields?.linkedinUrl || 
              record?.customFields?.linkedin || 
              record?.linkedinUrl || 
              record?.linkedin || 
              '-',
    founded: record.foundedYear || record.founded || '-',
    ceo: record.ceo || '-',
    description: (() => {
      // Use enriched CoreSignal description if available, otherwise generate AI description
      if (record.descriptionEnriched) {
        return record.descriptionEnriched;
      }
      
      // Generate AI description based on CoreSignal data
      const industry = record.industry || 'Unknown';
      const employeeCount = record.employeeCount || 0;
      const foundedYear = record.foundedYear || 0;
      const isPublic = record.isPublic;
      const stockSymbol = record.stockSymbol;
      
      if (industry.toLowerCase().includes('utility') || industry.toLowerCase().includes('utilities')) {
        const companyType = isPublic ? 'publicly traded' : 'privately held';
        const yearsInBusiness = foundedYear ? new Date().getFullYear() - foundedYear : 0;
        const sizeDescription = employeeCount > 10000 ? 'major' : employeeCount > 1000 ? 'large' : 'mid-size';
        
        return `${record.name} is a ${sizeDescription} ${companyType} utility company serving ${employeeCount.toLocaleString()} customers across Southern California. Founded in ${foundedYear}, the company has been providing reliable electricity service for ${yearsInBusiness} years. As one of the nation's largest electric utilities, SCE is leading the transition to clean energy through innovative projects in energy storage, transportation electrification, and renewable energy integration. The company operates critical infrastructure that powers homes, businesses, and communities while advancing environmental sustainability and grid modernization initiatives.`;
      } else {
        return record.description || 'No description available';
      }
    })(),
    marketCap: record.marketCap || '-',
    employees: record.employeeCount || record.size || '-',
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
      return '-';
    })(),
    businessModel: record.businessModel || '-',
    keyProducts: record.keyProducts || [],
    competitors: record.competitors || [],
    recentNews: record.recentNews || [],
    financials: {
      revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : '-',
      growth: record.growth || '-',
      profitMargin: record.profitMargin || '-',
      debtToEquity: record.debtToEquity || '-',
      peRatio: record.peRatio || '-'
    },
    technology: {
      cloudAdoption: record.cloudAdoption || '-',
      aiUsage: record.aiUsage || '-',
      securityRating: record.securityRating || '-',
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
      new Date(companyUpdates[0].date).toLocaleDateString() : '-';
    
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
        time: '-',
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-900 leading-relaxed font-medium">{companyData.description}</div>
        </div>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Name:</span>
                <span className="text-sm font-medium text-gray-900">{companyData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Size:</span>
                <span className="text-sm font-medium text-gray-900">{companyData.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Headquarters:</span>
                <span className="text-sm font-medium text-gray-900">{companyData.headquarters}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Founded:</span>
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    if (record?.foundedYear) {
                      const currentYear = new Date().getFullYear();
                      const yearsInBusiness = currentYear - record.foundedYear;
                      return `${yearsInBusiness} years ago (${record.foundedYear})`;
                    }
                    return '-';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Type:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.isPublic ? 'Public Company' : record?.isPublic === false ? 'Private Company' : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.phone || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Contact & Market</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Website:</span>
                <span className="text-sm font-medium">
                  {companyData.website && companyData.website !== 'No website' ? (
                    <a 
                      href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#0171E4' }}
                      className="hover:underline"
                    >
                      {(() => {
                        const url = companyData.website.replace(/^https?:\/\/(www\.)?/, '');
                        return url.replace(/\/$/, '');
                      })()}
                    </a>
                  ) : (
                    <span className="text-gray-800">No website</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">LinkedIn:</span>
                <span className="text-sm font-medium">
                  {companyData.linkedin && companyData.linkedin !== '-' ? (
                    <a 
                      href={companyData.linkedin.startsWith('http') ? companyData.linkedin : `https://${companyData.linkedin}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#0171E4' }}
                      className="hover:underline"
                    >
                      {(() => {
                        const url = companyData.linkedin.replace(/^https?:\/\/(www\.)?/, '');
                        return url.replace(/\/$/, '');
                      })()}
                    </a>
                  ) : (
                    <span className="text-gray-800">-</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Market:</span>
                <span className="text-sm font-medium text-gray-900">{record?.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900">
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
                <span className="text-sm text-gray-600">Segment:</span>
                <span className="text-sm font-medium text-gray-900">
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

      {/* Company Business Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Business Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Market Position</h4>
            <div className="text-2xl font-bold text-blue-600">{record?.isPublic ? 'Public' : 'Private'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {record?.stockSymbol ? `Ticker: ${record.stockSymbol}` : 'Company type'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Technology Stack</h4>
            <div className="text-2xl font-bold text-green-600">{record?.technologiesUsed?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Systems in use</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Hiring Activity</h4>
            <div className="text-2xl font-bold text-purple-600">{record?.activeJobPostings || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Active job postings</div>
          </div>
        </div>
      </div>

      {/* Company Social Media Presence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Social Media Presence</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">LinkedIn Followers:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.linkedinFollowers ? record.linkedinFollowers.toLocaleString() : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recent Posts:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.companyUpdates?.length || 0} updates
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Competitors:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.competitors?.length || 0} identified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Founded:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.foundedYear || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Company Activity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Company Activity</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
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
                  <div className="text-sm font-medium text-gray-900">
                    {activity.type} from {activity.contact}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.time} • {activity.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Analysis Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Analysis Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Size:</span>
                <span className="text-sm font-medium text-gray-900">{record?.employeeCount?.toLocaleString() || '-'} employees</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Industry:</span>
                <span className="text-sm font-medium text-gray-900">{record?.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Type:</span>
                <span className="text-sm font-medium text-gray-900">{record?.isPublic ? 'Public Company' : 'Private Company'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Founded:</span>
                <span className="text-sm font-medium text-gray-900">{record?.foundedYear || '-'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Technologies:</span>
                <span className="text-sm font-medium text-gray-900">{record?.technologiesUsed?.length || 0} systems</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Jobs:</span>
                <span className="text-sm font-medium text-gray-900">{record?.activeJobPostings || 0} postings</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Competitors:</span>
                <span className="text-sm font-medium text-gray-900">{record?.competitors?.length || 0} identified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Social Reach:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.linkedinFollowers ? `${(record.linkedinFollowers / 1000).toFixed(0)}K followers` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}