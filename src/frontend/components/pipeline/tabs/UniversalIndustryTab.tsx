"use client";

import React from 'react';

interface UniversalIndustryTabProps {
  record: any;
  recordType: string;
}



export function UniversalIndustryTab({ record, recordType }: UniversalIndustryTabProps) {
  // Get industry from record - check both direct fields and related data
  const industry = record?.industry || record?.industryData?.name || 'Not specified';
  const vertical = record?.vertical || record?.verticalData?.name || 'Not specified';
  const sector = record?.sector || 'Not specified';
  const companySize = record?.companySize || record?.size || 'Not specified';

  return (
    <div className="space-y-8">
      {/* Industry Information */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Industry Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Industry</label>
            <p className="text-sm text-gray-800 font-medium">{industry}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Company Size</label>
            <p className="text-sm text-gray-800 font-medium">{companySize}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Sector</label>
            <p className="text-sm text-gray-800 font-medium">{sector}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Vertical</label>
            <p className="text-sm text-gray-800 font-medium">{vertical}</p>
          </div>
        </div>
      </div>

    </div>
  );
}

