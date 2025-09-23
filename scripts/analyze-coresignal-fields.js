#!/usr/bin/env node

/**
 * 🔍 ANALYZE CORESIGNAL FIELDS
 * 
 * This script analyzes the CoreSignal data to determine which fields
 * should be created as actual database columns vs stored in customFields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function analyzeCoreSignalFields() {
  console.log('🔍 ANALYZING CORESIGNAL FIELDS');
  console.log('==============================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get a company with CoreSignal data
    const company = await prisma.companies.findFirst({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        customFields: { not: null }
      },
      select: { 
        id: true,
        name: true,
        customFields: true 
      }
    });

    if (!company?.customFields?.coresignalData) {
      console.log('❌ No CoreSignal data found. Run enrichment first.');
      return;
    }

    const coresignalData = company.customFields.coresignalData;
    const fields = Object.keys(coresignalData);

    console.log(`📊 Found ${fields.length} CoreSignal fields for ${company.name}\n`);

    // Categorize fields by importance and usage
    const fieldCategories = {
      // Overview Tab Fields (High Priority - Create as DB columns)
      overviewTab: [
        'company_name',
        'size_range', 
        'hq_full_address',
        'hq_city',
        'hq_state', 
        'hq_country',
        'founded_year',
        'ownership_status',
        'company_phone_numbers',
        'website',
        'linkedin_url',
        'description_enriched'
      ],
      
      // Intelligence Tab Fields (High Priority - Create as DB columns)
      intelligenceTab: [
        'description_enriched',
        'industry',
        'categories_and_keywords',
        'naics_codes',
        'sic_codes',
        'employees_count',
        'revenue_annual',
        'active_job_postings_count',
        'followers_count_linkedin'
      ],
      
      // Business Intelligence Fields (Medium Priority - Create as DB columns)
      businessIntelligence: [
        'revenue_annual',
        'employees_count',
        'active_job_postings_count',
        'followers_count_linkedin',
        'technologies_used',
        'competitors',
        'funding_rounds',
        'acquisition_list_source_1',
        'acquisition_list_source_2',
        'acquisition_list_source_5'
      ],
      
      // Social Media & Contact Fields (Medium Priority - Create as DB columns)
      socialMedia: [
        'linkedin_url',
        'facebook_url',
        'twitter_url',
        'instagram_url',
        'youtube_url',
        'github_url',
        'company_phone_numbers',
        'company_emails'
      ],
      
      // Location & Address Fields (Medium Priority - Create as DB columns)
      location: [
        'hq_full_address',
        'hq_city',
        'hq_state',
        'hq_country',
        'hq_zipcode',
        'hq_street',
        'company_locations_full'
      ],
      
      // Financial Fields (Medium Priority - Create as DB columns)
      financial: [
        'revenue_annual',
        'revenue_quarterly',
        'income_statements',
        'funding_rounds',
        'last_funding_round_amount_raised',
        'last_funding_round_announced_date'
      ],
      
      // Employee & HR Fields (Low Priority - Store in customFields)
      employeeData: [
        'employees_count',
        'employees_count_by_month',
        'employees_count_breakdown_by_seniority',
        'employees_count_breakdown_by_department',
        'employees_count_breakdown_by_region',
        'employees_count_by_country',
        'key_executives',
        'key_employee_change_events',
        'key_executive_arrivals',
        'key_executive_departures'
      ],
      
      // Website & Traffic Fields (Low Priority - Store in customFields)
      websiteData: [
        'total_website_visits_monthly',
        'visits_change_monthly',
        'rank_global',
        'rank_country',
        'rank_category',
        'visits_breakdown_by_country',
        'visits_breakdown_by_gender',
        'visits_breakdown_by_age',
        'bounce_rate',
        'pages_per_visit',
        'average_visit_duration_seconds'
      ],
      
      // Reviews & Ratings Fields (Low Priority - Store in customFields)
      reviewsData: [
        'product_reviews_count',
        'product_reviews_aggregate_score',
        'product_reviews_score_distribution',
        'company_employee_reviews_count',
        'company_employee_reviews_aggregate_score',
        'employee_reviews_score_breakdown',
        'employee_reviews_score_distribution'
      ],
      
      // Historical & Trend Data (Low Priority - Store in customFields)
      historicalData: [
        'linkedin_followers_count_by_month',
        'active_job_postings_count_by_month',
        'employees_count_by_month',
        'product_reviews_score_by_month',
        'total_website_visits_by_month',
        'employee_reviews_score_aggregated_by_month'
      ]
    };

    console.log('📋 FIELD CATEGORIZATION ANALYSIS');
    console.log('================================\n');

    // Analyze each category
    for (const [categoryName, categoryFields] of Object.entries(fieldCategories)) {
      console.log(`🏷️  ${categoryName.toUpperCase()}:`);
      const availableFields = categoryFields.filter(field => fields.includes(field));
      const missingFields = categoryFields.filter(field => !fields.includes(field));
      
      console.log(`   Available: ${availableFields.length}/${categoryFields.length} fields`);
      if (availableFields.length > 0) {
        availableFields.forEach(field => {
          const value = coresignalData[field];
          const hasData = value !== null && value !== undefined && 
                         !(Array.isArray(value) && value.length === 0) &&
                         !(typeof value === 'object' && Object.keys(value).length === 0);
          console.log(`     ${hasData ? '✅' : '❌'} ${field}: ${hasData ? 'Has data' : 'No data'}`);
        });
      }
      if (missingFields.length > 0) {
        console.log(`   Missing: ${missingFields.join(', ')}`);
      }
      console.log('');
    }

    // Recommend database schema changes
    console.log('💡 RECOMMENDED DATABASE SCHEMA CHANGES');
    console.log('=====================================\n');

    const recommendedFields = [
      // Overview Tab Fields
      { name: 'linkedin_url', type: 'VARCHAR(500)', priority: 'HIGH', reason: 'Overview tab' },
      { name: 'founded_year', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab' },
      { name: 'employee_count', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab' },
      { name: 'active_job_postings', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab' },
      { name: 'linkedin_followers', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab' },
      
      // Intelligence Tab Fields
      { name: 'naics_codes', type: 'TEXT[]', priority: 'HIGH', reason: 'Intelligence tab' },
      { name: 'sic_codes', type: 'TEXT[]', priority: 'HIGH', reason: 'Intelligence tab' },
      { name: 'technologies_used', type: 'TEXT[]', priority: 'MEDIUM', reason: 'Technology intelligence' },
      { name: 'competitors', type: 'TEXT[]', priority: 'MEDIUM', reason: 'Competitive analysis' },
      
      // Social Media Fields
      { name: 'facebook_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media' },
      { name: 'twitter_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media' },
      { name: 'instagram_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media' },
      { name: 'youtube_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media' },
      { name: 'github_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media' },
      
      // Financial Fields
      { name: 'revenue_currency', type: 'VARCHAR(3)', priority: 'MEDIUM', reason: 'Financial data' },
      { name: 'last_funding_amount', type: 'BIGINT', priority: 'MEDIUM', reason: 'Financial data' },
      { name: 'last_funding_date', type: 'DATE', priority: 'MEDIUM', reason: 'Financial data' },
      
      // Intelligence Tab Content Fields
      { name: 'situation_analysis', type: 'TEXT', priority: 'HIGH', reason: 'Intelligence tab content' },
      { name: 'complications', type: 'TEXT', priority: 'HIGH', reason: 'Intelligence tab content' },
      { name: 'strategic_intelligence', type: 'TEXT', priority: 'HIGH', reason: 'Intelligence tab content' }
    ];

    console.log('🎯 HIGH PRIORITY FIELDS (Create as DB columns):');
    recommendedFields
      .filter(f => f.priority === 'HIGH')
      .forEach(field => {
        console.log(`   ALTER TABLE companies ADD COLUMN ${field.name} ${field.type}; -- ${field.reason}`);
      });

    console.log('\n🎯 MEDIUM PRIORITY FIELDS (Create as DB columns):');
    recommendedFields
      .filter(f => f.priority === 'MEDIUM')
      .forEach(field => {
        console.log(`   ALTER TABLE companies ADD COLUMN ${field.name} ${field.type}; -- ${field.reason}`);
      });

    console.log('\n📊 SUMMARY:');
    console.log(`   Total CoreSignal fields: ${fields.length}`);
    console.log(`   High priority fields to create: ${recommendedFields.filter(f => f.priority === 'HIGH').length}`);
    console.log(`   Medium priority fields to create: ${recommendedFields.filter(f => f.priority === 'MEDIUM').length}`);
    console.log(`   Fields to keep in customFields: ${fields.length - recommendedFields.length}`);

    console.log('\n💡 RECOMMENDATION:');
    console.log('   Create the high and medium priority fields as actual database columns');
    console.log('   Keep the rest in customFields for future use');
    console.log('   This will make the Overview and Intelligence tabs much richer');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeCoreSignalFields().catch(console.error);
