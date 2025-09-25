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
    revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : 'Unknown Revenue',
    location: record.city && record.state ? `${record.city}, ${record.state}` : record.address || 'Unknown Location',
    website: record.website || 'No website',
    linkedin: record?.customFields?.linkedinUrl || 
              record?.customFields?.linkedin || 
              record?.linkedinUrl || 
              record?.linkedin || 
              '-',
    founded: record.founded || '-',
    ceo: record.ceo || '-',
    description: record.description || 'No description available',
    marketCap: record.marketCap || 'Unknown',
    employees: record.employeeCount || record.size || 'Unknown',
    headquarters: (() => {
      const address = record.address || '';
      const city = record.city || '';
      const state = record.state || '';
      
      if (address && city && state) {
        return `${address}, ${city}, ${state}`;
      } else if (city && state) {
        return `${city}, ${state}`;
      } else if (address) {
        return address;
      } else if (city) {
        return city;
      }
      return 'Unknown';
    })(),
    businessModel: record.businessModel || 'Unknown',
    keyProducts: record.keyProducts || [],
    competitors: record.competitors || [],
    recentNews: record.recentNews || [],
    financials: {
      revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : 'Unknown',
      growth: record.growth || 'Unknown',
      profitMargin: record.profitMargin || 'Unknown',
      debtToEquity: record.debtToEquity || 'Unknown',
      peRatio: record.peRatio || 'Unknown'
    },
    technology: {
      cloudAdoption: record.cloudAdoption || 'Unknown',
      aiUsage: record.aiUsage || 'Unknown',
      securityRating: record.securityRating || 'Unknown',
      compliance: record.compliance || []
    }
  };

  // Generate engagement data from associated contacts
  const generateEngagementData = () => {
    // Mock data for now - in real implementation, this would come from associated contacts
    const totalContacts = 8;
    const activeContacts = 5;
    const lastActivity = '2 days ago';
    const decisionMakers = 3;
    const nextAction = 'Follow-up call';
    const engagementLevel = 'High';
    const opportunityStage = 'Qualified';

    return {
      totalContacts,
      activeContacts,
      lastActivity,
      decisionMakers,
      nextAction,
      engagementLevel,
      opportunityStage
    };
  };

  const engagementData = generateEngagementData();

  // Generate recent activity from associated contacts
  const generateRecentActivity = () => {
    return [
      {
        type: 'Email exchange',
        contact: 'Sarah Johnson (HR Director)',
        time: '2 days ago',
        description: 'Discussed implementation timeline',
        color: 'blue'
      },
      {
        type: 'Meeting scheduled',
        contact: 'Mike Chen (CTO)',
        time: '5 days ago',
        description: 'Technical requirements discussion',
        color: 'green'
      },
      {
        type: 'Proposal sent',
        contact: 'Lisa Wang (VP Operations)',
        time: '1 week ago',
        description: 'Custom solution proposal',
        color: 'purple'
      },
      {
        type: 'LinkedIn interaction',
        contact: 'David Kim (Engineering Manager)',
        time: '2 weeks ago',
        description: 'Industry insights shared',
        color: 'orange'
      }
    ];
  };

  const recentActivity = generateRecentActivity();

  return (
    <div className="space-y-8">
      {/* Company Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">{companyData.description}</div>
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
                    const foundedYear = record?.customFields?.coresignalData?.founded_year || record?.founded;
                    if (foundedYear) {
                      const currentYear = new Date().getFullYear();
                      const yearsInBusiness = currentYear - parseInt(foundedYear);
                      return `${yearsInBusiness} years ago (${foundedYear})`;
                    }
                    return 'Unknown';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Type:</span>
                <span className="text-sm font-medium text-gray-900">
                  {record?.customFields?.coresignalData?.type || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    const phoneNumbers = record?.customFields?.coresignalData?.company_phone_numbers;
                    if (phoneNumbers && phoneNumbers.length > 0) {
                      return phoneNumbers[0];
                    }
                    return 'Unknown';
                  })()}
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
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    const coresignalData = record?.customFields?.coresignalData;
                    if (coresignalData?.categories_and_keywords?.includes('telecommunications')) {
                      return 'Telecommunications';
                    }
                    return record?.industry || 'Unknown';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    const coresignalData = record?.customFields?.coresignalData;
                    const categories = coresignalData?.categories_and_keywords || [];
                    
                    if (categories.some(cat => 
                      cat.includes('infrastructure') || 
                      cat.includes('construction') || 
                      cat.includes('installation') ||
                      cat.includes('excavating') ||
                      cat.includes('drilling')
                    )) {
                      return 'Infrastructure & Construction';
                    }
                    return 'Unknown';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Segment:</span>
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    const coresignalData = record?.customFields?.coresignalData;
                    const categories = coresignalData?.categories_and_keywords || [];
                    
                    if (categories.some(cat => 
                      cat.includes('fiber') || 
                      cat.includes('wireless') ||
                      cat.includes('small cell') ||
                      cat.includes('das')
                    )) {
                      return 'Fiber & Wireless Infrastructure';
                    }
                    return 'Unknown';
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Engagement & Activity */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Engagement & Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Overall Engagement</h4>
            <div className="text-2xl font-bold text-blue-600">{engagementData.engagementLevel}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Contact Activity</h4>
            <div className="text-2xl font-bold text-green-600">{engagementData.activeContacts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Last Activity</h4>
            <div className="text-2xl font-bold text-purple-600">{engagementData.lastActivity}</div>
            <div className="text-xs text-gray-500 mt-1">Since last interaction</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Across All Contacts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Across All Contacts</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  activity.color === 'blue' ? 'bg-blue-500' :
                  activity.color === 'green' ? 'bg-green-500' :
                  activity.color === 'purple' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.type} with {activity.contact}
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

      {/* Contact Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Contacts:</span>
                <span className="text-sm font-medium text-gray-900">{engagementData.totalContacts} active contacts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Meeting:</span>
                <span className="text-sm font-medium text-gray-900">{engagementData.lastActivity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Makers:</span>
                <span className="text-sm font-medium text-gray-900">{engagementData.decisionMakers} identified</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Action:</span>
                <span className="text-sm font-medium text-gray-900">{engagementData.nextAction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Engagement Level:</span>
                <span className="text-sm font-medium text-gray-900">{engagementData.engagementLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Opportunity Stage:</span>
                <span className="text-sm font-medium text-gray-900">{engagementData.opportunityStage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}