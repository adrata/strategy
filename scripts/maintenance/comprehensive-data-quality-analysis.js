#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function comprehensiveDataQualityAnalysis() {
  console.log("🔍 COMPREHENSIVE DATA QUALITY ANALYSIS");
  console.log("=====================================");
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
      status: true,
      priority: true,
      source: true,
      notes: true,
      tags: true,
      customFields: true,
      assignedUserId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`📊 Total prospects: ${leads.length}`);
  console.log("");

  // Data Quality Metrics
  const dataQuality = {
    total: leads.length,
    withPhone: 0,
    withValidUSPhone: 0,
    withEmail: 0,
    withValidEmail: 0,
    withCompany: 0,
    withJobTitle: 0,
    withFullName: 0,
    withNotes: 0,
    withTags: 0,
    withCustomFields: 0,
    withMonacoEnrichment: 0,
    emailInPhoneField: 0,
    phoneIssues: {
      noPhone: 0,
      emailInPhone: 0,
      tooShort: 0,
      tooLong: 0,
      hasExtension: 0,
      hasLetters: 0,
      international: 0,
    },
    emailIssues: {
      noEmail: 0,
      invalidFormat: 0,
      personalEmail: 0,
      tempEmail: 0,
    },
    nameIssues: {
      noFirstName: 0,
      noLastName: 0,
      noFullName: 0,
      inconsistentNames: 0,
    },
    companyIssues: {
      noCompany: 0,
      genericCompany: 0,
    },
    enrichmentOpportunities: {
      needsPhoneEnrichment: 0,
      needsEmailEnrichment: 0,
      needsCompanyEnrichment: 0,
      needsJobTitleEnrichment: 0,
      needsLocationEnrichment: 0,
      needsSocialMediaEnrichment: 0,
      needsMonacoIntelligence: 0,
    },
  };

  const examples = {
    phoneIssues: [],
    emailIssues: [],
    nameIssues: [],
    companyIssues: [],
    enrichmentCandidates: [],
  };

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const personalEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
  ];
  const tempEmailDomains = [
    "tempmail.org",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
  ];

  leads.forEach((lead) => {
    const name = `${lead.firstName || ""} ${lead.lastName || ""}`.trim();

    // Phone Analysis
    if (!lead.phone || !lead.phone.trim()) {
      dataQuality.phoneIssues.noPhone++;
    } else {
      dataQuality.withPhone++;
      const phone = lead.phone.trim();

      // Check if email is in phone field
      if (phone.includes("@")) {
        dataQuality.phoneIssues.emailInPhone++;
        dataQuality.emailInPhoneField++;
        if (examples.phoneIssues.length < 5) {
          examples.phoneIssues.push({
            name,
            company: lead.company,
            issue: "email_in_phone",
            value: phone,
          });
        }
      } else {
        const cleanPhone = phone.replace(/\D/g, "");

        if (cleanPhone.length < 7) {
          dataQuality.phoneIssues.tooShort++;
        } else if (
          cleanPhone.length === 10 ||
          (cleanPhone.length === 11 && cleanPhone.startsWith("1"))
        ) {
          dataQuality.withValidUSPhone++;
        } else if (cleanPhone.length > 11) {
          dataQuality.phoneIssues.tooLong++;
        } else if (cleanPhone.length === 11 && !cleanPhone.startsWith("1")) {
          dataQuality.phoneIssues.international++;
        }

        if (
          phone.includes("ext") ||
          phone.includes("x ") ||
          phone.includes("#")
        ) {
          dataQuality.phoneIssues.hasExtension++;
        }

        if (/[a-zA-Z]/.test(phone.replace(/ext|extension/gi, ""))) {
          dataQuality.phoneIssues.hasLetters++;
        }
      }
    }

    // Email Analysis
    if (!lead.email || !lead.email.trim()) {
      dataQuality.emailIssues.noEmail++;
    } else {
      dataQuality.withEmail++;
      const email = lead.email.trim().toLowerCase();

      if (!emailRegex.test(email)) {
        dataQuality.emailIssues.invalidFormat++;
        if (examples.emailIssues.length < 5) {
          examples.emailIssues.push({
            name,
            company: lead.company,
            issue: "invalid_format",
            value: email,
          });
        }
      } else {
        dataQuality.withValidEmail++;
        const domain = email.split("@")[1];

        if (personalEmailDomains.includes(domain)) {
          dataQuality.emailIssues.personalEmail++;
        }

        if (tempEmailDomains.includes(domain)) {
          dataQuality.emailIssues.tempEmail++;
        }
      }
    }

    // Name Analysis
    if (!lead.firstName || !lead.firstName.trim()) {
      dataQuality.nameIssues.noFirstName++;
    }
    if (!lead.lastName || !lead.lastName.trim()) {
      dataQuality.nameIssues.noLastName++;
    }
    if (!lead.fullName || !lead.fullName.trim()) {
      dataQuality.nameIssues.noFullName++;
    } else {
      dataQuality.withFullName++;

      // Check name consistency
      const expectedFullName =
        `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
      if (lead.fullName !== expectedFullName && expectedFullName.length > 1) {
        dataQuality.nameIssues.inconsistentNames++;
      }
    }

    // Company Analysis
    if (!lead.company || !lead.company.trim()) {
      dataQuality.companyIssues.noCompany++;
    } else {
      dataQuality.withCompany++;
      const company = lead.company.trim().toLowerCase();
      const genericCompanies = [
        "unknown",
        "n/a",
        "none",
        "tbd",
        "pending",
        "freelancer",
        "consultant",
      ];

      if (genericCompanies.some((generic) => company.includes(generic))) {
        dataQuality.companyIssues.genericCompany++;
      }
    }

    // Job Title Analysis
    if (lead.jobTitle && lead.jobTitle.trim()) {
      dataQuality.withJobTitle++;
    }

    // Notes Analysis
    if (lead.notes && lead.notes.trim()) {
      dataQuality.withNotes++;
    }

    // Tags Analysis
    if (lead.tags && lead.tags.length > 0) {
      dataQuality.withTags++;
    }

    // Custom Fields Analysis
    if (lead.customFields && Object.keys(lead.customFields).length > 0) {
      dataQuality.withCustomFields++;

      // Check for Monaco enrichment
      if (lead.customFields.monacoEnrichment) {
        dataQuality.withMonacoEnrichment++;
      }
    }

    // Enrichment Opportunities
    if (
      !lead.phone ||
      lead.phone.includes("@") ||
      (lead.phone && lead.phone.replace(/\D/g, "").length < 10)
    ) {
      dataQuality.enrichmentOpportunities.needsPhoneEnrichment++;
    }

    if (!lead.email || !emailRegex.test(lead.email || "")) {
      dataQuality.enrichmentOpportunities.needsEmailEnrichment++;
    }

    if (!lead.company || dataQuality.companyIssues.genericCompany > 0) {
      dataQuality.enrichmentOpportunities.needsCompanyEnrichment++;
    }

    if (!lead.jobTitle) {
      dataQuality.enrichmentOpportunities.needsJobTitleEnrichment++;
    }

    if (!lead.customFields?.monacoEnrichment) {
      dataQuality.enrichmentOpportunities.needsMonacoIntelligence++;
    }

    // Track high-value enrichment candidates
    const hasGoodEmail = lead.email && emailRegex.test(lead.email);
    const hasGoodName = lead.firstName && lead.lastName;
    const hasGoodCompany =
      lead.company &&
      !genericCompanies.some((g) => lead.company.toLowerCase().includes(g));

    if (
      hasGoodEmail &&
      hasGoodName &&
      hasGoodCompany &&
      (!lead.phone || lead.phone.includes("@"))
    ) {
      if (examples.enrichmentCandidates.length < 10) {
        examples.enrichmentCandidates.push({
          name,
          email: lead.email,
          company: lead.company,
          jobTitle: lead.jobTitle,
          missingData: [],
        });
      }
    }
  });

  // Calculate percentages
  const percentages = {
    withPhone: ((dataQuality.withPhone / dataQuality.total) * 100).toFixed(1),
    withValidUSPhone: (
      (dataQuality.withValidUSPhone / dataQuality.total) *
      100
    ).toFixed(1),
    withEmail: ((dataQuality.withEmail / dataQuality.total) * 100).toFixed(1),
    withValidEmail: (
      (dataQuality.withValidEmail / dataQuality.total) *
      100
    ).toFixed(1),
    withCompany: ((dataQuality.withCompany / dataQuality.total) * 100).toFixed(
      1,
    ),
    withJobTitle: (
      (dataQuality.withJobTitle / dataQuality.total) *
      100
    ).toFixed(1),
    withMonacoEnrichment: (
      (dataQuality.withMonacoEnrichment / dataQuality.total) *
      100
    ).toFixed(1),
    needsPhoneEnrichment: (
      (dataQuality.enrichmentOpportunities.needsPhoneEnrichment /
        dataQuality.total) *
      100
    ).toFixed(1),
    needsEmailEnrichment: (
      (dataQuality.enrichmentOpportunities.needsEmailEnrichment /
        dataQuality.total) *
      100
    ).toFixed(1),
  };

  // Print Results
  console.log("📈 DATA COMPLETENESS OVERVIEW:");
  console.log("==============================");
  console.log(
    `• Phone numbers: ${dataQuality.withPhone}/${dataQuality.total} (${percentages.withPhone}%)`,
  );
  console.log(
    `• Valid US phones: ${dataQuality.withValidUSPhone}/${dataQuality.total} (${percentages.withValidUSPhone}%)`,
  );
  console.log(
    `• Email addresses: ${dataQuality.withEmail}/${dataQuality.total} (${percentages.withEmail}%)`,
  );
  console.log(
    `• Valid emails: ${dataQuality.withValidEmail}/${dataQuality.total} (${percentages.withValidEmail}%)`,
  );
  console.log(
    `• Company names: ${dataQuality.withCompany}/${dataQuality.total} (${percentages.withCompany}%)`,
  );
  console.log(
    `• Job titles: ${dataQuality.withJobTitle}/${dataQuality.total} (${percentages.withJobTitle}%)`,
  );
  console.log(
    `• Monaco enrichment: ${dataQuality.withMonacoEnrichment}/${dataQuality.total} (${percentages.withMonacoEnrichment}%)`,
  );
  console.log("");

  console.log("🚨 MAJOR DATA QUALITY ISSUES:");
  console.log("=============================");
  console.log(
    `• Emails in phone field: ${dataQuality.emailInPhoneField} prospects`,
  );
  console.log(
    `• Missing phone numbers: ${dataQuality.phoneIssues.noPhone} prospects`,
  );
  console.log(
    `• Missing email addresses: ${dataQuality.emailIssues.noEmail} prospects`,
  );
  console.log(
    `• Personal email addresses: ${dataQuality.emailIssues.personalEmail} prospects`,
  );
  console.log(
    `• Missing company names: ${dataQuality.companyIssues.noCompany} prospects`,
  );
  console.log("");

  console.log("🎯 ENRICHMENT OPPORTUNITIES:");
  console.log("============================");
  console.log(
    `• Need phone enrichment: ${dataQuality.enrichmentOpportunities.needsPhoneEnrichment} prospects (${percentages.needsPhoneEnrichment}%)`,
  );
  console.log(
    `• Need email enrichment: ${dataQuality.enrichmentOpportunities.needsEmailEnrichment} prospects (${percentages.needsEmailEnrichment}%)`,
  );
  console.log(
    `• Need company enrichment: ${dataQuality.enrichmentOpportunities.needsCompanyEnrichment} prospects`,
  );
  console.log(
    `• Need job title enrichment: ${dataQuality.enrichmentOpportunities.needsJobTitleEnrichment} prospects`,
  );
  console.log(
    `• Need Monaco intelligence: ${dataQuality.enrichmentOpportunities.needsMonacoIntelligence} prospects`,
  );
  console.log("");

  console.log("💡 TOP ENRICHMENT CANDIDATES:");
  console.log("=============================");
  examples.enrichmentCandidates.slice(0, 5).forEach((candidate, i) => {
    console.log(`${i + 1}. ${candidate.name} (${candidate.company})`);
    console.log(`   Email: ${candidate.email}`);
    console.log(`   Title: ${candidate.jobTitle || "Missing"}`);
    console.log("");
  });

  console.log("🔧 MONACO PIPELINE ENHANCEMENT RECOMMENDATIONS:");
  console.log("===============================================");
  console.log("1. ADD PHONE NUMBER ENRICHMENT STEP:");
  console.log("   - Use email + name + company for phone lookup");
  console.log("   - Integrate with ZoomInfo, Apollo, or similar APIs");
  console.log(
    "   - Clean existing phone data (remove emails from phone fields)",
  );
  console.log("");
  console.log("2. ENHANCE EMAIL ENRICHMENT:");
  console.log("   - Find business emails for personal email addresses");
  console.log("   - Validate email deliverability");
  console.log("   - Find additional email addresses per contact");
  console.log("");
  console.log("3. ADD SOCIAL MEDIA ENRICHMENT:");
  console.log("   - LinkedIn profile URLs");
  console.log("   - Twitter handles");
  console.log("   - Company social media presence");
  console.log("");
  console.log("4. ENHANCE COMPANY DATA:");
  console.log("   - Company size and revenue");
  console.log("   - Technology stack");
  console.log("   - Recent funding/news");
  console.log("   - Headquarters location");
  console.log("");
  console.log("5. ADD CONTACT SCORING:");
  console.log("   - Data completeness score");
  console.log("   - Contact quality score");
  console.log("   - Enrichment priority score");
  console.log("");

  // Data Quality Score
  const completenessScore =
    ((dataQuality.withValidUSPhone / dataQuality.total) * 0.25 +
      (dataQuality.withValidEmail / dataQuality.total) * 0.25 +
      (dataQuality.withCompany / dataQuality.total) * 0.2 +
      (dataQuality.withJobTitle / dataQuality.total) * 0.15 +
      (dataQuality.withFullName / dataQuality.total) * 0.1 +
      (dataQuality.withMonacoEnrichment / dataQuality.total) * 0.05) *
    100;

  console.log("📊 OVERALL DATA QUALITY SCORE:");
  console.log("==============================");
  console.log(`Score: ${completenessScore.toFixed(1)}/100`);

  if (completenessScore >= 80) {
    console.log("Grade: A - Excellent data quality");
  } else if (completenessScore >= 70) {
    console.log("Grade: B - Good data quality with room for improvement");
  } else if (completenessScore >= 60) {
    console.log(
      "Grade: C - Average data quality, significant enrichment needed",
    );
  } else {
    console.log("Grade: D - Poor data quality, major enrichment required");
  }

  console.log("");
  console.log("✅ Analysis complete! Ready for Monaco pipeline enhancement.");

  await prisma.$disconnect();
}

comprehensiveDataQualityAnalysis().catch(console.error);
