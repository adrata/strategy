#!/usr/bin/env node

/**
 * Company URL Audit Script
 * 
 * This script audits company URLs to find discrepancies between:
 * - Expected URLs (generated from current database IDs)
 * - Potential legacy URLs (that may exist in bookmarks or shared links)
 * 
 * Helps identify companies where wrong IDs might cause issues
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to generate slug from name and ID (matches frontend logic)
function generateSlug(name, id) {
  if (!name || !id) {
    return id || 'unknown';
  }

  // Clean the name: lowercase, replace spaces and special chars with hyphens
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Limit name length to keep URLs reasonable
  const truncatedName = cleanName.substring(0, 50);
  
  // Format: name-id (human-readable name first, then unique ID)
  return `${truncatedName}-${id}`;
}

async function auditCompanyUrls() {
  console.log('='.repeat(80));
  console.log('COMPANY URL AUDIT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');
    console.log('');

    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${workspaces.length} workspace(s)`);
    console.log('');

    const auditResults = [];

    for (const workspace of workspaces) {
      console.log(`Auditing workspace: ${workspace.name} (${workspace.slug})`);
      console.log('-'.repeat(80));

      // Get all companies in this workspace
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      console.log(`   Found ${companies.length} companies`);

      // Analyze each company's URL
      const urlIssues = [];
      for (const company of companies) {
        const expectedSlug = generateSlug(company.name, company.id);
        const expectedUrl = `/${workspace.slug}/companies/${expectedSlug}`;

        // Store audit info
        const audit = {
          workspaceName: workspace.name,
          workspaceSlug: workspace.slug,
          companyId: company.id,
          companyName: company.name,
          expectedSlug,
          expectedUrl,
          idLength: company.id.length,
          hasSpecialChars: /[^a-zA-Z0-9-]/.test(company.id),
          created: company.createdAt.toISOString().split('T')[0],
          updated: company.updatedAt.toISOString().split('T')[0]
        };

        auditResults.push(audit);

        // Check for potential issues
        if (audit.hasSpecialChars) {
          urlIssues.push({
            company: company.name,
            issue: 'Company ID contains special characters',
            id: company.id
          });
        }
      }

      // Report issues for this workspace
      if (urlIssues.length > 0) {
        console.log(`   ⚠️ Found ${urlIssues.length} potential URL issue(s):`);
        urlIssues.forEach((issue, index) => {
          console.log(`      ${index + 1}. ${issue.company}`);
          console.log(`         Issue: ${issue.issue}`);
          console.log(`         ID: ${issue.id}`);
        });
      } else {
        console.log(`   ✅ No URL issues found`);
      }

      console.log('');
    }

    // Generate report
    console.log('='.repeat(80));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log('');

    const totalCompanies = auditResults.length;
    const companiesWithIssues = auditResults.filter(a => a.hasSpecialChars).length;

    console.log(`Total companies audited: ${totalCompanies}`);
    console.log(`Companies with potential URL issues: ${companiesWithIssues}`);
    console.log('');

    // Group by workspace
    console.log('BY WORKSPACE:');
    const byWorkspace = {};
    auditResults.forEach(audit => {
      if (!byWorkspace[audit.workspaceName]) {
        byWorkspace[audit.workspaceName] = {
          total: 0,
          issues: 0
        };
      }
      byWorkspace[audit.workspaceName].total++;
      if (audit.hasSpecialChars) {
        byWorkspace[audit.workspaceName].issues++;
      }
    });

    Object.keys(byWorkspace).sort().forEach(workspaceName => {
      const stats = byWorkspace[workspaceName];
      const status = stats.issues > 0 ? '⚠️' : '✅';
      console.log(`   ${status} ${workspaceName}: ${stats.total} companies (${stats.issues} with issues)`);
    });
    console.log('');

    // Sample expected URLs
    console.log('SAMPLE EXPECTED URLS:');
    const samples = auditResults.slice(0, 5);
    samples.forEach((audit, index) => {
      console.log(`   ${index + 1}. ${audit.companyName}`);
      console.log(`      URL: https://action.adrata.com${audit.expectedUrl}`);
      console.log(`      ID: ${audit.companyId}`);
      console.log('');
    });

    // Save detailed report
    const timestamp = Date.now();
    const reportPath = `logs/company-url-audit-${timestamp}.json`;
    const fs = require('fs');
    const path = require('path');
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(process.cwd(), reportPath),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          totalCompanies,
          companiesWithIssues,
          byWorkspace
        },
        companies: auditResults
      }, null, 2)
    );

    console.log(`📄 Detailed report saved: ${reportPath}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditCompanyUrls()
  .then(() => {
    console.log('✅ Audit completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });

