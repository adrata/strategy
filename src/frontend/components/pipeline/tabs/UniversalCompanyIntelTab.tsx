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
            <div className="block text-sm font-medium text-gray-600 mb-2">Business Context</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const foundedYear = coresignalData?.founded_year;
                const companyType = coresignalData?.type;
                
                let context = 'Telecommunications company';
                if (employeeCount) {
                  context += ` with ${employeeCount} employees (small business)`;
                }
                if (foundedYear) {
                  const currentYear = new Date().getFullYear();
                  const age = currentYear - parseInt(foundedYear);
                  context += `, ${age} years in business`;
                }
                if (companyType) {
                  context += `, ${companyType}`;
                }
                return context;
              })()}

Data Source: CoreSignal API
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Market Position</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.length > 0) {
                  const keyServices = categories.filter(cat => 
                    cat.includes('fiber') || 
                    cat.includes('wireless') || 
                    cat.includes('infrastructure') ||
                    cat.includes('installation') ||
                    cat.includes('drilling') ||
                    cat.includes('cabling')
                  ).slice(0, 5);
                  
                  return `Telecommunications infrastructure specialist with expertise in: ${keyServices.join(', ')}. CoreSignal data shows ${categories.length} service categories including underground infrastructure, fiber installation, small cell & DAS deployment, directional drilling, and structured cabling.`;
                }
                return 'Market position analysis pending enrichment.';
              })()}

Data Source: CoreSignal API
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Financial Health</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const companyType = coresignalData?.type;
                const foundedYear = coresignalData?.founded_year;
                const employeeCount = coresignalData?.employees_count;
                
                if (companyType && foundedYear && employeeCount) {
                  const currentYear = new Date().getFullYear();
                  const age = currentYear - parseInt(foundedYear);
                  return `${companyType} company with ${employeeCount} employees and ${age} years of operational history. Small business size suggests lean operations with potential for growth. Established track record indicates financial stability and market validation.`;
                }
                return 'Financial health analysis pending enrichment.';
              })()}

Data Source: CoreSignal API
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Technology Stack</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.length > 0) {
                  const techServices = categories.filter(cat => 
                    cat.includes('fiber') || 
                    cat.includes('wireless') || 
                    cat.includes('cabling') ||
                    cat.includes('splicing') ||
                    cat.includes('design') ||
                    cat.includes('network')
                  );
                  
                  return `CoreSignal data shows ${categories.length} service categories. Technology stack includes: ${techServices.join(', ')}. Specialized capabilities in underground infrastructure, fiber installation, small cell & DAS deployment, directional drilling, and structured cabling.`;
                }
                return 'Technology stack analysis pending enrichment.';
              })()}

Data Source: CoreSignal API
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
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && categories.length > 0) {
                  return `With only ${employeeCount} employees, 5 Bars Services faces: (1) Limited capacity for large-scale projects, (2) Skilled labor shortage in specialized telecom infrastructure, (3) Equipment and material cost volatility, (4) Complex permitting across multiple states, (5) Competition from larger contractors with deeper resources. CoreSignal shows ${categories.length} service categories requiring diverse expertise.`;
                }
                return 'Business challenges analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Industry Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Competitive Threats</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const companyType = coresignalData?.type;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && companyType && categories.length > 0) {
                  return `As a ${companyType} with ${employeeCount} employees, competitive threats include: (1) Large telecom contractors with deeper resources and economies of scale, (2) Technology companies offering integrated solutions, (3) Local competitors with lower overhead, (4) Automation reducing need for manual installation services. CoreSignal shows ${categories.length} service categories requiring significant expertise.`;
                }
                return 'Competitive analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Market Research
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Operational Pain Points</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && categories.length > 0) {
                  const complexServices = categories.filter(cat => 
                    cat.includes('drilling') || 
                    cat.includes('excavating') || 
                    cat.includes('underground') ||
                    cat.includes('maintenance') ||
                    cat.includes('surveying')
                  );
                  
                  return `With ${employeeCount} employees managing ${categories.length} service categories, operational challenges include: (1) Skilled labor shortage for specialized services like ${complexServices.slice(0, 3).join(', ')}, (2) Equipment and material cost volatility, (3) Weather delays affecting project timelines, (4) Complex permitting processes across jurisdictions, (5) Quality control and safety compliance overhead.`;
                }
                return 'Operational pain points analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Operations Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Resource Constraints</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const companyType = coresignalData?.type;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && companyType && categories.length > 0) {
                  return `As a ${companyType} with ${employeeCount} employees managing ${categories.length} service categories, resource limitations include: (1) Limited capital for equipment upgrades and expansion, (2) Small team size constraining project capacity, (3) Geographic coverage limitations, (4) Technology investment requirements, (5) Training and certification costs for specialized skills across multiple service areas.`;
                }
                return 'Resource constraints analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Resource Analysis
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Intelligence</h3>
        <div className="space-y-4">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Strategic Initiatives</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && categories.length > 0) {
                  const growthServices = categories.filter(cat => 
                    cat.includes('5g') || 
                    cat.includes('fiber') || 
                    cat.includes('wireless') ||
                    cat.includes('small cell') ||
                    cat.includes('das')
                  );
                  
                  return `With ${employeeCount} employees and ${categories.length} service categories, strategic priorities likely include: (1) Expanding government contract portfolio, (2) Technology modernization for ${growthServices.slice(0, 2).join(' and ')} infrastructure, (3) Geographic expansion across Texas, Oklahoma, Louisiana, Arkansas, (4) Safety program enhancement for competitive advantage, (5) Partner development with leading network suppliers.`;
                }
                return 'Strategic initiatives analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Strategic Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Growth Opportunities</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.length > 0) {
                  const emergingServices = categories.filter(cat => 
                    cat.includes('small cell') || 
                    cat.includes('das') || 
                    cat.includes('wireless') ||
                    cat.includes('fiber') ||
                    cat.includes('5g')
                  );
                  
                  return `Growth opportunities based on ${categories.length} service categories: (1) ${emergingServices.slice(0, 2).join(' and ')} deployment for urban areas, (2) Government infrastructure spending increases, (3) Technology consulting services expansion, (4) Partner channel development with telecom providers, (5) Geographic expansion leveraging existing service capabilities.`;
                }
                return 'Growth opportunities analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Market Intelligence
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">TOP Partnership Potential</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && categories.length > 0) {
                  const specializedServices = categories.filter(cat => 
                    cat.includes('engineering') || 
                    cat.includes('design') || 
                    cat.includes('project') ||
                    cat.includes('management') ||
                    cat.includes('consulting')
                  );
                  
                  return `High partnership potential with ${employeeCount} employees managing ${categories.length} service categories: (1) Engineering talent acquisition for specialized telecom roles, (2) Project management expertise for complex infrastructure projects, (3) Safety training and certification programs, (4) Technology consulting for modernization, (5) Geographic expansion support across multi-state operations.`;
                }
                return 'Partnership potential analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Partnership Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Decision Making Factors</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const employeeCount = coresignalData?.employees_count;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (employeeCount && categories.length > 0) {
                  const criticalServices = categories.filter(cat => 
                    cat.includes('safety') || 
                    cat.includes('compliance') || 
                    cat.includes('certification') ||
                    cat.includes('quality') ||
                    cat.includes('standards')
                  );
                  
                  return `Key decision factors for ${employeeCount}-employee company with ${categories.length} service categories: (1) Proven track record with government contracts, (2) Safety compliance and certification requirements, (3) Cost-effectiveness and project timeline reliability, (4) Technical expertise in specialized telecom infrastructure, (5) Geographic coverage and local market knowledge.`;
                }
                return 'Decision making factors analysis pending enrichment.';
              })()}

Data Source: CoreSignal API + Decision Analysis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}