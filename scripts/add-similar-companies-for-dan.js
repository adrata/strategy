#!/usr/bin/env node

/**
 * Add 20 Similar Companies for Dan
 * 
 * Adds 20 USA software companies (not marketing/sales, not Adrata competitors)
 * to the database assigned to Dan in the Adrata workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

// 20 USA software companies (not marketing/sales, not Adrata competitors)
const COMPANIES_TO_ADD = [
  {
    name: 'Atlassian',
    website: 'https://www.atlassian.com',
    linkedinUrl: 'https://www.linkedin.com/company/atlassian',
    industry: 'Software Development',
    country: 'United States',
    description: 'Enterprise software company providing collaboration and development tools'
  },
  {
    name: 'Splunk',
    website: 'https://www.splunk.com',
    linkedinUrl: 'https://www.linkedin.com/company/splunk',
    industry: 'Software Development',
    country: 'United States',
    description: 'Data platform for security and observability'
  },
  {
    name: 'Twilio',
    website: 'https://www.twilio.com',
    linkedinUrl: 'https://www.linkedin.com/company/twilio',
    industry: 'Software Development',
    country: 'United States',
    description: 'Cloud communications platform for developers'
  },
  {
    name: 'MongoDB',
    website: 'https://www.mongodb.com',
    linkedinUrl: 'https://www.linkedin.com/company/mongodb',
    industry: 'Software Development',
    country: 'United States',
    description: 'General purpose database platform'
  },
  {
    name: 'Datadog',
    website: 'https://www.datadoghq.com',
    linkedinUrl: 'https://www.linkedin.com/company/datadog',
    industry: 'Software Development',
    country: 'United States',
    description: 'Monitoring and security platform for cloud applications'
  },
  {
    name: 'Elastic',
    website: 'https://www.elastic.co',
    linkedinUrl: 'https://www.linkedin.com/company/elastic-co',
    industry: 'Software Development',
    country: 'United States',
    description: 'Search and analytics engine company'
  },
  {
    name: 'PagerDuty',
    website: 'https://www.pagerduty.com',
    linkedinUrl: 'https://www.linkedin.com/company/pagerduty',
    industry: 'Software Development',
    country: 'United States',
    description: 'Digital operations management platform'
  },
  {
    name: 'GitLab',
    website: 'https://www.gitlab.com',
    linkedinUrl: 'https://www.linkedin.com/company/gitlab',
    industry: 'Software Development',
    country: 'United States',
    description: 'DevOps platform and source code management'
  },
  {
    name: 'New Relic',
    website: 'https://www.newrelic.com',
    linkedinUrl: 'https://www.linkedin.com/company/new-relic',
    industry: 'Software Development',
    country: 'United States',
    description: 'Observability platform for engineers'
  },
  {
    name: 'Okta',
    website: 'https://www.okta.com',
    linkedinUrl: 'https://www.linkedin.com/company/okta',
    industry: 'Computer and Network Security',
    country: 'United States',
    description: 'Identity and access management platform'
  },
  {
    name: 'CrowdStrike',
    website: 'https://www.crowdstrike.com',
    linkedinUrl: 'https://www.linkedin.com/company/crowdstrike',
    industry: 'Computer and Network Security',
    country: 'United States',
    description: 'Cybersecurity technology company'
  },
  {
    name: 'Palo Alto Networks',
    website: 'https://www.paloaltonetworks.com',
    linkedinUrl: 'https://www.linkedin.com/company/palo-alto-networks',
    industry: 'Computer and Network Security',
    country: 'United States',
    description: 'Cybersecurity company providing network security solutions'
  },
  {
    name: 'Zscaler',
    website: 'https://www.zscaler.com',
    linkedinUrl: 'https://www.linkedin.com/company/zscaler',
    industry: 'Computer and Network Security',
    country: 'United States',
    description: 'Cloud security platform'
  },
  {
    name: 'Snowflake',
    website: 'https://www.snowflake.com',
    linkedinUrl: 'https://www.linkedin.com/company/snowflake-computing',
    industry: 'Software Development',
    country: 'United States',
    description: 'Cloud data platform'
  },
  {
    name: 'Confluent',
    website: 'https://www.confluent.io',
    linkedinUrl: 'https://www.linkedin.com/company/confluent',
    industry: 'Software Development',
    country: 'United States',
    description: 'Data streaming platform'
  },
  {
    name: 'Hashicorp',
    website: 'https://www.hashicorp.com',
    linkedinUrl: 'https://www.linkedin.com/company/hashicorp',
    industry: 'Software Development',
    country: 'United States',
    description: 'Infrastructure automation software company'
  },
  {
    name: 'JFrog',
    website: 'https://www.jfrog.com',
    linkedinUrl: 'https://www.linkedin.com/company/jfrog',
    industry: 'Software Development',
    country: 'United States',
    description: 'DevOps platform for software distribution'
  },
  {
    name: 'Cloudflare',
    website: 'https://www.cloudflare.com',
    linkedinUrl: 'https://www.linkedin.com/company/cloudflare',
    industry: 'Software Development',
    country: 'United States',
    description: 'Web performance and security company'
  },
  {
    name: 'Auth0',
    website: 'https://auth0.com',
    linkedinUrl: 'https://www.linkedin.com/company/auth0',
    industry: 'Computer and Network Security',
    country: 'United States',
    description: 'Identity and authentication platform'
  },
  {
    name: 'Fastly',
    website: 'https://www.fastly.com',
    linkedinUrl: 'https://www.linkedin.com/company/fastly',
    industry: 'Software Development',
    country: 'United States',
    description: 'Edge cloud platform for content delivery'
  }
];

async function addCompanies() {
  console.log('🚀 Adding Similar Companies for Dan');
  console.log('═'.repeat(60));
  console.log(`Target: ${COMPANIES_TO_ADD.length} companies\n`);

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Verify workspace exists
    const workspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      throw new Error(`Workspace ${ADRATA_WORKSPACE_ID} not found`);
    }
    console.log(`✅ Workspace: ${workspace.name} (${workspace.slug})\n`);

    // Verify Dan user exists
    const danUser = await prisma.users.findUnique({
      where: { id: DAN_USER_ID },
      select: { id: true, name: true, email: true }
    });

    if (!danUser) {
      throw new Error(`User ${DAN_USER_ID} not found`);
    }
    console.log(`✅ User: ${danUser.name} (${danUser.email})\n`);

    const results = {
      added: [],
      skipped: [],
      errors: []
    };

    console.log('📋 Processing companies...\n');

    for (let i = 0; i < COMPANIES_TO_ADD.length; i++) {
      const companyData = COMPANIES_TO_ADD[i];
      console.log(`[${i + 1}/${COMPANIES_TO_ADD.length}] ${companyData.name}`);

      try {
        // Check if company already exists (by name in workspace)
        const existing = await prisma.companies.findFirst({
          where: {
            workspaceId: ADRATA_WORKSPACE_ID,
            name: companyData.name,
            deletedAt: null
          },
          select: { id: true, name: true }
        });

        if (existing) {
          console.log(`   ⏭️  Already exists: ${existing.id}`);
          results.skipped.push({ name: companyData.name, reason: 'Already exists' });
          continue;
        }

        // Extract domain from website
        const domain = companyData.website
          ? companyData.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
          : null;

        // Create company
        const company = await prisma.companies.create({
          data: {
            workspaceId: ADRATA_WORKSPACE_ID,
            mainSellerId: DAN_USER_ID,
            name: companyData.name,
            website: companyData.website,
            linkedinUrl: companyData.linkedinUrl,
            domain: domain,
            industry: companyData.industry,
            country: companyData.country,
            description: companyData.description,
            status: 'ACTIVE',
            priority: 'MEDIUM'
          }
        });

        console.log(`   ✅ Added: ${company.id}`);
        results.added.push({
          id: company.id,
          name: companyData.name,
          website: companyData.website,
          linkedinUrl: companyData.linkedinUrl
        });

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.errors.push({
          name: companyData.name,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n\n📊 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Added: ${results.added.length} companies`);
    console.log(`⏭️  Skipped: ${results.skipped.length} companies`);
    console.log(`❌ Errors: ${results.errors.length} companies`);

    if (results.added.length > 0) {
      console.log('\n✅ Successfully added companies:');
      results.added.forEach(c => {
        console.log(`   - ${c.name} (${c.id})`);
      });
    }

    if (results.skipped.length > 0) {
      console.log('\n⏭️  Skipped companies:');
      results.skipped.forEach(c => {
        console.log(`   - ${c.name}: ${c.reason}`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(c => {
        console.log(`   - ${c.name}: ${c.error}`);
      });
    }

    console.log('\n✅ Process complete!\n');

    return results;

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addCompanies().catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
}

module.exports = { addCompanies, COMPANIES_TO_ADD };

