"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalCompanyTabProps {
  recordType: string;
  record?: any;
}

export function UniversalCompanyTab({ recordType, record: recordProp }: UniversalCompanyTabProps) {
  const { record: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Use real company data from record
  const companyData = {
    name: record.name || 'Unknown Company',
    industry: record.industry || 'Unknown Industry',
    size: record.size || record.employeeCount || 'Unknown Size',
    revenue: record.revenue ? `$${Number(record.revenue).toLocaleString()}` : 'Unknown Revenue',
    location: record.city && record.state ? `${record.city}, ${record.state}` : record.address || 'Unknown Location',
    website: record.website || 'No website',
    founded: record.founded || 'Unknown',
    ceo: record.ceo || 'Unknown',
    description: record.description || 'No description available',
    marketCap: record.marketCap || 'Unknown',
    employees: record.employeeCount || record.size || 'Unknown',
    headquarters: record.address || record.city || 'Unknown',
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.industry}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Size</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.size}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Revenue</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.revenue}</div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
          <div className="text-sm text-gray-800 font-medium">{companyData.description}</div>
        </div>
      </div>

      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.industry}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Size</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.size}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Founded</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.founded}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">CEO</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.ceo}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Headquarters</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.headquarters}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.website}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Model</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.businessModel}</div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Revenue</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.financials.revenue}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Growth</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.financials.growth}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Profit Margin</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.financials.profitMargin}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Market Cap</label>
            <div className="text-sm text-gray-800 font-medium">{companyData.marketCap}</div>
          </div>
        </div>
      </div>
    </div>
  );
}