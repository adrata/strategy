"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface PersonOverviewTabProps {
  recordType: string;
  record?: any;
}

export function PersonOverviewTab({ recordType, record: recordProp }: PersonOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading person details..." />;
  }

  // Safety check: ensure record is an object and not being rendered directly
  if (typeof record !== 'object' || record === null) {
    return <CompanyDetailSkeleton message="Invalid record data..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Person Data Debug] Record structure:', {
      recordKeys: Object.keys(record || {}),
      customFields: record?.customFields,
      company: record?.company,
      buyerGroupRole: record?.customFields?.buyerGroupRole
    });
  }

  // Use real person data from record - ensure all values are strings or arrays
  const personData = {
    name: String(record.fullName || record.name || 'Unknown Person'),
    title: String(record.jobTitle || record.title || 'Unknown Title'),
    email: String(record.email || record.workEmail || 'No email'),
    phone: String(record.phone || record.mobilePhone || record.workPhone || 'No phone'),
    linkedin: String(record.linkedinUrl || record?.customFields?.linkedinUrl || 'No LinkedIn'),
    department: String(record.department || 'Unknown Department'),
    seniority: String(record.seniority || 'Unknown'),
    status: String(record.status || 'active'),
    company: String(record.company || record?.company?.name || record.companyData?.name || 'No company assigned'),
    companyId: record.companyId || null,
    industry: String(record.industry || record?.company?.industry || record.companyData?.industry || 'Unknown Industry'),
    location: String(record.city && record.state ? `${record.city}, ${record.state}` : record.city || record.address || 'Unknown Location'),
    buyerGroupRole: String(record?.customFields?.buyerGroupRole || record?.buyerGroupRole || 'Stakeholder'),
    influenceLevel: String(record?.customFields?.influenceLevel || record?.influenceLevel || 'Medium'),
    engagementPriority: String(record?.customFields?.engagementPriority || record?.engagementPriority || 'Medium'),
    lastContact: String(record.lastContactDate || record.lastContact || 'Never'),
    nextAction: String(record.nextAction || 'No action planned'),
    nextActionDate: record.nextActionDate || null,
    notes: String(record.notes || 'No notes available'),
    tags: Array.isArray(record.tags) ? record.tags : []
  };

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
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
  };

  return (
    <div className="space-y-8">
      {/* Person Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Person Summary</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
            {personData.name} is a {personData.title} at {personData.company}, specializing in {personData.department}. 
            As a {personData.buyerGroupRole} with {personData.influenceLevel.toLowerCase()} influence, they play a key role in 
            decision-making processes. Last contact: {formatRelativeDate(personData.lastContact)}.
          </div>
        </div>
      </div>

      {/* Person Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Person Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Full Name</div>
            <div className="text-sm text-gray-900 font-medium">{personData.name}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Job Title</div>
            <div className="text-sm text-gray-900 font-medium">{personData.title}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Email</div>
            <div className="text-sm text-gray-900 font-medium">
              {personData.email !== 'No email' ? (
                <a href={`mailto:${personData.email}`} className="text-blue-600 hover:underline">
                  {personData.email}
                </a>
              ) : (
                personData.email
              )}
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Phone</div>
            <div className="text-sm text-gray-900 font-medium">
              {personData.phone !== 'No phone' ? (
                <a href={`tel:${personData.phone}`} className="text-blue-600 hover:underline">
                  {personData.phone}
                </a>
              ) : (
                personData.phone
              )}
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</div>
            <div className="text-sm text-gray-900 font-medium">
              {personData.linkedin !== 'No LinkedIn' ? (
                <a 
                  href={personData.linkedin.startsWith('http') ? personData.linkedin : `https://${personData.linkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {personData.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                </a>
              ) : (
                personData.linkedin
              )}
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Department</div>
            <div className="text-sm text-gray-900 font-medium">{personData.department}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Seniority</div>
            <div className="text-sm text-gray-900 font-medium">{personData.seniority}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Status</div>
            <div className="text-sm text-gray-900 font-medium capitalize">{personData.status}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Company</div>
            <div className="text-sm text-gray-900 font-medium">{personData.company}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Industry</div>
            <div className="text-sm text-gray-900 font-medium">{personData.industry}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Location</div>
            <div className="text-sm text-gray-900 font-medium">{personData.location}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Buyer Group Role</div>
            <div className="text-sm text-gray-900 font-medium">
              <span className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                personData.buyerGroupRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                personData.buyerGroupRole === 'Champion' ? 'bg-green-100 text-green-800' :
                personData.buyerGroupRole === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                personData.buyerGroupRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {personData.buyerGroupRole}
              </span>
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Influence Level</div>
            <div className="text-sm text-gray-900 font-medium capitalize">{personData.influenceLevel}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Last Contact</div>
            <div className="text-sm text-gray-900 font-medium">{formatRelativeDate(personData.lastContact)}</div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Next Action</div>
            <div className="text-sm text-gray-900 font-medium">{personData.nextAction}</div>
          </div>
        </div>
      </div>

      {/* Deep Value Reports Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deep Value Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Competitive Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Competitive Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/adp-competitive-deep-value-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">ADP Competitive Deep Value Report</div>
                <div className="text-xs text-gray-500 mt-1">52-page competitive intelligence analysis</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/workday-market-analysis-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">Workday Market Analysis Report</div>
                <div className="text-xs text-gray-500 mt-1">Market positioning and growth opportunities</div>
              </a>
            </div>
          </div>

          {/* Market Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Market Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/hr-tech-market-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">HR Tech Market Trends</div>
                <div className="text-xs text-gray-500 mt-1">Industry growth and emerging technologies</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/enterprise-hr-landscape-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">Enterprise HR Landscape</div>
                <div className="text-xs text-gray-500 mt-1">Market segmentation and opportunities</div>
              </a>
            </div>
          </div>

          {/* Buyer Group Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Buyer Group Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/adp-buyer-group-intel-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">ADP Buyer Group Intelligence</div>
                <div className="text-xs text-gray-500 mt-1">Key decision makers and influencers</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/enterprise-procurement-process-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">Enterprise Procurement Process</div>
                <div className="text-xs text-gray-500 mt-1">Decision-making workflow analysis</div>
              </a>
            </div>
          </div>

          {/* Industry Analysis */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Industry Analysis</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/hr-technology-industry-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">HR Technology Industry Trends</div>
                <div className="text-xs text-gray-500 mt-1">Latest trends and developments</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/ai-automation-impact-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">AI & Automation Impact</div>
                <div className="text-xs text-gray-500 mt-1">Technology disruption analysis</div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Notes</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
              {personData.notes}
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Tags</div>
            <div className="text-sm text-gray-900">
              {personData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {personData.tags.map((tag: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                'No tags'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
