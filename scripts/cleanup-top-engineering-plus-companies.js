#!/usr/bin/env node

/**
 * Cleanup TOP Engineering workspace companies based on latest audit report.
 *
 * Rules:
 * - Soft delete industry mismatches, geography mismatches, suspicious companies, bad/missing domain
 * - For "no people linked", ONLY soft delete if company is NOT in expected utilities/energy industry
 * - Never delete a company in expected industry solely due to no-people flag
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Optional override via env
const ENV_WORKSPACE_ID = process.env.TOP_WORKSPACE_ID || process.env.WORKSPACE_ID || null;

const REPORT_PREFIX = 'top-engineering-plus-company-audit-';

function isExpectedIndustry(industry, sector) {
  const EXPECTED_INDUSTRY_KEYWORDS = [
    'utility', 'utilities', 'energy', 'power', 'electric', 'water', 'wastewater', 'gas',
    'grid', 'transmission', 'distribution', 'renewable', 'solar', 'wind'
  ];
  const hay = `${industry || ''} ${sector || ''}`.toLowerCase();
  return EXPECTED_INDUSTRY_KEYWORDS.some(k => hay.includes(k));
}

async function resolveTopWorkspaceId() {
  if (ENV_WORKSPACE_ID) return ENV_WORKSPACE_ID;
  const candidates = await prisma.workspaces.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: 'TOP', mode: 'insensitive' } },
        { slug: { contains: 'top', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, slug: true }
  });
  if (candidates.length === 0) return null;
  const ranked = [];
  for (const ws of candidates) {
    const count = await prisma.companies.count({ where: { workspaceId: ws.id, deletedAt: null } });
    ranked.push({ ...ws, companyCount: count });
  }
  ranked.sort((a, b) => b.companyCount - a.companyCount);
  return ranked[0]?.id || null;
}

function getLatestAuditReportPath() {
  const dir = path.join(process.cwd(), 'docs', 'reports');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(REPORT_PREFIX) && f.endsWith('.json'))
    .map(f => path.join(dir, f));
  if (files.length === 0) return null;
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

async function main() {
  console.log('🧹 Cleaning up TOP Engineering companies based on latest audit');
  console.log('================================================================\n');
  try {
    await prisma.$connect();

    const workspaceId = await resolveTopWorkspaceId();
    if (!workspaceId) {
      console.log('❌ Could not resolve TOP Engineering workspace ID');
      return;
    }

    const reportPath = getLatestAuditReportPath();
    if (!reportPath) {
      console.log('❌ No audit report found in docs/reports');
      return;
    }

    console.log(`📄 Using report: ${reportPath}`);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    const ids = new Set();

    const addList = (list) => {
      if (!Array.isArray(list)) return;
      for (const item of list) {
        if (item && item.id) ids.add(item.id);
      }
    };

    addList(report.issues?.industryMismatches);
    addList(report.issues?.geographyMismatches);
    addList(report.issues?.suspiciousCompanies);
    addList(report.issues?.badOrMissingDomain);

    // For noPeopleLinked, only include if NOT expected industry
    const noPeople = Array.isArray(report.issues?.noPeopleLinked) ? report.issues.noPeopleLinked : [];
    if (noPeople.length > 0) {
      const toCheckIds = noPeople.map(x => x.id).filter(Boolean);
      const chunkSize = 100;
      for (let i = 0; i < toCheckIds.length; i += chunkSize) {
        const chunk = toCheckIds.slice(i, i + chunkSize);
        const companies = await prisma.companies.findMany({
          where: { id: { in: chunk }, workspaceId, deletedAt: null },
          select: { id: true, industry: true, sector: true }
        });
        for (const c of companies) {
          if (!isExpectedIndustry(c.industry, c.sector)) ids.add(c.id);
        }
      }
    }

    const idsToDelete = Array.from(ids);
    if (idsToDelete.length === 0) {
      console.log('\n✅ Nothing to delete based on current rules.');
      return;
    }

    console.log(`\n🗂️ Candidates for soft delete: ${idsToDelete.length}`);

    let deletedCount = 0;
    const now = new Date();
    const chunkSize = 50;
    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
      const chunk = idsToDelete.slice(i, i + chunkSize);
      // Fetch to merge customFields and double-check workspace/deletedAt
      const companies = await prisma.companies.findMany({
        where: { id: { in: chunk }, workspaceId, deletedAt: null },
        select: { id: true, customFields: true }
      });
      for (const c of companies) {
        const cf = c.customFields || {};
        const updatedCustomFields = {
          ...cf,
          cleanup: {
            ...(cf.cleanup || {}),
            softDeletedBy: 'top_cleanup_script',
            reason: 'audit_flagged',
            at: now.toISOString()
          }
        };
        await prisma.companies.update({
          where: { id: c.id },
          data: {
            deletedAt: now,
            status: 'INACTIVE',
            customFields: updatedCustomFields
          }
        });
        deletedCount += 1;
      }
    }

    console.log(`\n✅ Soft-deleted companies: ${deletedCount}`);

  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };


