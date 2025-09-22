"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface UniversalCompanyTabProps {
  recordType: string;
  record?: any;
}

export function UniversalCompanyTab({ recordType, record: recordProp }: UniversalCompanyTabProps) {
  const { record: contextRecord } = useRecordContext();
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
    name: record.name || 'Unknown Company',
    industry: record.industry || 'Unknown Industry',
    size: record.size || record.employeeCount || 'Unknown Size',
    revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : 'Unknown Revenue',
    location: record.city && record.state ? `${record.city}, ${record.state}` : record.address || 'Unknown Location',
    website: record.website || 'No website',
    linkedin: record?.customFields?.linkedinUrl || 
              record?.customFields?.linkedin || 
              record?.linkedinUrl || 
              record?.linkedin || 
              'No LinkedIn',
    founded: record.founded || 'Unknown',
    ceo: record.ceo || 'Unknown',
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

  return (
    <div className="space-y-8">
      {/* Company Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Summary</h3>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">{companyData.description}</div>
        </div>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Company Name</div>
              <div className="text-sm text-gray-800 font-medium">{companyData.name}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Size</div>
              <div className="text-sm text-gray-800 font-medium">{companyData.size}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Headquarters</div>
              <div className="text-sm text-gray-800 font-medium">{companyData.headquarters}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Founded</div>
              <div className="text-sm text-gray-800 font-medium">
                {(() => {
                  const foundedYear = record?.customFields?.coresignalData?.founded_year || record?.founded;
                  if (foundedYear) {
                    const currentYear = new Date().getFullYear();
                    const yearsInBusiness = currentYear - parseInt(foundedYear);
                    return `${yearsInBusiness} years ago (${foundedYear})`;
                  }
                  return 'Unknown';
                })()}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Company Type</div>
              <div className="text-sm text-gray-800 font-medium">
                {record?.customFields?.coresignalData?.type || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Phone</div>
              <div className="text-sm text-gray-800 font-medium">
                {(() => {
                  const phoneNumbers = record?.customFields?.coresignalData?.company_phone_numbers;
                  if (phoneNumbers && phoneNumbers.length > 0) {
                    return phoneNumbers[0]; // Show primary phone number
                  }
                  return 'Unknown';
                })()}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
                   <div>
                     <div className="block text-sm font-medium text-gray-600 mb-1">Website</div>
                     <div className="text-sm font-medium">
                       {companyData.website && companyData.website !== 'No website' ? (
                         <a 
                           href={companyData.website.startsWith('http') ? companyData.website : `https://${companyData.website}`}
                           target="_blank" 
                           rel="noopener noreferrer"
                           style={{ color: '#0171E4' }}
                           className="hover:underline"
                         >
                           {(() => {
                             // Clean URL to show just domain without https://
                             const url = companyData.website.replace(/^https?:\/\/(www\.)?/, '');
                             return url.replace(/\/$/, ''); // Remove trailing slash
                           })()}
                         </a>
                       ) : (
                         <span className="text-gray-800">No website</span>
                       )}
                     </div>
                   </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</div>
              <div className="text-sm font-medium">
                {companyData.linkedin && companyData.linkedin !== 'No LinkedIn' ? (
                  <a 
                    href={companyData.linkedin.startsWith('http') ? companyData.linkedin : `https://${companyData.linkedin}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#0171E4' }}
                    className="hover:underline"
                  >
                    {(() => {
                      // Clean LinkedIn URL to show just domain without https://
                      const url = companyData.linkedin.replace(/^https?:\/\/(www\.)?/, '');
                      return url.replace(/\/$/, ''); // Remove trailing slash
                    })()}
                  </a>
                ) : (
                  <span className="text-gray-800">No LinkedIn</span>
                )}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Market</div>
              <div className="text-sm text-gray-800 font-medium">
                {(() => {
                  // Extract market from external data or fallback to industry
                  const coresignalData = record?.customFields?.coresignalData;
                  if (coresignalData?.categories_and_keywords?.includes('telecommunications')) {
                    return 'Telecommunications';
                  }
                  return record?.industry || 'Unknown';
                })()}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Category</div>
              <div className="text-sm text-gray-800 font-medium">
                {(() => {
                  // Determine category based on services
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
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Segment</div>
              <div className="text-sm text-gray-800 font-medium">
                {(() => {
                  // Determine segment based on specific services
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
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}