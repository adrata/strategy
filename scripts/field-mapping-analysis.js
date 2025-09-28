// CoreSignal to Database Field Mapping Analysis

const coresignalFields = {
  // Basic Company Information
  'company_name': 'String',
  'legal_name': 'String', 
  'trading_name': 'String',
  'local_name': 'String',
  'website': 'String',
  'domain': 'String',
  'email': 'String',
  'phone': 'String',
  'fax': 'String',
  
  // Location Information
  'address': 'String',
  'city': 'String',
  'state': 'String',
  'country': 'String',
  'postal_code': 'String',
  'hq_location': 'String',
  'hq_full_address': 'String',
  'hq_city': 'String',
  'hq_state': 'String',
  'hq_street': 'String',
  'hq_zipcode': 'String',
  
  // Business Information
  'industry': 'String',
  'sector': 'String',
  'size_range': 'String',
  'employees_count': 'Number',
  'revenue': 'Number',
  'currency': 'String',
  'founded_year': 'Number',
  'is_public': 'Boolean',
  'stock_ticker': 'Array',
  'type': 'String',
  'status': 'Object',
  
  // Social Media & Online Presence
  'linkedin_url': 'String',
  'facebook_url': 'String',
  'twitter_url': 'String',
  'instagram_url': 'String',
  'youtube_url': 'String',
  'github_url': 'String',
  'linkedin_followers': 'Number',
  'followers_count_linkedin': 'Number',
  'followers_count_twitter': 'Number',
  'followers_count_owler': 'Number',
  'active_job_postings': 'Number',
  
  // Industry Classification
  'naics_codes': 'Array',
  'sic_codes': 'Array',
  'categories_and_keywords': 'Array',
  
  // Business Intelligence
  'technologies_used': 'Array',
  'competitors': 'Array',
  'company_updates': 'Array',
  'num_technologies_used': 'Number',
  
  // Enhanced Descriptions
  'description': 'String',
  'description_enriched': 'String',
  'description_metadata_raw': 'String',
  
  // Company Logo
  'company_logo_url': 'String',
  
  // Regional Information
  'hq_region': 'Array',
  'hq_country_iso2': 'String',
  'hq_country_iso3': 'String'
};

const currentSchemaFields = {
  'name': 'String',
  'legalName': 'String',
  'tradingName': 'String',
  'localName': 'String',
  'website': 'String',
  'email': 'String',
  'phone': 'String',
  'fax': 'String',
  'address': 'String',
  'city': 'String',
  'state': 'String',
  'country': 'String',
  'postalCode': 'String',
  'industry': 'String',
  'sector': 'String',
  'size': 'String',
  'revenue': 'Decimal',
  'currency': 'String',
  'description': 'String',
  'tags': 'String[]',
  'customFields': 'Json',
  'linkedinUrl': 'String',
  'foundedYear': 'Int',
  'employeeCount': 'Int',
  'activeJobPostings': 'Int',
  'linkedinFollowers': 'Int',
  'naicsCodes': 'String[]',
  'sicCodes': 'String[]',
  'facebookUrl': 'String',
  'twitterUrl': 'String',
  'instagramUrl': 'String',
  'youtubeUrl': 'String',
  'githubUrl': 'String',
  'technologiesUsed': 'String[]',
  'competitors': 'String[]'
};

function analyzeMapping() {
  console.log('🔍 CORESIGNAL TO DATABASE FIELD MAPPING ANALYSIS');
  console.log('===============================================\n');
  
  const coresignalFieldList = Object.keys(coresignalFields);
  const schemaFieldList = Object.keys(currentSchemaFields);
  
  console.log(`📊 Total CoreSignal fields: ${coresignalFieldList.length}`);
  console.log(`📊 Total schema fields: ${schemaFieldList.length}\n`);
  
  // Direct mappings
  const directMappings = {
    'company_name': 'name',
    'legal_name': 'legalName',
    'trading_name': 'tradingName',
    'local_name': 'localName',
    'website': 'website',
    'email': 'email',
    'phone': 'phone',
    'fax': 'fax',
    'address': 'address',
    'city': 'city',
    'state': 'state',
    'country': 'country',
    'postal_code': 'postalCode',
    'industry': 'industry',
    'sector': 'sector',
    'size_range': 'size',
    'employees_count': 'employeeCount',
    'revenue': 'revenue',
    'currency': 'currency',
    'founded_year': 'foundedYear',
    'description': 'description',
    'linkedin_url': 'linkedinUrl',
    'linkedin_followers': 'linkedinFollowers',
    'followers_count_linkedin': 'linkedinFollowers',
    'active_job_postings': 'activeJobPostings',
    'naics_codes': 'naicsCodes',
    'sic_codes': 'sicCodes',
    'facebook_url': 'facebookUrl',
    'twitter_url': 'twitterUrl',
    'instagram_url': 'instagramUrl',
    'youtube_url': 'youtubeUrl',
    'github_url': 'githubUrl',
    'technologies_used': 'technologiesUsed',
    'competitors': 'competitors',
    'categories_and_keywords': 'tags'
  };
  
  console.log('✅ DIRECT MAPPINGS:');
  console.log('==================');
  Object.entries(directMappings).forEach(([coresignal, schema]) => {
    console.log(`  ${coresignal} → ${schema}`);
  });
  
  // Missing important fields
  const missingFields = [
    'is_public',
    'stock_ticker', 
    'company_logo_url',
    'domain',
    'hq_location',
    'hq_full_address',
    'hq_city',
    'hq_state',
    'hq_street',
    'hq_zipcode',
    'followers_count_twitter',
    'followers_count_owler',
    'company_updates',
    'num_technologies_used',
    'description_enriched',
    'description_metadata_raw',
    'hq_region',
    'hq_country_iso2',
    'hq_country_iso3'
  ];
  
  console.log('\n❌ MISSING IMPORTANT FIELDS:');
  console.log('============================');
  missingFields.forEach(field => {
    console.log(`  ${field} (${coresignalFields[field]})`);
  });
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('===================');
  console.log('\n1. ADD MISSING SCHEMA FIELDS:');
  console.log('   isPublic Boolean?');
  console.log('   stockSymbol String?');
  console.log('   logoUrl String?');
  console.log('   domain String?');
  console.log('   hqLocation String?');
  console.log('   hqFullAddress String?');
  console.log('   hqCity String?');
  console.log('   hqState String?');
  console.log('   hqStreet String?');
  console.log('   hqZipcode String?');
  console.log('   twitterFollowers Int?');
  console.log('   owlerFollowers Int?');
  console.log('   companyUpdates Json?');
  console.log('   numTechnologiesUsed Int?');
  console.log('   descriptionEnriched String?');
  console.log('   descriptionMetadataRaw String?');
  console.log('   hqRegion String[]');
  console.log('   hqCountryIso2 String?');
  console.log('   hqCountryIso3 String?');
  
  console.log('\n2. STORE IN CUSTOM FIELDS:');
  console.log('   All other fields can be stored in customFields JSON');
  
  console.log('\n📊 SUMMARY:');
  console.log('============');
  console.log(`✅ Direct mappings: ${Object.keys(directMappings).length}`);
  console.log(`❌ Missing fields: ${missingFields.length}`);
  console.log(`📈 Coverage: ${Math.round((Object.keys(directMappings).length / coresignalFieldList.length) * 100)}%`);
}

analyzeMapping();
