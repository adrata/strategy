"use client";

import React from 'react';

interface UniversalCompanyIntelTabProps {
  record: any;
  recordType: string;
}

export function UniversalCompanyIntelTab({ record, recordType }: UniversalCompanyIntelTabProps) {
  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Company Situation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Situation</h3>
        <div className="space-y-4">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Revenue</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {record?.revenue ? `$${record.revenue.toLocaleString()}` : 'Unknown'}

Data Source: Database
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Size</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {record?.size || 'Unknown'}

Data Source: Database
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Industry</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {record?.industry || 'Unknown'}

Data Source: Database
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Location</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {record?.city && record?.state ? `${record.city}, ${record.state}` : 'Unknown'}

Data Source: Database
            </div>
          </div>
        </div>
      </div>

      {/* Company Complication */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Complication</h3>
        <div className="space-y-4">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Business Challenges</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              No challenges identified yet

Data Source: Database
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Competitive Threats</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              No competitive analysis available

Data Source: Database
            </div>
          </div>
        </div>
      </div>

      {/* Directional Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Directional Intelligence</h3>
        <div className="space-y-4">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Strategic Initiatives</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              No strategic initiatives identified

Data Source: Database
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Growth Opportunities</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              No growth opportunities identified

Data Source: Database
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}