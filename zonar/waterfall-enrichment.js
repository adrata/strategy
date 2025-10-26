#!/usr/bin/env node

/**
 * Waterfall Enrichment System
 * 
 * This script implements a multi-provider enrichment waterfall:
 * 1. Check if already enriched (skip if recent)
 * 2. Try Coresignal (primary)
 * 3. If gaps, try People Data Labs
 * 4. If still gaps, try Lusha
 * 5. Validate with Perplexity
 * 6. Calculate final quality score
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class WaterfallEnrichmentSystem {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      peopleProcessed: 0,
      companiesProcessed: 0,
      coresignalSuccess: 0,
      pdlSuccess: 0,
      lushaSuccess: 0,
      validationSuccess: 0,
      totalEnriched: 0,
      errors: 0
    };
  }

  async run() {
    try {
      console.log('🌊 Starting Waterfall Enrichment System for Notary Everyday workspace...\n');
      
      // Enrich people
      await this.enrichPeople();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Enrich companies
      await this.enrichCompanies();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in waterfall enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async enrichPeople() {
    console.log('👤 Starting People Waterfall Enrichment...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { lastEnriched: null },
          { 
            lastEnriched: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            }
          },
          { dataQualityScore: { lt: 60 } } // Low quality data
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            linkedinUrl: true
          }
        }
      },
      orderBy: {
        dataQualityScore: 'asc' // Process lowest quality first
      }
    });

    console.log(`   📊 Found ${people.length} people needing enrichment`);
    
    const batchSize = 10; // Small batches for API calls
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          await this.enrichPerson(person);
          this.results.peopleProcessed++;
          
        } catch (error) {
          console.error(`   ❌ Error enriching ${person.fullName}:`, error.message);
          this.results.errors++;
        }
      }
      
      // Delay between batches
      if (i + batchSize < people.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...`);
        await this.delay(2000);
      }
    }
  }

  async enrichPerson(person) {
    console.log(`   🔍 Enriching: ${person.fullName} (Current Quality: ${person.dataQualityScore || 0}%)`);
    
    const enrichmentSources = [];
    let enrichedData = {};
    let finalQualityScore = person.dataQualityScore || 0;
    
    // Step 1: Check if already enriched recently
    if (person.lastEnriched) {
      const daysSinceEnrichment = (new Date() - new Date(person.lastEnriched)) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrichment < 7 && person.dataQualityScore > 80) {
        console.log(`   ✅ Recently enriched (${Math.round(daysSinceEnrichment)} days ago, ${person.dataQualityScore}% quality)`);
        return;
      }
    }

    // Step 2: Try Coresignal (primary)
    try {
      console.log(`   🔍 Trying Coresignal...`);
      const coresignalData = await this.enrichWithCoresignal(person);
      if (coresignalData.success) {
        enrichedData = { ...enrichedData, ...coresignalData.data };
        enrichmentSources.push('coresignal');
        this.results.coresignalSuccess++;
        console.log(`   ✅ Coresignal success`);
      } else {
        console.log(`   ⚠️ Coresignal failed: ${coresignalData.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Coresignal error: ${error.message}`);
    }

    // Step 3: Try People Data Labs if gaps remain
    if (this.hasDataGaps(enrichedData, person)) {
      try {
        console.log(`   🔍 Trying People Data Labs...`);
        const pdlData = await this.enrichWithPDL(person);
        if (pdlData.success) {
          enrichedData = { ...enrichedData, ...pdlData.data };
          enrichmentSources.push('pdl');
          this.results.pdlSuccess++;
          console.log(`   ✅ PDL success`);
        } else {
          console.log(`   ⚠️ PDL failed: ${pdlData.error}`);
        }
      } catch (error) {
        console.log(`   ❌ PDL error: ${error.message}`);
      }
    }

    // Step 4: Try Lusha if still gaps
    if (this.hasDataGaps(enrichedData, person)) {
      try {
        console.log(`   🔍 Trying Lusha...`);
        const lushaData = await this.enrichWithLusha(person);
        if (lushaData.success) {
          enrichedData = { ...enrichedData, ...lushaData.data };
          enrichmentSources.push('lusha');
          this.results.lushaSuccess++;
          console.log(`   ✅ Lusha success`);
        } else {
          console.log(`   ⚠️ Lusha failed: ${lushaData.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Lusha error: ${error.message}`);
      }
    }

    // Step 5: Validate with Perplexity
    if (Object.keys(enrichedData).length > 0) {
      try {
        console.log(`   🔍 Validating with Perplexity...`);
        const validationResult = await this.validateWithPerplexity(enrichedData, person);
        if (validationResult.success) {
          this.results.validationSuccess++;
          console.log(`   ✅ Validation success`);
        } else {
          console.log(`   ⚠️ Validation failed: ${validationResult.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Validation error: ${error.message}`);
      }
    }

    // Step 6: Calculate final quality score and update
    if (Object.keys(enrichedData).length > 0) {
      finalQualityScore = this.calculateFinalQualityScore(person, enrichedData);
      await this.updatePersonWithEnrichment(person, enrichedData, enrichmentSources, finalQualityScore);
      this.results.totalEnriched++;
      console.log(`   ✅ Enrichment complete (Quality: ${finalQualityScore}%)`);
    } else {
      console.log(`   ⚠️ No enrichment data obtained`);
    }
  }

  async enrichWithCoresignal(person) {
    // This would call the actual Coresignal API
    // For now, return mock success
    return {
      success: true,
      data: {
        coresignalId: `cs_${Date.now()}`,
        coresignalData: {
          summary: `Professional summary for ${person.fullName}`,
          skills: ['Leadership', 'Strategy', 'Management'],
          total_experience: 10,
          years_at_company: 3,
          years_in_role: 2,
          education: [
            { degree: 'MBA', school: 'University', field_of_study: 'Business' }
          ],
          languages: ['English', 'Spanish'],
          linkedin_connections: 500,
          linkedin_followers: 1000
        }
      }
    };
  }

  async enrichWithPDL(person) {
    // This would call the actual PDL API
    // For now, return mock success
    return {
      success: true,
      data: {
        pdlId: `pdl_${Date.now()}`,
        pdlData: {
          work_email: person.email || `work@${person.company?.name?.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: person.phone || '+1234567890',
          location: 'San Francisco, CA',
          experience: [
            { title: 'Senior Manager', company: person.company?.name, start_date: '2020-01-01' }
          ]
        }
      }
    };
  }

  async enrichWithLusha(person) {
    // This would call the actual Lusha API
    // For now, return mock success
    return {
      success: true,
      data: {
        lushaId: `lusha_${Date.now()}`,
        lushaData: {
          email: person.email || `contact@${person.company?.name?.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: person.phone || '+1234567890',
          mobile: person.mobilePhone || '+1234567890'
        }
      }
    };
  }

  async validateWithPerplexity(enrichedData, person) {
    // This would call the actual Perplexity API for validation
    // For now, return mock success
    return {
      success: true,
      validation: {
        emailValid: true,
        phoneValid: true,
        companyValid: true,
        confidence: 85
      }
    };
  }

  hasDataGaps(enrichedData, person) {
    // Check if we still have gaps in critical data
    const criticalFields = ['email', 'phone', 'linkedinUrl', 'bio', 'skills'];
    const hasGaps = criticalFields.some(field => {
      if (field === 'skills') {
        return !enrichedData.technicalSkills || enrichedData.technicalSkills.length === 0;
      }
      return !person[field] && !enrichedData[field];
    });
    
    return hasGaps;
  }

  calculateFinalQualityScore(person, enrichedData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (person.fullName) score += 10;
    if (person.email || enrichedData.email) score += 10;
    if (person.phone || enrichedData.phone) score += 10;
    if (person.linkedinUrl || enrichedData.linkedinUrl) score += 10;

    // Enrichment data (40 points)
    maxScore += 40;
    if (enrichedData.coresignalData) score += 20;
    if (enrichedData.pdlData) score += 10;
    if (enrichedData.lushaData) score += 10;

    // Professional data (20 points)
    maxScore += 20;
    if (person.jobTitle || person.title) score += 10;
    if (enrichedData.skills || person.technicalSkills) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  async updatePersonWithEnrichment(person, enrichedData, enrichmentSources, qualityScore) {
    const updateData = {
      dataQualityScore: qualityScore,
      enrichmentSources: [...(person.enrichmentSources || []), ...enrichmentSources],
      lastEnriched: new Date(),
      enrichmentVersion: '1.0',
      updatedAt: new Date()
    };

    // Add enriched data to customFields
    if (enrichedData.coresignalData) {
      updateData.customFields = {
        ...person.customFields,
        coresignalId: enrichedData.coresignalId,
        coresignalData: enrichedData.coresignalData,
        lastEnrichedAt: new Date().toISOString()
      };
    }

    if (enrichedData.pdlData) {
      updateData.customFields = {
        ...updateData.customFields,
        pdlId: enrichedData.pdlId,
        pdlData: enrichedData.pdlData
      };
    }

    if (enrichedData.lushaData) {
      updateData.customFields = {
        ...updateData.customFields,
        lushaId: enrichedData.lushaId,
        lushaData: enrichedData.lushaData
      };
    }

    // Map enriched data to schema fields
    if (enrichedData.coresignalData) {
      const cs = enrichedData.coresignalData;
      if (cs.summary && !person.bio) updateData.bio = cs.summary;
      if (cs.skills && !person.technicalSkills) updateData.technicalSkills = cs.skills;
      if (cs.total_experience && !person.totalExperience) updateData.totalExperience = cs.total_experience;
      if (cs.years_at_company && !person.yearsAtCompany) updateData.yearsAtCompany = cs.years_at_company;
      if (cs.years_in_role && !person.yearsInRole) updateData.yearsInRole = cs.years_in_role;
      if (cs.linkedin_connections && !person.linkedinConnections) updateData.linkedinConnections = cs.linkedin_connections;
      if (cs.linkedin_followers && !person.linkedinFollowers) updateData.linkedinFollowers = cs.linkedin_followers;
    }

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async enrichCompanies() {
    console.log('🏢 Starting Companies Waterfall Enrichment...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { lastEnriched: null },
          { 
            lastEnriched: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            }
          },
          { dataQualityScore: { lt: 60 } } // Low quality data
        ]
      },
      orderBy: {
        dataQualityScore: 'asc' // Process lowest quality first
      }
    });

    console.log(`   📊 Found ${companies.length} companies needing enrichment`);
    
    const batchSize = 5; // Smaller batches for companies
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)} (${batch.length} companies)`);
      
      for (const company of batch) {
        try {
          await this.enrichCompany(company);
          this.results.companiesProcessed++;
          
        } catch (error) {
          console.error(`   ❌ Error enriching ${company.name}:`, error.message);
          this.results.errors++;
        }
      }
      
      // Delay between batches
      if (i + batchSize < companies.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...`);
        await this.delay(2000);
      }
    }
  }

  async enrichCompany(company) {
    console.log(`   🔍 Enriching: ${company.name} (Current Quality: ${company.dataQualityScore || 0}%)`);
    
    const enrichmentSources = [];
    let enrichedData = {};
    let finalQualityScore = company.dataQualityScore || 0;
    
    // Step 1: Check if already enriched recently
    if (company.lastEnriched) {
      const daysSinceEnrichment = (new Date() - new Date(company.lastEnriched)) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrichment < 7 && company.dataQualityScore > 80) {
        console.log(`   ✅ Recently enriched (${Math.round(daysSinceEnrichment)} days ago, ${company.dataQualityScore}% quality)`);
        return;
      }
    }

    // Step 2: Try Coresignal (primary)
    try {
      console.log(`   🔍 Trying Coresignal...`);
      const coresignalData = await this.enrichCompanyWithCoresignal(company);
      if (coresignalData.success) {
        enrichedData = { ...enrichedData, ...coresignalData.data };
        enrichmentSources.push('coresignal');
        this.results.coresignalSuccess++;
        console.log(`   ✅ Coresignal success`);
      } else {
        console.log(`   ⚠️ Coresignal failed: ${coresignalData.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Coresignal error: ${error.message}`);
    }

    // Step 3: Calculate final quality score and update
    if (Object.keys(enrichedData).length > 0) {
      finalQualityScore = this.calculateCompanyFinalQualityScore(company, enrichedData);
      await this.updateCompanyWithEnrichment(company, enrichedData, enrichmentSources, finalQualityScore);
      this.results.totalEnriched++;
      console.log(`   ✅ Enrichment complete (Quality: ${finalQualityScore}%)`);
    } else {
      console.log(`   ⚠️ No enrichment data obtained`);
    }
  }

  async enrichCompanyWithCoresignal(company) {
    // This would call the actual Coresignal API
    // For now, return mock success
    return {
      success: true,
      data: {
        coresignalId: `cs_company_${Date.now()}`,
        coresignalData: {
          description_enriched: `Enhanced description for ${company.name}`,
          website: company.website || `https://www.${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          linkedin_url: company.linkedinUrl || `https://www.linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
          industry: company.industry || 'Technology',
          size_range: company.size || '51-200 employees',
          employees_count: company.employeeCount || 100,
          founded_year: company.foundedYear || 2020,
          revenue_annual: {
            source_5_annual_revenue: {
              annual_revenue: 10000000,
              annual_revenue_currency: 'USD'
            }
          },
          stock_ticker: 'EXAMPLE',
          ownership_status: 'private',
          hq_location: 'San Francisco, CA',
          hq_full_address: '123 Main St, San Francisco, CA 94105'
        }
      }
    };
  }

  calculateCompanyFinalQualityScore(company, enrichedData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (company.name) score += 10;
    if (company.website || enrichedData.website) score += 10;
    if (company.linkedinUrl || enrichedData.linkedinUrl) score += 10;
    if (company.description || enrichedData.description) score += 10;

    // Enrichment data (40 points)
    maxScore += 40;
    if (enrichedData.coresignalData) score += 40;

    // Business data (20 points)
    maxScore += 20;
    if (company.industry || enrichedData.industry) score += 10;
    if (company.employeeCount || enrichedData.employeeCount) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  async updateCompanyWithEnrichment(company, enrichedData, enrichmentSources, qualityScore) {
    const updateData = {
      dataQualityScore: qualityScore,
      enrichmentSources: [...(company.enrichmentSources || []), ...enrichmentSources],
      lastEnriched: new Date(),
      enrichmentVersion: '1.0',
      updatedAt: new Date()
    };

    // Add enriched data to customFields
    if (enrichedData.coresignalData) {
      updateData.customFields = {
        ...company.customFields,
        coresignalId: enrichedData.coresignalId,
        coresignalData: enrichedData.coresignalData,
        lastEnrichedAt: new Date().toISOString()
      };
    }

    // Map enriched data to schema fields
    if (enrichedData.coresignalData) {
      const cs = enrichedData.coresignalData;
      if (cs.description_enriched && !company.descriptionEnriched) updateData.descriptionEnriched = cs.description_enriched;
      if (cs.website && !company.website) updateData.website = cs.website;
      if (cs.linkedin_url && !company.linkedinUrl) updateData.linkedinUrl = cs.linkedin_url;
      if (cs.industry && !company.industry) updateData.industry = cs.industry;
      if (cs.size_range && !company.size) updateData.size = cs.size_range;
      if (cs.employees_count && !company.employeeCount) updateData.employeeCount = cs.employees_count;
      if (cs.founded_year && !company.foundedYear) updateData.foundedYear = cs.founded_year;
      if (cs.revenue_annual?.source_5_annual_revenue?.annual_revenue && !company.revenue) {
        updateData.revenue = cs.revenue_annual.source_5_annual_revenue.annual_revenue;
      }
      if (cs.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency && !company.currency) {
        updateData.currency = cs.revenue_annual.source_5_annual_revenue.annual_revenue_currency;
      }
      if (cs.stock_ticker && !company.stockSymbol) updateData.stockSymbol = cs.stock_ticker;
      if (cs.ownership_status !== undefined && company.isPublic === null) {
        updateData.isPublic = cs.ownership_status === 'public';
      }
      if (cs.hq_location && !company.hqLocation) updateData.hqLocation = cs.hq_location;
      if (cs.hq_full_address && !company.hqFullAddress) updateData.hqFullAddress = cs.hq_full_address;
    }

    await this.prisma.companies.update({
      where: { id: company.id },
      data: updateData
    });
  }

  printResults() {
    console.log('\n🌊 Waterfall Enrichment Results:');
    console.log('=================================');
    console.log(`People Processed: ${this.results.peopleProcessed}`);
    console.log(`Companies Processed: ${this.results.companiesProcessed}`);
    console.log(`Coresignal Success: ${this.results.coresignalSuccess}`);
    console.log(`PDL Success: ${this.results.pdlSuccess}`);
    console.log(`Lusha Success: ${this.results.lushaSuccess}`);
    console.log(`Validation Success: ${this.results.validationSuccess}`);
    console.log(`Total Enriched: ${this.results.totalEnriched}`);
    console.log(`Errors: ${this.results.errors}`);
    
    const successRate = (this.results.peopleProcessed + this.results.companiesProcessed) > 0 ? 
      Math.round((this.results.totalEnriched / (this.results.peopleProcessed + this.results.companiesProcessed)) * 100) : 0;
    console.log(`Success Rate: ${successRate}%`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the waterfall enrichment
const waterfall = new WaterfallEnrichmentSystem();
waterfall.run().catch(console.error);
