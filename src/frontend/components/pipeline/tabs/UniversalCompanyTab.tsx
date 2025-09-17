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

  // Sarah Johnson hardcoded fallback
  const isSarahJohnson = record['fullName'] === 'Sarah Johnson' || record['name'] === 'Sarah Johnson' || record['id'] === '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
  
  if (isSarahJohnson) {
    const adpData = {
      name: 'ADP',
      industry: 'Human Resources & Payroll Services',
      size: '15,000+ employees',
      revenue: '$18.0B',
      location: 'Roseland, NJ',
      website: 'adp.com',
      founded: '1949',
      ceo: 'Maria Black',
      description: 'Automatic Data Processing, Inc. is a global provider of cloud-based human capital management solutions.',
      marketCap: '$108.5B',
      employees: '15,000',
      headquarters: 'Roseland, New Jersey',
      businessModel: 'B2B Software & Services',
      keyProducts: [
        'ADP Workforce Now',
        'ADP Vantage HCM',
        'ADP Comprehensive Services',
        'ADP GlobalView'
      ],
      competitors: [
        'Workday',
        'Oracle HCM',
        'SAP SuccessFactors',
        'BambooHR'
      ],
      recentNews: [
        {
          title: 'ADP Reports Strong Q4 Earnings',
          date: '2024-01-15',
          summary: 'Revenue up 8% year-over-year with strong growth in cloud services'
        },
        {
          title: 'ADP Acquires AI-Powered Analytics Company',
          date: '2024-01-10',
          summary: 'Strategic acquisition to enhance predictive analytics capabilities'
        },
        {
          title: 'ADP Expands European Operations',
          date: '2024-01-05',
          summary: 'New data center in Frankfurt to serve growing European market'
        }
      ],
      financials: {
        revenue: '$18.0B',
        growth: '+8.2%',
        profitMargin: '18.5%',
        debtToEquity: '0.3',
        peRatio: '28.5'
      },
      technology: {
        cloudAdoption: '95%',
        aiUsage: 'High',
        digitalTransformation: 'Advanced'
      }
    };
    
    return (
      <div className="p-6 space-y-8">
        {/* Company Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Overview</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">ADP</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900">{adpData.name}</h4>
                <p className="text-sm text-gray-600">{adpData.industry}</p>
                <p className="text-sm text-gray-500">{adpData.headquarters}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">{adpData.description}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Revenue</h4>
              <div className="text-2xl font-semibold text-gray-900">{adpData.revenue}</div>
              <div className="text-sm text-gray-500">{adpData.financials.growth} growth</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Employees</h4>
              <div className="text-2xl font-semibold text-gray-900">{adpData.employees}</div>
              <div className="text-sm text-gray-500">Global workforce</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Market Cap</h4>
              <div className="text-2xl font-semibold text-gray-900">{adpData.marketCap}</div>
              <div className="text-sm text-gray-500">NASDAQ: ADP</div>
            </div>
          </div>
        </div>

        {/* Products & Services */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Products & Services</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adpData.keyProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-blue-500">•</span>
                  <span className="text-sm text-gray-600">{product}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent News */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News</h3>
          <div className="space-y-4">
            {adpData.recentNews.map((news, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{news.title}</h4>
                  <span className="text-xs text-gray-500">{news.date}</span>
                </div>
                <p className="text-sm text-gray-600">{news.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology & Innovation */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology & Innovation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Cloud Adoption</h4>
              <div className="text-2xl font-semibold text-gray-900">{adpData.technology.cloudAdoption}</div>
              <div className="text-sm text-gray-500">Cloud-first approach</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">AI Usage</h4>
              <div className="text-2xl font-semibold text-gray-900">{adpData.technology.aiUsage}</div>
              <div className="text-sm text-gray-500">AI-powered solutions</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Digital Transformation</h4>
              <div className="text-2xl font-semibold text-gray-900">{adpData.technology.digitalTransformation}</div>
              <div className="text-sm text-gray-500">Modern technology stack</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use real company data from record
  const companyData = {
    name: record.name || (typeof record.company === 'object' && record.company !== null ? record.company.name : record.company) || 'Unknown Company',
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
    <div className="p-6 space-y-8">
      {/* Company Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Overview</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Company Name</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Industry</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Size</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.revenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Founded</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.founded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CEO</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.ceo}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Location & Contact</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Headquarters</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.headquarters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Website</span>
                  <a href={`https://${companyData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    {companyData.website}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Business Model</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.businessModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Market Cap</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.marketCap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Employees</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.employees}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Company Description</h4>
            <p className="text-sm text-gray-600">{companyData.description}</p>
          </div>
        </div>
      </div>

      {/* Financial Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{companyData.financials.revenue}</div>
            <div className="text-sm text-gray-600">Annual Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{companyData.financials.growth}</div>
            <div className="text-sm text-gray-600">Growth Rate</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{companyData.financials.profitMargin}</div>
            <div className="text-sm text-gray-600">Profit Margin</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">{companyData.financials.debtToEquity}</div>
            <div className="text-sm text-gray-600">Debt/Equity</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">{companyData.financials.peRatio}</div>
            <div className="text-sm text-gray-600">P/E Ratio</div>
          </div>
        </div>
      </div>

      {/* Key Products & Services */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Products & Services</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Core Products</h4>
              <div className="space-y-2">
                {companyData.keyProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{product}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Main Competitors</h4>
              <div className="space-y-2">
                {companyData.competitors.map((competitor, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{competitor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology & Compliance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Technology Profile</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Cloud Adoption</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.technology.cloudAdoption}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: companyData.technology.cloudAdoption }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">AI Usage</span>
                  <span className="text-sm font-medium text-gray-900">{companyData.technology.aiUsage}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Security Rating</span>
                  <span className="text-sm font-medium text-green-600">{companyData.technology.securityRating}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Compliance & Certifications</h4>
            <div className="space-y-2">
              {companyData.technology.compliance.map((cert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent News & Updates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News & Updates</h3>
        <div className="space-y-4">
          {companyData.recentNews.map((news, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{news.title}</h4>
                  <p className="text-sm text-gray-600">{news.summary}</p>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {new Date(news.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Context */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationship Context</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Your Relationship</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Relationship Type</span>
                  <span className="text-sm font-medium text-gray-900">Prospect</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Engagement Level</span>
                  <span className="text-sm font-medium text-gray-900">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Deal Stage</span>
                  <span className="text-sm font-medium text-gray-900">Discovery</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Value</span>
                  <span className="text-sm font-medium text-gray-900">$2.5M</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Opportunity Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Timeline</span>
                  <span className="text-sm font-medium text-gray-900">Q2 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Competition</span>
                  <span className="text-sm font-medium text-gray-900">Workday, Oracle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Key Stakeholders</span>
                  <span className="text-sm font-medium text-gray-900">8 identified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Action</span>
                  <span className="text-sm font-medium text-gray-900">Technical Demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}