#!/usr/bin/env node

/**
 * 🔗 FIND LINKEDIN URLS FOR COMPANIES
 * 
 * Finds and updates LinkedIn company page URLs for companies missing them
 * Uses CoreSignal API and fallback strategies
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v1/linkedin/company';

// Known LinkedIn URLs for major IT staffing companies
const KNOWN_LINKEDIN_URLS = {
  'Apex Systems': 'https://www.linkedin.com/company/apex-systems',
  'TEKsystems': 'https://www.linkedin.com/company/teksystems',
  'Insight Global': 'https://www.linkedin.com/company/insight-global',
  'Modis': 'https://www.linkedin.com/company/modis',
  'Ntiva': 'https://www.linkedin.com/company/ntiva',
  'Robert Half Technology': 'https://www.linkedin.com/company/robert-half-technology',
  'SDI Presence': 'https://www.linkedin.com/company/sdi-presence',
  'ITStaff': 'https://www.linkedin.com/company/itstaff',
  'Scion Technology': 'https://www.linkedin.com/company/scion-technology',
  'TechBridge': 'https://www.linkedin.com/company/techbridge'
};

async function searchCoreSignalCompany(companyName, domain) {
  if (!CORESIGNAL_API_KEY) {
    console.log('   ⚠️  CORESIGNAL_API_KEY not found, skipping CoreSignal search');
    return null;
  }

  try {
    // Try searching by company name first
    const searchParams = {
      q: companyName,
      limit: 5
    };

    const response = await axios.get(`${CORESIGNAL_BASE_URL}/search`, {
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: searchParams
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Find best match by name similarity
      let bestMatch = null;
      let bestScore = 0;

      for (const result of response.data.data) {
        const resultName = (result.name || '').toLowerCase();
        const searchName = companyName.toLowerCase();
        
        // Simple name matching score
        let score = 0;
        if (resultName === searchName) score = 100;
        else if (resultName.includes(searchName) || searchName.includes(resultName)) score = 80;
        else if (resultName.split(' ').some(word => searchName.includes(word))) score = 60;
        
        // Boost score if domain matches
        if (domain && result.website) {
          const resultDomain = result.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          const searchDomain = domain.replace(/^www\./, '');
          if (resultDomain === searchDomain) {
            score += 20;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = result;
        }
      }

      if (bestMatch && bestMatch.linkedin_url) {
        return bestMatch.linkedin_url;
      }
    }

    return null;
  } catch (error) {
    console.log(`   ⚠️  CoreSignal search failed: ${error.message}`);
    return null;
  }
}

function constructLinkedInUrl(companyName) {
  // Convert company name to LinkedIn slug format
  let slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `https://www.linkedin.com/company/${slug}`;
}

async function findLinkedInUrl(company) {
  console.log(`\n🔍 Searching for: ${company.name}`);
  console.log(`   Website: ${company.website || 'N/A'}`);
  console.log(`   Domain: ${company.domain || 'N/A'}`);

  // Strategy 1: Check known URLs
  if (KNOWN_LINKEDIN_URLS[company.name]) {
    console.log(`   ✅ Found in known URLs: ${KNOWN_LINKEDIN_URLS[company.name]}`);
    return KNOWN_LINKEDIN_URLS[company.name];
  }

  // Strategy 2: CoreSignal API search
  if (CORESIGNAL_API_KEY) {
    console.log(`   🔎 Searching CoreSignal API...`);
    const coresignalUrl = await searchCoreSignalCompany(company.name, company.domain);
    if (coresignalUrl) {
      console.log(`   ✅ Found via CoreSignal: ${coresignalUrl}`);
      return coresignalUrl;
    }
  }

  // Strategy 3: Construct from company name
  console.log(`   🔧 Constructing LinkedIn URL from name...`);
  const constructedUrl = constructLinkedInUrl(company.name);
  console.log(`   📝 Constructed URL: ${constructedUrl}`);
  
  // Note: We'll use the constructed URL but it may not be valid
  // The buyer group pipeline will validate it
  return constructedUrl;
}

async function findLinkedInUrlsForCompanies() {
  try {
    console.log('🔗 FINDING LINKEDIN URLS FOR COMPANIES');
    console.log('=====================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name}\n`);
    
    // Find Justin
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'justin.johnson@cloudcaddie.com' },
          { username: 'justin' }
        ]
      }
    });
    
    if (!justin) {
      console.log('❌ Justin not found');
      return;
    }
    
    // Get companies without LinkedIn URLs and without buyer groups
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: justin.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        linkedinUrl: true,
        _count: {
          select: {
            people: {
              where: {
                isBuyerGroupMember: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Filter companies missing LinkedIn URLs
    const companiesNeedingLinkedIn = allCompanies.filter(
      company => !company.linkedinUrl && company._count.people === 0
    );
    
    console.log(`📊 Found ${companiesNeedingLinkedIn.length} companies needing LinkedIn URLs\n`);
    
    if (companiesNeedingLinkedIn.length === 0) {
      console.log('✅ All companies already have LinkedIn URLs!');
      return;
    }
    
    // Process each company
    let updatedCount = 0;
    const results = [];
    
    for (let i = 0; i < companiesNeedingLinkedIn.length; i++) {
      const company = companiesNeedingLinkedIn[i];
      const progress = `[${i + 1}/${companiesNeedingLinkedIn.length}]`;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${progress} ${company.name}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        const linkedinUrl = await findLinkedInUrl(company);
        
        if (linkedinUrl) {
          // Update company with LinkedIn URL
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              linkedinUrl: linkedinUrl,
              updatedAt: new Date()
            }
          });
          
          console.log(`   ✅ Updated: ${linkedinUrl}`);
          updatedCount++;
          results.push({
            company: company.name,
            linkedinUrl: linkedinUrl,
            success: true
          });
        } else {
          console.log(`   ❌ Could not find LinkedIn URL`);
          results.push({
            company: company.name,
            linkedinUrl: null,
            success: false
          });
        }
        
        // Add delay between API calls
        if (i < companiesNeedingLinkedIn.length - 1 && CORESIGNAL_API_KEY) {
          console.log(`   ⏳ Waiting 2 seconds before next company...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${company.name}:`, error.message);
        results.push({
          company: company.name,
          linkedinUrl: null,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Updated: ${updatedCount} companies`);
    console.log(`❌ Failed: ${companiesNeedingLinkedIn.length - updatedCount} companies\n`);
    
    if (results.length > 0) {
      console.log('📋 Results:');
      results.forEach((result, idx) => {
        if (result.success) {
          console.log(`   ${idx + 1}. ✅ ${result.company}`);
          console.log(`      LinkedIn: ${result.linkedinUrl}`);
        } else {
          console.log(`   ${idx + 1}. ❌ ${result.company} - ${result.error || 'Not found'}`);
        }
      });
    }
    
    console.log('\n🎉 LinkedIn URL search complete!');
    console.log('\n💡 Next step: Re-run buyer group generation script for these companies');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findLinkedInUrlsForCompanies();

