#!/usr/bin/env node

/**
 * 📊 ANALYZE CLOUDCADDIE COMPANIES
 * 
 * Studies companies in Justin's database to understand patterns
 * and identify similar companies targeting non-government sector
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeCloudCaddieCompanies() {
  try {
    console.log('📊 ANALYZING CLOUDCADDIE COMPANIES');
    console.log('==================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get all companies with detailed info
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        sector: true,
        size: true,
        description: true,
        website: true,
        domain: true,
        tags: true,
        customFields: true,
        companyIntelligence: true,
        techStack: true,
        naicsCodes: true,
        sicCodes: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📈 Found ${companies.length} companies\n`);
    
    // Analyze patterns
    console.log('1️⃣ INDUSTRY ANALYSIS:');
    console.log('---------------------');
    const industries = {};
    companies.forEach(c => {
      const industry = c.industry || 'Unknown';
      industries[industry] = (industries[industry] || 0) + 1;
    });
    Object.entries(industries)
      .sort((a, b) => b[1] - a[1])
      .forEach(([industry, count]) => {
        console.log(`   ${industry}: ${count} companies`);
      });
    
    console.log('\n2️⃣ SECTOR ANALYSIS:');
    console.log('---------------------');
    const sectors = {};
    companies.forEach(c => {
      const sector = c.sector || 'Unknown';
      sectors[sector] = (sectors[sector] || 0) + 1;
    });
    Object.entries(sectors)
      .sort((a, b) => b[1] - a[1])
      .forEach(([sector, count]) => {
        console.log(`   ${sector}: ${count} companies`);
      });
    
    console.log('\n3️⃣ COMPANY SIZE ANALYSIS:');
    console.log('--------------------------');
    const sizes = {};
    companies.forEach(c => {
      const size = c.size || 'Unknown';
      sizes[size] = (sizes[size] || 0) + 1;
    });
    Object.entries(sizes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([size, count]) => {
        console.log(`   ${size}: ${count} companies`);
      });
    
    // Check for government-related keywords
    console.log('\n4️⃣ GOVERNMENT SECTOR IDENTIFICATION:');
    console.log('--------------------------------------');
    const governmentKeywords = ['government', 'gov', 'public sector', 'municipal', 'federal', 'state', 'county', 'city', 'agency', 'department'];
    const governmentCompanies = companies.filter(c => {
      const searchText = [
        c.name || '',
        c.description || '',
        c.industry || '',
        c.sector || '',
        (c.tags || []).join(' '),
        JSON.stringify(c.customFields || {})
      ].join(' ').toLowerCase();
      
      return governmentKeywords.some(keyword => searchText.includes(keyword));
    });
    
    console.log(`   Found ${governmentCompanies.length} companies with government-related keywords`);
    console.log(`   Found ${companies.length - governmentCompanies.length} companies potentially targeting non-government sector\n`);
    
    if (governmentCompanies.length > 0) {
      console.log('   Government-related companies:');
      governmentCompanies.slice(0, 10).forEach(c => {
        console.log(`   - ${c.name} (${c.industry || 'Unknown industry'})`);
      });
      if (governmentCompanies.length > 10) {
        console.log(`   ... and ${governmentCompanies.length - 10} more`);
      }
    }
    
    // Sample companies for analysis
    console.log('\n5️⃣ SAMPLE COMPANY DETAILS:');
    console.log('----------------------------');
    const sampleCompanies = companies.slice(0, 5);
    sampleCompanies.forEach((c, idx) => {
      console.log(`\n   ${idx + 1}. ${c.name}`);
      console.log(`      Industry: ${c.industry || 'N/A'}`);
      console.log(`      Sector: ${c.sector || 'N/A'}`);
      console.log(`      Size: ${c.size || 'N/A'}`);
      console.log(`      Website: ${c.website || 'N/A'}`);
      if (c.description) {
        const desc = c.description.substring(0, 150);
        console.log(`      Description: ${desc}${c.description.length > 150 ? '...' : ''}`);
      }
    });
    
    // Summary for recommendations
    console.log('\n6️⃣ RECOMMENDATIONS FOR NON-GOVERNMENT SIMILAR COMPANIES:');
    console.log('----------------------------------------------------------');
    console.log(`   Based on ${companies.length} companies analyzed:`);
    console.log(`   - Primary industries: ${Object.keys(industries).slice(0, 3).join(', ')}`);
    console.log(`   - Primary sectors: ${Object.keys(sectors).slice(0, 3).join(', ')}`);
    console.log(`   - Target similar companies in same industries but exclude government sector`);
    console.log(`   - Focus on private sector, enterprise, and commercial markets`);
    
    // Export detailed analysis
    const analysis = {
      totalCompanies: companies.length,
      governmentCompanies: governmentCompanies.length,
      nonGovernmentCompanies: companies.length - governmentCompanies.length,
      industries: industries,
      sectors: sectors,
      sizes: sizes,
      sampleCompanies: sampleCompanies.map(c => ({
        name: c.name,
        industry: c.industry,
        sector: c.sector,
        size: c.size,
        website: c.website
      }))
    };
    
    console.log('\n✅ Analysis complete!');
    console.log(`\n📝 Summary: ${companies.length} total companies, ${governmentCompanies.length} government-related, ${companies.length - governmentCompanies.length} non-government`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCloudCaddieCompanies();

