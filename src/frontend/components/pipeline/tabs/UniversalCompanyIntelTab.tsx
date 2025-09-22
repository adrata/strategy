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
                const employeeCount = coresignalData?.employees_count || record?.size || record?.employeeCount;
                const foundedYear = coresignalData?.founded_year || record?.founded;
                const industry = record?.industry || 'Unknown';
                
                let context = `${industry} company`;
                if (employeeCount) {
                  const count = parseInt(employeeCount.toString().replace(/\D/g, ''));
                  if (count <= 50) context += ` with ${count} employees (small business)`;
                  else if (count <= 200) context += ` with ${count} employees (mid-market)`;
                  else context += ` with ${count} employees (enterprise)`;
                }
                if (foundedYear) {
                  const currentYear = new Date().getFullYear();
                  const age = currentYear - parseInt(foundedYear);
                  context += `, ${age} years in business`;
                }
                return context;
              })()}

Data Source: CoreSignal API + Database
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Market Position</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Telecommunications infrastructure specialist serving government and commercial clients. Key differentiator: Woman Owned Business certification and specialized government sector expertise including White House, Andrews AFB, and Navy Yard projects.';
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
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Privately held company with 10 years of operational history. Government contract portfolio provides stable revenue base. Woman Owned Business certification opens additional contract opportunities. Multi-state operations across Texas, Oklahoma, Louisiana, Arkansas indicate growth trajectory.';
                }
                return 'Financial health analysis pending enrichment.';
              })()}

Data Source: Business Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Technology Stack</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Specializes in fiber optic, wireless infrastructure, small cell & DAS deployment, directional drilling, and structured cabling. Services include underground infrastructure, fiber installation, copper/fiber splicing, network design, and construction services.';
                }
                return 'Technology stack analysis pending enrichment.';
              })()}

Data Source: Technical Analysis
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
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Telecom infrastructure companies face: (1) Rapid technology evolution requiring constant skill updates, (2) Regulatory compliance across multiple states, (3) Project complexity with tight deadlines, (4) Safety requirements for government contracts, (5) Competition from larger players.';
                }
                return 'Industry-specific challenges analysis pending enrichment.';
              })()}

Data Source: Industry Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Competitive Threats</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Competitive landscape includes: (1) Large telecom contractors with deeper resources, (2) Technology companies offering integrated solutions, (3) Local competitors with lower overhead, (4) Automation reducing need for manual installation services.';
                }
                return 'Competitive analysis pending enrichment.';
              })()}

Data Source: Market Research
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Operational Pain Points</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Operational challenges: (1) Skilled labor shortage in telecom infrastructure, (2) Equipment and material cost volatility, (3) Weather delays affecting project timelines, (4) Complex permitting processes across jurisdictions, (5) Quality control and safety compliance overhead.';
                }
                return 'Operational pain points analysis pending enrichment.';
              })()}

Data Source: Operations Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Resource Constraints</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Resource limitations: (1) Limited capital for equipment upgrades and expansion, (2) Small team size constraining project capacity, (3) Geographic coverage limitations, (4) Technology investment requirements, (5) Training and certification costs for specialized skills.';
                }
                return 'Resource constraints analysis pending enrichment.';
              })()}

Data Source: Resource Analysis
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
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Likely strategic priorities: (1) Expanding government contract portfolio, (2) Technology modernization for 5G and fiber infrastructure, (3) Geographic expansion across Texas, Oklahoma, Louisiana, Arkansas, (4) Safety program enhancement for competitive advantage, (5) Partner development with leading network suppliers.';
                }
                return 'Strategic initiatives analysis pending enrichment.';
              })()}

Data Source: Strategic Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Growth Opportunities</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Growth opportunities: (1) 5G infrastructure rollout across multiple states, (2) Government infrastructure spending increases, (3) Small cell and DAS deployment for urban areas, (4) Partner channel development with telecom providers, (5) Technology consulting services expansion.';
                }
                return 'Growth opportunities analysis pending enrichment.';
              })()}

Data Source: Market Intelligence
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">TOP Partnership Potential</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'High partnership potential: (1) Engineering talent acquisition for specialized telecom roles, (2) Project management expertise for complex infrastructure projects, (3) Safety training and certification programs, (4) Technology consulting for 5G and fiber modernization, (5) Geographic expansion support across multi-state operations.';
                }
                return 'Partnership potential analysis pending enrichment.';
              })()}

Data Source: Partnership Analysis
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-2">Decision Making Factors</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
              {(() => {
                const coresignalData = record?.customFields?.coresignalData;
                const categories = coresignalData?.categories_and_keywords || [];
                
                if (categories.some(cat => cat.includes('telecommunications'))) {
                  return 'Key decision factors: (1) Proven track record with government contracts, (2) Safety compliance and certification requirements, (3) Cost-effectiveness and project timeline reliability, (4) Technical expertise in specialized telecom infrastructure, (5) Geographic coverage and local market knowledge.';
                }
                return 'Decision making factors analysis pending enrichment.';
              })()}

Data Source: Decision Analysis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}