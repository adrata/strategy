#!/usr/bin/env node

/**
 * Update Already Enriched Companies with Comprehensive Field Mapping
 * 
 * This script takes companies that were already enriched and updates
 * their main fields with data from the stored Coresignal data.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichedCompanyUpdater {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // Adrata workspace
    this.danUserId = '01K7B327HWN9G6KGWA97S1TK43'; // Dan Mirolli
  }

  async run() {
    try {
      console.log('🚀 Updating Already Enriched Companies with Comprehensive Field Mapping...\n');
      console.log(`👤 Dan's User ID: ${this.danUserId}`);
      console.log(`🏢 Adrata Workspace ID: ${this.workspaceId}\n`);

      // Get companies that have Coresignal data but may need field updates
      const companies = await this.prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          mainSellerId: this.danUserId,
          deletedAt: null,
          customFields: {
            path: ['coresignalData'],
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          customFields: true,
          descriptionEnriched: true,
          industry: true,
          employeeCount: true,
          linkedinUrl: true,
          website: true,
          domain: true,
          foundedYear: true,
          dataQualityScore: true
        }
      });

      console.log(`📊 Found ${companies.length} enriched companies to update\n`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const company of companies) {
        try {
          console.log(`🔍 Updating: ${company.name}`);
          
          const coresignalData = company.customFields?.coresignalData;
          if (!coresignalData) {
            console.log(`   ⚠️ No Coresignal data found for ${company.name}`);
            continue;
          }

          // Extract revenue from nested structure
          const revenue = this.extractRevenue(coresignalData);

          await this.prisma.companies.update({
            where: { id: company.id },
            data: {
              // Basic Information
              name: coresignalData.name || coresignalData.company_name || company.name,
              description: coresignalData.description || company.description,
              descriptionEnriched: coresignalData.description || company.descriptionEnriched,
              
              // Contact Information
              website: coresignalData.website || company.website,
              domain: coresignalData.domain || company.domain,
              email: coresignalData.email || company.email,
              phone: coresignalData.company_phone_numbers?.[0] || coresignalData.phone || company.phone,
              
              // Social Media
              linkedinUrl: coresignalData.linkedin_url || company.linkedinUrl,
              twitterUrl: coresignalData.twitter_url?.[0] || company.twitterUrl,
              facebookUrl: coresignalData.facebook_url?.[0] || company.facebookUrl,
              // Skip githubUrl for now due to array handling issues
              
              // Location Information
              address: coresignalData.company_hq_street || coresignalData.hq_street || company.address,
              city: coresignalData.hq_city || coresignalData.company_hq_city || company.city,
              state: coresignalData.hq_state || coresignalData.company_hq_state || company.state,
              country: coresignalData.hq_country || coresignalData.company_hq_country || company.country,
              postalCode: coresignalData.company_hq_zipcode || coresignalData.hq_zipcode || company.postalCode,
              
              // Business Information
              industry: coresignalData.industry || company.industry,
              sector: coresignalData.sector || company.sector,
              size: coresignalData.size_range || company.size,
              revenue: revenue || company.revenue,
              employeeCount: coresignalData.employees_count || coresignalData.employee_count || company.employeeCount,
              foundedYear: coresignalData.founded_year ? parseInt(coresignalData.founded_year) : company.foundedYear,
              
              // Company Status
              isPublic: coresignalData.is_public || company.isPublic,
              // Skip stockSymbol for now due to array handling issues
              
              // Additional Data
              naicsCodes: coresignalData.naics_codes || company.naicsCodes || [],
              sicCodes: coresignalData.sic_codes || company.sicCodes || [],
              // Skip other fields for now to focus on core data
              
              // Quality Metrics
              dataSources: ['coresignal'],
              lastVerified: new Date(),
              updatedAt: new Date()
            }
          });

          console.log(`   ✅ Updated: ${company.name}`);
          updatedCount++;

        } catch (error) {
          console.error(`   ❌ Error updating ${company.name}:`, error.message);
          errorCount++;
        }
      }

      console.log(`\n📊 Update Complete:`);
      console.log(`   ✅ Successfully Updated: ${updatedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📈 Success Rate: ${((updatedCount/(updatedCount+errorCount))*100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Error in update process:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  extractRevenue(profileData) {
    // Extract revenue from Coresignal's nested structure
    if (!profileData.revenue_annual) return null;
    
    // Try different revenue sources
    const revenueSources = [
      profileData.revenue_annual?.source_1_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_2_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_3_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_4_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_5_annual_revenue?.annual_revenue,
      profileData.revenue_annual_range
    ];
    
    for (const revenue of revenueSources) {
      if (revenue && typeof revenue === 'number') {
        return revenue;
      }
      if (revenue && typeof revenue === 'string') {
        // Extract number from string like "$100M" or "100000000"
        const match = revenue.match(/[\d.]+/);
        if (match) {
          let value = parseFloat(match[0]);
          if (revenue.includes('B')) value *= 1000000000;
          else if (revenue.includes('M')) value *= 1000000;
          else if (revenue.includes('K')) value *= 1000;
          return value;
        }
      }
    }
    
    return null;
  }
}

// Run the updater
const updater = new EnrichedCompanyUpdater();
updater.run().catch(console.error);
