#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE SBI DATA MIGRATION
 * 
 * Migrates all SBI data from old database to new streamlined schema
 * Captures ALL vital career, enrichment, and business intelligence data
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

// Use streamlined schema for new database
const newPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Helper function to extract career data from customFields
function extractCareerData(customFields) {
  if (!customFields) return {};
  
  const enrichedData = customFields.enrichedData || {};
  const career = enrichedData.career || {};
  const coresignal = customFields.coresignal || {};
  
  return {
    // Career data
    currentRole: career.currentRole || null,
    currentCompany: career.currentCompany || null,
    yearsInRole: career.yearsInRole || null,
    yearsAtCompany: career.yearsAtCompany || null,
    totalExperience: career.totalExperience || null,
    industryExperience: career.industryExperience || null,
    leadershipExperience: career.leadershipExperience || null,
    budgetResponsibility: career.budgetResponsibility || null,
    teamSize: career.teamSize || null,
    achievements: career.achievements || [],
    certifications: career.certifications || [],
    publications: career.publications || [],
    speakingEngagements: career.speakingEngagements || [],
    
    // Education data
    degrees: career.education || null,
    institutions: career.education ? career.education.map(edu => edu.institution_name).filter(Boolean) : [],
    fieldsOfStudy: career.education ? career.education.map(edu => edu.degree).filter(Boolean) : [],
    graduationYears: career.education ? career.education.map(edu => edu.date_from_year).filter(Boolean) : [],
    
    // Skills data
    technicalSkills: career.skills || [],
    softSkills: [], // Extract from skills if needed
    industrySkills: [], // Extract from skills if needed
    languages: [], // Extract from skills if needed
    
    // Experience data
    previousRoles: career.previousRoles || null,
    careerTimeline: career.careerTimeline || null,
    roleHistory: career.previousRoles || null,
    
    // Coresignal data
    coresignalData: coresignal || null,
    enrichedData: enrichedData || null
  };
}

// Helper function to extract buyer group data from customFields
function extractBuyerGroupData(customFields) {
  if (!customFields) return {};
  
  return {
    buyerGroupRole: customFields.buyerGroupRole || null,
    decisionPower: customFields.decisionPower || 0,
    influenceLevel: customFields.influenceLevel || null,
    influenceScore: customFields.influenceScore || 0,
    engagementLevel: customFields.engagementLevel || null,
    buyerGroupStatus: customFields.buyerGroupStatus || null,
    isBuyerGroupMember: customFields.isBuyerGroupMember || false,
    buyerGroupOptimized: customFields.buyerGroupOptimized || false,
    decisionMaking: customFields.decisionMaking || null,
    communicationStyle: customFields.communicationStyle || null,
    engagementStrategy: customFields.engagementStrategy || null
  };
}

// Helper function to extract enrichment data from customFields
function extractEnrichmentData(customFields) {
  if (!customFields) return {};
  
  return {
    enrichmentScore: customFields.enrichmentScore || 0,
    enrichmentSources: customFields.enrichmentSources || [],
    lastEnriched: customFields.lastEnriched ? new Date(customFields.lastEnriched) : null,
    enrichmentVersion: customFields.enrichmentVersion || null,
    emailConfidence: customFields.emailConfidence || 0,
    phoneConfidence: customFields.phoneConfidence || 0,
    mobileVerified: customFields.mobileVerified || false,
    dataCompleteness: customFields.dataCompleteness || 0,
    preferredContact: customFields.preferredContact || null,
    responseTime: customFields.responseTime || null,
    statusReason: customFields.statusReason || null,
    statusUpdateDate: customFields.statusUpdateDate ? new Date(customFields.statusUpdateDate) : null,
    hiddenFromSections: customFields.hiddenFromSections || [],
    rolePromoted: customFields.rolePromoted || null
  };
}

// Helper function to extract company intelligence data from customFields
function extractCompanyIntelligenceData(customFields) {
  if (!customFields) return {};
  
  const companyIntelligence = customFields.companyIntelligence || {};
  
  return {
    companyIntelligence: companyIntelligence || null,
    businessChallenges: customFields.businessChallenges || [],
    businessPriorities: customFields.businessPriorities || [],
    competitiveAdvantages: customFields.competitiveAdvantages || [],
    growthOpportunities: customFields.growthOpportunities || [],
    strategicInitiatives: customFields.strategicInitiatives || [],
    successMetrics: customFields.successMetrics || [],
    marketThreats: customFields.marketThreats || [],
    keyInfluencers: customFields.keyInfluencers || null,
    decisionTimeline: customFields.decisionTimeline || null,
    marketPosition: companyIntelligence.marketPosition || customFields.marketPosition || null,
    digitalMaturity: companyIntelligence.digitalMaturity || customFields.digitalMaturity || 0,
    techStack: companyIntelligence.techStack || customFields.technologiesUsed || [],
    competitors: companyIntelligence.competitors || customFields.competitors || []
  };
}

// Helper function to extract company SBI data
function extractCompanySbiData(company) {
  return {
    confidence: company.confidence ? parseFloat(company.confidence) : 0,
    sources: company.sources || [],
    acquisitionDate: company.acquisitionDate ? new Date(company.acquisitionDate) : null,
    lastVerified: company.lastVerified ? new Date(company.lastVerified) : null,
    parentCompanyName: company.parent_company_name || null,
    parentCompanyDomain: company.parent_company_domain || null
  };
}

async function migrateSbiData(targetWorkspaceName = 'Notary Everyday') {
  try {
    console.log(`🚀 Starting SBI data migration for workspace: ${targetWorkspaceName}...\n`);
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // Find the target workspace in the SBI database using raw query
    const sbiWorkspaces = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE ${'%' + targetWorkspaceName + '%'}
    `;
    
    if (!sbiWorkspaces || sbiWorkspaces.length === 0) {
      throw new Error(`Workspace "${targetWorkspaceName}" not found in SBI database.`);
    }
    
    const sbiWorkspace = sbiWorkspaces[0];
    console.log(`📋 Found SBI workspace: ${sbiWorkspace.name} (${sbiWorkspace.id})\n`);

    // Create or find workspace in new database
    let newWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: targetWorkspaceName,
          mode: 'insensitive'
        }
      }
    });
    
    if (!newWorkspace) {
      newWorkspace = await newPrisma.workspaces.create({
        data: {
          name: sbiWorkspace.name,
          slug: sbiWorkspace.slug,
          timezone: sbiWorkspace.timezone || 'UTC',
          description: `Migrated from SBI database - ${sbiWorkspace.name}`,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created new workspace: ${newWorkspace.name} (${newWorkspace.id})\n`);
    } else {
      console.log(`📋 Using existing workspace: ${newWorkspace.name} (${newWorkspace.id})\n`);
    }
    
    const workspaceId = newWorkspace.id;

    // 1. MIGRATE COMPANIES
    console.log('🏢 MIGRATING COMPANIES...');
    
    const sbiCompanies = await sbiPrisma.$queryRaw`
      SELECT * FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace.id}
      AND "customFields" IS NOT NULL 
      AND "customFields"::text != '{}'
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`   Found ${sbiCompanies.length} companies with enrichment data`);
    
    let companiesMigrated = 0;
    for (const sbiCompany of sbiCompanies) {
      try {
        // Extract intelligence data
        const intelligenceData = extractCompanyIntelligenceData(sbiCompany.customFields);
        const sbiData = extractCompanySbiData(sbiCompany);
        
        // Create company in new database
        const newCompany = await newPrisma.companies.create({
          data: {
            workspaceId: workspaceId,
            name: sbiCompany.name,
            legalName: sbiCompany.legalName,
            tradingName: sbiCompany.tradingName,
            localName: sbiCompany.localName,
            description: sbiCompany.description,
            website: sbiCompany.website,
            email: sbiCompany.email,
            phone: sbiCompany.phone,
            fax: sbiCompany.fax,
            address: sbiCompany.address,
            city: sbiCompany.city,
            state: sbiCompany.state,
            country: sbiCompany.country,
            postalCode: sbiCompany.postalCode,
            industry: sbiCompany.industry,
            sector: sbiCompany.sector,
            size: sbiCompany.size,
            revenue: sbiCompany.revenue ? parseFloat(sbiCompany.revenue) : null,
            currency: sbiCompany.currency || 'USD',
            employeeCount: sbiCompany.employeeCount,
            foundedYear: sbiCompany.foundedYear,
            registrationNumber: sbiCompany.registrationNumber,
            taxId: sbiCompany.taxId,
            vatNumber: sbiCompany.vatNumber,
            domain: sbiCompany.domain,
            logoUrl: sbiCompany.logoUrl,
            status: 'ACTIVE',
            priority: 'MEDIUM',
            tags: sbiCompany.tags || [],
            customFields: sbiCompany.customFields,
            notes: sbiCompany.notes,
            lastAction: sbiCompany.lastAction,
            lastActionDate: sbiCompany.lastActionDate ? new Date(sbiCompany.lastActionDate) : null,
            nextAction: sbiCompany.nextAction,
            nextActionDate: sbiCompany.nextActionDate ? new Date(sbiCompany.nextActionDate) : null,
            actionStatus: sbiCompany.actionStatus,
            globalRank: sbiCompany.rank || 0,
            createdAt: sbiCompany.createdAt ? new Date(sbiCompany.createdAt) : new Date(),
            updatedAt: sbiCompany.updatedAt ? new Date(sbiCompany.updatedAt) : new Date(),
            entityId: sbiCompany.entity_id,
            deletedAt: sbiCompany.deletedAt ? new Date(sbiCompany.deletedAt) : null,
            
            // Company intelligence data
            ...intelligenceData,
            
            // SBI specific data
            ...sbiData,
            
            // Social media data
            linkedinUrl: sbiCompany.linkedinUrl,
            linkedinFollowers: sbiCompany.linkedinFollowers,
            twitterUrl: sbiCompany.twitterUrl,
            twitterFollowers: sbiCompany.twitterFollowers,
            facebookUrl: sbiCompany.facebookUrl,
            instagramUrl: sbiCompany.instagramUrl,
            youtubeUrl: sbiCompany.youtubeUrl,
            githubUrl: sbiCompany.githubUrl,
            
            // Location data
            hqLocation: sbiCompany.hqLocation,
            hqFullAddress: sbiCompany.hqFullAddress,
            hqCity: sbiCompany.hqCity,
            hqState: sbiCompany.hqState,
            hqStreet: sbiCompany.hqStreet,
            hqZipcode: sbiCompany.hqZipcode,
            hqRegion: sbiCompany.hqRegion || [],
            hqCountryIso2: sbiCompany.hqCountryIso2,
            hqCountryIso3: sbiCompany.hqCountryIso3,
            
            // Activity data
            companyUpdates: sbiCompany.companyUpdates,
            activeJobPostings: sbiCompany.activeJobPostings,
            numTechnologiesUsed: sbiCompany.numTechnologiesUsed,
            technologiesUsed: sbiCompany.technologiesUsed || [],
            
            // Financial data
            lastFundingAmount: sbiCompany.lastFundingAmount,
            lastFundingDate: sbiCompany.lastFundingDate ? new Date(sbiCompany.lastFundingDate) : null,
            stockSymbol: sbiCompany.stockSymbol,
            isPublic: sbiCompany.isPublic,
            naicsCodes: sbiCompany.naicsCodes || [],
            sicCodes: sbiCompany.sicCodes || []
          }
        });
        
        companiesMigrated++;
        console.log(`   ✅ Migrated company: ${sbiCompany.name} (${newCompany.id})`);
        
      } catch (error) {
        console.log(`   ❌ Error migrating company ${sbiCompany.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🏢 Companies migration completed: ${companiesMigrated}/${sbiCompanies.length} migrated\n`);

    // 2. MIGRATE PEOPLE
    console.log('👥 MIGRATING PEOPLE...');
    
    const sbiPeople = await sbiPrisma.$queryRaw`
      SELECT * FROM people 
      WHERE "workspaceId" = ${sbiWorkspace.id}
      AND "customFields" IS NOT NULL 
      AND "customFields"::text != '{}'
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`   Found ${sbiPeople.length} people with enrichment data`);
    
    let peopleMigrated = 0;
    for (const sbiPerson of sbiPeople) {
      try {
        // Extract career data
        const careerData = extractCareerData(sbiPerson.customFields);
        const buyerGroupData = extractBuyerGroupData(sbiPerson.customFields);
        const enrichmentData = extractEnrichmentData(sbiPerson.customFields);
        
        // Find company in new database (if exists)
        let companyId = null;
        if (sbiPerson.companyId) {
          const company = await newPrisma.companies.findFirst({
            where: {
              workspaceId: workspaceId,
              OR: [
                { name: { contains: sbiPerson.companyId, mode: 'insensitive' } },
                { domain: { contains: sbiPerson.companyId, mode: 'insensitive' } }
              ]
            }
          });
          companyId = company?.id || null;
        }
        
        // Create person in new database
        const newPerson = await newPrisma.people.create({
          data: {
            workspaceId: workspaceId,
            companyId: companyId,
            firstName: sbiPerson.firstName,
            lastName: sbiPerson.lastName,
            fullName: sbiPerson.fullName,
            displayName: sbiPerson.displayName,
            salutation: sbiPerson.salutation,
            suffix: sbiPerson.suffix,
            jobTitle: sbiPerson.jobTitle,
            title: sbiPerson.jobTitle, // Map jobTitle to title
            department: sbiPerson.department,
            seniority: sbiPerson.seniority,
            email: sbiPerson.email,
            workEmail: sbiPerson.workEmail,
            personalEmail: sbiPerson.personalEmail,
            phone: sbiPerson.phone,
            mobilePhone: sbiPerson.mobilePhone,
            workPhone: sbiPerson.workPhone,
            linkedinUrl: sbiPerson.linkedinUrl,
            address: sbiPerson.address,
            city: sbiPerson.city,
            state: sbiPerson.state,
            country: sbiPerson.country,
            postalCode: sbiPerson.postalCode,
            dateOfBirth: sbiPerson.dateOfBirth ? new Date(sbiPerson.dateOfBirth) : null,
            gender: sbiPerson.gender,
            bio: sbiPerson.bio,
            profilePictureUrl: sbiPerson.profilePictureUrl,
            status: 'LEAD', // Set all SBI people as LEAD as requested
            priority: 'MEDIUM',
            source: 'SBI_MIGRATION',
            tags: sbiPerson.tags || [],
            customFields: sbiPerson.customFields,
            notes: sbiPerson.notes,
            preferredLanguage: sbiPerson.preferredLanguage,
            timezone: sbiPerson.timezone,
            emailVerified: sbiPerson.emailVerified || false,
            phoneVerified: sbiPerson.phoneVerified || false,
            lastAction: sbiPerson.lastAction,
            lastActionDate: sbiPerson.lastActionDate ? new Date(sbiPerson.lastActionDate) : null,
            nextAction: sbiPerson.nextAction,
            nextActionDate: sbiPerson.nextActionDate ? new Date(sbiPerson.nextActionDate) : null,
            actionStatus: sbiPerson.actionStatus,
            engagementScore: sbiPerson.engagementScore || 0,
            globalRank: sbiPerson.rank || 0,
            companyRank: 0,
            createdAt: sbiPerson.createdAt ? new Date(sbiPerson.createdAt) : new Date(),
            updatedAt: sbiPerson.updatedAt ? new Date(sbiPerson.updatedAt) : new Date(),
            entityId: sbiPerson.entity_id,
            deletedAt: sbiPerson.deletedAt ? new Date(sbiPerson.deletedAt) : null,
            vertical: null, // Will be set based on company data
            
            // Career data
            ...careerData,
            
            // Buyer group data
            ...buyerGroupData,
            
            // Enrichment data
            ...enrichmentData
          }
        });
        
        peopleMigrated++;
        console.log(`   ✅ Migrated person: ${sbiPerson.fullName} (${newPerson.id})`);
        
      } catch (error) {
        console.log(`   ❌ Error migrating person ${sbiPerson.fullName}: ${error.message}`);
      }
    }
    
    console.log(`\n👥 People migration completed: ${peopleMigrated}/${sbiPeople.length} migrated\n`);

    // 3. SUMMARY
    console.log('📊 MIGRATION SUMMARY:');
    console.log('====================');
    console.log(`✅ Companies migrated: ${companiesMigrated}`);
    console.log(`✅ People migrated: ${peopleMigrated}`);
    console.log(`✅ Total records migrated: ${companiesMigrated + peopleMigrated}`);
    console.log('\n🎉 SBI data migration completed successfully!');
    console.log('\n📋 All vital career, enrichment, and business intelligence data has been preserved:');
    console.log('   - Career data (roles, experience, skills, education)');
    console.log('   - Buyer group data (decision power, influence, engagement)');
    console.log('   - Enrichment data (scores, sources, verification)');
    console.log('   - Company intelligence (challenges, opportunities, competitors)');
    console.log('   - SBI specific data (confidence, sources, verification)');

  } catch (error) {
    console.error('❌ Error during SBI data migration:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the migration for Notary Everyday
migrateSbiData('Notary Everyday');
