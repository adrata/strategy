#!/usr/bin/env node

/**
 * NOTARY EVERYDAY - Buyer Group Discovery
 * 
 * Runs buyer group discovery for Notary Everyday's target companies
 * with their specific configuration for a Notary Quality/Automation Platform:
 * 
 * 📋 PRODUCT: Notary Quality & Automation Platform
 *    - Remote Online Notarization (RON)
 *    - Document automation & compliance
 *    - Notary scheduling & management
 *    - Digital document processing
 * 
 * 🎯 TARGET INDUSTRIES:
 *    - Healthcare (patient consent forms, HIPAA documents, POA)
 *    - Estate Planning (wills, trusts, power of attorney)
 *    - Legal (mass tort, injury law - settlement documents)
 *    - Mortgage & Lending (loan closings, title documents)
 * 
 * 💰 DEAL SIZE: $15K-$50K annually (per location/department)
 * 
 * 👥 TARGET BUYER PROFILES:
 *    Decision Makers: COO, VP Operations, General Counsel, CFO, Managing Partner
 *    Champions: Director of Operations, Compliance Officer, Paralegal Manager
 *    Stakeholders: Loan processors, Title officers, Legal assistants
 */

// Load environment variables from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../../_future_now/find-buyer-group/index');
const { extractDomain, createUniqueId } = require('../../_future_now/find-buyer-group/utils');

class NotaryEverydayBuyerGroupRunner {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.workspaceId = null; // Will be set dynamically
    this.mainSellerId = options.mainSellerId || null;
    
    // NOTARY EVERYDAY CONFIGURATION
    // Tailored for a Notary Quality/Automation Platform
    this.config = {
      // Average deal size (platform subscription)
      dealSize: options.dealSize || 35000, // $35K average (range: $15K-$50K)
      dealSizeRange: { min: 15000, max: 50000 },
      
      // Custom product category for notary services
      productCategory: 'notary-automation',
      productName: 'Notary Quality & Automation Platform',
      productDescription: 'Comprehensive notary automation platform featuring Remote Online Notarization (RON), document workflow automation, compliance management, digital signature processing, mobile notary coordination, and audit trail management. Reduces closing time by 60%, eliminates compliance risks, and cuts notary costs by 40%.',
      
      // Pricing Information
      pricing: {
        startingPrice: 299, // $299/month starting price
        pricingModel: 'Subscription-based with per-transaction fees',
        averageDealSize: 25000, // $25k annual contract
        maxDealSize: 150000, // $150k enterprise contract
        typicalSalesCycle: 45 // 45 days
      },
      
      // Value Propositions
      valuePropositions: [
        'Reduce closing time by 60%',
        'Eliminate compliance risks',
        'Cut notary costs by 40%',
        'Streamline document workflow',
        'RON capability built-in',
        'Real-time audit trails',
        'Mobile-first design'
      ],
      
      // Primary Use Cases
      primaryUseCases: [
        'Remote Online Notarization (RON)',
        'Document workflow automation',
        'Compliance management',
        'Digital signature processing',
        'Mobile notary coordination',
        'Audit trail management'
      ],
      
      // Industry-specific filtering
      customFiltering: {
        departments: {
          // PRIMARY: Departments that directly manage notarization workflows
          primary: [
            // Operations & Document Processing
            'operations',
            'document processing',
            'document management',
            'records management',
            'administration',
            
            // Legal & Compliance
            'legal',
            'legal operations',
            'compliance',
            'risk management',
            'regulatory',
            
            // Finance & Lending (Mortgage companies)
            'loan processing',
            'mortgage operations',
            'title services',
            'escrow',
            'closing',
            'loan origination',
            
            // Healthcare-specific
            'patient services',
            'medical records',
            'health information',
            'patient access',
            'admissions',
            
            // Estate Planning Law Firms
            'estate planning',
            'trusts and estates',
            'probate',
            'paralegal'
          ],
          
          // SECONDARY: Departments that influence or benefit from notary solutions
          secondary: [
            'executive',
            'general counsel',
            'office management',
            'business operations',
            'client services',
            'customer service',
            'quality assurance',
            'contract management',
            'vendor management',
            'procurement',
            'information technology',
            'it',
            'digital transformation'
          ],
          
          // EXCLUDE: Departments unlikely to be involved in notary decisions
          exclude: [
            'engineering',
            'software development',
            'product development',
            'research',
            'marketing',
            'brand',
            'communications',
            'pr',
            'public relations',
            'investor relations',
            'human resources',
            'talent acquisition',
            'recruiting',
            'learning and development',
            'training'
          ]
        },
        
        titles: {
          // PRIMARY: Decision makers and direct users of notary platforms
          primary: [
            // C-Suite & Executive
            'coo',
            'chief operating officer',
            'cfo',
            'chief financial officer',
            'general counsel',
            'chief legal officer',
            'chief compliance officer',
            'cco',
            'managing partner',
            'partner',
            'owner',
            'president',
            
            // VP Level
            'vp operations',
            'vice president operations',
            'vp legal',
            'vice president legal',
            'vp compliance',
            'vp loan operations',
            'vp mortgage operations',
            'vp closing',
            'vp title',
            
            // Director Level
            'director of operations',
            'director operations',
            'director legal operations',
            'director compliance',
            'director loan operations',
            'director mortgage operations',
            'director closing operations',
            'director document management',
            'director records',
            'director patient services',
            'director health information',
            
            // Manager Level (often champions)
            'operations manager',
            'office manager',
            'compliance manager',
            'compliance officer',
            'legal operations manager',
            'paralegal manager',
            'document processing manager',
            'records manager',
            'loan processing manager',
            'closing manager',
            'escrow manager',
            'title manager',
            'branch manager',
            
            // Healthcare-specific
            'director patient access',
            'director admissions',
            'patient services manager',
            'medical records director',
            'him director',
            'health information director'
          ],
          
          // SECONDARY: Influencers and end users
          secondary: [
            // Senior staff
            'senior paralegal',
            'senior loan processor',
            'senior closer',
            'senior escrow officer',
            'senior title officer',
            'lead paralegal',
            'lead closer',
            
            // Staff level (end users who influence decisions)
            'paralegal',
            'legal assistant',
            'loan processor',
            'loan closer',
            'escrow officer',
            'title officer',
            'closing coordinator',
            'document specialist',
            'records specialist',
            
            // IT/Tech (implementation support)
            'it manager',
            'it director',
            'systems administrator',
            'business analyst'
          ],
          
          // EXCLUDE: Titles unlikely to be involved
          exclude: [
            'software engineer',
            'developer',
            'programmer',
            'data scientist',
            'marketing manager',
            'marketing director',
            'sales representative',
            'sales manager',
            'account executive',
            'recruiter',
            'hr manager',
            'hr director'
          ]
        },
        
        // Industry-specific keywords to boost relevance
        industryKeywords: {
          healthcare: ['hipaa', 'patient', 'medical', 'health', 'clinical', 'care', 'hospital', 'hospice'],
          estatePlanning: ['estate', 'trust', 'probate', 'will', 'power of attorney', 'poa', 'elder law'],
          legal: ['litigation', 'settlement', 'tort', 'injury', 'plaintiff', 'case management'],
          mortgage: ['loan', 'mortgage', 'title', 'escrow', 'closing', 'origination', 'lender', 'underwriting']
        }
      },
      
      // Buyer group sizing for SMB/Mid-market notary deals
      buyerGroupSizing: {
        min: 4,
        max: 8,
        ideal: 6
      },
      
      // Role priorities for notary platform sales
      rolePriorities: {
        decision: 10,     // Critical - need COO/CFO/Managing Partner
        champion: 9,      // Very important - Operations/Compliance managers
        stakeholder: 7,   // Important - Paralegals, loan processors who will use it
        blocker: 5,       // Moderate - IT/Procurement may need to approve
        introducer: 4     // Nice to have - but less critical for notary sales
      },
      
      // Focus on USA (notary laws are state-specific)
      usaOnly: true
    };
  }

  /**
   * Initialize with workspace and seller info
   */
  async initialize() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    // Find workspace
    const workspace = await this.prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    this.workspaceId = workspace.id;
    console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);
    
    // Find Noel as main seller
    const noel = await this.prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });
    
    if (noel) {
      this.mainSellerId = noel.id;
      console.log(`✅ Main Seller: ${noel.name} (${noel.id})`);
    }
    
    return { workspace, noel };
  }

  /**
   * Get all target companies for Noel (skip those with existing buyer groups)
   */
  async getTargetCompanies() {
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        mainSellerId: this.mainSellerId,
        deletedAt: null,
        // Skip companies that already have buyer group members
        people: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        city: true,
        state: true,
        employeeCount: true,
        revenue: true,
        notes: true
      },
      orderBy: { industry: 'asc' }
    });
    
    console.log(`📊 Found ${companies.length} companies without buyer groups`);
    return companies;
  }

  /**
   * Run buyer group discovery for a single company
   */
  async runForCompany(company, options = {}) {
    console.log('\n' + '='.repeat(70));
    console.log(`🏢 ${company.name}`);
    console.log(`   📍 ${company.city || 'N/A'}, ${company.state || 'N/A'}`);
    console.log(`   🏷️  ${company.industry || 'Unknown Industry'}`);
    console.log(`   🌐 ${company.website || 'No website'}`);
    console.log('='.repeat(70));

    try {
      // Adjust configuration based on industry
      const adjustedConfig = this.adjustConfigForIndustry(company.industry);
      
      // Show industry-specific configuration if different from base
      if (adjustedConfig.productDescription && adjustedConfig.productDescription !== this.config.productDescription) {
        console.log(`\n📋 Industry-Specific Product Configuration:`);
        console.log(`   Product: ${adjustedConfig.productName || this.config.productName}`);
        console.log(`   Description: ${adjustedConfig.productDescription.substring(0, 120)}...`);
        console.log(`   Deal Size: $${adjustedConfig.dealSize.toLocaleString()}`);
        if (adjustedConfig.valuePropositions && adjustedConfig.valuePropositions.length > 0) {
          console.log(`   Key Value Props: ${adjustedConfig.valuePropositions.slice(0, 2).join(', ')}`);
        }
        console.log('');
      }
      
      // Initialize pipeline with industry-specific product details
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: this.workspaceId,
        mainSellerId: this.mainSellerId,
        dealSize: adjustedConfig.dealSize,
        productCategory: this.config.productCategory,
        productName: adjustedConfig.productName || this.config.productName,
        productDescription: adjustedConfig.productDescription || this.config.productDescription,
        pricing: adjustedConfig.pricing || this.config.pricing,
        valuePropositions: adjustedConfig.valuePropositions || this.config.valuePropositions,
        primaryUseCases: adjustedConfig.primaryUseCases || this.config.primaryUseCases,
        customFiltering: adjustedConfig.customFiltering,
        buyerGroupSize: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities,
        usaOnly: this.config.usaOnly,
        prisma: this.prisma,
        skipDatabase: options.skipDatabase || false
      });

      // Run discovery
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('⚠️  No buyer group members found');
        return { company, success: false, buyerGroup: [] };
      }

      console.log(`\n✅ Found ${result.buyerGroup.length} buyer group members:`);
      
      // Display buyer group
      result.buyerGroup.forEach((member, i) => {
        const role = member.buyerGroupRole || 'stakeholder';
        const roleEmoji = {
          decision: '👔',
          champion: '⭐',
          stakeholder: '👤',
          blocker: '🚧',
          introducer: '🤝'
        }[role] || '👤';
        
        console.log(`   ${i + 1}. ${roleEmoji} ${member.name} - ${member.title}`);
        if (member.email) console.log(`      📧 ${member.email}`);
      });

      return { company, success: true, buyerGroup: result.buyerGroup, intelligence: result.intelligence };

    } catch (error) {
      console.error(`❌ Error for ${company.name}:`, error.message);
      return { company, success: false, error: error.message, buyerGroup: [] };
    }
  }

  /**
   * Adjust configuration based on company industry
   */
  adjustConfigForIndustry(industry) {
    const config = JSON.parse(JSON.stringify(this.config)); // Deep clone
    const industryLower = (industry || '').toLowerCase();
    
    // Industry-specific adjustments
    if (industryLower.includes('healthcare') || industryLower.includes('hospice')) {
      // Healthcare: Focus on patient services, compliance, HIM
      config.dealSize = 40000; // Higher deal size for healthcare
      config.productDescription = 'HIPAA-compliant notary automation platform for healthcare organizations. Streamlines patient consent forms, medical power of attorney, advance directives, and other critical healthcare document notarization. Ensures compliance with healthcare regulations while reducing administrative burden.';
      config.valuePropositions = [
        'HIPAA-compliant document notarization',
        'Reduce patient consent processing time by 50%',
        'Eliminate compliance risks with audit trails',
        'Mobile notary for patient bedside services',
        'Secure document storage and retrieval',
        'Integration with EMR systems'
      ];
      config.primaryUseCases = [
        'Patient consent form notarization',
        'Medical power of attorney documents',
        'Advance directive processing',
        'HIPAA authorization forms',
        'Patient admission documents',
        'Clinical trial consent forms'
      ];
      config.customFiltering.departments.primary = [
        ...config.customFiltering.departments.primary,
        'patient services',
        'health information management',
        'him',
        'medical records',
        'clinical operations',
        'nursing administration'
      ];
      config.customFiltering.titles.primary = [
        ...config.customFiltering.titles.primary,
        'chief nursing officer',
        'cno',
        'director of nursing',
        'don',
        'patient access director',
        'registration manager'
      ];
    }
    
    if (industryLower.includes('estate planning') || industryLower.includes('trust')) {
      // Estate Planning: Focus on managing partners, paralegals
      config.dealSize = 25000; // Smaller law firms
      config.productDescription = 'Specialized notary automation platform for estate planning law firms. Streamlines will execution, trust document notarization, power of attorney processing, and probate document management. Reduces client wait times and ensures compliance with state-specific notary requirements.';
      config.valuePropositions = [
        'Reduce will execution time by 60%',
        'Remote notarization for elderly clients',
        'State-specific compliance automation',
        'Secure document storage for estate documents',
        'Client portal for document access',
        'Reduce paralegal notarization workload by 50%'
      ];
      config.primaryUseCases = [
        'Will and testament notarization',
        'Trust document execution',
        'Power of attorney processing',
        'Probate document notarization',
        'Elder law document services',
        'Estate planning client meetings'
      ];
      config.customFiltering.departments.primary = [
        ...config.customFiltering.departments.primary,
        'estate planning',
        'trusts and estates',
        'probate',
        'elder law'
      ];
      config.customFiltering.titles.primary = [
        ...config.customFiltering.titles.primary,
        'estate planning attorney',
        'trust officer',
        'probate coordinator'
      ];
    }
    
    if (industryLower.includes('legal') && !industryLower.includes('estate')) {
      // Mass Tort/Injury Law: Focus on intake, case management
      config.dealSize = 35000;
      config.productDescription = 'Notary automation platform for legal firms handling mass tort and injury cases. Streamlines settlement document notarization, client intake forms, case management documents, and court filing requirements. Reduces administrative overhead and ensures timely document processing.';
      config.valuePropositions = [
        'Accelerate settlement document processing by 50%',
        'Mobile notary for client home visits',
        'Reduce case management administrative time',
        'Compliance with court filing requirements',
        'Secure client document management',
        'Integration with case management systems'
      ];
      config.primaryUseCases = [
        'Settlement document notarization',
        'Client intake form processing',
        'Case management document execution',
        'Court filing document preparation',
        'Client meeting notarization services',
        'Bulk document processing for class actions'
      ];
      config.customFiltering.departments.primary = [
        ...config.customFiltering.departments.primary,
        'intake',
        'case management',
        'client relations',
        'settlement'
      ];
      config.customFiltering.titles.primary = [
        ...config.customFiltering.titles.primary,
        'intake manager',
        'case manager',
        'client services director',
        'settlement coordinator'
      ];
    }
    
    if (industryLower.includes('mortgage') || industryLower.includes('lending') || industryLower.includes('auto lending')) {
      // Mortgage/Auto Lending: Focus on closing, title, loan ops
      config.dealSize = 50000; // Higher volume, higher deal size
      config.productDescription = 'Notary automation platform for mortgage and auto lending companies. Streamlines loan closing document notarization, title document processing, and post-closing workflows. Reduces closing time, eliminates compliance risks, and cuts notary costs significantly.';
      config.valuePropositions = [
        'Reduce loan closing time by 60%',
        'Eliminate compliance risks with automated audit trails',
        'Cut notary costs by 40%',
        'Remote online notarization (RON) for faster closings',
        'Integration with loan origination systems',
        'Real-time document tracking and status updates'
      ];
      config.primaryUseCases = [
        'Loan closing document notarization',
        'Title document processing',
        'Post-closing document management',
        'Remote online notarization (RON)',
        'Mobile notary coordination for closings',
        'Bulk document processing for high-volume lenders'
      ];
      config.customFiltering.departments.primary = [
        ...config.customFiltering.departments.primary,
        'closing',
        'post-closing',
        'funding',
        'title',
        'escrow',
        'loan processing',
        'loan operations',
        'auto finance',
        'vehicle finance'
      ];
      config.customFiltering.titles.primary = [
        ...config.customFiltering.titles.primary,
        'chief production officer',
        'branch manager',
        'closing coordinator',
        'funding manager',
        'post-closing manager',
        'loan operations manager',
        'auto finance manager',
        'vehicle finance director'
      ];
    }

    if (industryLower.includes('insurance claims') || industryLower.includes('insurance')) {
      // Insurance Claims: Focus on claims operations, compliance, fraud prevention
      config.dealSize = 45000;
      config.productDescription = 'Notary automation platform for insurance claims processing. Streamlines claim document notarization, fraud investigation document processing, settlement agreement execution, and compliance documentation. Reduces claims processing time and ensures regulatory compliance.';
      config.valuePropositions = [
        'Accelerate claims processing by 45%',
        'Fraud prevention through secure document verification',
        'Compliance with insurance regulations',
        'Reduce claims adjuster administrative time',
        'Secure document storage for claims files',
        'Integration with claims management systems'
      ];
      config.primaryUseCases = [
        'Claim document notarization',
        'Settlement agreement execution',
        'Fraud investigation document processing',
        'Witness statement notarization',
        'Medical record verification',
        'Claims compliance documentation'
      ];
      config.customFiltering.departments.primary = [
        ...config.customFiltering.departments.primary,
        'claims',
        'claims operations',
        'claims processing',
        'claims management',
        'fraud prevention',
        'investigation',
        'adjusting',
        'underwriting'
      ];
      config.customFiltering.titles.primary = [
        ...config.customFiltering.titles.primary,
        'claims director',
        'claims manager',
        'chief claims officer',
        'fraud prevention manager',
        'investigation manager',
        'claims operations director',
        'adjuster manager'
      ];
    }

    if (industryLower.includes('credit union')) {
      // Credit Union: Focus on lending operations, member services, compliance
      config.dealSize = 40000;
      config.productDescription = 'Notary automation platform for credit unions. Streamlines member loan document notarization, account opening documents, estate planning services, and compliance documentation. Enhances member experience while reducing operational costs and ensuring regulatory compliance.';
      config.valuePropositions = [
        'Improve member experience with faster document processing',
        'Reduce loan processing time by 50%',
        'Cut operational costs by 35%',
        'Compliance with NCUA regulations',
        'Member-friendly remote notarization options',
        'Integration with core banking systems'
      ];
      config.primaryUseCases = [
        'Member loan document notarization',
        'Account opening document processing',
        'Estate planning document services',
        'Member service document notarization',
        'Compliance documentation management',
        'Bulk document processing for member services'
      ];
      config.customFiltering.departments.primary = [
        ...config.customFiltering.departments.primary,
        'lending',
        'loan operations',
        'member services',
        'consumer lending',
        'auto lending',
        'mortgage lending',
        'compliance',
        'operations'
      ];
      config.customFiltering.titles.primary = [
        ...config.customFiltering.titles.primary,
        'chief lending officer',
        'lending director',
        'loan operations manager',
        'member services director',
        'consumer lending manager',
        'auto lending manager',
        'compliance officer'
      ];
    }
    
    return config;
  }

  /**
   * Run buyer group discovery for all Noel's companies
   */
  async runAll(options = {}) {
    console.log('\n' + '🚀 NOTARY EVERYDAY - BUYER GROUP DISCOVERY');
    console.log('━'.repeat(70));
    console.log(`📋 Product: ${this.config.productName}`);
    if (this.config.productDescription) {
      console.log(`📝 Description: ${this.config.productDescription.substring(0, 100)}...`);
    }
    console.log(`💰 Deal Size: $${this.config.dealSize.toLocaleString()} average (Range: $${this.config.dealSizeRange?.min?.toLocaleString() || '15K'} - $${this.config.dealSizeRange?.max?.toLocaleString() || '50K'})`);
    if (this.config.pricing) {
      console.log(`💵 Starting Price: $${this.config.pricing.startingPrice}/month`);
      console.log(`📊 Pricing Model: ${this.config.pricing.pricingModel}`);
    }
    console.log(`🎯 Category: ${this.config.productCategory}`);
    if (this.config.valuePropositions && this.config.valuePropositions.length > 0) {
      console.log(`✨ Key Value Props: ${this.config.valuePropositions.slice(0, 3).join(', ')}`);
    }
    console.log(`🇺🇸 USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('━'.repeat(70));

    await this.initialize();

    const companies = await this.getTargetCompanies();
    console.log(`\n📊 Found ${companies.length} target companies for Noel\n`);

    const results = {
      total: companies.length,
      processed: 0,
      successful: 0,
      failed: 0,
      totalBuyerGroupMembers: 0,
      byIndustry: {},
      companies: []
    };

    // Process each company
    const limit = options.limit || companies.length;
    const startIndex = options.startIndex || 0;
    const companiesToProcess = companies.slice(startIndex, startIndex + limit);

    for (const company of companiesToProcess) {
      const result = await this.runForCompany(company, options);
      results.processed++;
      
      if (result.success) {
        results.successful++;
        results.totalBuyerGroupMembers += result.buyerGroup.length;
      } else {
        results.failed++;
      }
      
      // Track by industry
      const industry = company.industry || 'Unknown';
      if (!results.byIndustry[industry]) {
        results.byIndustry[industry] = { count: 0, buyerGroupMembers: 0 };
      }
      results.byIndustry[industry].count++;
      results.byIndustry[industry].buyerGroupMembers += result.buyerGroup.length;
      
      results.companies.push(result);

      // Add delay between companies to avoid rate limits
      if (companiesToProcess.indexOf(company) < companiesToProcess.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next company...');
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Final summary
    this.printSummary(results);

    return results;
  }

  /**
   * Print summary of results
   */
  printSummary(results) {
    console.log('\n' + '━'.repeat(70));
    console.log('📊 BUYER GROUP DISCOVERY SUMMARY');
    console.log('━'.repeat(70));
    console.log(`\n✅ Processed: ${results.processed} of ${results.total} companies`);
    console.log(`   ✓ Successful: ${results.successful}`);
    console.log(`   ✗ Failed: ${results.failed}`);
    console.log(`\n👥 Total Buyer Group Members Found: ${results.totalBuyerGroupMembers}`);
    console.log(`   Average per company: ${(results.totalBuyerGroupMembers / results.successful || 0).toFixed(1)}`);
    
    console.log('\n📁 BY INDUSTRY:');
    Object.entries(results.byIndustry).forEach(([industry, data]) => {
      console.log(`   ${industry}: ${data.count} companies, ${data.buyerGroupMembers} buyer group members`);
    });
    
    // Top performing companies
    const topCompanies = results.companies
      .filter(r => r.success)
      .sort((a, b) => b.buyerGroup.length - a.buyerGroup.length)
      .slice(0, 5);
    
    if (topCompanies.length > 0) {
      console.log('\n🏆 TOP COMPANIES BY BUYER GROUP SIZE:');
      topCompanies.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.company.name} - ${r.buyerGroup.length} members`);
      });
    }
    
    console.log('\n━'.repeat(70));
    console.log('🎉 Buyer Group Discovery Complete!');
    console.log('━'.repeat(70));
  }

  /**
   * Cleanup
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
    startIndex: args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1]) : 0,
    skipDatabase: args.includes('--skip-database'),
    company: args.includes('--company') ? args[args.indexOf('--company') + 1] : null
  };

  console.log('🏁 Starting Notary Everyday Buyer Group Discovery...\n');

  const runner = new NotaryEverydayBuyerGroupRunner();

  try {
    if (options.company) {
      // Run for specific company
      await runner.initialize();
      const companies = await runner.getTargetCompanies();
      const company = companies.find(c => 
        c.name.toLowerCase().includes(options.company.toLowerCase())
      );
      
      if (!company) {
        console.error(`❌ Company not found: ${options.company}`);
        process.exit(1);
      }
      
      await runner.runForCompany(company, options);
    } else {
      // Run for all companies
      await runner.runAll(options);
    }
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

// Export for programmatic use
module.exports = { NotaryEverydayBuyerGroupRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

