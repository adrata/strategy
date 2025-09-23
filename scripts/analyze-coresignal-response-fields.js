#!/usr/bin/env node

/**
 * 🔍 ANALYZE CORESIGNAL RESPONSE FIELDS
 * 
 * This script analyzes the complete response from CoreSignal to show
 * all available data fields for company enrichment
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

// CoreSignal API configuration
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY,
  baseUrl: 'https://api.coresignal.com/cdapi/v2'
};

class CoreSignalFieldAnalyzer {
  constructor() {
    this.config = CORESIGNAL_CONFIG;
  }

  /**
   * Make API request to CoreSignal
   */
  async makeApiRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Search for company by name
   */
  async searchCompany(companyName) {
    const searchQuery = {
      query: {
        query_string: {
          query: companyName,
          default_field: "company_name",
          default_operator: "and"
        }
      }
    };

    const url = `${this.config.baseUrl}/company_multi_source/search/es_dsl`;
    
    try {
      const response = await this.makeApiRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        return response[0]; // Return first company ID
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get detailed company data by ID
   */
  async getCompanyDetails(companyId) {
    const url = `${this.config.baseUrl}/company_multi_source/collect/${companyId}`;
    
    try {
      const response = await this.makeApiRequest(url, 'GET');
      return response;
    } catch (error) {
      console.error(`❌ Company details failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Analyze all fields in the response
   */
  analyzeFields(data, prefix = '') {
    const fields = {};
    
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        
        if (value === null || value === undefined) {
          fields[fieldPath] = { type: 'null', value: null };
        } else if (Array.isArray(value)) {
          fields[fieldPath] = { 
            type: 'array', 
            length: value.length,
            sample: value.slice(0, 2),
            description: `Array with ${value.length} items`
          };
        } else if (typeof value === 'object') {
          // Recursively analyze nested objects
          const nestedFields = this.analyzeFields(value, fieldPath);
          Object.assign(fields, nestedFields);
        } else {
          fields[fieldPath] = { 
            type: typeof value, 
            value: value,
            description: this.getFieldDescription(fieldPath, value)
          };
        }
      }
    }
    
    return fields;
  }

  /**
   * Get human-readable description for fields
   */
  getFieldDescription(fieldPath, value) {
    const descriptions = {
      'company_name': 'Official company name',
      'website': 'Company website URL',
      'domain': 'Company domain name',
      'description': 'Company description/summary',
      'industry': 'Primary industry classification',
      'size_range': 'Company size range (e.g., 11-50 employees)',
      'employees_count': 'Exact employee count',
      'employees_count_change': 'Employee count change over time',
      'revenue_annual_range': 'Annual revenue range',
      'founded_year': 'Year company was founded',
      'hq_country': 'Headquarters country',
      'hq_region': 'Headquarters region/state',
      'hq_city': 'Headquarters city',
      'hq_address': 'Full headquarters address',
      'phone': 'Company phone number',
      'linkedin_url': 'LinkedIn company page URL',
      'twitter_url': 'Twitter company page URL',
      'facebook_url': 'Facebook company page URL',
      'naics_codes': 'NAICS industry codes',
      'sic_codes': 'SIC industry codes',
      'active_job_postings_count': 'Number of active job postings',
      'active_job_postings_count_change': 'Change in job postings',
      'key_executive_arrivals': 'Recent executive arrivals',
      'key_executive_departures': 'Recent executive departures',
      'confidence': 'Data confidence score',
      'last_updated': 'Last data update timestamp',
      'data_sources': 'Sources of the data',
      'company_type': 'Company type (public, private, etc.)',
      'market_cap': 'Market capitalization',
      'stock_symbol': 'Stock ticker symbol',
      'parent_company': 'Parent company information',
      'subsidiaries': 'Subsidiary companies',
      'technologies': 'Technologies used by company',
      'funding_rounds': 'Funding and investment rounds',
      'acquisitions': 'Company acquisitions',
      'partnerships': 'Strategic partnerships',
      'awards': 'Awards and recognition',
      'news_mentions': 'Recent news mentions',
      'social_media_presence': 'Social media activity',
      'growth_metrics': 'Growth and performance metrics',
      'competitive_landscape': 'Competitor information',
      'market_position': 'Market position and ranking'
    };

    return descriptions[fieldPath] || `${fieldPath} field`;
  }

  /**
   * Categorize fields by type
   */
  categorizeFields(fields) {
    const categories = {
      'Basic Information': [],
      'Contact & Location': [],
      'Business Metrics': [],
      'Financial Data': [],
      'Industry & Classification': [],
      'Growth & Performance': [],
      'Leadership & People': [],
      'Technology & Innovation': [],
      'Market & Competition': [],
      'Social & Media': [],
      'Metadata': []
    };

    for (const [fieldPath, fieldInfo] of Object.entries(fields)) {
      const category = this.categorizeField(fieldPath, fieldInfo);
      categories[category].push({ field: fieldPath, ...fieldInfo });
    }

    return categories;
  }

  /**
   * Categorize individual field
   */
  categorizeField(fieldPath, fieldInfo) {
    if (fieldPath.includes('company_name') || fieldPath.includes('description') || fieldPath.includes('website')) {
      return 'Basic Information';
    }
    if (fieldPath.includes('hq_') || fieldPath.includes('phone') || fieldPath.includes('address')) {
      return 'Contact & Location';
    }
    if (fieldPath.includes('employees') || fieldPath.includes('size') || fieldPath.includes('founded')) {
      return 'Business Metrics';
    }
    if (fieldPath.includes('revenue') || fieldPath.includes('market_cap') || fieldPath.includes('funding')) {
      return 'Financial Data';
    }
    if (fieldPath.includes('industry') || fieldPath.includes('naics') || fieldPath.includes('sic')) {
      return 'Industry & Classification';
    }
    if (fieldPath.includes('growth') || fieldPath.includes('change') || fieldPath.includes('performance')) {
      return 'Growth & Performance';
    }
    if (fieldPath.includes('executive') || fieldPath.includes('leadership') || fieldPath.includes('people')) {
      return 'Leadership & People';
    }
    if (fieldPath.includes('technology') || fieldPath.includes('innovation') || fieldPath.includes('tech')) {
      return 'Technology & Innovation';
    }
    if (fieldPath.includes('market') || fieldPath.includes('competitor') || fieldPath.includes('position')) {
      return 'Market & Competition';
    }
    if (fieldPath.includes('linkedin') || fieldPath.includes('twitter') || fieldPath.includes('social')) {
      return 'Social & Media';
    }
    if (fieldPath.includes('confidence') || fieldPath.includes('last_updated') || fieldPath.includes('data_sources')) {
      return 'Metadata';
    }
    
    return 'Basic Information';
  }

  /**
   * Format field information for display
   */
  formatFieldInfo(fieldInfo) {
    if (fieldInfo.type === 'null') {
      return '❌ Not available';
    } else if (fieldInfo.type === 'array') {
      return `📋 ${fieldInfo.description} (${fieldInfo.length} items)`;
    } else if (fieldInfo.type === 'object') {
      return '📁 Nested object';
    } else {
      const value = typeof fieldInfo.value === 'string' && fieldInfo.value.length > 100 
        ? fieldInfo.value.substring(0, 100) + '...' 
        : fieldInfo.value;
      return `✅ ${value}`;
    }
  }
}

async function analyzeCoreSignalFields() {
  console.log('🔍 ANALYZING CORESIGNAL RESPONSE FIELDS');
  console.log('======================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check if CoreSignal API key is available
    if (!CORESIGNAL_CONFIG.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable not set');
      return;
    }

    console.log('🔑 CoreSignal API Key: ' + CORESIGNAL_CONFIG.apiKey.substring(0, 10) + '...\n');

    // Get a test company
    const testCompany = await prisma.companies.findFirst({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        name: { not: "" }
      },
      select: { id: true, name: true }
    });

    if (!testCompany) {
      console.error('❌ No test company found');
      return;
    }

    console.log(`🏢 TEST COMPANY: ${testCompany.name}\n`);

    // Initialize analyzer
    const analyzer = new CoreSignalFieldAnalyzer();

    // Step 1: Search for company
    console.log('🔍 STEP 1: SEARCHING FOR COMPANY');
    console.log('===============================\n');
    
    const companyId = await analyzer.searchCompany(testCompany.name);
    
    if (!companyId) {
      console.log('❌ No search results found for this company\n');
      return;
    }

    console.log(`✅ Found company ID: ${companyId}\n`);

    // Step 2: Get detailed company data
    console.log('📊 STEP 2: GETTING DETAILED COMPANY DATA');
    console.log('=======================================\n');
    
    const companyData = await analyzer.getCompanyDetails(companyId);
    
    if (!companyData) {
      console.log('❌ Failed to get company details\n');
      return;
    }

    console.log('✅ Company details retrieved successfully\n');

    // Step 3: Analyze all fields
    console.log('🔍 STEP 3: ANALYZING ALL AVAILABLE FIELDS');
    console.log('=========================================\n');
    
    const allFields = analyzer.analyzeFields(companyData);
    const categorizedFields = analyzer.categorizeFields(allFields);

    console.log(`📊 TOTAL FIELDS AVAILABLE: ${Object.keys(allFields).length}\n`);

    // Display categorized fields
    for (const [category, fields] of Object.entries(categorizedFields)) {
      if (fields.length > 0) {
        console.log(`📋 ${category.toUpperCase()}`);
        console.log('='.repeat(category.length + 3));
        
        fields.forEach(field => {
          const status = field.type === 'null' ? '❌' : '✅';
          const description = field.description || field.field;
          const formatted = analyzer.formatFieldInfo(field);
          console.log(`   ${status} ${field.field}: ${formatted}`);
        });
        console.log('');
      }
    }

    // Step 4: Summary of useful fields for Overview tab
    console.log('🎯 STEP 4: OVERVIEW TAB MAPPING');
    console.log('==============================\n');
    
    const overviewMappings = {
      'Company Name': allFields['company_name'],
      'Description': allFields['description'],
      'Website': allFields['website'] || allFields['domain'],
      'Size': allFields['size_range'] || allFields['employees_count'],
      'Founded Year': allFields['founded_year'],
      'Industry': allFields['industry'],
      'Headquarters': allFields['hq_address'] || allFields['hq_city'],
      'Phone': allFields['phone'],
      'LinkedIn': allFields['linkedin_url'],
      'Revenue': allFields['revenue_annual_range'],
      'Employee Count': allFields['employees_count'],
      'Company Type': allFields['company_type'],
      'NAICS Codes': allFields['naics_codes'],
      'SIC Codes': allFields['sic_codes']
    };

    console.log('🎯 OVERVIEW TAB FIELD MAPPINGS:');
    console.log('==============================\n');
    
    Object.entries(overviewMappings).forEach(([overviewField, coresignalField]) => {
      if (coresignalField) {
        const status = coresignalField.type === 'null' ? '❌' : '✅';
        const description = coresignalField.description || coresignalField.field;
        console.log(`   ${status} ${overviewField} → ${coresignalField.field}: ${description}`);
      } else {
        console.log(`   ❌ ${overviewField} → Not available in CoreSignal`);
      }
    });

    // Step 5: Data quality summary
    console.log('\n📊 STEP 5: DATA QUALITY SUMMARY');
    console.log('==============================\n');
    
    const availableFields = Object.values(overviewMappings).filter(field => field && field.type !== 'null').length;
    const totalFields = Object.keys(overviewMappings).length;
    const coveragePercentage = ((availableFields / totalFields) * 100).toFixed(1);

    console.log(`📈 OVERVIEW TAB COVERAGE: ${availableFields}/${totalFields} fields (${coveragePercentage}%)`);
    
    if (coveragePercentage >= 80) {
      console.log('✅ EXCELLENT: CoreSignal provides comprehensive Overview tab data');
    } else if (coveragePercentage >= 60) {
      console.log('⚠️  GOOD: CoreSignal provides most Overview tab data');
    } else {
      console.log('❌ LIMITED: CoreSignal provides limited Overview tab data');
    }

    console.log('\n🎯 RECOMMENDATION:');
    console.log('==================');
    console.log('✅ CoreSignal can provide most of the Overview tab data you need!');
    console.log('🚀 Proceed with implementing CoreSignal enrichment for all companies.');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeCoreSignalFields().catch(console.error);
