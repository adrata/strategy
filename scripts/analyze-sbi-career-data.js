#!/usr/bin/env node

/**
 * 🔍 ANALYZE SBI CAREER DATA
 * 
 * Comprehensive analysis of all career and enrichment data in SBI database
 */

const { PrismaClient } = require('@prisma/client');

// SBI Database connection
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

async function analyzeSbiCareerData() {
  try {
    console.log('🔍 Analyzing SBI career and enrichment data...\n');
    
    await sbiPrisma.$connect();
    console.log('✅ Connected to SBI database!\n');

    // 1. Analyze people with rich career data
    console.log('👥 ANALYZING PEOPLE WITH CAREER DATA:');
    
    try {
      const peopleWithCareerData = await sbiPrisma.$queryRaw`
        SELECT id, "fullName", "jobTitle", "customFields"
        FROM people 
        WHERE "customFields"::text LIKE '%"career"%'
        OR "customFields"::text LIKE '%"experience"%'
        OR "customFields"::text LIKE '%"education"%'
        OR "customFields"::text LIKE '%"skills"%'
        OR "customFields"::text LIKE '%"enrichedData"%'
        OR "customFields"::text LIKE '%"coresignal"%'
        LIMIT 5;
      `;
      
      console.log(`   Found ${peopleWithCareerData.length} people with career data:`);
      peopleWithCareerData.forEach(person => {
        console.log(`\n   📋 ${person.fullName} (${person.jobTitle}):`);
        
        if (person.customFields) {
          const cf = person.customFields;
          
          // Check for career data
          if (cf.enrichedData && cf.enrichedData.career) {
            const career = cf.enrichedData.career;
            console.log(`     🎯 Career Data Found:`);
            console.log(`       - Current Role: ${career.currentRole || 'N/A'}`);
            console.log(`       - Current Company: ${career.currentCompany || 'N/A'}`);
            console.log(`       - Years in Role: ${career.yearsInRole || 'N/A'}`);
            console.log(`       - Years at Company: ${career.yearsAtCompany || 'N/A'}`);
            console.log(`       - Total Experience: ${career.totalExperience || 'N/A'} years`);
            console.log(`       - Seniority: ${career.seniority || 'N/A'}`);
            console.log(`       - Department: ${career.department || 'N/A'}`);
            console.log(`       - Leadership Experience: ${career.leadershipExperience || 'N/A'}`);
            console.log(`       - Industry Experience: ${career.industryExperience || 'N/A'}`);
            console.log(`       - Budget Responsibility: ${career.budgetResponsibility || 'N/A'}`);
            
            if (career.skills && career.skills.length > 0) {
              console.log(`       - Skills (${career.skills.length}): ${career.skills.slice(0, 5).join(', ')}${career.skills.length > 5 ? '...' : ''}`);
            }
            
            if (career.education && career.education.length > 0) {
              console.log(`       - Education (${career.education.length}):`);
              career.education.slice(0, 2).forEach(edu => {
                console.log(`         * ${edu.degree} from ${edu.institution_name || 'Unknown'}`);
              });
            }
            
            if (career.previousRoles && career.previousRoles.length > 0) {
              console.log(`       - Previous Roles (${career.previousRoles.length}):`);
              career.previousRoles.slice(0, 2).forEach(role => {
                console.log(`         * ${role.position_title} at ${role.company_name} (${role.duration_months || 'Unknown'} months)`);
              });
            }
          }
          
          // Check for Coresignal data
          if (cf.coresignal) {
            const coresignal = cf.coresignal;
            console.log(`     🔗 Coresignal Data Found:`);
            console.log(`       - Employee ID: ${coresignal.employeeId || 'N/A'}`);
            console.log(`       - Enriched At: ${coresignal.enrichedAt || 'N/A'}`);
            console.log(`       - Is Decision Maker: ${coresignal.isDecisionMaker || 'N/A'}`);
            console.log(`       - Total Experience Months: ${coresignal.totalExperienceMonths || 'N/A'}`);
            
            if (coresignal.experience && coresignal.experience.length > 0) {
              console.log(`       - Experience Records (${coresignal.experience.length}):`);
              coresignal.experience.slice(0, 2).forEach(exp => {
                console.log(`         * ${exp.position_title} at ${exp.company_name} (${exp.duration_months || 'Unknown'} months)`);
              });
            }
            
            if (coresignal.education && coresignal.education.length > 0) {
              console.log(`       - Education Records (${coresignal.education.length}):`);
              coresignal.education.slice(0, 2).forEach(edu => {
                console.log(`         * ${edu.degree} from ${edu.institution_name || 'Unknown'}`);
              });
            }
          }
          
          // Check for other enrichment data
          if (cf.overview) {
            const overview = cf.overview;
            console.log(`     📊 Overview Data:`);
            console.log(`       - Bio: ${overview.bio ? overview.bio.substring(0, 100) + '...' : 'N/A'}`);
            console.log(`       - Industry: ${overview.industry || 'N/A'}`);
            console.log(`       - Location: ${overview.location || 'N/A'}`);
            console.log(`       - Priority: ${overview.priority || 'N/A'}`);
            console.log(`       - Buyer Group Role: ${overview.buyerGroupRole || 'N/A'}`);
            console.log(`       - Influence Level: ${overview.influenceLevel || 'N/A'}`);
          }
          
          // Check for intelligence data
          if (cf.intelligence) {
            const intelligence = cf.intelligence;
            console.log(`     🧠 Intelligence Data:`);
            console.log(`       - Company: ${intelligence.companyName || 'N/A'}`);
            console.log(`       - Industry: ${intelligence.industry || 'N/A'}`);
            console.log(`       - Size: ${intelligence.size || 'N/A'}`);
            console.log(`       - Revenue: ${intelligence.revenue || 'N/A'}`);
            console.log(`       - Employee Count: ${intelligence.employeeCount || 'N/A'}`);
            console.log(`       - Founded Year: ${intelligence.foundedYear || 'N/A'}`);
            console.log(`       - Website: ${intelligence.website || 'N/A'}`);
          }
        }
      });
    } catch (error) {
      console.log(`   Error analyzing career data: ${error.message}`);
    }

    // 2. Analyze companies with rich data
    console.log('\n🏢 ANALYZING COMPANIES WITH ENRICHMENT DATA:');
    
    try {
      const companiesWithData = await sbiPrisma.$queryRaw`
        SELECT id, name, industry, size, revenue, "customFields"
        FROM companies 
        WHERE "customFields" IS NOT NULL
        AND "customFields"::text != '{}'
        LIMIT 3;
      `;
      
      console.log(`   Found ${companiesWithData.length} companies with enrichment data:`);
      companiesWithData.forEach(company => {
        console.log(`\n   🏢 ${company.name} (${company.industry}):`);
        console.log(`     - Size: ${company.size || 'N/A'}`);
        console.log(`     - Revenue: ${company.revenue || 'N/A'}`);
        
        if (company.customFields) {
          const cf = company.customFields;
          
          // Check for company intelligence data
          if (cf.companyIntelligence) {
            const ci = cf.companyIntelligence;
            console.log(`     📊 Company Intelligence:`);
            console.log(`       - Industry: ${ci.industry || 'N/A'}`);
            console.log(`       - Company Size: ${ci.companySize || 'N/A'}`);
            console.log(`       - Revenue: ${ci.revenue || 'N/A'}`);
            console.log(`       - Tech Stack: ${ci.techStack ? ci.techStack.join(', ') : 'N/A'}`);
            console.log(`       - Competitors: ${ci.competitors ? ci.competitors.join(', ') : 'N/A'}`);
            console.log(`       - Market Position: ${ci.marketPosition || 'N/A'}`);
            console.log(`       - Digital Maturity: ${ci.digitalMaturity || 'N/A'}`);
          }
          
          // Check for other company data
          Object.keys(cf).forEach(key => {
            if (key !== 'companyIntelligence' && cf[key] && typeof cf[key] === 'object') {
              console.log(`     🔧 ${key}: ${JSON.stringify(cf[key], null, 2).substring(0, 200)}...`);
            }
          });
        }
      });
    } catch (error) {
      console.log(`   Error analyzing company data: ${error.message}`);
    }

    // 3. Check for specific career-related fields
    console.log('\n🎯 CHECKING FOR SPECIFIC CAREER FIELDS:');
    
    const careerFields = [
      'skills', 'education', 'experience', 'certifications', 'awards',
      'publications', 'speakingEngagements', 'previousRoles', 'careerTimeline',
      'totalExperience', 'yearsInRole', 'yearsAtCompany', 'seniority',
      'leadershipExperience', 'industryExperience', 'budgetResponsibility',
      'teamSize', 'currentRole', 'currentCompany', 'achievements'
    ];
    
    for (const field of careerFields) {
      try {
        const count = await sbiPrisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM people 
          WHERE "customFields"::text LIKE ${'%"' + field + '"%'};
        `;
        
        if (count[0].count > 0) {
          console.log(`   ✅ ${field}: Found in ${count[0].count} people`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${field}: ${error.message}`);
      }
    }

    // 4. Check for company intelligence fields
    console.log('\n🏢 CHECKING FOR COMPANY INTELLIGENCE FIELDS:');
    
    const companyFields = [
      'industry', 'companySize', 'revenue', 'techStack', 'competitors',
      'marketPosition', 'digitalMaturity', 'businessChallenges', 'businessPriorities',
      'competitiveAdvantages', 'growthOpportunities', 'strategicInitiatives',
      'successMetrics', 'marketThreats', 'keyInfluencers', 'decisionTimeline'
    ];
    
    for (const field of companyFields) {
      try {
        const count = await sbiPrisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM companies 
          WHERE "customFields"::text LIKE ${'%"' + field + '"%'};
        `;
        
        if (count[0].count > 0) {
          console.log(`   ✅ ${field}: Found in ${count[0].count} companies`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${field}: ${error.message}`);
      }
    }

    // 5. Check for buyer group and decision maker data
    console.log('\n👑 CHECKING FOR BUYER GROUP DATA:');
    
    const buyerGroupFields = [
      'buyerGroupRole', 'decisionPower', 'influenceLevel', 'influenceScore',
      'engagementLevel', 'buyerGroupStatus', 'isBuyerGroupMember', 'buyerGroupDiscovery',
      'buyerGroupOptimized', 'decisionMaking', 'communicationStyle', 'engagementStrategy'
    ];
    
    for (const field of buyerGroupFields) {
      try {
        const count = await sbiPrisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM people 
          WHERE "customFields"::text LIKE ${'%"' + field + '"%'};
        `;
        
        if (count[0].count > 0) {
          console.log(`   ✅ ${field}: Found in ${count[0].count} people`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${field}: ${error.message}`);
      }
    }

    console.log('\n✅ SBI career data analysis completed!');

  } catch (error) {
    console.error('❌ Error during SBI career data analysis:', error);
  } finally {
    await sbiPrisma.$disconnect();
  }
}

// Run the analysis
analyzeSbiCareerData();
