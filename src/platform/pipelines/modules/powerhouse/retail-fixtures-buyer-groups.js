#!/usr/bin/env node

/**
 * 🎯 RETAIL FIXTURES BUYER GROUP DISCOVERY
 * 
 * Specialized buyer group intelligence for Dano's retail fixtures business:
 * - Products: Store fixtures, millwork, coolers/freezers, store resets
 * - Decision Process: Capital equipment purchases ($100K-$10M+)
 * - Key Roles: Operations (champions), Merchandising (specs), Procurement (vendors), Finance (budget)
 * - NOT NEEDED: IT/Technology (physical products, not software)
 */

const { PrismaClient } = require('@prisma/client');
const { ExecutiveResearch } = require('../modules/ExecutiveResearch');
const { CoreSignalIntelligence } = require('../modules/CoreSignalIntelligence');
const { BuyerGroupIdentifier } = require('../../src/platform/services/buyer-group/buyer-group-identifier');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class RetailFixturesBuyerGroupDiscovery {
    constructor() {
        this.executiveResearch = new ExecutiveResearch();
        this.coreSignal = new CoreSignalIntelligence();
        this.buyerGroupIdentifier = new BuyerGroupIdentifier();
        
        this.danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
        this.danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';
        
        this.stats = {
            accountsProcessed: 0,
            buyerGroupsCompleted: 0,
            contactsDiscovered: 0,
            executivesFound: 0,
            rolesClassified: 0,
            errors: 0
        };
        
        // Retail Fixtures Buyer Group Model
        this.retailFixturesModel = {
            // Decision Makers: Budget authority for capital equipment
            decisionMakers: {
                titles: [
                    'president', 'ceo', 'chief executive officer', 'owner', 'founder',
                    'vice president', 'vp', 'senior vice president', 'svp',
                    'regional president', 'division president', 'executive vice president',
                    'general manager', 'regional manager', 'district manager'
                ],
                departments: ['executive', 'leadership', 'management'],
                authority: 'budget_approval',
                dealSize: '$100K-$10M+',
                target: '1-3 per account'
            },
            
            // Champions: Operations people who use the fixtures daily
            champions: {
                titles: [
                    'director of operations', 'operations director', 'store operations director',
                    'director of store development', 'store development manager',
                    'real estate director', 'construction manager', 'facilities manager',
                    'store planning director', 'retail development manager'
                ],
                departments: ['operations', 'store development', 'real estate', 'facilities'],
                impact: 'daily_operations',
                influence: 'high',
                target: '2-3 per account'
            },
            
            // Operational Stakeholders: Merchandising who specify fixture requirements
            operationalStakeholders: {
                titles: [
                    'category manager', 'senior category manager', 'merchandising manager',
                    'merchandising director', 'visual merchandising manager',
                    'store planning manager', 'planogram manager', 'retail design manager',
                    'space planning manager', 'display manager'
                ],
                departments: ['merchandising', 'category management', 'visual merchandising', 'store planning'],
                impact: 'specifications',
                influence: 'medium',
                target: '1-2 per account'
            },
            
            // Financial Stakeholders: Capital expenditure approval
            financialStakeholders: {
                titles: [
                    'cfo', 'chief financial officer', 'finance director', 'controller',
                    'treasurer', 'vp finance', 'vice president finance',
                    'capital planning manager', 'budget manager'
                ],
                departments: ['finance', 'accounting', 'treasury'],
                authority: 'capital_approval',
                influence: 'high',
                target: '1-2 per account'
            },
            
            // Procurement Stakeholders: Vendor selection and contracts
            procurementStakeholders: {
                titles: [
                    'procurement director', 'purchasing manager', 'buyer', 'senior buyer',
                    'vendor relations manager', 'supplier relations manager',
                    'sourcing manager', 'procurement manager', 'purchasing director'
                ],
                departments: ['procurement', 'purchasing', 'sourcing', 'vendor relations'],
                authority: 'vendor_selection',
                influence: 'medium',
                target: '1-2 per account'
            },
            
            // Blockers: Can delay or prevent decisions
            blockers: {
                titles: [
                    'legal counsel', 'legal director', 'compliance manager',
                    'risk manager', 'contract manager', 'quality assurance manager'
                ],
                departments: ['legal', 'compliance', 'risk management', 'quality'],
                impact: 'approval_gates',
                influence: 'blocking',
                target: '1 per account'
            },
            
            // Introducers: Can provide access to decision makers
            introducers: {
                titles: [
                    'account manager', 'business development manager', 'sales manager',
                    'regional manager', 'territory manager', 'relationship manager',
                    'store manager', 'district manager'
                ],
                departments: ['sales', 'business development', 'account management'],
                access: 'relationship_building',
                influence: 'access',
                target: '2-3 per account'
            }
        };
    }

    /**
     * 🚀 MAIN BUYER GROUP DISCOVERY
     */
    async discoverBuyerGroups(options = {}) {
        console.log('🎯 RETAIL FIXTURES BUYER GROUP DISCOVERY');
        console.log('========================================');
        console.log('Business: Store fixtures, millwork, coolers, resets');
        console.log('Focus: Operations, Merchandising, Procurement, Finance\n');

        try {
            // PHASE 1: Load accounts needing buyer group completion
            console.log('📊 PHASE 1: Account Analysis');
            const targetAccounts = await this.loadTargetAccounts();
            
            // PHASE 2: Discover missing buyer group members
            console.log('\n🔍 PHASE 2: Buyer Group Discovery');
            await this.discoverMissingBuyerGroupMembers(targetAccounts, options);
            
            // PHASE 3: Classify existing contacts
            console.log('\n🏷️ PHASE 3: Role Classification');
            await this.classifyExistingContacts();
            
            // PHASE 4: Generate buyer group reports
            console.log('\n📊 PHASE 4: Buyer Group Analysis');
            await this.generateBuyerGroupReports();
            
            this.printFinalStats();
            
        } catch (error) {
            console.error('❌ Buyer group discovery failed:', error);
            throw error;
        } finally {
            await prisma.$disconnect();
        }
    }

    /**
     * 📊 LOAD TARGET ACCOUNTS
     */
    async loadTargetAccounts() {
        console.log('   Loading accounts needing buyer group completion...');
        
        const accounts = await prisma.accounts.findMany({
            where: { 
                workspaceId: this.danoWorkspaceId, 
                assignedUserId: this.danoUserId,
                deletedAt: null
            },
            include: {
                contacts: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        fullName: true,
                        jobTitle: true,
                        department: true,
                        workEmail: true,
                        phone: true,
                        tags: true
                    }
                }
            }
        });

        // Analyze current buyer group completeness
        const accountsWithAnalysis = accounts.map(account => {
            const analysis = this.analyzeBuyerGroupCompleteness(account);
            return { ...account, buyerGroupAnalysis: analysis };
        });

        // Sort by priority (accounts with some contacts but incomplete buyer groups)
        const prioritizedAccounts = accountsWithAnalysis
            .filter(account => account.contacts.length > 0 && !account.buyerGroupAnalysis.isComplete)
            .sort((a, b) => b.contacts.length - a.contacts.length);

        console.log(`   ✅ Loaded ${accounts.length} accounts:`);
        console.log(`      Complete buyer groups: ${accountsWithAnalysis.filter(a => a.buyerGroupAnalysis.isComplete).length}`);
        console.log(`      Needs expansion: ${prioritizedAccounts.length}`);
        console.log(`      No contacts: ${accounts.filter(a => a.contacts.length === 0).length}`);

        return prioritizedAccounts;
    }

    /**
     * 🔍 ANALYZE BUYER GROUP COMPLETENESS
     */
    analyzeBuyerGroupCompleteness(account) {
        const contacts = account.contacts;
        const roles = {
            decisionMakers: [],
            champions: [],
            operationalStakeholders: [],
            financialStakeholders: [],
            procurementStakeholders: [],
            blockers: [],
            introducers: []
        };

        // Classify existing contacts
        contacts.forEach(contact => {
            const role = this.classifyContactRole(contact.jobTitle);
            if (role !== 'unknown' && roles[role]) {
                roles[role].push(contact);
            }
        });

        const analysis = {
            totalContacts: contacts.length,
            roles: roles,
            hasDecisionMaker: roles.decisionMakers.length > 0,
            hasChampion: roles.champions.length > 0,
            hasOperational: roles.operationalStakeholders.length > 0,
            hasFinancial: roles.financialStakeholders.length > 0,
            hasProcurement: roles.procurementStakeholders.length > 0,
            missingRoles: [],
            isComplete: false,
            completeness: 0
        };

        // Identify missing roles
        if (!analysis.hasDecisionMaker) analysis.missingRoles.push('Decision Maker');
        if (!analysis.hasChampion) analysis.missingRoles.push('Champion (Operations)');
        if (!analysis.hasOperational) analysis.missingRoles.push('Operational (Merchandising)');
        if (!analysis.hasFinancial) analysis.missingRoles.push('Financial (CFO)');
        if (!analysis.hasProcurement) analysis.missingRoles.push('Procurement');

        // Calculate completeness
        const requiredRoles = 5; // Decision, Champion, Operational, Financial, Procurement
        const presentRoles = [
            analysis.hasDecisionMaker,
            analysis.hasChampion,
            analysis.hasOperational,
            analysis.hasFinancial,
            analysis.hasProcurement
        ].filter(Boolean).length;

        analysis.completeness = Math.round((presentRoles / requiredRoles) * 100);
        analysis.isComplete = analysis.completeness >= 80; // 4 out of 5 roles minimum

        return analysis;
    }

    /**
     * 🏷️ CLASSIFY CONTACT ROLE FOR RETAIL FIXTURES
     */
    classifyContactRole(jobTitle) {
        if (!jobTitle) return 'unknown';
        
        const title = jobTitle.toLowerCase();
        
        // Check each role category
        for (const [roleType, config] of Object.entries(this.retailFixturesModel)) {
            for (const titlePattern of config.titles) {
                if (title.includes(titlePattern)) {
                    return roleType;
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * 🔍 DISCOVER MISSING BUYER GROUP MEMBERS
     */
    async discoverMissingBuyerGroupMembers(targetAccounts, options) {
        console.log(`   Discovering missing buyer group members for ${targetAccounts.length} accounts...`);
        
        const maxAccounts = options.maxAccounts || Math.min(targetAccounts.length, 20);
        
        for (let i = 0; i < maxAccounts; i++) {
            const account = targetAccounts[i];
            console.log(`\n   🏢 ${i+1}/${maxAccounts}: ${account.name} (${account.vertical})`);
            console.log(`      Current: ${account.contacts.length} contacts, ${account.buyerGroupAnalysis.completeness}% complete`);
            console.log(`      Missing: ${account.buyerGroupAnalysis.missingRoles.join(', ')}`);
            
            try {
                await this.discoverMissingRolesForAccount(account);
                this.stats.accountsProcessed++;
                
                if (account.buyerGroupAnalysis.completeness >= 80) {
                    this.stats.buyerGroupsCompleted++;
                }
                
            } catch (error) {
                console.log(`      ❌ Failed to discover for ${account.name}: ${error.message}`);
                this.stats.errors++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log(`   ✅ Processed ${this.stats.accountsProcessed} accounts`);
    }

    /**
     * 🔍 DISCOVER MISSING ROLES FOR ACCOUNT
     */
    async discoverMissingRolesForAccount(account) {
        const missingRoles = account.buyerGroupAnalysis.missingRoles;
        
        for (const missingRole of missingRoles.slice(0, 2)) { // Limit to 2 roles per account for cost control
            const targetTitles = this.getTargetTitlesForRole(missingRole);
            
            console.log(`      🎯 Searching for ${missingRole}: ${targetTitles.slice(0, 2).join(', ')}`);
            
            try {
                const discoveredContacts = await this.searchForRoleAtCompany(
                    account.name,
                    account.website,
                    targetTitles
                );
                
                if (discoveredContacts && discoveredContacts.length > 0) {
                    for (const contact of discoveredContacts.slice(0, 2)) { // Max 2 per role
                        await this.addDiscoveredContactToAccount(contact, account.id, missingRole);
                        this.stats.contactsDiscovered++;
                    }
                    console.log(`         ✅ Found ${discoveredContacts.length} ${missingRole} contacts`);
                } else {
                    console.log(`         ⚠️ No ${missingRole} contacts found`);
                }
                
            } catch (error) {
                console.log(`         ❌ Search failed for ${missingRole}: ${error.message}`);
            }
        }
    }

    /**
     * 🎯 GET TARGET TITLES FOR ROLE
     */
    getTargetTitlesForRole(roleName) {
        const roleMap = {
            'Decision Maker': this.retailFixturesModel.decisionMakers.titles,
            'Champion (Operations)': this.retailFixturesModel.champions.titles,
            'Operational (Merchandising)': this.retailFixturesModel.operationalStakeholders.titles,
            'Financial (CFO)': this.retailFixturesModel.financialStakeholders.titles,
            'Procurement': this.retailFixturesModel.procurementStakeholders.titles
        };
        
        return roleMap[roleName] || [];
    }

    /**
     * 🔍 SEARCH FOR ROLE AT COMPANY
     */
    async searchForRoleAtCompany(companyName, website, targetTitles) {
        try {
            // Use CoreSignal to find people with specific titles
            const searchResults = await this.coreSignal.searchPeopleByCompanyAndRole(
                companyName,
                targetTitles,
                { limit: 5 }
            );
            
            return searchResults;
            
        } catch (error) {
            console.log(`         ⚠️ CoreSignal search failed, trying executive research...`);
            
            // Fallback to executive research
            try {
                const executiveResults = await this.executiveResearch.findExecutivesByRole(
                    companyName,
                    website,
                    targetTitles
                );
                
                return executiveResults;
                
            } catch (fallbackError) {
                console.log(`         ❌ All search methods failed`);
                return [];
            }
        }
    }

    /**
     * 💾 ADD DISCOVERED CONTACT TO ACCOUNT
     */
    async addDiscoveredContactToAccount(contactData, accountId, role) {
        try {
            // Check if contact already exists
            const existingContact = await prisma.contacts.findFirst({
                where: {
                    workspaceId: this.danoWorkspaceId,
                    workEmail: contactData.email,
                    accountId: accountId
                }
            });

            if (existingContact) {
                // Update existing contact with role classification
                await prisma.contacts.update({
                    where: { id: existingContact.id },
                    data: {
                        tags: { push: `buyer-group-${role.toLowerCase().replace(/[^a-z]/g, '')}` }
                    }
                });
                return existingContact;
            }

            // Create new contact
            const newContact = await prisma.contacts.create({
                data: {
                    workspaceId: this.danoWorkspaceId,
                    assignedUserId: this.danoUserId,
                    accountId: accountId,
                    firstName: contactData.firstName || '',
                    lastName: contactData.lastName || '',
                    fullName: contactData.fullName || contactData.name,
                    workEmail: contactData.email,
                    phone: contactData.phone,
                    jobTitle: contactData.title,
                    department: contactData.department,
                    status: 'lead', // New discovery = lead status
                    tags: [
                        'discovered-contact',
                        `buyer-group-${role.toLowerCase().replace(/[^a-z]/g, '')}`,
                        'retail-fixtures-buyer-group'
                    ]
                }
            });

            return newContact;
            
        } catch (error) {
            console.log(`         ❌ Failed to add contact: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🏷️ CLASSIFY EXISTING CONTACTS
     */
    async classifyExistingContacts() {
        console.log('   Classifying existing contacts for buyer group roles...');
        
        const contacts = await prisma.contacts.findMany({
            where: { 
                workspaceId: this.danoWorkspaceId, 
                assignedUserId: this.danoUserId,
                deletedAt: null,
                jobTitle: { not: null }
            },
            select: { 
                id: true, 
                fullName: true, 
                jobTitle: true,
                tags: true,
                account: { select: { name: true, vertical: true } }
            }
        });

        let classified = 0;
        for (const contact of contacts) {
            const role = this.classifyContactRole(contact.jobTitle);
            
            if (role !== 'unknown') {
                const roleTag = `buyer-group-${role.replace('Stakeholders', '').toLowerCase()}`;
                
                // Only add tag if not already present
                if (!contact.tags.includes(roleTag)) {
                    await prisma.contacts.update({
                        where: { id: contact.id },
                        data: {
                            tags: { push: roleTag }
                        }
                    });
                    classified++;
                }
            }
        }

        this.stats.rolesClassified = classified;
        console.log(`   ✅ Classified ${classified} existing contacts`);
    }

    /**
     * 🏷️ CLASSIFY CONTACT ROLE
     */
    classifyContactRole(jobTitle) {
        if (!jobTitle) return 'unknown';
        
        const title = jobTitle.toLowerCase();
        
        // Check each role category in priority order
        for (const [roleType, config] of Object.entries(this.retailFixturesModel)) {
            for (const titlePattern of config.titles) {
                if (title.includes(titlePattern)) {
                    return roleType;
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * 📊 GENERATE BUYER GROUP REPORTS
     */
    async generateBuyerGroupReports() {
        const outputDir = path.join(__dirname, '../outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate comprehensive buyer group analysis
        const accounts = await prisma.accounts.findMany({
            where: { 
                workspaceId: this.danoWorkspaceId, 
                assignedUserId: this.danoUserId,
                deletedAt: null
            },
            include: {
                contacts: {
                    where: { deletedAt: null },
                    select: {
                        fullName: true,
                        jobTitle: true,
                        department: true,
                        workEmail: true,
                        phone: true,
                        tags: true
                    }
                }
            }
        });

        const buyerGroupReport = {
            timestamp: new Date().toISOString(),
            business: 'Retail Fixtures (Store equipment, millwork, coolers)',
            summary: {
                totalAccounts: accounts.length,
                accountsWithContacts: accounts.filter(a => a.contacts.length > 0).length,
                completeBuyerGroups: accounts.filter(a => this.analyzeBuyerGroupCompleteness(a).isComplete).length
            },
            verticalAnalysis: this.analyzeByVertical(accounts),
            topOpportunities: this.identifyTopExpansionOpportunities(accounts),
            buyerGroupModel: this.retailFixturesModel,
            stats: this.stats
        };

        const reportFile = path.join(outputDir, `retail-fixtures-buyer-groups-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(buyerGroupReport, null, 2));
        
        console.log(`   ✅ Buyer group report saved to: ${reportFile}`);
    }

    /**
     * 📊 ANALYZE BY VERTICAL
     */
    analyzeByVertical(accounts) {
        const verticalAnalysis = {};
        
        accounts.forEach(account => {
            const vertical = account.vertical || 'Unknown';
            if (!verticalAnalysis[vertical]) {
                verticalAnalysis[vertical] = {
                    accounts: 0,
                    totalContacts: 0,
                    completeBuyerGroups: 0,
                    avgContactsPerAccount: 0
                };
            }
            
            const va = verticalAnalysis[vertical];
            va.accounts++;
            va.totalContacts += account.contacts.length;
            
            if (this.analyzeBuyerGroupCompleteness(account).isComplete) {
                va.completeBuyerGroups++;
            }
        });

        // Calculate averages
        Object.values(verticalAnalysis).forEach(va => {
            va.avgContactsPerAccount = Math.round(va.totalContacts / va.accounts * 10) / 10;
        });

        return verticalAnalysis;
    }

    /**
     * 🎯 IDENTIFY TOP EXPANSION OPPORTUNITIES
     */
    identifyTopExpansionOpportunities(accounts) {
        return accounts
            .map(account => {
                const analysis = this.analyzeBuyerGroupCompleteness(account);
                return {
                    company: account.name,
                    vertical: account.vertical,
                    currentContacts: account.contacts.length,
                    completeness: analysis.completeness,
                    missingRoles: analysis.missingRoles,
                    priority: account.contacts.length > 5 ? 'high' : 'medium'
                };
            })
            .filter(item => item.currentContacts > 0 && item.completeness < 80)
            .sort((a, b) => b.currentContacts - a.currentContacts)
            .slice(0, 20);
    }

    /**
     * 📊 PRINT FINAL STATISTICS
     */
    printFinalStats() {
        console.log('\n🎉 RETAIL FIXTURES BUYER GROUP DISCOVERY COMPLETE');
        console.log('==================================================');
        console.log(`🏢 Accounts Processed: ${this.stats.accountsProcessed}`);
        console.log(`✅ Buyer Groups Completed: ${this.stats.buyerGroupsCompleted}`);
        console.log(`👥 Contacts Discovered: ${this.stats.contactsDiscovered}`);
        console.log(`👔 Executives Found: ${this.stats.executivesFound}`);
        console.log(`🏷️ Roles Classified: ${this.stats.rolesClassified}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        
        console.log('\n🎯 RETAIL FIXTURES BUYER GROUP MODEL:');
        console.log('   ✅ Decision Makers: Presidents, VPs (capital equipment budget)');
        console.log('   ✅ Champions: Operations Directors, Store Development');
        console.log('   ✅ Operational: Category Managers, Merchandising (fixture specs)');
        console.log('   ✅ Financial: CFOs, Finance Directors (capital approval)');
        console.log('   ✅ Procurement: Purchasing Managers (vendor selection)');
        console.log('   ❌ NOT NEEDED: IT/Technology (physical products)');
    }
}

/**
 * 🚀 MAIN EXECUTION
 */
async function main() {
    const discovery = new RetailFixturesBuyerGroupDiscovery();
    
    const args = process.argv.slice(2);
    const options = {};
    
    if (args.includes('--test')) {
        options.maxAccounts = 5;
        console.log('🧪 Running in test mode (5 accounts max)');
    }
    
    const maxArg = args.find(arg => arg.startsWith('--max='));
    if (maxArg) {
        options.maxAccounts = parseInt(maxArg.split('=')[1]);
    }
    
    try {
        await discovery.discoverBuyerGroups(options);
    } catch (error) {
        console.error('❌ Discovery failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { RetailFixturesBuyerGroupDiscovery };
