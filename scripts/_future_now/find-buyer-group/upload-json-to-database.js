#!/usr/bin/env node

/**
 * Upload Buyer Group JSON Results to Database
 * 
 * Reads JSON files exported from buyer group discovery and uploads them to the database.
 * Allows review of JSON files before committing to database.
 * 
 * Usage:
 *   node upload-json-to-database.js --file ./test-results/buyer-group-company.json
 *   node upload-json-to-database.js --directory ./test-results --workspace-id "xxx"
 *   node upload-json-to-database.js --file ./test-results/*.json --dry-run
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { extractDomain, createUniqueId } = require('./utils');

class BuyerGroupUploader {
  constructor(options = {}) {
    this.prisma = options.prisma || new PrismaClient();
    this.workspaceId = options.workspaceId;
    this.dryRun = options.dryRun || false;
  }

  /**
   * Upload a single JSON file to database
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<object>} Upload result
   */
  async uploadFile(filePath) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Processing: ${path.basename(filePath)}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Read and parse JSON
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      // Validate JSON structure
      const validation = this.validateJSON(data);
      if (!validation.valid) {
        throw new Error(`Invalid JSON structure: ${validation.errors.join(', ')}`);
      }

      // Extract data
      const intelligence = data.intelligence || {};
      const buyerGroup = data.buyerGroup || [];
      const report = data.report || {};
      const cohesion = data.cohesion || {};
      const metadata = data.metadata || {};

      // Use workspace ID from JSON or options
      const workspaceId = this.workspaceId || metadata.workspaceId;
      if (!workspaceId) {
        throw new Error('Workspace ID required (provide via --workspace-id or ensure JSON has metadata.workspaceId)');
      }

      console.log(`🏢 Company: ${intelligence.companyName || 'Unknown'}`);
      console.log(`👥 Buyer Group Size: ${buyerGroup.length} members`);
      console.log(`💰 Cost: $${(data.costs?.total || 0).toFixed(2)}`);
      console.log(`📊 Cohesion: ${cohesion.score || 0}%`);

      if (this.dryRun) {
        console.log('\n🔍 DRY RUN - Would upload:');
        console.log(`   - Company: ${intelligence.companyName}`);
        console.log(`   - People records: ${buyerGroup.length}`);
        console.log(`   - Buyer group record: 1`);
        return { success: true, dryRun: true, filePath };
      }

      // Upload to database using same logic as pipeline
      const result = await this.saveToDatabase(
        buyerGroup,
        report,
        intelligence,
        cohesion,
        data.costs,
        workspaceId,
        metadata.targetCompany
      );

      console.log(`\n✅ Successfully uploaded: ${path.basename(filePath)}`);
      return { success: true, filePath, result };

    } catch (error) {
      console.error(`\n❌ Failed to upload ${path.basename(filePath)}:`, error.message);
      return { success: false, filePath, error: error.message };
    }
  }

  /**
   * Validate JSON structure before upload
   * @param {object} data - Parsed JSON data
   * @returns {object} Validation result
   */
  validateJSON(data) {
    const errors = [];

    if (!data.intelligence) {
      errors.push('Missing intelligence data');
    } else {
      if (!data.intelligence.companyName) {
        errors.push('Missing intelligence.companyName');
      }
    }

    if (!data.buyerGroup || !Array.isArray(data.buyerGroup)) {
      errors.push('Missing or invalid buyerGroup array');
    } else if (data.buyerGroup.length === 0) {
      errors.push('Buyer group is empty');
    } else {
      // Validate buyer group members
      data.buyerGroup.forEach((member, index) => {
        if (!member.name) errors.push(`Member ${index + 1} missing name`);
        if (!member.buyerGroupRole) errors.push(`Member ${index + 1} missing buyerGroupRole`);
      });
    }

    if (!data.report) {
      errors.push('Missing report data');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Save buyer group to database (same logic as pipeline)
   * @param {Array} buyerGroup - Buyer group members
   * @param {object} report - Research report
   * @param {object} intelligence - Company intelligence
   * @param {object} cohesion - Cohesion analysis
   * @param {object} costs - Cost breakdown
   * @param {string} workspaceId - Workspace ID
   * @param {string} targetCompany - Target company identifier
   * @returns {Promise<object>} Save result
   */
  async saveToDatabase(buyerGroup, report, intelligence, cohesion, costs, workspaceId, targetCompany) {
    console.log('\n💾 Saving to database...');

    try {
      // 1. Find or create company record
      const company = await this.findOrCreateCompany(intelligence, workspaceId);

      // 2. Create/update People records
      console.log(`👥 Creating/updating People records for ${buyerGroup.length} members...`);
      for (const member of buyerGroup) {
        await this.savePerson(member, company.id, workspaceId);
      }

      // 3. Create BuyerGroups record
      let buyerGroupRecord = null;
      try {
        buyerGroupRecord = await this.prisma.buyerGroups.create({
          data: {
            id: createUniqueId('bg'),
            workspaceId: workspaceId,
            companyName: intelligence.companyName || extractDomain(targetCompany || ''),
            website: intelligence.website,
            industry: intelligence.industry,
            companySize: intelligence.employeeCount?.toString(),
            cohesionScore: cohesion.score || 0,
            overallConfidence: report.qualityMetrics?.averageConfidence || 0,
            totalMembers: buyerGroup.length,
            processingTime: 0, // Not available from JSON
            metadata: {
              report: report,
              intelligence: intelligence,
              costs: costs || {},
              companyTier: intelligence.tier,
              dealSize: intelligence.dealSize || 0,
              totalCost: costs?.total || 0,
              pipelineVersion: '2.1.0',
              uploadedFromJSON: true,
              uploadedAt: new Date().toISOString()
            },
            updatedAt: new Date()
          }
        });
        console.log('✅ BuyerGroups record created successfully');
      } catch (error) {
        console.warn('⚠️ BuyerGroups creation failed, continuing without audit trail:', error.message);
        buyerGroupRecord = { id: 'temp-' + Date.now() };
      }

      // 4. Create BuyerGroupMembers records
      try {
        const memberRecords = buyerGroup.map(member => {
          const email = this.extractEmail(member);
          return {
            id: createUniqueId('bgm'),
            buyerGroupId: buyerGroupRecord.id,
            name: member.name,
            title: member.title || null,
            department: member.department || null,
            role: member.buyerGroupRole,
            email: email,
            linkedin: member.linkedinUrl || null,
            confidence: member.roleConfidence || 0,
            influenceScore: member.scores?.influence || 0,
            updatedAt: new Date()
          };
        });

        await this.prisma.buyerGroupMembers.createMany({
          data: memberRecords
        });
        console.log('✅ BuyerGroupMembers records created successfully');
      } catch (error) {
        console.warn('⚠️ BuyerGroupMembers creation failed:', error.message);
      }

      console.log('✅ Buyer group saved to database successfully');
      console.log(`   - Company: ${company.name} (${company.id})`);
      console.log(`   - People records: ${buyerGroup.length} created/updated`);
      console.log(`   - Buyer group: ${buyerGroupRecord.id}`);

      return {
        companyId: company.id,
        buyerGroupId: buyerGroupRecord.id,
        peopleCount: buyerGroup.length
      };

    } catch (error) {
      console.error('❌ Failed to save buyer group to database:', error.message);
      throw error;
    }
  }

  /**
   * Save or update a person record
   * @param {object} member - Buyer group member
   * @param {string} companyId - Company ID
   * @param {string} workspaceId - Workspace ID
   */
  async savePerson(member, companyId, workspaceId) {
    const nameParts = member.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const email = this.extractEmail(member);
    const phone = this.extractPhone(member);

    // Check if person exists
    const existingPerson = await this.prisma.people.findFirst({
      where: {
        workspaceId: workspaceId,
        OR: [
          member.linkedinUrl ? { linkedinUrl: member.linkedinUrl } : null,
          email ? { email: email } : null
        ].filter(Boolean)
      }
    });

    // Extract intelligence data
    const coresignalData = member.fullProfile || {};
    const experience = coresignalData.experience || [];
    const currentExperience = experience.find(exp => exp.active_experience === 1) || experience[0] || {};

    const totalExperienceMonths = coresignalData.total_experience_duration_months || 0;
    const yearsExperience = Math.floor(totalExperienceMonths / 12);
    const yearsAtCompany = currentExperience.duration_months ? Math.floor(currentExperience.duration_months / 12) : 0;

    const influenceScore = member.scores?.influence || 0;
    const decisionPower = member.scores?.seniority || 0;
    let influenceLevel = 'low';
    if (influenceScore >= 7) influenceLevel = 'high';
    else if (influenceScore >= 4) influenceLevel = 'medium';

    const engagementScore = member.overallScore || 0;
    let engagementLevel = 'low';
    if (engagementScore >= 80) engagementLevel = 'high';
    else if (engagementScore >= 60) engagementLevel = 'medium';

    // Extract churn prediction from member data if available
    const churnPrediction = member.churnPrediction || 
                           (member.fullProfile?.churnPrediction) ||
                           (member.customFields?.churnPrediction) ||
                           null;

    const aiIntelligence = {
      influenceLevel,
      engagementLevel,
      decisionPower,
      influenceScore,
      primaryRole: member.title,
      department: member.department,
      churnPrediction: churnPrediction,
      lastUpdated: new Date().toISOString()
    };

    // Add refresh status if churn prediction exists
    if (churnPrediction && churnPrediction.refreshColor) {
      aiIntelligence.refreshStatus = {
        priority: churnPrediction.refreshPriority,
        color: churnPrediction.refreshColor,
        frequency: churnPrediction.refreshFrequency,
        nextRefreshDate: churnPrediction.nextRefreshDate,
        lastRefreshDate: churnPrediction.lastRefreshDate
      };
    }

    const personData = {
      workspaceId: workspaceId,
      companyId: companyId,
      firstName: firstName,
      lastName: lastName,
      fullName: member.name,
      jobTitle: member.title,
      title: member.title,
      department: member.department,
      email: email,
      phone: phone,
      linkedinUrl: member.linkedinUrl,
      buyerGroupRole: member.buyerGroupRole,
      isBuyerGroupMember: true,
      buyerGroupOptimized: true,
      coresignalData: member.fullProfile,
      enrichedData: aiIntelligence,
      aiIntelligence: aiIntelligence,
      aiLastUpdated: new Date(),
      dataLastVerified: new Date(), // Set to now when uploading fresh data
      influenceScore: influenceScore,
      decisionPower: decisionPower,
      engagementScore: engagementScore,
      lastEnriched: new Date(),
      mobilePhone: member.mobilePhone,
      workPhone: member.workPhone,
      phoneVerified: member.phone1Verified || false,
      phoneConfidence: member.phoneDataQuality ? member.phoneDataQuality / 100 : undefined,
      influenceLevel: influenceLevel,
      engagementLevel: engagementLevel,
      totalExperienceMonths: totalExperienceMonths,
      yearsExperience: yearsExperience,
      yearsAtCompany: yearsAtCompany,
      currentCompany: currentExperience.company_name,
      currentRole: member.title,
      industryExperience: currentExperience.company_industry,
      linkedinConnections: coresignalData.connections_count,
      linkedinFollowers: coresignalData.followers_count,
      technicalSkills: coresignalData.inferred_skills || [],
      dataQualityScore: this.calculateDataQualityScore(member, coresignalData),
      enrichmentScore: this.calculateEnrichmentScore(member, coresignalData),
      enrichmentSources: ['coresignal', 'lusha'],
      enrichmentVersion: '2.1.0',
      dataSources: ['coresignal', 'lusha'],
      aiConfidence: member.roleConfidence ? member.roleConfidence / 100 : 0.8,
      // Churn prediction and refresh scheduling
      customFields: churnPrediction ? {
        churnPrediction: {
          averageTimeInRoleMonths: churnPrediction.averageTimeInRoleMonths,
          predictedDepartureMonths: churnPrediction.predictedDepartureMonths,
          churnRiskScore: churnPrediction.churnRiskScore,
          churnRiskLevel: churnPrediction.churnRiskLevel,
          predictedDepartureDate: churnPrediction.predictedDepartureDate,
          reasoning: churnPrediction.reasoning,
          completedRolesCount: churnPrediction.completedRolesCount,
          refreshPriority: churnPrediction.refreshPriority,
          refreshColor: churnPrediction.refreshColor,
          refreshFrequency: churnPrediction.refreshFrequency,
          refreshFrequencyDays: churnPrediction.refreshFrequencyDays,
          nextRefreshDate: churnPrediction.nextRefreshDate,
          lastRefreshDate: churnPrediction.lastRefreshDate || new Date().toISOString()
        }
      } : undefined
    };

    if (existingPerson) {
      // Preserve existing customFields
      const existingCustomFields = existingPerson.customFields && typeof existingPerson.customFields === 'object'
        ? existingPerson.customFields
        : {};
      
      // Merge churn prediction into existing customFields
      if (churnPrediction) {
        personData.customFields = {
          ...existingCustomFields,
          churnPrediction: {
            averageTimeInRoleMonths: churnPrediction.averageTimeInRoleMonths,
            predictedDepartureMonths: churnPrediction.predictedDepartureMonths,
            churnRiskScore: churnPrediction.churnRiskScore,
            churnRiskLevel: churnPrediction.churnRiskLevel,
            predictedDepartureDate: churnPrediction.predictedDepartureDate,
            reasoning: churnPrediction.reasoning,
            completedRolesCount: churnPrediction.completedRolesCount,
            refreshPriority: churnPrediction.refreshPriority,
            refreshColor: churnPrediction.refreshColor,
            refreshFrequency: churnPrediction.refreshFrequency,
            refreshFrequencyDays: churnPrediction.refreshFrequencyDays,
            nextRefreshDate: churnPrediction.nextRefreshDate,
            lastRefreshDate: churnPrediction.lastRefreshDate || new Date().toISOString()
          }
        };
      } else {
        personData.customFields = existingCustomFields;
      }
      
      await this.prisma.people.update({
        where: { id: existingPerson.id },
        data: personData
      });
    } else {
      await this.prisma.people.create({
        data: personData
      });
    }
  }

  /**
   * Extract email from member data
   * @param {object} member - Buyer group member
   * @returns {string|null} Email address
   */
  extractEmail(member) {
    // Check fullProfile first (Coresignal data)
    if (member.fullProfile?.emails && Array.isArray(member.fullProfile.emails)) {
      const validEmails = member.fullProfile.emails
        .map(e => (typeof e === 'string' ? e : e.email || e.address))
        .filter(email => email && !email.includes('@coresignal.temp') && email.includes('@'));
      if (validEmails.length > 0) return validEmails[0];
    }

    // Check direct email field
    if (member.email && !member.email.includes('@coresignal.temp') && member.email.includes('@')) {
      return member.email;
    }

    return null;
  }

  /**
   * Extract phone from member data
   * @param {object} member - Buyer group member
   * @returns {string|null} Phone number
   */
  extractPhone(member) {
    // Prefer Lusha phone data
    if (member.phone1) return member.phone1;
    if (member.mobilePhone) return member.mobilePhone;
    if (member.workPhone) return member.workPhone;

    // Check Coresignal data
    if (member.fullProfile?.phoneNumbers && Array.isArray(member.fullProfile.phoneNumbers)) {
      const phones = member.fullProfile.phoneNumbers;
      const direct = phones.find(p => p.type === 'direct');
      const mobile = phones.find(p => p.type === 'mobile');
      const work = phones.find(p => p.type === 'work');
      return direct?.number || mobile?.number || work?.number || phones[0]?.number;
    }

    return member.phone || null;
  }

  /**
   * Find or create company record
   * @param {object} intelligence - Company intelligence
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<object>} Company record
   */
  async findOrCreateCompany(intelligence, workspaceId) {
    console.log('🏢 Finding or creating company record...');

    try {
      let company = null;
      if (intelligence.website) {
        const domain = extractDomain(intelligence.website);
        company = await this.prisma.companies.findFirst({
          where: {
            workspaceId: workspaceId,
            OR: [
              { website: { contains: domain } },
              { domain: domain }
            ]
          }
        });
      }

      if (!company && intelligence.companyName) {
        company = await this.prisma.companies.findFirst({
          where: {
            workspaceId: workspaceId,
            name: { contains: intelligence.companyName, mode: 'insensitive' }
          }
        });
      }

      if (!company) {
        console.log(`📝 Creating new company record for ${intelligence.companyName}`);
        company = await this.prisma.companies.create({
          data: {
            workspaceId: workspaceId,
            name: intelligence.companyName || 'Unknown Company',
            website: intelligence.website,
            industry: intelligence.industry,
            employeeCount: intelligence.employeeCount,
            revenue: intelligence.revenue,
            domain: intelligence.website ? extractDomain(intelligence.website) : null,
            status: 'ACTIVE',
            priority: 'MEDIUM',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created company: ${company.name} (${company.id})`);
      } else {
        console.log(`✅ Found existing company: ${company.name} (${company.id})`);
      }

      return company;
    } catch (error) {
      console.error('❌ Failed to find or create company:', error.message);
      throw error;
    }
  }

  /**
   * Calculate data quality score
   * @param {object} member - Buyer group member
   * @param {object} coresignalData - Coresignal data
   * @returns {number} Quality score (0-100)
   */
  calculateDataQualityScore(member, coresignalData) {
    let score = 0;
    if (member.name) score += 10;
    if (member.title) score += 10;
    if (this.extractEmail({ ...member, fullProfile: coresignalData })) score += 15;
    if (this.extractPhone({ ...member, fullProfile: coresignalData })) score += 15;
    if (member.linkedinUrl) score += 10;
    if (coresignalData.experience && coresignalData.experience.length > 0) score += 10;
    if (coresignalData.inferred_skills && coresignalData.inferred_skills.length > 0) score += 10;
    if (coresignalData.summary) score += 10;
    if (coresignalData.connections_count > 0) score += 5;
    if (coresignalData.followers_count > 0) score += 5;
    return Math.min(score, 100);
  }

  /**
   * Calculate enrichment score
   * @param {object} member - Buyer group member
   * @param {object} coresignalData - Coresignal data
   * @returns {number} Enrichment score (0-100)
   */
  calculateEnrichmentScore(member, coresignalData) {
    let score = 0;
    if (coresignalData.id) score += 30;
    if (member.phone1 || member.phone2) score += 20;
    if (this.extractEmail({ ...member, fullProfile: coresignalData })) score += 15;
    if (member.linkedinUrl) score += 15;
    const dataQuality = this.calculateDataQualityScore(member, coresignalData);
    score += dataQuality * 0.2;
    return Math.min(score, 100);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const files = [];

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' && args[i + 1]) {
      files.push(args[++i]);
    } else if (arg === '--directory' && args[i + 1]) {
      const dir = args[++i];
      const jsonFiles = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(dir, f));
      files.push(...jsonFiles);
    } else if (arg === '--workspace-id' && args[i + 1]) {
      options.workspaceId = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
      i--; // No value for boolean flags
    } else if (arg.endsWith('.json')) {
      files.push(arg);
    }
  }

  if (files.length === 0) {
    console.error('❌ Error: No JSON files specified');
    console.log('\nUsage:');
    console.log('  Upload single file:');
    console.log('    node upload-json-to-database.js --file ./test-results/buyer-group-company.json --workspace-id "xxx"');
    console.log('\n  Upload all files in directory:');
    console.log('    node upload-json-to-database.js --directory ./test-results --workspace-id "xxx"');
    console.log('\n  Dry run (preview without saving):');
    console.log('    node upload-json-to-database.js --file ./test-results/*.json --workspace-id "xxx" --dry-run');
    process.exit(1);
  }

  if (!options.workspaceId) {
    console.warn('⚠️  Warning: No workspace ID provided. Will try to use workspace ID from JSON metadata.');
  }

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to database\n');
  }

  try {
    const uploader = new BuyerGroupUploader(options);
    const results = [];

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        results.push({ success: false, filePath: file, error: 'File not found' });
        continue;
      }

      const result = await uploader.uploadFile(file);
      results.push(result);

      // Small delay between uploads
      if (files.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 UPLOAD SUMMARY');
    console.log(`${'='.repeat(60)}\n`);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}\n`);

    results.forEach((r, i) => {
      const status = r.success ? '✅' : '❌';
      const fileName = path.basename(r.filePath);
      console.log(`${status} ${i + 1}. ${fileName}`);
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      }
    });

    if (options.dryRun) {
      console.log('\n💡 This was a dry run. Remove --dry-run to actually upload to database.');
    } else {
      console.log('\n✅ Upload completed!');
    }

  } catch (error) {
    console.error('❌ Upload process failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await uploader?.prisma?.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BuyerGroupUploader };

