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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Revenue</label>
            <div className="text-sm text-gray-800 font-medium">{record?.revenue ? `$${record.revenue.toLocaleString()}` : 'Unknown'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Size</label>
            <div className="text-sm text-gray-800 font-medium">{record?.size || 'Unknown'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
            <div className="text-sm text-gray-800 font-medium">{record?.industry || 'Unknown'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
            <div className="text-sm text-gray-800 font-medium">{record?.city && record?.state ? `${record.city}, ${record.state}` : 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Company Complication */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Complication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Challenges</label>
            <div className="text-sm text-gray-800 font-medium">No challenges identified yet</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Competitive Threats</label>
            <div className="text-sm text-gray-800 font-medium">No competitive analysis available</div>
          </div>
        </div>
      </div>

      {/* Directional Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Directional Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Strategic Initiatives</label>
            <div className="text-sm text-gray-800 font-medium">No strategic initiatives identified</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Growth Opportunities</label>
            <div className="text-sm text-gray-800 font-medium">No growth opportunities identified</div>
          </div>
        </div>
      </div>
    </div>
  );
}