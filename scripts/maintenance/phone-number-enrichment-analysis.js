#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function phoneNumberEnrichmentAnalysis() {
  console.log("📞 PHONE NUMBER ENRICHMENT ANALYSIS FOR MONACO PIPELINE");
  console.log("=======================================================");
  console.log("");

  const leads = await prisma.lead.findMany({
    where: { workspaceId: "adrata" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      phone: true,
      company: true,
      jobTitle: true,
      customFields: true,
    },
  });

  console.log(
    `📊 Analyzing ${leads.length} prospects for phone number enrichment opportunities...`,
  );
  console.log("");

  const analysis = {
    validUSPhones: 0,
    noPhones: 0,
    emailsInPhoneField: 0,
    internationalPhones: 0,
    invalidPhones: 0,
    needsEnrichment: [],
    enrichmentOpportunities: {
      hasEmailNeedsPhone: [],
      hasCompanyNeedsPhone: [],
      hasLinkedInNeedsPhone: [],
      completeMissingContact: [],
    },
  };

  leads.forEach((lead) => {
    const hasValidPhone =
      lead.phone && !lead.phone.includes("@") && isValidUSPhone(lead.phone);
    const hasValidEmail = lead.email && isValidEmail(lead.email);

    if (!lead.phone || lead.phone.trim() === "") {
      analysis.noPhones++;
      analysis.needsEnrichment.push({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        company: lead.company,
        email: lead.email,
        issue: "no_phone",
        enrichmentPotential: calculateEnrichmentPotential(lead),
      });
    } else if (lead.phone.includes("@")) {
      analysis.emailsInPhoneField++;
      analysis.needsEnrichment.push({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        company: lead.company,
        email: lead.email,
        issue: "email_in_phone_field",
        enrichmentPotential: calculateEnrichmentPotential(lead),
      });
    } else if (hasValidPhone) {
      analysis.validUSPhones++;
    } else {
      analysis.invalidPhones++;
      analysis.needsEnrichment.push({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        issue: "invalid_phone",
        enrichmentPotential: calculateEnrichmentPotential(lead),
      });
    }

    // Categorize enrichment opportunities
    if (!hasValidPhone) {
      if (hasValidEmail && lead.company) {
        analysis.enrichmentOpportunities.hasEmailNeedsPhone.push(lead);
      } else if (lead.company && lead.firstName && lead.lastName) {
        analysis.enrichmentOpportunities.hasCompanyNeedsPhone.push(lead);
      } else if (hasLinkedInData(lead)) {
        analysis.enrichmentOpportunities.hasLinkedInNeedsPhone.push(lead);
      } else {
        analysis.enrichmentOpportunities.completeMissingContact.push(lead);
      }
    }
  });

  // Sort by enrichment potential
  analysis.needsEnrichment.sort(
    (a, b) => b.enrichmentPotential - a.enrichmentPotential,
  );

  console.log("📈 PHONE NUMBER DATA QUALITY SUMMARY:");
  console.log("=====================================");
  console.log(
    `✅ Valid US phone numbers: ${analysis.validUSPhones} (${((analysis.validUSPhones / leads.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `❌ No phone numbers: ${analysis.noPhones} (${((analysis.noPhones / leads.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `🔤 Emails in phone field: ${analysis.emailsInPhoneField} (${((analysis.emailsInPhoneField / leads.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `🌍 Invalid/International: ${analysis.invalidPhones} (${((analysis.invalidPhones / leads.length) * 100).toFixed(1)}%)`,
  );
  console.log("");

  console.log("🎯 ENRICHMENT OPPORTUNITIES:");
  console.log("============================");
  console.log(
    `📧 Has email, needs phone: ${analysis.enrichmentOpportunities.hasEmailNeedsPhone.length}`,
  );
  console.log(
    `🏢 Has company, needs phone: ${analysis.enrichmentOpportunities.hasCompanyNeedsPhone.length}`,
  );
  console.log(
    `💼 Has LinkedIn, needs phone: ${analysis.enrichmentOpportunities.hasLinkedInNeedsPhone.length}`,
  );
  console.log(
    `🚨 Missing all contact info: ${analysis.enrichmentOpportunities.completeMissingContact.length}`,
  );
  console.log("");

  console.log("🔧 TOP 10 ENRICHMENT TARGETS:");
  console.log("=============================");
  analysis.needsEnrichment.slice(0, 10).forEach((prospect, index) => {
    console.log(`${index + 1}. ${prospect.name} (${prospect.company})`);
    console.log(`   Issue: ${prospect.issue.replace(/_/g, " ")}`);
    console.log(`   Enrichment Potential: ${prospect.enrichmentPotential}/100`);
    console.log("");
  });

  console.log("💡 MONACO PIPELINE ENHANCEMENT RECOMMENDATIONS:");
  console.log("===============================================");
  console.log("1. ADD PHONE ENRICHMENT STEP: Create enrichPhoneNumbers.ts");
  console.log("2. INTEGRATE WITH APOLLO/ZOOMINFO: Use real contact APIs");
  console.log("3. CLEAN EXISTING DATA: Fix emails in phone fields");
  console.log("4. VALIDATE NUMBERS: Verify phone number accuracy");
  console.log(
    "5. PRIORITIZE BY POTENTIAL: Focus on high-value prospects first",
  );
  console.log("");

  const totalNeedingEnrichment = analysis.needsEnrichment.length;
  const enrichmentCoverage = (
    (totalNeedingEnrichment / leads.length) *
    100
  ).toFixed(1);

  console.log(
    `🎯 ENRICHMENT IMPACT: ${totalNeedingEnrichment} prospects (${enrichmentCoverage}%) need phone enrichment`,
  );
  console.log(
    `💰 BUSINESS VALUE: ${totalNeedingEnrichment} × 40% answer rate boost = ${Math.round(totalNeedingEnrichment * 0.4)} more conversations`,
  );

  await prisma.$disconnect();
}

function isValidUSPhone(phone) {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, "");
  return (
    cleanPhone.length === 10 ||
    (cleanPhone.length === 11 && cleanPhone.startsWith("1"))
  );
}

function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function hasLinkedInData(lead) {
  if (!lead.customFields) return false;
  const customFields =
    typeof lead.customFields === "string"
      ? JSON.parse(lead.customFields)
      : lead.customFields;
  return customFields?.linkedinUrl || customFields?.socialProfiles?.linkedin;
}

function calculateEnrichmentPotential(lead) {
  let score = 0;

  // Base score for having name and company
  if (lead.firstName && lead.lastName && lead.company) score += 30;

  // Email bonus
  if (lead.email && isValidEmail(lead.email)) score += 25;

  // Job title bonus
  if (lead.jobTitle) score += 15;

  // Company size/importance (mock scoring)
  const importantCompanies = [
    "google",
    "microsoft",
    "apple",
    "amazon",
    "meta",
    "salesforce",
    "oracle",
  ];
  if (
    lead.company &&
    importantCompanies.some((c) => lead.company.toLowerCase().includes(c))
  ) {
    score += 20;
  }

  // Executive level bonus
  if (
    lead.jobTitle &&
    (lead.jobTitle.toLowerCase().includes("ceo") ||
      lead.jobTitle.toLowerCase().includes("cto") ||
      lead.jobTitle.toLowerCase().includes("vp"))
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}

phoneNumberEnrichmentAnalysis().catch(console.error);
