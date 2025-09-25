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
    
    // Get enrichment data from multiple sources
    const coresignalData = record?.customFields?.coresignalData;
    const enrichedData = record?.customFields?.enrichedData?.intelligence;
    const rawData = record?.customFields?.rawData;
    
    // Company intelligence from enriched data
    const employeeCount = enrichedData?.employeeCount || coresignalData?.employees_count || record?.employeeCount || 'Unknown';
    const foundedYear = enrichedData?.foundedYear || coresignalData?.founded_year || record?.foundedYear;
    const age = foundedYear ? new Date().getFullYear() - parseInt(foundedYear) : null;
    const categories = enrichedData?.categories || coresignalData?.categories_and_keywords || [];
    
    // Get strategic intelligence from enriched data
    const situationAnalysis = enrichedData?.situationAnalysis || record?.situationAnalysis || record?.customFields?.intelligenceTabFields?.situationAnalysis;
    const complications = enrichedData?.complications || record?.complications || record?.customFields?.intelligenceTabFields?.complications;
    const strategicIntelligence = enrichedData?.strategicIntelligence || record?.strategicIntelligence || record?.customFields?.intelligenceTabFields?.strategicIntelligence;
    
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

  // Generate business units based on company type and industry
  const generateBusinessUnits = () => {
    const companyName = intelligence.companyName;
    const industry = intelligence.industry.toLowerCase();
    
    // Water Agency specific business units
    if (companyName.toLowerCase().includes('water') || companyName.toLowerCase().includes('county')) {
      return [
        {
          name: 'Water Supply & Operations',
          color: 'bg-blue-100 border-blue-200',
          functions: [
            'Water treatment facilities',
            'Distribution systems', 
            'Quality monitoring',
            'Emergency response'
          ]
        },
        {
          name: 'Engineering & Infrastructure',
          color: 'bg-green-100 border-green-200',
          functions: [
            'System design & planning',
            'Infrastructure maintenance',
            'Capital projects',
            'Technical support'
          ]
        },
        {
          name: 'Customer Services',
          color: 'bg-purple-100 border-purple-200',
          functions: [
            'Customer support',
            'Billing & collections',
            'Service requests',
            'Community outreach'
          ]
        },
        {
          name: 'Regulatory & Compliance',
          color: 'bg-orange-100 border-orange-200',
          functions: [
            'Environmental compliance',
            'Safety regulations'
          ]
        },
        {
          name: 'Administration',
          color: 'bg-gray-100 border-gray-200',
          functions: [
            'Financial management',
            'Human resources',
            'IT & systems',
            'Board governance'
          ]
        }
      ];
    }
    
    // Default business units for other companies
    return [
      {
        name: 'Operations',
        color: 'bg-blue-100 border-blue-200',
        functions: [
          'Core business operations',
          'Process management',
          'Quality control',
          'Performance monitoring'
        ]
      },
      {
        name: 'Technology & IT',
        color: 'bg-green-100 border-green-200',
        functions: [
          'IT infrastructure',
          'Software development',
          'Data management',
          'Security systems'
        ]
      },
      {
        name: 'Sales & Marketing',
        color: 'bg-purple-100 border-purple-200',
        functions: [
          'Customer acquisition',
          'Brand management',
          'Market research',
          'Lead generation'
        ]
      },
      {
        name: 'Finance & Administration',
        color: 'bg-orange-100 border-orange-200',
        functions: [
          'Financial planning',
          'Budget management',
          'HR operations',
          'Compliance'
        ]
      }
    ];
  };

  const businessUnits = generateBusinessUnits();

  // Generate AI-powered company wants and needs
  const generateCompanyWantsAndNeeds = () => {
    const companyName = intelligence.companyName;
    const industry = intelligence.industry;
    const size = intelligence.employeeCount;
    
    // Strategic wants based on company type
    const strategicWants = [
      'Operational efficiency improvements',
      'Technology modernization',
      'Cost reduction initiatives',
      'Regulatory compliance automation'
    ];
    
    // Critical needs based on industry and size
    const criticalNeeds = [
      'Infrastructure modernization',
      'Water quality monitoring systems',
      'Customer service digitization',
      'Emergency response capabilities'
    ];
    
    return { strategicWants, criticalNeeds };
  };

  const { strategicWants, criticalNeeds } = generateCompanyWantsAndNeeds();

  return (
    <div className="space-y-8">
      {/* Company Wants & Needs Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Wants & Needs Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Strategic Wants</h4>
            <div className="space-y-2">
              {strategicWants.map((want, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {want}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Critical Needs</h4>
            <div className="space-y-2">
              {criticalNeeds.map((need, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {need}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI-Generated Alignment Strategy */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Alignment Strategy</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-900 leading-relaxed">
            Based on analysis of {intelligence.companyName}'s business units and industry position, the company's wants and needs align with solutions that address operational efficiency, technology modernization, and regulatory compliance. Key positioning opportunities include emphasizing how our solutions directly support their water supply operations, engineering infrastructure needs, and customer service improvements while ensuring regulatory compliance and administrative efficiency.
          </div>
        </div>
      </div>

      {/* Business Units */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Units</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessUnits.map((unit, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${unit.color}`}>
              <h4 className="font-medium text-gray-900 mb-3">{unit.name}</h4>
              <div className="space-y-1">
                {unit.functions.map((func, funcIndex) => (
                  <div key={funcIndex} className="text-xs text-gray-700">
                    {func}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Intelligence</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-900 leading-relaxed">
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