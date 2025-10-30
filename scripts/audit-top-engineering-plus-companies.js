#!/usr/bin/env node

/**
 * TOP Engineering Plus - Company Data Quality Audit
 *
 * This script audits all companies in the TOP Engineering Plus workspace to identify:
 * - Industry mismatches (non-utilities/energy or adjacent sectors)
 * - Geographic mismatches (international where US-focused expected)
 * - Suspicious records (generic names, no people, bad/missing domains)
 * - Data source provenance to understand origin
 *
 * Output:
 * - Console summary
 * - JSON report saved to docs/reports/top-engineering-plus-company-audit-[timestamp].json
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Workspace resolution: allow override via env, otherwise auto-detect TOP Engineering workspace
const ENV_WORKSPACE_ID = process.env.TOP_WORKSPACE_ID || process.env.WORKSPACE_ID || null;

function nowIsoSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureReportDir() {
  const dir = path.join(process.cwd(), 'docs', 'reports');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function toDomain(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const u = new URL(normalized);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Heuristics
const EXPECTED_INDUSTRY_KEYWORDS = [
  'utility', 'utilities', 'energy', 'power', 'electric', 'water', 'wastewater', 'gas',
  'grid', 'transmission', 'distribution', 'renewable', 'solar', 'wind'
];

const CLEAR_MISMATCH_KEYWORDS = [
  'photograph', 'animation', 'studio', 'retail', 'fashion', 'bling', 'bows', 'wedding',
  'beauty', 'salon', 'restaurant', 'cafe', 'hotel', 'travel'
];

const INTERNATIONAL_COUNTRIES = [
  'india', 'australia', 'united kingdom', 'uk', 'england', 'canada', 'new zealand',
  'ireland', 'south africa', 'singapore', 'philippines', 'pakistan', 'bangladesh'
];

function isExpectedIndustry(industry, sector) {
  const hay = `${industry || ''} ${sector || ''}`.toLowerCase();
  return EXPECTED_INDUSTRY_KEYWORDS.some(k => hay.includes(k));
}

function isClearMismatch(name, industry, sector) {
  const hay = `${name || ''} ${industry || ''} ${sector || ''}`.toLowerCase();
  return CLEAR_MISMATCH_KEYWORDS.some(k => hay.includes(k));
}

function isInternational(country) {
  if (!country) return false;
  const c = String(country).toLowerCase();
  if (c === 'united states' || c === 'usa' || c === 'us' || c === 'united states of america') return false;
  return INTERNATIONAL_COUNTRIES.some(k => c.includes(k));
}

function looksGenericName(name) {
  if (!name) return true;
  const n = name.toLowerCase();
  if (n.length < 3) return true;
  // overly generic tokens
  const genericTokens = ['company', 'inc', 'llc', 'ltd', 'corp', 'co'];
  const tokens = n.split(/[^a-z0-9]+/).filter(Boolean);
  const uniqueTokens = tokens.filter(t => !genericTokens.includes(t));
  return uniqueTokens.length <= 1;
}

function inferSource(company) {
  // Prefer explicit fields when available
  const sourcesArray = company.sources || company.dataSources || [];
  const cf = company.customFields || {};
  const cfImport = cf.importSource || cf.source || cf.origin || null;
  const direct = company.source || null; // some historical schemas
  const collected = [];
  if (Array.isArray(sourcesArray)) collected.push(...sourcesArray);
  if (cfImport) collected.push(cfImport);
  if (direct) collected.push(direct);
  return Array.from(new Set(collected.filter(Boolean)));
}

async function resolveTopWorkspaceId() {
  if (ENV_WORKSPACE_ID) return ENV_WORKSPACE_ID;

  // Try to find a workspace with TOP Engineering in the name/slug that has the most companies
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

  // Rank by company count, pick the one with the most companies
  const ranked = [];
  for (const ws of candidates) {
    const count = await prisma.companies.count({ where: { workspaceId: ws.id, deletedAt: null } });
    ranked.push({ ...ws, companyCount: count });
  }
  ranked.sort((a, b) => b.companyCount - a.companyCount);
  return ranked[0]?.id || null;
}

async function auditTopEngineeringPlusCompanies() {
  console.log('🔍 Auditing TOP Engineering Plus companies');
  console.log('==========================================\n');

  try {
    await prisma.$connect();

    const workspaceId = await resolveTopWorkspaceId();
    if (!workspaceId) {
      console.log('❌ Could not determine TOP Engineering workspace. Set TOP_WORKSPACE_ID env var or ensure workspace exists.');
      return;
    }

    const companies = await prisma.companies.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        name: true,
        industry: true,
        sector: true,
        size: true,
        website: true,
        domain: true,
        city: true,
        state: true,
        country: true,
        tags: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        customFields: true,
        dataSources: true,
        sources: true,
        _count: { select: { people: true } }
      }
    });

    console.log(`📊 Total companies: ${companies.length}\n`);

    const summary = {
      totalCompanies: companies.length,
      byIndustryCategory: { expected: 0, mismatched: 0, unclear: 0 },
      byGeography: { us: 0, international: 0, unknown: 0 },
      bySource: {},
    };

    const issues = {
      industryMismatches: [],
      geographyMismatches: [],
      suspiciousCompanies: [],
      noPeopleLinked: [],
      badOrMissingDomain: [],
    };

    // Predefined examples to highlight if present
    const highlightNames = [
      'Approve Infoways',
      'Bows, Blings & Things of Georgia',
      'Burbank Animation Studios'
    ].map(s => s.toLowerCase());

    const highlighted = [];

    for (const c of companies) {
      const industryOk = isExpectedIndustry(c.industry, c.sector);
      const industryClearMismatch = isClearMismatch(c.name, c.industry, c.sector);

      if (industryOk) summary.byIndustryCategory.expected += 1;
      else if (industryClearMismatch) summary.byIndustryCategory.mismatched += 1;
      else summary.byIndustryCategory.unclear += 1;

      const country = c.country && String(c.country).trim();
      if (!country) summary.byGeography.unknown += 1;
      else if (isInternational(country)) summary.byGeography.international += 1;
      else summary.byGeography.us += 1;

      const sources = inferSource(c);
      if (sources.length === 0) {
        summary.bySource['Unknown'] = (summary.bySource['Unknown'] || 0) + 1;
      } else {
        for (const s of sources) {
          summary.bySource[s] = (summary.bySource[s] || 0) + 1;
        }
      }

      // Collect issues
      if (industryClearMismatch) {
        issues.industryMismatches.push({
          id: c.id,
          name: c.name,
          industry: c.industry || null,
          sector: c.sector || null,
          sources,
        });
      }

      if (isInternational(country)) {
        issues.geographyMismatches.push({
          id: c.id,
          name: c.name,
          city: c.city || null,
          state: c.state || null,
          country: c.country || null,
          sources,
        });
      }

      const domain = c.domain || toDomain(c.website);
      if (!domain || /\s/.test(domain) || !domain.includes('.')) {
        issues.badOrMissingDomain.push({ id: c.id, name: c.name, website: c.website || null, domain: c.domain || null });
      }

      if (!c._count || !c._count.people || c._count.people === 0) {
        issues.noPeopleLinked.push({ id: c.id, name: c.name });
      }

      if (looksGenericName(c.name)) {
        issues.suspiciousCompanies.push({ id: c.id, name: c.name, reason: 'Generic or low-information name' });
      }

      // Highlights
      if (highlightNames.some(h => (c.name || '').toLowerCase().includes(h))) {
        highlighted.push({
          id: c.id,
          name: c.name,
          industry: c.industry || null,
          sector: c.sector || null,
          city: c.city || null,
          state: c.state || null,
          country: c.country || null,
          website: c.website || null,
          sources,
          peopleCount: (c._count && c._count.people) || 0,
        });
      }
    }

    // Sort issue lists for readability
    issues.industryMismatches.sort((a, b) => a.name.localeCompare(b.name));
    issues.geographyMismatches.sort((a, b) => a.name.localeCompare(b.name));
    issues.suspiciousCompanies.sort((a, b) => a.name.localeCompare(b.name));
    issues.noPeopleLinked.sort((a, b) => a.name.localeCompare(b.name));

    // Console report
    console.log('📋 Industry coverage:');
    console.log(`   ✅ Expected:   ${summary.byIndustryCategory.expected}`);
    console.log(`   ❌ Mismatched: ${summary.byIndustryCategory.mismatched}`);
    console.log(`   ⚠️  Unclear:    ${summary.byIndustryCategory.unclear}`);
    console.log('\n🌍 Geography:');
    console.log(`   🇺🇸 US:            ${summary.byGeography.us}`);
    console.log(`   🌐 International:  ${summary.byGeography.international}`);
    console.log(`   ❓ Unknown:        ${summary.byGeography.unknown}`);

    console.log('\n🏷️  Top Sources:');
    const topSources = Object.entries(summary.bySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    topSources.forEach(([src, count]) => console.log(`   • ${src}: ${count}`));

    console.log('\n🚨 Issues (counts):');
    console.log(`   Industry mismatches: ${issues.industryMismatches.length}`);
    console.log(`   Geography mismatches: ${issues.geographyMismatches.length}`);
    console.log(`   Suspicious companies: ${issues.suspiciousCompanies.length}`);
    console.log(`   No people linked:     ${issues.noPeopleLinked.length}`);
    console.log(`   Bad/missing domain:   ${issues.badOrMissingDomain.length}`);

    if (highlighted.length > 0) {
      console.log('\n🔎 Highlighted examples:');
      highlighted.forEach((h, i) => {
        console.log(`   ${i + 1}. ${h.name} — ${h.industry || 'Unknown Industry'} (${h.country || 'Unknown Country'})`);
      });
    }

    // JSON report
    const report = {
      generatedAt: new Date().toISOString(),
      workspaceId,
      summary,
      issues,
      highlighted,
    };

    const outDir = ensureReportDir();
    const outPath = path.join(outDir, `top-engineering-plus-company-audit-${nowIsoSafe()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📝 Report written to: ${outPath}`);

  } catch (err) {
    console.error('❌ Audit failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  auditTopEngineeringPlusCompanies();
}

module.exports = { auditTopEngineeringPlusCompanies };


