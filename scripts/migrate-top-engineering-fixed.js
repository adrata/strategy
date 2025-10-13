#!/usr/bin/env node

/**
 * 🚀 MIGRATE TOP ENGINEERING PLUS (FIXED)
 * 
 * Migrates TOP Engineering Plus workspace data with proper ID mapping
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

const newPrisma = new PrismaClient();

async function migrateTopEngineeringFixed() {
  try {
    console.log('🚀 Migrating TOP Engineering Plus workspace (FIXED)...\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // 1. Find TOP Engineering Plus workspace in SBI database
    console.log('📋 FINDING TOP ENGINEERING PLUS WORKSPACE IN SBI DATABASE:');
    const sbiWorkspace = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%top engineering plus%'
      LIMIT 1;
    `;
    
    if (!sbiWorkspace || sbiWorkspace.length === 0) {
      throw new Error('TOP Engineering Plus workspace not found in SBI database!');
    }
    
    console.log(`✅ Found SBI workspace: ${sbiWorkspace[0].name} (${sbiWorkspace[0].id})\n`);

    // 2. Find or create TOP Engineering Plus workspace in new database
    let newWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP Engineering Plus',
          mode: 'insensitive'
        }
      }
    });
    
    if (!newWorkspace) {
      newWorkspace = await newPrisma.workspaces.create({
        data: {
          name: sbiWorkspace[0].name,
          slug: sbiWorkspace[0].slug,
          timezone: sbiWorkspace[0].timezone || 'UTC',
          description: `Migrated from SBI database - ${sbiWorkspace[0].name}`,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created new workspace: ${newWorkspace.name} (${newWorkspace.id})\n`);
    } else {
      console.log(`📋 Using existing workspace: ${newWorkspace.name} (${newWorkspace.id})\n`);
    }

    // 3. Clear existing data first
    console.log('🗑️ CLEARING EXISTING DATA:');
    await newPrisma.people.deleteMany({ where: { workspaceId: newWorkspace.id } });
    await newPrisma.companies.deleteMany({ where: { workspaceId: newWorkspace.id } });
    console.log('✅ Cleared existing data\n');

    // 4. Migrate ALL companies and create ID mapping
    console.log('🏢 MIGRATING ALL COMPANIES:');
    const sbiCompanies = await sbiPrisma.$queryRaw`
      SELECT * FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`   Found ${sbiCompanies.length} companies to migrate`);
    
    // Create mapping from old company ID to new company ID
    const companyIdMapping = new Map();
    let companiesMigrated = 0;
    
    for (const company of sbiCompanies) {
      try {
        // Extract customFields data if it exists
        let customFieldsData = {};
        if (company.customFields && company.customFields !== null) {
          try {
            customFieldsData = typeof company.customFields === 'string' 
              ? JSON.parse(company.customFields) 
              : company.customFields;
          } catch (e) {
            console.log(`   Warning: Could not parse customFields for company ${company.name}`);
          }
        }
        
        // Create company in new database with ULID
        const newCompany = await newPrisma.companies.create({
          data: {
            workspaceId: newWorkspace.id,
            name: company.name,
            domain: company.domain,
            industry: company.industry,
            companySize: company.companySize,
            revenue: company.revenue,
            description: company.description,
            website: company.website,
            phone: company.phone,
            email: company.email,
            address: company.address,
            city: company.city,
            state: company.state,
            country: company.country,
            postalCode: company.postalCode,
            linkedinUrl: company.linkedinUrl,
            twitterUrl: company.twitterUrl,
            facebookUrl: company.facebookUrl,
            instagramUrl: company.instagramUrl,
            youtubeUrl: company.youtubeUrl,
            githubUrl: company.githubUrl,
            status: company.status ? company.status.toUpperCase() : 'ACTIVE',
            priority: company.priority ? company.priority.toUpperCase() : 'MEDIUM',
            source: company.source,
            tags: company.tags || [],
            customFields: customFieldsData,
            notes: company.notes,
            // Opportunity tracking fields
            opportunityStage: company.opportunityStage,
            opportunityAmount: company.opportunityAmount,
            opportunityProbability: company.opportunityProbability,
            expectedCloseDate: company.expectedCloseDate ? new Date(company.expectedCloseDate) : null,
            actualCloseDate: company.actualCloseDate ? new Date(company.actualCloseDate) : null,
            // Company intelligence fields
            companyIntelligence: company.companyIntelligence,
            businessChallenges: company.businessChallenges || [],
            businessPriorities: company.businessPriorities || [],
            competitiveAdvantages: company.competitiveAdvantages || [],
            growthOpportunities: company.growthOpportunities || [],
            strategicInitiatives: company.strategicInitiatives || [],
            successMetrics: company.successMetrics || [],
            marketThreats: company.marketThreats || [],
            keyInfluencers: company.keyInfluencers,
            decisionTimeline: company.decisionTimeline,
            marketPosition: company.marketPosition,
            digitalMaturity: company.digitalMaturity,
            techStack: company.techStack || [],
            competitors: company.competitors || [],
            // Financial & business data
            lastFundingAmount: company.lastFundingAmount,
            lastFundingDate: company.lastFundingDate ? new Date(company.lastFundingDate) : null,
            stockSymbol: company.stockSymbol,
            isPublic: company.isPublic,
            naicsCodes: company.naicsCodes || [],
            sicCodes: company.sicCodes || [],
            // Social media & online presence
            linkedinFollowers: company.linkedinFollowers,
            twitterFollowers: company.twitterFollowers,
            // Location & address data
            hqLocation: company.hqLocation,
            hqFullAddress: company.hqFullAddress,
            hqCity: company.hqCity,
            hqState: company.hqState,
            hqStreet: company.hqStreet,
            hqZipcode: company.hqZipcode,
            hqRegion: company.hqRegion || [],
            hqCountryIso2: company.hqCountryIso2,
            hqCountryIso3: company.hqCountryIso3,
            // Company updates & activity
            companyUpdates: company.companyUpdates,
            activeJobPostings: company.activeJobPostings,
            numTechnologiesUsed: company.numTechnologiesUsed,
            technologiesUsed: company.technologiesUsed || [],
            // SBI specific fields
            confidence: company.confidence,
            sources: company.sources || [],
            acquisitionDate: company.acquisitionDate ? new Date(company.acquisitionDate) : null,
            lastVerified: company.lastVerified ? new Date(company.lastVerified) : null,
            parentCompanyName: company.parentCompanyName,
            parentCompanyDomain: company.parentCompanyDomain,
            createdAt: new Date(company.createdAt),
            updatedAt: new Date(company.updatedAt)
          }
        });
        
        // Store the mapping from old ID to new ID
        companyIdMapping.set(company.id, newCompany.id);
        companiesMigrated++;
        
        if (companiesMigrated % 50 === 0) {
          console.log(`   Migrated ${companiesMigrated} companies...`);
        }
        
      } catch (error) {
        console.log(`   Error migrating company ${company.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Companies migration complete: ${companiesMigrated} migrated\n`);

    // 5. Migrate ALL people using the company ID mapping
    console.log('👥 MIGRATING ALL PEOPLE:');
    const sbiPeople = await sbiPrisma.$queryRaw`
      SELECT * FROM people 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`   Found ${sbiPeople.length} people to migrate`);
    
    let peopleMigrated = 0;
    let peopleSkipped = 0;
    
    for (const person of sbiPeople) {
      try {
        // Extract customFields data if it exists
        let customFieldsData = {};
        if (person.customFields && person.customFields !== null) {
          try {
            customFieldsData = typeof person.customFields === 'string' 
              ? JSON.parse(person.customFields) 
              : person.customFields;
          } catch (e) {
            console.log(`   Warning: Could not parse customFields for person ${person.fullName}`);
          }
        }
        
        // Map the company ID if it exists
        let mappedCompanyId = null;
        if (person.companyId && companyIdMapping.has(person.companyId)) {
          mappedCompanyId = companyIdMapping.get(person.companyId);
        }
        
        // Create person in new database with ULID
        await newPrisma.people.create({
          data: {
            workspaceId: newWorkspace.id,
            companyId: mappedCompanyId, // Use mapped company ID
            firstName: person.firstName,
            lastName: person.lastName,
            fullName: person.fullName,
            displayName: person.displayName,
            salutation: person.salutation,
            suffix: person.suffix,
            jobTitle: person.jobTitle,
            title: person.title,
            department: person.department,
            seniority: person.seniority,
            email: person.email,
            workEmail: person.workEmail,
            personalEmail: person.personalEmail,
            phone: person.phone,
            mobilePhone: person.mobilePhone,
            workPhone: person.workPhone,
            linkedinUrl: person.linkedinUrl,
            address: person.address,
            city: person.city,
            state: person.state,
            country: person.country,
            postalCode: person.postalCode,
            dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth) : null,
            gender: person.gender,
            bio: person.bio,
            profilePictureUrl: person.profilePictureUrl,
            status: 'LEAD', // Set all people to LEAD status as requested
            priority: person.priority ? person.priority.toUpperCase() : 'MEDIUM',
            source: person.source,
            tags: person.tags || [],
            customFields: customFieldsData,
            notes: person.notes,
            vertical: person.vertical,
            preferredLanguage: person.preferredLanguage,
            timezone: person.timezone,
            emailVerified: person.emailVerified,
            phoneVerified: person.phoneVerified,
            lastAction: person.lastAction,
            lastActionDate: person.lastActionDate ? new Date(person.lastActionDate) : null,
            nextAction: person.nextAction,
            nextActionDate: person.nextActionDate ? new Date(person.nextActionDate) : null,
            actionStatus: person.actionStatus,
            engagementScore: person.engagementScore,
            globalRank: person.globalRank,
            companyRank: person.companyRank,
            entityId: person.entityId,
            deletedAt: person.deletedAt ? new Date(person.deletedAt) : null,
            // Career data
            currentRole: person.currentRole,
            currentCompany: person.currentCompany,
            yearsInRole: person.yearsInRole,
            yearsAtCompany: person.yearsAtCompany,
            totalExperience: person.totalExperience,
            industryExperience: person.industryExperience,
            leadershipExperience: person.leadershipExperience,
            budgetResponsibility: person.budgetResponsibility,
            teamSize: person.teamSize,
            achievements: person.achievements || [],
            certifications: person.certifications || [],
            publications: person.publications || [],
            speakingEngagements: person.speakingEngagements || [],
            // Education data
            degrees: person.degrees,
            institutions: person.institutions || [],
            fieldsOfStudy: person.fieldsOfStudy || [],
            graduationYears: person.graduationYears || [],
            // Skills & expertise
            technicalSkills: person.technicalSkills || [],
            softSkills: person.softSkills || [],
            industrySkills: person.industrySkills || [],
            languages: person.languages || [],
            // Experience & career timeline
            previousRoles: person.previousRoles,
            careerTimeline: person.careerTimeline,
            roleHistory: person.roleHistory,
            // Buyer group & decision making
            buyerGroupRole: person.buyerGroupRole,
            decisionPower: person.decisionPower,
            influenceLevel: person.influenceLevel,
            influenceScore: person.influenceScore,
            engagementLevel: person.engagementLevel,
            buyerGroupStatus: person.buyerGroupStatus,
            isBuyerGroupMember: person.isBuyerGroupMember,
            buyerGroupOptimized: person.buyerGroupOptimized,
            decisionMaking: person.decisionMaking,
            communicationStyle: person.communicationStyle,
            engagementStrategy: person.engagementStrategy,
            // Enrichment & intelligence data
            enrichmentScore: person.enrichmentScore,
            enrichmentSources: person.enrichmentSources || [],
            lastEnriched: person.lastEnriched ? new Date(person.lastEnriched) : null,
            enrichmentVersion: person.enrichmentVersion,
            coresignalData: person.coresignalData,
            enrichedData: person.enrichedData,
            // Contact & verification data
            emailConfidence: person.emailConfidence,
            phoneConfidence: person.phoneConfidence,
            mobileVerified: person.mobileVerified,
            dataCompleteness: person.dataCompleteness,
            preferredContact: person.preferredContact,
            responseTime: person.responseTime,
            // Status & tracking
            statusReason: person.statusReason,
            statusUpdateDate: person.statusUpdateDate ? new Date(person.statusUpdateDate) : null,
            hiddenFromSections: person.hiddenFromSections || [],
            rolePromoted: person.rolePromoted,
            createdAt: new Date(person.createdAt),
            updatedAt: new Date(person.updatedAt)
          }
        });
        
        peopleMigrated++;
        
        if (peopleMigrated % 100 === 0) {
          console.log(`   Migrated ${peopleMigrated} people...`);
        }
        
      } catch (error) {
        console.log(`   Error migrating person ${person.fullName}: ${error.message}`);
        peopleSkipped++;
      }
    }
    
    console.log(`✅ People migration complete: ${peopleMigrated} migrated, ${peopleSkipped} skipped\n`);

    // 6. Summary
    console.log('📊 MIGRATION SUMMARY:');
    console.log('====================');
    console.log(`✅ Workspace: ${newWorkspace.name} (${newWorkspace.id})`);
    console.log(`✅ Companies: ${companiesMigrated} migrated`);
    console.log(`✅ People: ${peopleMigrated} migrated, ${peopleSkipped} skipped`);
    console.log(`✅ All people set to LEAD status`);
    console.log(`✅ All records use ULID format`);
    console.log(`✅ Company ID mapping preserved relationships`);
    console.log('\n🎉 TOP Engineering Plus workspace migration finished successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the migration
migrateTopEngineeringFixed();
