#!/usr/bin/env node

/**
 * Diagnose Domain Mismatch Issues in Buyer Groups
 * 
 * This script identifies cases where people from different companies
 * (based on email domains) are grouped together in buyer groups.
 * 
 * Example: underline.com vs underline.cz
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseDomainMismatches() {
  console.log('\n🔍 Diagnosing Domain Mismatch Issues in Buyer Groups\n');

  try {
    // Get all companies with buyer groups
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        people: {
          some: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      },
      include: {
        people: {
          where: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      }
    });

    console.log(`📊 Checking ${companies.length} companies with buyer groups\n`);

    const issues = [];

    for (const company of companies) {
      const companyDomain = extractDomain(company.website);
      const emailDomains = new Map(); // domain -> [people]

      // Group people by email domain
      for (const person of company.people) {
        const email = person.email || person.workEmail;
        if (email && email.includes('@')) {
          const domain = email.split('@')[1].toLowerCase();
          if (!emailDomains.has(domain)) {
            emailDomains.set(domain, []);
          }
          emailDomains.get(domain).push(person);
        }
      }

      // Check for mismatches
      if (emailDomains.size > 1) {
        const domains = Array.from(emailDomains.keys());
        
        // Check if any domain is significantly different
        let hasMismatch = false;
        const domainInfo = [];

        for (const domain of domains) {
          const people = emailDomains.get(domain);
          const matchesCompany = companyDomain && domainsMatch(domain, companyDomain);
          
          domainInfo.push({
            domain,
            count: people.length,
            matchesCompany,
            people: people.map(p => ({
              name: p.fullName || `${p.firstName} ${p.lastName}`,
              email: p.email || p.workEmail,
              linkedin: p.linkedinUrl
            }))
          });

          if (!matchesCompany) {
            hasMismatch = true;
          }
        }

        if (hasMismatch) {
          issues.push({
            company: company.name,
            companyId: company.id,
            companyWebsite: company.website,
            companyDomain,
            totalBuyerGroupMembers: company.people.length,
            domains: domainInfo,
            severity: calculateSeverity(domainInfo, companyDomain)
          });

          console.log(`\n⚠️  ${company.name} (${companyDomain || 'no domain'})`);
          console.log(`   Total buyer group: ${company.people.length} people`);
          console.log(`   Email domains found:`);
          for (const info of domainInfo) {
            const status = info.matchesCompany ? '✅' : '❌';
            console.log(`   ${status} ${info.domain} (${info.count} people)`);
            info.people.forEach(p => {
              console.log(`      - ${p.name} (${p.email})`);
            });
          }
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nTotal companies checked: ${companies.length}`);
    console.log(`Issues found: ${issues.length}\n`);

    if (issues.length > 0) {
      const highSeverity = issues.filter(i => i.severity === 'HIGH');
      const mediumSeverity = issues.filter(i => i.severity === 'MEDIUM');
      const lowSeverity = issues.filter(i => i.severity === 'LOW');

      console.log(`🔴 HIGH severity: ${highSeverity.length}`);
      console.log(`   - People from completely different companies grouped together`);
      
      console.log(`🟡 MEDIUM severity: ${mediumSeverity.length}`);
      console.log(`   - Different TLD variants (e.g., .com vs .cz)`);
      
      console.log(`🟢 LOW severity: ${lowSeverity.length}`);
      console.log(`   - Subdomain variations (likely valid)`);

      // Save report
      const fs = require('fs');
      const reportPath = `./logs/domain-mismatch-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
      console.log(`\n📄 Full report saved to: ${reportPath}`);
    } else {
      console.log('✅ No domain mismatch issues found!');
    }

  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Extract domain from URL or email
 */
function extractDomain(url) {
  if (!url) return null;
  const cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  return cleaned;
}

/**
 * Check if two domains match (accounting for subdomains)
 */
function domainsMatch(domain1, domain2) {
  if (!domain1 || !domain2) return false;
  
  domain1 = domain1.toLowerCase();
  domain2 = domain2.toLowerCase();
  
  // Exact match
  if (domain1 === domain2) return true;
  
  // Check root domain match (e.g., subdomain.example.com matches example.com)
  const parts1 = domain1.split('.');
  const parts2 = domain2.split('.');
  
  if (parts1.length >= 2 && parts2.length >= 2) {
    const root1 = parts1.slice(-2).join('.');
    const root2 = parts2.slice(-2).join('.');
    return root1 === root2;
  }
  
  return false;
}

/**
 * Calculate severity of domain mismatch
 */
function calculateSeverity(domainInfo, companyDomain) {
  const mismatches = domainInfo.filter(d => !d.matchesCompany);
  
  if (mismatches.length === 0) return 'LOW';
  
  // Check if it's just TLD difference (e.g., .com vs .cz)
  const hasTLDVariants = mismatches.some(m => {
    if (!companyDomain) return false;
    const baseDomain1 = m.domain.split('.').slice(0, -1).join('.');
    const baseDomain2 = companyDomain.split('.').slice(0, -1).join('.');
    return baseDomain1 === baseDomain2;
  });
  
  if (hasTLDVariants) return 'MEDIUM';
  
  // Check if domains share common base name
  const hasRelatedDomains = mismatches.some(m => {
    if (!companyDomain) return false;
    const name1 = m.domain.split('.')[0];
    const name2 = companyDomain.split('.')[0];
    return name1 === name2;
  });
  
  if (hasRelatedDomains) return 'MEDIUM';
  
  return 'HIGH';
}

// Run the diagnosis
if (require.main === module) {
  diagnoseDomainMismatches().catch(console.error);
}

module.exports = { diagnoseDomainMismatches };

