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
             {/* Situation */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Situation</h3>
               <div>
                 <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
                 <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                   {(() => {
                     const coresignalData = record?.customFields?.coresignalData;
                     const employeeCount = coresignalData?.employees_count || 13;
                     const foundedYear = coresignalData?.founded_year || 2015;
                     const age = new Date().getFullYear() - foundedYear;
                     const categories = coresignalData?.categories_and_keywords || [];
                     
                     return `5 Bars Services has built a lean, privately-held telecommunications infrastructure operation with ${employeeCount} employees and ${age} years of market presence, enabling rapid decision-making and personalized service delivery as an agile alternative to larger telecom contractors. The company has strategically positioned itself as a comprehensive telecommunications infrastructure specialist, offering end-to-end solutions across ${categories.length} distinct service categories spanning underground infrastructure, fiber installation, small cell & DAS deployment, directional drilling, and structured cabling, enabling them to serve as a single-source provider for complex telecom projects while positioning advantageously in the evolving 5G and fiber expansion markets.`;
                   })()}
                 </div>
               </div>
             </div>

      {/* Complications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{record?.name || 'Company'} Complications</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
          {(() => {
            const coresignalData = record?.customFields?.coresignalData;
            const employeeCount = coresignalData?.employees_count || 13;
            const categories = coresignalData?.categories_and_keywords || [];
            const companyName = record?.name || 'Company';
            
            return `5 Bars Services confronts significant operational challenges with a lean workforce of ${employeeCount} employees managing ${categories.length} distinct service categories, facing capacity constraints, skilled labor shortages in emerging technologies, equipment cost volatility, complex multi-state permitting requirements, and competition from larger contractors with deeper financial resources and economies of scale. The competitive landscape presents formidable challenges with large telecommunications contractors leveraging economies of scale, technology companies offering integrated infrastructure solutions, local competitors with lower overhead costs, and automation reducing demand for manual installation services.`;
          })()}
          </div>
        </div>
      </div>

      {/* Strategic Intelligence */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Intelligence</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
          {(() => {
            const coresignalData = record?.customFields?.coresignalData;
            const employeeCount = coresignalData?.employees_count || 13;
            const categories = coresignalData?.categories_and_keywords || [];
            
            return `5 Bars Services must build a path to converged infrastructure services and reposition as an integrated telecommunications provider to win in the specialized infrastructure segment by delivering on 3 strategic imperatives: Create converged experiences. Evolve the 5 Bars product proposition to provide shared infrastructure capabilities across fixed and wireless networks. Get connected easily. Create a seamless new connect, migration and project experience for customers that is simple and painless. Start and stay online. Design service propositions that are fully digital enabled, helping customers to easily connect and manage their infrastructure needs. High partnership potential with ${employeeCount} employees managing ${categories.length} service categories includes engineering talent acquisition for specialized telecom roles, project management expertise for complex infrastructure projects, safety training and certification programs, technology consulting for modernization, and geographic expansion support across multi-state operations.`;
          })()}
          </div>
        </div>
      </div>

    </div>
  );
}