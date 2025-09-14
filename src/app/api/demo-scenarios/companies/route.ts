import { NextRequest, NextResponse } from 'next/server';
import { winningVariantCompanies } from './winning-variant-companies';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    
    console.log(`🎯 [DEMO COMPANIES API] Loading companies for scenario: ${scenario}`);
    
    // Generate scenario-specific companies data
    const companies = generateScenarioCompanies(scenario);
    
    console.log(`✅ [DEMO COMPANIES API] Generated ${companies.length} companies for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      companies: companies,
      scenario: scenario,
      count: companies.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO COMPANIES API] Error loading companies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo companies',
        companies: []
      },
      { status: 500 }
    );
  }
}

function generateScenarioCompanies(scenario: string) {
  // Use scenario-specific companies for winning-variant
  if (scenario === 'winning-variant') {
    return winningVariantCompanies;
  }

  const baseCompanies = [
    {
      id: 'company_1',
      workspaceId: 'demo-workspace-2025',
      assignedUserId: null,
      name: 'TechCorp Industries',
      legalName: 'TechCorp Industries Inc.',
      tradingName: 'TechCorp',
      localName: null,
      website: 'https://techcorp.com',
      email: 'contact@techcorp.com',
      phone: '+1-555-1000',
      fax: null,
      address: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postalCode: '94105',
      industry: 'Technology',
      sector: 'Software',
      size: '1000-5000',
      revenue: 250000000.00,
      currency: 'USD',
      registrationNumber: 'TC-2023-001',
      taxId: '12-3456789',
      vatNumber: null,
      description: 'Leading technology company specializing in enterprise software solutions',
      notes: 'High-value prospect with approved budget for Q1 implementation',
      tags: ['enterprise', 'software', 'high-value'],
      customFields: null,
      preferredLanguage: 'en',
      timezone: 'America/Los_Angeles',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      accountType: 'enterprise',
      primaryContact: 'Michael Chen',
      tier: 'A',
      externalId: 'TC-001',
      vertical: 'SaaS',
      zohoId: null,
      isDemoData: true,
      demoScenarioId: scenario
    },
    {
      id: 'company_2',
      workspaceId: 'demo-workspace-2025',
      assignedUserId: null,
      name: 'Global Retail Inc',
      legalName: 'Global Retail Incorporated',
      tradingName: 'Global Retail',
      localName: null,
      website: 'https://globalretail.com',
      email: 'info@globalretail.com',
      phone: '+1-555-2000',
      fax: null,
      address: '456 Retail Avenue',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      postalCode: '10001',
      industry: 'Retail',
      sector: 'E-commerce',
      size: '5000+',
      revenue: 500000000.00,
      currency: 'USD',
      registrationNumber: 'GR-2023-002',
      taxId: '98-7654321',
      vatNumber: null,
      description: 'Global retail chain with strong e-commerce presence',
      notes: 'Technical evaluation phase for new platform implementation',
      tags: ['retail', 'e-commerce', 'global'],
      customFields: null,
      preferredLanguage: 'en',
      timezone: 'America/New_York',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      accountType: 'enterprise',
      primaryContact: 'Sarah Rodriguez',
      tier: 'A',
      externalId: 'GR-002',
      vertical: 'E-commerce',
      zohoId: null,
      isDemoData: true,
      demoScenarioId: scenario
    },
    {
      id: 'company_3',
      workspaceId: 'demo-workspace-2025',
      assignedUserId: null,
      name: 'DataCorp Solutions',
      legalName: 'DataCorp Solutions LLC',
      tradingName: 'DataCorp',
      localName: null,
      website: 'https://datacorp.com',
      email: 'hello@datacorp.com',
      phone: '+1-555-3000',
      fax: null,
      address: '789 Data Drive',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      postalCode: '73301',
      industry: 'Data & Analytics',
      sector: 'Analytics',
      size: '500-1000',
      revenue: 75000000.00,
      currency: 'USD',
      registrationNumber: 'DC-2023-003',
      taxId: '45-6789012',
      vatNumber: null,
      description: 'Data analytics company focused on business intelligence solutions',
      notes: 'Pain point identified - compliance requirements for data security',
      tags: ['analytics', 'data', 'compliance'],
      customFields: null,
      preferredLanguage: 'en',
      timezone: 'America/Chicago',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      accountType: 'mid-market',
      primaryContact: 'Jennifer Kim',
      tier: 'B',
      externalId: 'DC-003',
      vertical: 'Analytics',
      zohoId: null,
      isDemoData: true,
      demoScenarioId: scenario
    },
    {
      id: 'company_4',
      workspaceId: 'demo-workspace-2025',
      assignedUserId: null,
      name: 'CloudFirst Technologies',
      legalName: 'CloudFirst Technologies Inc.',
      tradingName: 'CloudFirst',
      localName: null,
      website: 'https://cloudfirst.com',
      email: 'contact@cloudfirst.com',
      phone: '+1-555-4000',
      fax: null,
      address: '321 Cloud Street',
      city: 'Seattle',
      state: 'WA',
      country: 'United States',
      postalCode: '98101',
      industry: 'Cloud Services',
      sector: 'Cloud Computing',
      size: '1000-5000',
      revenue: 150000000.00,
      currency: 'USD',
      registrationNumber: 'CF-2023-004',
      taxId: '78-9012345',
      vatNumber: null,
      description: 'Cloud infrastructure and services provider',
      notes: 'Procurement process started for new cloud management platform',
      tags: ['cloud', 'infrastructure', 'services'],
      customFields: null,
      preferredLanguage: 'en',
      timezone: 'America/Los_Angeles',
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      accountType: 'enterprise',
      primaryContact: 'David Wang',
      tier: 'A',
      externalId: 'CF-004',
      vertical: 'Cloud',
      zohoId: null,
      isDemoData: true,
      demoScenarioId: scenario
    },
    {
      id: 'company_5',
      workspaceId: 'demo-workspace-2025',
      assignedUserId: null,
      name: 'FinTech Solutions',
      legalName: 'FinTech Solutions Corporation',
      tradingName: 'FinTech Solutions',
      localName: null,
      website: 'https://fintech-solutions.com',
      email: 'info@fintech-solutions.com',
      phone: '+1-555-5000',
      fax: null,
      address: '654 Finance Plaza',
      city: 'Boston',
      state: 'MA',
      country: 'United States',
      postalCode: '02101',
      industry: 'FinTech',
      sector: 'Financial Services',
      size: '200-1000',
      revenue: 100000000.00,
      currency: 'USD',
      registrationNumber: 'FS-2023-005',
      taxId: '23-4567890',
      vatNumber: null,
      description: 'Financial technology company specializing in digital banking solutions',
      notes: 'Digital banking initiative requiring new compliance and security platform',
      tags: ['fintech', 'banking', 'compliance'],
      customFields: null,
      preferredLanguage: 'en',
      timezone: 'America/New_York',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      accountType: 'mid-market',
      primaryContact: 'Lisa Thompson',
      tier: 'B',
      externalId: 'FS-005',
      vertical: 'Banking',
      zohoId: null,
      isDemoData: true,
      demoScenarioId: scenario
    }
  ];

  // Customize companies based on scenario
  const scenarioCustomizations = {
    'zeropoint-cro': {
      industry: 'E-commerce',
      useCase: 'Conversion Optimization',
      painPoints: ['low conversion rates', 'cart abandonment', 'A/B testing complexity']
    },
    'retail-solutions': {
      industry: 'Retail',
      useCase: 'Inventory Optimization',
      painPoints: ['stockouts', 'overstock', 'demand forecasting']
    },
    'cybersecurity-pro': {
      industry: 'Cybersecurity',
      useCase: 'Security Monitoring',
      painPoints: ['threat detection', 'compliance', 'incident response']
    },
    'fintech-solutions': {
      industry: 'FinTech',
      useCase: 'Digital Banking',
      painPoints: ['regulatory compliance', 'fraud detection', 'customer onboarding']
    }
  };

  const customization = scenarioCustomizations[scenario as keyof typeof scenarioCustomizations] || scenarioCustomizations['zeropoint-cro'];

  // Apply scenario-specific customizations
  const customizedCompanies = baseCompanies.map((company) => ({
    ...company,
    industry: customization.industry,
    description: `${customization.useCase} - ${company.description}`,
    notes: `${customization.useCase} - ${company.notes}`,
    tags: [...company.tags, customization.useCase.toLowerCase().replace(/\s+/g, '-')],
    vertical: customization.industry
  }));

  return customizedCompanies;
}
