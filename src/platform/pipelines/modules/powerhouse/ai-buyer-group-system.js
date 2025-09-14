#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

/**
 * 🎯 AI BUYER GROUP SYSTEM
 * 
 * Comprehensive buyer group discovery that:
 * - Aligns with MEDDIC/MEDDPICC methodology
 * - Uses AI to determine roles based on company/product context
 * - Stores roles directly on person/contact records for visibility
 * - Supports flexible terminology (MEDDIC, Challenger Sale, etc.)
 * - Automatically pulls user context from workspace data
 * 
 * MEDDIC Alignment:
 * - Economic Buyer = Decision Maker (budget authority)
 * - Champion = Internal advocate (MEDDIC champion)
 * - Influencers = Stakeholders who influence (technical, financial, procurement)
 * - Coach = Subset of Champion (provides inside info)
 * - Introducers = Board members, PE, junior staff (access providers)
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class AIBuyerGroupSystem {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            OPENAI_API_KEY: config.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
            ...config
        };
        
        this.stats = {
            usersAnalyzed: 0,
            companiesProcessed: 0,
            buyerGroupsGenerated: 0,
            rolesAssigned: 0,
            databaseUpdates: 0,
            errors: 0
        };
        
        // MEDDIC-aligned buyer group roles
        this.buyerGroupRoles = {
            'Decision Maker': {
                meddic: 'Economic Buyer',
                description: 'Has budget authority and final approval power',
                authority: 'budget_approval',
                dbField: 'buyerGroupRole',
                dbValue: 'decision_maker',
                tags: ['decision-maker', 'economic-buyer', 'budget-authority']
            },
            'Champion': {
                meddic: 'Champion',
                description: 'Internal advocate who promotes the solution',
                authority: 'influence',
                dbField: 'buyerGroupRole', 
                dbValue: 'champion',
                tags: ['champion', 'internal-advocate', 'solution-promoter']
            },
            'Coach': {
                meddic: 'Coach (subset of Champion)',
                description: 'Provides inside information and guidance',
                authority: 'intelligence',
                dbField: 'buyerGroupRole',
                dbValue: 'coach',
                tags: ['coach', 'insider', 'guidance-provider']
            },
            'Influencer': {
                meddic: 'Stakeholder/Influencer',
                description: 'Influences specifications and requirements',
                authority: 'specification',
                dbField: 'buyerGroupRole',
                dbValue: 'influencer',
                tags: ['influencer', 'stakeholder', 'spec-influencer'],
                subtypes: {
                    'Technical Influencer': ['technical', 'it', 'systems', 'engineering'],
                    'Financial Influencer': ['finance', 'cfo', 'budget', 'accounting'],
                    'Procurement Influencer': ['procurement', 'purchasing', 'vendor', 'sourcing'],
                    'Operational Influencer': ['operations', 'process', 'workflow', 'implementation']
                }
            },
            'Blocker': {
                meddic: 'Potential Blocker',
                description: 'Can prevent or delay decisions',
                authority: 'veto_power',
                dbField: 'buyerGroupRole',
                dbValue: 'blocker',
                tags: ['blocker', 'gatekeeper', 'risk-factor']
            },
            'Introducer': {
                meddic: 'Access Provider',
                description: 'Provides access to decision makers',
                authority: 'relationship_access',
                dbField: 'buyerGroupRole',
                dbValue: 'introducer',
                tags: ['introducer', 'access-provider', 'relationship-builder'],
                subtypes: {
                    'Board Member': ['board', 'director', 'advisory'],
                    'PE/VC Contact': ['private equity', 'venture capital', 'investor'],
                    'Junior Staff': ['coordinator', 'assistant', 'associate'],
                    'External Advisor': ['consultant', 'advisor', 'partner']
                }
            }
        };
    }

    /**
     * 🚀 MAIN BUYER GROUP DISCOVERY
     * 
     * Automatically discovers user context and generates buyer groups
     */
    async discoverBuyerGroups(userId, targetCompanies = null, options = {}) {
        console.log('🎯 AI BUYER GROUP SYSTEM');
        console.log('========================');
        console.log('MEDDIC-aligned, AI-powered buyer group discovery\n');

        try {
            // STEP 1: Auto-discover user profile and selling context
            console.log('👤 STEP 1: Auto-Discovering User Context');
            const userContext = await this.autoDiscoverUserContext(userId);
            
            // STEP 2: Auto-analyze workspace and business patterns
            console.log('\n📊 STEP 2: Auto-Analyzing Business Context');
            const businessContext = await this.autoAnalyzeBusinessContext(userContext);
            
            // STEP 3: Generate AI buyer groups for target companies
            console.log('\n🎯 STEP 3: AI Buyer Group Generation');
            const buyerGroups = await this.generateAIBuyerGroups(
                userContext, 
                businessContext, 
                targetCompanies, 
                options
            );
            
            // STEP 4: Store buyer group roles in database
            console.log('\n💾 STEP 4: Storing Buyer Group Roles');
            await this.storeBuyerGroupRoles(buyerGroups, userContext.workspaceId);
            
            // STEP 5: Generate comprehensive report
            console.log('\n📊 STEP 5: Generating Report');
            await this.generateBuyerGroupReport(userContext, businessContext, buyerGroups);
            
            this.printFinalStats();
            
            return {
                userContext,
                businessContext,
                buyerGroups,
                meddic: {
                    methodology: 'MEDDIC-aligned',
                    rolesGenerated: buyerGroups.reduce((sum, bg) => sum + Object.keys(bg.roles).length, 0),
                    confidence: this.calculateOverallConfidence(buyerGroups)
                }
            };
            
        } catch (error) {
            console.error('❌ AI buyer group discovery failed:', error);
            this.stats.errors++;
            throw error;
        } finally {
            await prisma.$disconnect();
        }
    }

    /**
     * 👤 AUTO-DISCOVER USER CONTEXT
     */
    async autoDiscoverUserContext(userId) {
        console.log('   Automatically discovering user profile...');
        
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                title: true,
                department: true,
                territory: true,
                quota: true,
                startDate: true,
                workspaces: {
                    select: {
                        workspaceId: true,
                        workspace: {
                            select: {
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const primaryWorkspace = user.workspaces[0]?.workspace;
        
        const context = {
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            title: user.title,
            department: user.department,
            territory: user.territory,
            quota: user.quota,
            experience: this.calculateExperience(user.startDate),
            workspaceId: primaryWorkspace?.id,
            workspaceName: primaryWorkspace?.name,
            workspaceDescription: primaryWorkspace?.description
        };

        console.log(`   ✅ User context: ${context.name} (${context.title || 'No title'})`);
        console.log(`      Workspace: ${context.workspaceName}`);
        
        this.stats.usersAnalyzed++;
        
        return context;
    }

    /**
     * 📊 AUTO-ANALYZE BUSINESS CONTEXT
     */
    async autoAnalyzeBusinessContext(userContext) {
        console.log('   Analyzing business context from workspace data...');
        
        const [opportunities, accounts, contacts] = await Promise.all([
            prisma.opportunities.findMany({
                where: { 
                    workspaceId: userContext.workspaceId,
                    assignedUserId: userContext.userId,
                    deletedAt: null
                },
                select: { 
                    name: true, 
                    description: true, 
                    amount: true, 
                    stage: true,
                    account: { select: { name: true, vertical: true, industry: true } }
                }
            }),
            prisma.accounts.findMany({
                where: { 
                    workspaceId: userContext.workspaceId,
                    assignedUserId: userContext.userId,
                    deletedAt: null
                },
                select: { 
                    name: true, 
                    industry: true, 
                    vertical: true, 
                    size: true,
                    revenue: true
                }
            }),
            prisma.contacts.findMany({
                where: { 
                    workspaceId: userContext.workspaceId,
                    assignedUserId: userContext.userId,
                    deletedAt: null
                },
                select: { 
                    jobTitle: true,
                    tags: true,
                    account: { select: { vertical: true } }
                }
            })
        ]);

        const context = {
            totalOpportunities: opportunities.length,
            totalAccounts: accounts.length,
            totalContacts: contacts.length,
            
            // Auto-discovered patterns
            primaryVerticals: this.extractPrimaryVerticals(accounts, opportunities),
            averageDealSize: this.calculateAverageDealSize(opportunities),
            businessModel: this.inferBusinessModel(opportunities),
            targetRoles: this.extractTargetRoles(contacts),
            successPatterns: this.analyzeSuccessPatterns(opportunities),
            
            // MEDDIC context
            dealComplexity: this.assessDealComplexity(opportunities),
            procurementMaturity: this.assessProcurementMaturity(accounts),
            decisionStyle: this.assessDecisionStyle(accounts, opportunities)
        };

        console.log(`   ✅ Business context: ${context.businessModel}`);
        console.log(`      Verticals: ${context.primaryVerticals.slice(0, 2).join(', ')}`);
        console.log(`      Deal Size: ${context.averageDealSize}`);
        
        return context;
    }

    /**
     * 🎯 GENERATE AI BUYER GROUPS
     */
    async generateAIBuyerGroups(userContext, businessContext, targetCompanies, options) {
        // Get target companies
        const companies = targetCompanies || await this.getTopPriorityCompanies(
            userContext.workspaceId, 
            userContext.userId, 
            options.maxCompanies || 10
        );

        console.log(`   Generating buyer groups for ${companies.length} companies...`);
        
        const buyerGroups = [];
        
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            
            console.log(`\n   🏢 ${i+1}/${companies.length}: ${company.name}`);
            
            try {
                const buyerGroup = await this.generateSingleBuyerGroup(
                    company,
                    userContext,
                    businessContext
                );
                
                if (buyerGroup) {
                    buyerGroups.push(buyerGroup);
                    this.stats.buyerGroupsGenerated++;
                }
                
            } catch (error) {
                console.log(`      ❌ Failed: ${error.message}`);
                this.stats.errors++;
            }
            
            // Rate limiting
            if (i < companies.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        this.stats.companiesProcessed = companies.length;
        console.log(`   ✅ Generated ${buyerGroups.length} buyer groups`);
        
        return buyerGroups;
    }

    /**
     * 🎯 GENERATE SINGLE BUYER GROUP
     */
    async generateSingleBuyerGroup(company, userContext, businessContext) {
        const prompt = `Generate a MEDDIC-aligned buyer group for this specific selling scenario:

SELLER CONTEXT:
Name: ${userContext.name}
Title: ${userContext.title}
Experience: ${userContext.experience}
Territory: ${userContext.territory}
Quota: ${userContext.quota}

BUSINESS CONTEXT:
Business Model: ${businessContext.businessModel}
Primary Verticals: ${businessContext.primaryVerticals.join(', ')}
Average Deal Size: ${businessContext.averageDealSize}
Deal Complexity: ${businessContext.dealComplexity}
Success Patterns: ${businessContext.successPatterns}

TARGET COMPANY:
Name: ${company.name}
Industry: ${company.industry}
Vertical: ${company.vertical}
Size: ${company.size}
Revenue: ${company.revenue || 'Unknown'}

Based on this context, generate a MEDDIC-aligned buyer group with these roles:

1. DECISION MAKER (Economic Buyer): Who has budget authority for ${businessContext.averageDealSize} deals?
2. CHAMPION: Who would internally advocate for this solution?
3. COACH (subset of Champion): Who would provide inside information?
4. INFLUENCERS: Who influences specifications? Include subtypes:
   - Technical Influencer (if technical product)
   - Financial Influencer (budget/ROI analysis)
   - Procurement Influencer (vendor selection)
   - Operational Influencer (implementation/usage)
5. BLOCKER: Who could delay or prevent the decision?
6. INTRODUCER: Who could provide access? Include subtypes:
   - Board Members/PE contacts
   - Junior staff with relationships
   - External advisors/consultants

For each role, provide:
- Specific job titles to search for at this company
- Departments to target
- Why they're relevant to this specific scenario
- Search keywords for finding them
- Confidence level for this role at this company type

Respond in JSON format with complete buyer group.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const buyerGroup = this.parseAIResponse(response);
            
            if (buyerGroup && buyerGroup.roles) {
                console.log(`      ✅ Buyer group generated: ${Object.keys(buyerGroup.roles).length} roles`);
                
                return {
                    companyId: company.id,
                    companyName: company.name,
                    industry: company.industry,
                    vertical: company.vertical,
                    roles: buyerGroup.roles,
                    meddic: {
                        economicBuyer: buyerGroup.roles['Decision Maker'],
                        champion: buyerGroup.roles['Champion'],
                        coach: buyerGroup.roles['Coach'],
                        stakeholders: buyerGroup.roles['Influencers'],
                        blockers: buyerGroup.roles['Blocker']
                    },
                    confidence: buyerGroup.confidence || 75,
                    reasoning: buyerGroup.reasoning,
                    generatedAt: new Date().toISOString()
                };
            }
            
            return null;
            
        } catch (error) {
            console.log(`      ❌ AI generation failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 💾 STORE BUYER GROUP ROLES IN DATABASE
     */
    async storeBuyerGroupRoles(buyerGroups, workspaceId) {
        console.log('   Storing buyer group roles on contact records...');
        
        let rolesStored = 0;
        
        for (const buyerGroup of buyerGroups) {
            try {
                // Get all contacts for this company
                const contacts = await prisma.contacts.findMany({
                    where: {
                        workspaceId: workspaceId,
                        account: {
                            name: buyerGroup.companyName
                        },
                        deletedAt: null
                    }
                });

                // Classify each contact using AI buyer group analysis
                for (const contact of contacts) {
                    const role = await this.classifyContactRole(contact, buyerGroup);
                    
                    if (role && role !== 'unknown') {
                        // Update contact with buyer group role
                        await prisma.contacts.update({
                            where: { id: contact.id },
                            data: {
                                tags: {
                                    push: this.buyerGroupRoles[role]?.tags || [`buyer-group-${role.toLowerCase()}`]
                                },
                                // Store MEDDIC role in a custom field or notes
                                notes: this.appendBuyerGroupInfo(contact.notes, role, buyerGroup.meddic)
                            }
                        });
                        
                        rolesStored++;
                        this.stats.rolesAssigned++;
                    }
                }
                
            } catch (error) {
                console.log(`      ❌ Failed to store roles for ${buyerGroup.companyName}: ${error.message}`);
                this.stats.errors++;
            }
        }

        this.stats.databaseUpdates = rolesStored;
        console.log(`   ✅ Stored ${rolesStored} buyer group roles in database`);
    }

    /**
     * 🏷️ CLASSIFY CONTACT ROLE
     */
    async classifyContactRole(contact, buyerGroup) {
        const jobTitle = contact.jobTitle?.toLowerCase() || '';
        
        // Check each buyer group role
        for (const [roleName, roleConfig] of Object.entries(buyerGroup.roles)) {
            if (roleConfig.titles) {
                for (const title of roleConfig.titles) {
                    if (jobTitle.includes(title.toLowerCase())) {
                        return roleName;
                    }
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * 📝 APPEND BUYER GROUP INFO
     */
    appendBuyerGroupInfo(existingNotes, role, meddicMapping) {
        const roleInfo = this.buyerGroupRoles[role];
        const meddicRole = roleInfo?.meddic || role;
        
        const buyerGroupNote = `\n[BUYER GROUP] Role: ${role} (MEDDIC: ${meddicRole}) - ${roleInfo?.description || 'AI-classified role'}`;
        
        return (existingNotes || '') + buyerGroupNote;
    }

    /**
     * 🤖 CALL PERPLEXITY AI
     */
    async callPerplexityAI(prompt) {
        const apiKey = this.config.PERPLEXITY_API_KEY;
        if (!apiKey || apiKey === 'your_perplexity_api_key_here') {
            throw new Error('Perplexity API key not configured - set PERPLEXITY_API_KEY in .env.local');
        }
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a B2B sales expert specializing in MEDDIC methodology and buyer group analysis. Generate detailed, actionable buyer groups in JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity API failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    /**
     * 📊 PARSE AI RESPONSE
     */
    parseAIResponse(response) {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (error) {
            console.log('      ⚠️ Failed to parse AI response');
            return null;
        }
    }

    /**
     * 📊 CALCULATE EXPERIENCE
     */
    calculateExperience(startDate) {
        if (!startDate) return 'Unknown';
        
        const years = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
        return years < 1 ? 'New' : years < 3 ? 'Junior' : years < 7 ? 'Experienced' : 'Senior';
    }

    /**
     * 📊 EXTRACT PRIMARY VERTICALS
     */
    extractPrimaryVerticals(accounts, opportunities) {
        const verticals = new Set();
        
        accounts.forEach(account => {
            if (account.vertical) verticals.add(account.vertical);
            else if (account.industry) verticals.add(account.industry);
        });
        
        opportunities.forEach(opp => {
            if (opp.account?.vertical) verticals.add(opp.account.vertical);
            else if (opp.account?.industry) verticals.add(opp.account.industry);
        });
        
        return Array.from(verticals);
    }

    /**
     * 🎯 EXTRACT TARGET ROLES
     */
    extractTargetRoles(contacts) {
        const roleCounts = {};
        
        contacts.forEach(contact => {
            if (contact.jobTitle) {
                const normalizedRole = this.normalizeJobTitle(contact.jobTitle);
                roleCounts[normalizedRole] = (roleCounts[normalizedRole] || 0) + 1;
            }
        });

        return Object.entries(roleCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([role, count]) => role)
            .slice(0, 10);
    }

    /**
     * 🏷️ NORMALIZE JOB TITLE
     */
    normalizeJobTitle(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('president') || titleLower.includes('ceo')) return 'President/CEO';
        else if (titleLower.includes('vice president') || titleLower.includes('vp')) return 'Vice President';
        else if (titleLower.includes('director')) return 'Director';
        else if (titleLower.includes('manager')) return 'Manager';
        else if (titleLower.includes('cfo') || titleLower.includes('finance')) return 'Finance';
        else if (titleLower.includes('procurement') || titleLower.includes('purchasing')) return 'Procurement';
        else if (titleLower.includes('operations')) return 'Operations';
        else if (titleLower.includes('merchandising') || titleLower.includes('category')) return 'Merchandising';
        else return 'Other';
    }

    /**
     * 📊 ANALYZE SUCCESS PATTERNS
     */
    analyzeSuccessPatterns(opportunities) {
        const wonOpps = opportunities.filter(opp => 
            opp.stage && opp.stage.toLowerCase().includes('won')
        );
        
        if (wonOpps.length === 0) return 'Relationship-building';
        
        const avgWonSize = wonOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0) / wonOpps.length;
        
        if (avgWonSize >= 500000) return 'Executive-focused';
        else if (avgWonSize >= 100000) return 'Consultative';
        else return 'Transactional';
    }

    /**
     * 🔧 ASSESS DEAL COMPLEXITY
     */
    assessDealComplexity(opportunities) {
        const avgAmount = this.calculateAverageDealSize(opportunities);
        
        if (avgAmount.includes('$1M+')) return 'high';
        else if (avgAmount.includes('$500K') || avgAmount.includes('$100K')) return 'medium';
        else return 'low';
    }

    /**
     * 🏭 ASSESS PROCUREMENT MATURITY
     */
    assessProcurementMaturity(accounts) {
        const largeAccounts = accounts.filter(account => 
            account.size && (account.size.includes('1000+') || account.size.includes('5000+'))
        ).length;
        
        const maturityRatio = largeAccounts / accounts.length;
        
        if (maturityRatio >= 0.5) return 'mature';
        else if (maturityRatio >= 0.2) return 'developing';
        else return 'basic';
    }

    /**
     * 🎯 ASSESS DECISION STYLE
     */
    assessDecisionStyle(accounts, opportunities) {
        const avgDealSize = this.calculateAverageDealSize(opportunities);
        const avgAccountSize = accounts.length;
        
        if (avgDealSize.includes('$1M+') || avgAccountSize > 100) return 'committee';
        else if (avgDealSize.includes('$100K') || avgAccountSize > 20) return 'collaborative';
        else return 'individual';
    }

    /**
     * 💰 CALCULATE AVERAGE DEAL SIZE
     */
    calculateAverageDealSize(opportunities) {
        const validAmounts = opportunities
            .map(opp => opp.amount)
            .filter(amount => amount && amount > 0);

        if (validAmounts.length === 0) return 'Unknown';

        const average = validAmounts.reduce((sum, amount) => sum + amount, 0) / validAmounts.length;
        
        if (average >= 1000000) return '$1M+';
        else if (average >= 500000) return '$500K-$1M';
        else if (average >= 100000) return '$100K-$500K';
        else return 'Under $100K';
    }

    /**
     * 🏭 INFER BUSINESS MODEL
     */
    inferBusinessModel(opportunities) {
        const descriptions = opportunities
            .map(opp => `${opp.name} ${opp.description || ''}`)
            .join(' ')
            .toLowerCase();

        if (descriptions.includes('software') || descriptions.includes('saas') || descriptions.includes('platform')) {
            return 'Software/SaaS';
        } else if (descriptions.includes('equipment') || descriptions.includes('fixture') || descriptions.includes('hardware')) {
            return 'Equipment/Hardware';
        } else if (descriptions.includes('service') || descriptions.includes('consulting')) {
            return 'Services/Consulting';
        } else {
            return 'Business Solutions';
        }
    }

    /**
     * 🎯 GET TOP PRIORITY COMPANIES
     */
    async getTopPriorityCompanies(workspaceId, userId, maxCompanies) {
        const companies = await prisma.accounts.findMany({
            where: { 
                workspaceId, 
                assignedUserId: userId,
                deletedAt: null
            },
            include: {
                contacts: { 
                    where: { deletedAt: null },
                    select: { id: true, jobTitle: true, tags: true }
                },
                opportunities: {
                    where: { deletedAt: null },
                    select: { amount: true, stage: true }
                }
            },
            take: maxCompanies
        });

        // Prioritize by opportunity value and missing buyer group roles
        return companies.sort((a, b) => {
            const aValue = a.opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
            const bValue = b.opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
            return bValue - aValue;
        });
    }

    /**
     * 📊 GENERATE BUYER GROUP REPORT
     */
    async generateBuyerGroupReport(userContext, businessContext, buyerGroups) {
        const outputDir = path.join(__dirname, '../outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            user: {
                name: userContext.name,
                title: userContext.title,
                workspace: userContext.workspaceName,
                experience: userContext.experience
            },
            business: {
                model: businessContext.businessModel,
                verticals: businessContext.primaryVerticals,
                dealSize: businessContext.averageDealSize,
                complexity: businessContext.dealComplexity
            },
            buyerGroups: buyerGroups.map(bg => ({
                company: bg.companyName,
                industry: bg.industry,
                vertical: bg.vertical,
                roles: Object.keys(bg.roles),
                confidence: bg.confidence,
                meddic: bg.meddic
            })),
            meddic: {
                methodology: 'MEDDIC-aligned buyer group discovery',
                economicBuyers: buyerGroups.reduce((sum, bg) => sum + (bg.meddic.economicBuyer ? 1 : 0), 0),
                champions: buyerGroups.reduce((sum, bg) => sum + (bg.meddic.champion ? 1 : 0), 0),
                stakeholders: buyerGroups.reduce((sum, bg) => sum + (bg.meddic.stakeholders ? 1 : 0), 0)
            },
            stats: this.stats
        };

        const reportFile = path.join(outputDir, `ai-buyer-groups-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`   ✅ Report saved to: ${reportFile}`);
    }

    /**
     * 📊 CALCULATE OVERALL CONFIDENCE
     */
    calculateOverallConfidence(buyerGroups) {
        if (buyerGroups.length === 0) return 0;
        
        const totalConfidence = buyerGroups.reduce((sum, bg) => sum + bg.confidence, 0);
        return Math.round(totalConfidence / buyerGroups.length);
    }

    /**
     * 📊 PRINT FINAL STATISTICS
     */
    printFinalStats() {
        console.log('\n🎉 AI BUYER GROUP SYSTEM COMPLETE');
        console.log('==================================');
        console.log(`👤 Users Analyzed: ${this.stats.usersAnalyzed}`);
        console.log(`🏢 Companies Processed: ${this.stats.companiesProcessed}`);
        console.log(`🎯 Buyer Groups Generated: ${this.stats.buyerGroupsGenerated}`);
        console.log(`🏷️ Roles Assigned: ${this.stats.rolesAssigned}`);
        console.log(`💾 Database Updates: ${this.stats.databaseUpdates}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        
        console.log('\n🎯 MEDDIC ALIGNMENT:');
        console.log('   ✅ Economic Buyer = Decision Maker');
        console.log('   ✅ Champion = Internal advocate');
        console.log('   ✅ Coach = Insider information provider');
        console.log('   ✅ Stakeholders = Influencers (technical, financial, procurement)');
        console.log('   ✅ Introducers = Access providers (board, PE, junior staff)');
        
        console.log('\n📊 SYSTEM BENEFITS:');
        console.log('   ✅ Zero configuration - auto-discovers user context');
        console.log('   ✅ MEDDIC methodology alignment');
        console.log('   ✅ Roles stored on contact records for visibility');
        console.log('   ✅ AI adapts to any industry/company/product');
        console.log('   ✅ Integrates with existing database structure');
    }
}

/**
 * 🚀 MAIN EXECUTION
 */
async function main() {
    const buyerGroupSystem = new AIBuyerGroupSystem();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--dano')) {
        console.log('🧪 Running with Dano\'s data...');
        
        const danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';
        
        const result = await buyerGroupSystem.discoverBuyerGroups(danoUserId, null, {
            maxCompanies: 5
        });
        
        console.log('\n🎯 DANO\'S BUYER GROUP RESULTS:');
        console.log(`   Business Model: ${result.businessContext.businessModel}`);
        console.log(`   Primary Verticals: ${result.businessContext.primaryVerticals.join(', ')}`);
        console.log(`   Deal Size: ${result.businessContext.averageDealSize}`);
        console.log(`   Buyer Groups Generated: ${result.buyerGroups.length}`);
        
    } else {
        console.log('🎯 AI BUYER GROUP SYSTEM');
        console.log('========================');
        console.log('Usage: node ai-buyer-group-system.js --dano');
        console.log('');
        console.log('Features:');
        console.log('• Auto-discovers user context from database');
        console.log('• MEDDIC-aligned buyer group generation');
        console.log('• AI-powered role classification');
        console.log('• Stores roles on contact records');
        console.log('• Works for any industry/product/deal size');
    }
}

if (require.main === module) {
    main();
}

module.exports = { AIBuyerGroupSystem };
