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

  // Generate dynamic intelligence based on real company data
  const generateCompanyIntelligence = () => {
    const companyName = record?.name || 'Company';
    const industry = record?.industry || 'Unknown Industry';
    const size = record?.size || 'Unknown Size';
    const revenue = record?.revenue ? `$${Number(record.revenue).toLocaleString()}` : 'Unknown Revenue';
    const website = record?.website || 'No website available';
    const description = record?.description || 'No description available';
    const location = record?.city && record?.state ? `${record.city}, ${record.state}` : record?.address || 'Unknown Location';
    
    // Get enrichment data if available
    const coresignalData = record?.customFields?.coresignalData;
    const employeeCount = coresignalData?.employees_count || record?.employeeCount || 'Unknown';
    const foundedYear = coresignalData?.founded_year || record?.foundedYear;
    const age = foundedYear ? new Date().getFullYear() - parseInt(foundedYear) : null;
    const categories = coresignalData?.categories_and_keywords || [];
    
    // Get strategic intelligence from database fields
    const situationAnalysis = record?.situationAnalysis || record?.customFields?.intelligenceTabFields?.situationAnalysis;
    const complications = record?.complications || record?.customFields?.intelligenceTabFields?.complications;
    const strategicIntelligence = record?.strategicIntelligence || record?.customFields?.intelligenceTabFields?.strategicIntelligence;
    
    return {
      companyName,
      industry,
      size,
      revenue,
      website,
      description,
      location,
      employeeCount,
      age,
      categories,
      situationAnalysis,
      complications,
      strategicIntelligence
    };
  };

  const intelligence = generateCompanyIntelligence();

  return (
    <div className="space-y-8">
      {/* Situation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Situation Analysis</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
            {intelligence.situationAnalysis 
              ? intelligence.situationAnalysis
              : intelligence.description && intelligence.description.trim() !== '' 
                ? intelligence.description
                : `${intelligence.companyName} operates in the ${intelligence.industry} industry${intelligence.location !== 'Unknown Location' ? `, located in ${intelligence.location}` : ''}. ${intelligence.employeeCount !== 'Unknown' ? `The company has ${intelligence.employeeCount} employees` : 'Company size information is not available'}. ${intelligence.revenue !== 'Unknown Revenue' ? `Revenue is estimated at ${intelligence.revenue}` : 'Financial information is not available'}. ${intelligence.website !== 'No website available' ? `More information can be found at ${intelligence.website}` : ''}.`
            }
          </div>
        </div>
      </div>

      {/* Complications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complications</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
            {intelligence.complications 
              ? intelligence.complications
              : `${intelligence.companyName} operates in the competitive ${intelligence.industry} industry, facing typical challenges including market competition, regulatory compliance, technology adoption, and operational efficiency. ${intelligence.employeeCount !== 'Unknown' ? `With ${intelligence.employeeCount} employees, the company must balance growth with resource management.` : 'The company must effectively manage resources and operations.'} Key challenges may include staying competitive in the evolving ${intelligence.industry} landscape, maintaining quality standards, and adapting to changing market conditions and customer expectations.`
            }
          </div>
        </div>
      </div>

      {/* Strategic Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Intelligence</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
            {intelligence.strategicIntelligence 
              ? intelligence.strategicIntelligence
              : `${intelligence.companyName} represents a strategic opportunity in the ${intelligence.industry} sector. ${intelligence.employeeCount !== 'Unknown' ? `With ${intelligence.employeeCount} employees,` : 'The company'} demonstrates established market presence and operational capability. Key strategic considerations include understanding their business priorities, decision-making processes, and growth objectives. Partnership potential exists in areas such as technology solutions, operational improvements, and market expansion. The company's focus on ${intelligence.industry} suggests opportunities for collaboration in industry-specific solutions, process optimization, and strategic initiatives that align with their business goals and market position.`
            }
          </div>
        </div>
      </div>

    </div>
  );
}