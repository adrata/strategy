#!/usr/bin/env node

/**
 * 🔍 ANALYZE MISSING FIELDS
 * 
 * Compare SBI data fields with our current schema to identify missing fields
 */

console.log('🔍 ANALYZING MISSING FIELDS FOR SBI DATA MIGRATION\n');

// Based on the SBI data analysis, here are the vital fields we need to add:

const MISSING_PEOPLE_FIELDS = {
  // Career & Experience Data (CRITICAL)
  career: {
    currentRole: 'String? @db.VarChar(200)',
    currentCompany: 'String? @db.VarChar(200)', 
    yearsInRole: 'Int?',
    yearsAtCompany: 'Int?',
    totalExperience: 'Int?', // years
    industryExperience: 'String? @db.VarChar(100)',
    leadershipExperience: 'String? @db.VarChar(100)',
    budgetResponsibility: 'String? @db.VarChar(100)',
    teamSize: 'String? @db.VarChar(50)',
    achievements: 'String[] @default([])',
    certifications: 'String[] @default([])',
    publications: 'String[] @default([])',
    speakingEngagements: 'String[] @default([])'
  },
  
  // Education Data (CRITICAL)
  education: {
    degrees: 'Json?', // Array of education records
    institutions: 'String[] @default([])',
    fieldsOfStudy: 'String[] @default([])',
    graduationYears: 'Int[] @default([])'
  },
  
  // Skills & Expertise (CRITICAL)
  skills: {
    technicalSkills: 'String[] @default([])',
    softSkills: 'String[] @default([])',
    industrySkills: 'String[] @default([])',
    languages: 'String[] @default([])'
  },
  
  // Previous Roles & Experience (CRITICAL)
  experience: {
    previousRoles: 'Json?', // Array of role records
    careerTimeline: 'Json?', // Chronological career data
    roleHistory: 'Json?' // Detailed role information
  },
  
  // Buyer Group & Decision Making (CRITICAL)
  buyerGroup: {
    buyerGroupRole: 'String? @db.VarChar(50)',
    decisionPower: 'Int? @default(0)',
    influenceLevel: 'String? @db.VarChar(50)',
    influenceScore: 'Float? @default(0)',
    engagementLevel: 'String? @db.VarChar(50)',
    buyerGroupStatus: 'String? @db.VarChar(50)',
    isBuyerGroupMember: 'Boolean? @default(false)',
    buyerGroupOptimized: 'Boolean? @default(false)',
    decisionMaking: 'String? @db.VarChar(50)',
    communicationStyle: 'String? @db.VarChar(50)',
    engagementStrategy: 'String? @db.VarChar(100)'
  },
  
  // Enrichment & Intelligence Data (CRITICAL)
  enrichment: {
    enrichmentScore: 'Float? @default(0)',
    enrichmentSources: 'String[] @default([])',
    lastEnriched: 'DateTime?',
    enrichmentVersion: 'String? @db.VarChar(20)',
    coresignalData: 'Json?', // Coresignal enrichment data
    enrichedData: 'Json?' // General enrichment data
  },
  
  // Contact & Verification Data
  contact: {
    emailConfidence: 'Float? @default(0)',
    phoneConfidence: 'Float? @default(0)',
    mobileVerified: 'Boolean? @default(false)',
    dataCompleteness: 'Float? @default(0)',
    preferredContact: 'String? @db.VarChar(50)',
    responseTime: 'String? @db.VarChar(50)'
  },
  
  // Status & Tracking
  status: {
    statusReason: 'String? @db.VarChar(200)',
    statusUpdateDate: 'DateTime?',
    hiddenFromSections: 'String[] @default([])',
    rolePromoted: 'Json?' // Role promotion data
  }
};

const MISSING_COMPANY_FIELDS = {
  // Company Intelligence Data (CRITICAL)
  intelligence: {
    companyIntelligence: 'Json?', // Company analysis data
    businessChallenges: 'String[] @default([])',
    businessPriorities: 'String[] @default([])',
    competitiveAdvantages: 'String[] @default([])',
    growthOpportunities: 'String[] @default([])',
    strategicInitiatives: 'String[] @default([])',
    successMetrics: 'String[] @default([])',
    marketThreats: 'String[] @default([])',
    keyInfluencers: 'String? @db.VarChar(200)',
    decisionTimeline: 'String? @db.VarChar(100)',
    marketPosition: 'String? @db.VarChar(100)',
    digitalMaturity: 'Int? @default(0)',
    techStack: 'String[] @default([])',
    competitors: 'String[] @default([])'
  },
  
  // Financial & Business Data
  financial: {
    lastFundingAmount: 'BigInt?',
    lastFundingDate: 'DateTime?',
    stockSymbol: 'String? @db.VarChar(20)',
    isPublic: 'Boolean? @default(false)',
    naicsCodes: 'String[] @default([])',
    sicCodes: 'String[] @default([])'
  },
  
  // Social Media & Online Presence
  social: {
    linkedinUrl: 'String? @db.VarChar(500)',
    linkedinFollowers: 'Int?',
    twitterUrl: 'String? @db.VarChar(500)',
    twitterFollowers: 'Int?',
    facebookUrl: 'String? @db.VarChar(500)',
    instagramUrl: 'String? @db.VarChar(500)',
    youtubeUrl: 'String? @db.VarChar(500)',
    githubUrl: 'String? @db.VarChar(500)'
  },
  
  // Location & Address Data
  location: {
    hqLocation: 'String? @db.VarChar(200)',
    hqFullAddress: 'String? @db.VarChar(500)',
    hqCity: 'String? @db.VarChar(100)',
    hqState: 'String? @db.VarChar(100)',
    hqStreet: 'String? @db.VarChar(200)',
    hqZipcode: 'String? @db.VarChar(20)',
    hqRegion: 'String[] @default([])',
    hqCountryIso2: 'String? @db.VarChar(2)',
    hqCountryIso3: 'String? @db.VarChar(3)'
  },
  
  // Company Updates & Activity
  activity: {
    companyUpdates: 'Json?', // Company activity data
    activeJobPostings: 'Int? @default(0)',
    numTechnologiesUsed: 'Int? @default(0)',
    technologiesUsed: 'String[] @default([])'
  },
  
  // SBI Specific Fields
  sbi: {
    confidence: 'Float? @default(0)',
    sources: 'String[] @default([])',
    acquisitionDate: 'DateTime?',
    lastVerified: 'DateTime?',
    parentCompanyName: 'String? @db.VarChar(200)',
    parentCompanyDomain: 'String? @db.VarChar(200)'
  }
};

console.log('📋 MISSING PEOPLE FIELDS ANALYSIS:');
console.log('=====================================');

Object.entries(MISSING_PEOPLE_FIELDS).forEach(([category, fields]) => {
  console.log(`\n🎯 ${category.toUpperCase()} FIELDS (${Object.keys(fields).length} fields):`);
  Object.entries(fields).forEach(([field, type]) => {
    console.log(`   - ${field}: ${type}`);
  });
});

console.log('\n📋 MISSING COMPANY FIELDS ANALYSIS:');
console.log('=====================================');

Object.entries(MISSING_COMPANY_FIELDS).forEach(([category, fields]) => {
  console.log(`\n🏢 ${category.toUpperCase()} FIELDS (${Object.keys(fields).length} fields):`);
  Object.entries(fields).forEach(([field, type]) => {
    console.log(`   - ${field}: ${type}`);
  });
});

console.log('\n🚨 CRITICAL FIELDS THAT MUST BE ADDED:');
console.log('=====================================');
console.log('These fields contain vital career and business intelligence data:');
console.log('');
console.log('PEOPLE - Career Data:');
console.log('  - currentRole, currentCompany, yearsInRole, yearsAtCompany');
console.log('  - totalExperience, industryExperience, leadershipExperience');
console.log('  - skills (technical, soft, industry), education, certifications');
console.log('  - previousRoles, careerTimeline, achievements');
console.log('');
console.log('PEOPLE - Buyer Group Data:');
console.log('  - buyerGroupRole, decisionPower, influenceLevel, influenceScore');
console.log('  - engagementLevel, decisionMaking, communicationStyle');
console.log('');
console.log('PEOPLE - Enrichment Data:');
console.log('  - enrichmentScore, enrichmentSources, coresignalData');
console.log('  - enrichedData (career, overview, intelligence)');
console.log('');
console.log('COMPANIES - Intelligence Data:');
console.log('  - companyIntelligence, businessChallenges, businessPriorities');
console.log('  - competitiveAdvantages, growthOpportunities, strategicInitiatives');
console.log('  - techStack, competitors, marketPosition, digitalMaturity');
console.log('');
console.log('COMPANIES - SBI Data:');
console.log('  - confidence, sources, acquisitionDate, lastVerified');
console.log('  - parentCompanyName, parentCompanyDomain');

console.log('\n✅ ANALYSIS COMPLETE - Ready to create migration script!');
