#!/usr/bin/env node

/**
 * 🎯 BUYER GROUP PREVIEW DISCOVERY MODULE
 * 
 * World-class buyer group discovery using CoreSignal Preview API:
 * 1. Preview 100 employees at company (1 credit)
 * 2. Intelligent role scoring and classification (free)
 * 3. Select top candidates for full enrichment
 * 
 * Transforms buyer group discovery from narrow search to comprehensive intelligence
 */

const fetch = require('node-fetch');
const { ExecutiveRoleDefinitions } = require('./ExecutiveRoleDefinitions');

class BuyerGroupPreviewDiscovery {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: config.CORESIGNAL_BASE_URL || 'https://api.coresignal.com',
            TIMEOUT: config.TIMEOUT || 20000,
            MAX_RETRIES: config.MAX_RETRIES || 2,
            PREVIEW_LIMIT: config.PREVIEW_LIMIT || 100,
            ...config
        };
        
        this.roleDefinitions = new ExecutiveRoleDefinitions();
        
        this.stats = {
            previewSearches: 0,
            candidatesScored: 0,
            roleAssignments: 0,
            creditsUsed: 0,
            successes: 0,
            failures: 0
        };
    }

    /**
     * 🎯 MAIN DISCOVERY METHOD
     * 
     * Comprehensive buyer group discovery using Preview API
     */
    async discoverBuyerGroup(companyName, options = {}) {
        console.log(`\n🎯 [PREVIEW DISCOVERY] Starting comprehensive discovery for: ${companyName}`);
        
        try {
            // Step 1: Preview search for broad visibility
            console.log(`   📊 Step 1: Preview search for broad visibility...`);
            const previewResults = await this.searchPreview(companyName, options);
            
            if (!previewResults || previewResults.length === 0) {
                console.log(`   ❌ No employees found in preview search`);
                return this.getEmptyBuyerGroup(companyName);
            }
            
            console.log(`   ✅ Found ${previewResults.length} employees in preview`);
            
            // Step 2: Intelligent role scoring and classification
            console.log(`   🧠 Step 2: Intelligent role scoring and classification...`);
            const scoredCandidates = await this.scoreAndClassifyCandidates(previewResults, companyName);
            
            // Step 3: Select top candidates for each role
            console.log(`   🎯 Step 3: Selecting top candidates for buyer group...`);
            const selectedCandidates = this.selectTopCandidates(scoredCandidates, options);
            
            // Step 4: Generate buyer group structure
            console.log(`   📋 Step 4: Generating buyer group structure...`);
            const buyerGroup = this.generateBuyerGroupStructure(selectedCandidates, companyName);
            
            this.stats.successes++;
            console.log(`   ✅ Preview discovery complete: ${buyerGroup.totalMembers} members`);
            
            return buyerGroup;
            
        } catch (error) {
            console.error(`   ❌ Preview discovery failed: ${error.message}`);
            this.stats.failures++;
            throw error;
        }
    }

    /**
     * 📊 PREVIEW SEARCH
     * 
     * Search for employees using Preview API with broad criteria
     */
    async searchPreview(companyName, options = {}) {
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('   ⚠️ CoreSignal API key not configured');
            return [];
        }

        try {
            console.log(`   🔍 CoreSignal Preview: Searching for employees at ${companyName}...`);
            this.stats.previewSearches++;

            const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl/preview`;
            
            // Build comprehensive query for broad visibility
            const query = {
                query: {
                    bool: {
                        should: [
                            // C-level executives
                            { match: { "active_experience_management_level": "C-Level" }},
                            
                            // VP and Director level
                            { match: { "active_experience_management_level": "VP-Level" }},
                            { match: { "active_experience_management_level": "Director" }},
                            
                            // Key departments for buyer groups
                            { match: { "active_experience_department": "Finance" }},
                            { match: { "active_experience_department": "Sales" }},
                            { match: { "active_experience_department": "Operations" }},
                            { match: { "active_experience_department": "Product" }},
                            { match: { "active_experience_department": "Engineering" }},
                            { match: { "active_experience_department": "Marketing" }},
                            { match: { "active_experience_department": "Legal" }},
                            { match: { "active_experience_department": "Compliance" }},
                            { match: { "active_experience_department": "Procurement" }},
                            { match: { "active_experience_department": "Strategy" }},
                            
                            // Company name match (fallback)
                            { match: { "company_name": companyName }}
                        ],
                        minimum_should_match: 1
                    }
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(query),
                timeout: this.config.TIMEOUT
            });

            if (!response.ok) {
                console.log(`   ❌ Preview search failed: ${response.status} ${response.statusText}`);
                this.stats.failures++;
                return [];
            }

            const data = await response.json();
            this.stats.creditsUsed += 1; // Preview search costs 1 credit
            this.stats.successes++;

            // Preview API returns array of employee objects
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   ✅ Preview: Found ${data.length} employees`);
                return data;
            } else {
                console.log(`   ⚠️ Preview: No employees found`);
                return [];
            }

        } catch (error) {
            console.log(`   ❌ Preview search error: ${error.message}`);
            this.stats.failures++;
            return [];
        }
    }

    /**
     * 🧠 SCORE AND CLASSIFY CANDIDATES
     * 
     * Score each candidate for all buyer group roles
     */
    async scoreAndClassifyCandidates(employees, companyName) {
        console.log(`   🧠 Scoring ${employees.length} candidates for buyer group roles...`);
        
        const candidates = {
            decision: [],
            champion: [],
            stakeholder: [],
            blocker: [],
            introducer: []
        };

        for (const employee of employees) {
            // Score for each role
            const scores = {
                decision: this.scoreAsDecisionMaker(employee),
                champion: this.scoreAsChampion(employee),
                stakeholder: this.scoreAsStakeholder(employee),
                blocker: this.scoreAsBlocker(employee),
                introducer: this.scoreAsIntroducer(employee)
            };

            // Find best-fit role
            const bestRole = this.findBestRole(scores);
            const bestScore = scores[bestRole];

            // Only include candidates with meaningful scores
            if (bestScore >= 0.3) { // Minimum threshold
                candidates[bestRole].push({
                    ...employee,
                    roleScore: bestScore,
                    allScores: scores,
                    assignedRole: bestRole
                });
            }

            this.stats.candidatesScored++;
        }

        // Sort each role by score
        for (const role in candidates) {
            candidates[role].sort((a, b) => b.roleScore - a.roleScore);
        }

        console.log(`   ✅ Scored candidates: ${Object.values(candidates).flat().length} total`);
        console.log(`      Decision: ${candidates.decision.length}, Champion: ${candidates.champion.length}`);
        console.log(`      Stakeholder: ${candidates.stakeholder.length}, Blocker: ${candidates.blocker.length}, Introducer: ${candidates.introducer.length}`);

        return candidates;
    }

    /**
     * 🎯 SELECT TOP CANDIDATES
     * 
     * Select best candidates for each role based on targets
     */
    selectTopCandidates(scoredCandidates, options = {}) {
        const targets = {
            decision: { min: 1, max: 3, ideal: 2 },
            champion: { min: 2, max: 4, ideal: 3 },
            stakeholder: { min: 3, max: 5, ideal: 4 },
            blocker: { min: 0, max: 2, ideal: 1 },
            introducer: { min: 1, max: 3, ideal: 2 }
        };

        const selected = {
            decision: scoredCandidates.decision.slice(0, targets.decision.max),
            champion: scoredCandidates.champion.slice(0, targets.champion.max),
            stakeholder: scoredCandidates.stakeholder.slice(0, targets.stakeholder.max),
            blocker: scoredCandidates.blocker.slice(0, targets.blocker.max),
            introducer: scoredCandidates.introducer.slice(0, targets.introducer.max)
        };

        // Ensure minimum requirements are met
        for (const [role, candidates] of Object.entries(selected)) {
            if (candidates.length < targets[role].min) {
                console.log(`   ⚠️ Warning: Only ${candidates.length} ${role} candidates (min: ${targets[role].min})`);
            }
        }

        return selected;
    }

    /**
     * 📋 GENERATE BUYER GROUP STRUCTURE
     * 
     * Create final buyer group with proper structure
     */
    generateBuyerGroupStructure(selectedCandidates, companyName) {
        const allMembers = Object.values(selectedCandidates).flat();
        
        // Transform to buyer group format
        const roles = {
            decision: selectedCandidates.decision.map(c => this.transformToBuyerGroupMember(c)),
            champion: selectedCandidates.champion.map(c => this.transformToBuyerGroupMember(c)),
            stakeholder: selectedCandidates.stakeholder.map(c => this.transformToBuyerGroupMember(c)),
            blocker: selectedCandidates.blocker.map(c => this.transformToBuyerGroupMember(c)),
            introducer: selectedCandidates.introducer.map(c => this.transformToBuyerGroupMember(c))
        };

        // Calculate metrics
        const totalMembers = allMembers.length;
        const averageScore = totalMembers > 0 
            ? allMembers.reduce((sum, m) => sum + m.roleScore, 0) / totalMembers 
            : 0;

        return {
            id: `${companyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            companyName,
            totalMembers,
            roles,
            cohesion: {
                score: Math.round(averageScore * 100),
                level: this.getCohesionLevel(averageScore),
                overallScore: Math.round(averageScore * 100),
                departmentAlignment: this.calculateDepartmentAlignment(roles),
                signal: 'Preview-based comprehensive discovery',
                strength: averageScore,
                source: 'preview_discovery',
                confidence: Math.min(0.9, averageScore + 0.2)
            },
            dynamics: {
                decisionFlow: this.analyzeDecisionFlow(roles),
                engagementStrategy: this.generateEngagementStrategy(roles),
                timeline: '3-6 months typical sales cycle'
            },
            opportunitySignals: this.detectOpportunitySignals(roles),
            painSignals: this.detectPainSignals(roles),
            benchmark: {
                overallScore: Math.round(averageScore * 100),
                roleDistribution: this.calculateRoleDistribution(roles),
                influenceBalance: this.calculateInfluenceBalance(roles),
                cohesionScore: Math.round(averageScore * 100),
                dataQuality: 95 // Preview data is high quality
            },
            discoveryMethod: 'preview_comprehensive',
            previewStats: {
                candidatesEvaluated: this.stats.candidatesScored,
                roleAssignments: this.stats.roleAssignments,
                creditsUsed: this.stats.creditsUsed
            }
        };
    }

    /**
     * 🎯 ROLE SCORING FUNCTIONS
     */
    
    scoreAsDecisionMaker(employee) {
        const title = (employee.active_experience_title || '').toLowerCase();
        const department = (employee.active_experience_department || '').toLowerCase();
        const managementLevel = (employee.active_experience_management_level || '').toLowerCase();
        
        let score = 0;
        
        // C-level executives (highest score)
        if (managementLevel === 'c-level' || title.includes('chief') || title.includes('ceo') || title.includes('cfo') || title.includes('cto') || title.includes('cmo')) {
            score += 0.9;
        }
        
        // VPs with budget authority
        if (managementLevel === 'vp-level' && (title.includes('finance') || title.includes('operations') || title.includes('revenue'))) {
            score += 0.8;
        }
        
        // Directors with P&L responsibility
        if (managementLevel === 'director' && (title.includes('finance') || title.includes('operations') || title.includes('strategy'))) {
            score += 0.7;
        }
        
        // Department-based scoring
        if (department === 'finance' || department === 'operations' || department === 'strategy') {
            score += 0.3;
        }
        
        return Math.min(1.0, score);
    }

    scoreAsChampion(employee) {
        const title = (employee.active_experience_title || '').toLowerCase();
        const department = (employee.active_experience_department || '').toLowerCase();
        const managementLevel = (employee.active_experience_management_level || '').toLowerCase();
        
        let score = 0;
        
        // Sales and Marketing leaders
        if (department === 'sales' || department === 'marketing' || title.includes('sales') || title.includes('marketing')) {
            score += 0.8;
        }
        
        // Operations and Product leaders
        if (department === 'operations' || department === 'product' || title.includes('operations') || title.includes('product')) {
            score += 0.7;
        }
        
        // Directors and VPs in relevant departments
        if ((managementLevel === 'director' || managementLevel === 'vp-level') && 
            (department === 'sales' || department === 'marketing' || department === 'operations' || department === 'product')) {
            score += 0.6;
        }
        
        // Growth and Revenue roles
        if (title.includes('growth') || title.includes('revenue') || title.includes('business development')) {
            score += 0.7;
        }
        
        return Math.min(1.0, score);
    }

    scoreAsStakeholder(employee) {
        const title = (employee.active_experience_title || '').toLowerCase();
        const department = (employee.active_experience_department || '').toLowerCase();
        const managementLevel = (employee.active_experience_management_level || '').toLowerCase();
        
        let score = 0;
        
        // Directors and Managers
        if (managementLevel === 'director' || managementLevel === 'manager') {
            score += 0.6;
        }
        
        // Product, IT, and Operations roles
        if (department === 'product' || department === 'engineering' || department === 'operations' || department === 'it') {
            score += 0.7;
        }
        
        // Head of roles
        if (title.includes('head of') || title.includes('director of') || title.includes('manager of')) {
            score += 0.5;
        }
        
        // Technical roles
        if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
            score += 0.4;
        }
        
        return Math.min(1.0, score);
    }

    scoreAsBlocker(employee) {
        const title = (employee.active_experience_title || '').toLowerCase();
        const department = (employee.active_experience_department || '').toLowerCase();
        
        let score = 0;
        
        // Legal and Compliance
        if (department === 'legal' || department === 'compliance' || title.includes('legal') || title.includes('compliance')) {
            score += 0.9;
        }
        
        // Security and Risk
        if (title.includes('security') || title.includes('risk') || title.includes('audit')) {
            score += 0.8;
        }
        
        // Procurement
        if (department === 'procurement' || title.includes('procurement') || title.includes('vendor')) {
            score += 0.7;
        }
        
        // Finance gatekeepers
        if (department === 'finance' && (title.includes('controller') || title.includes('accounting'))) {
            score += 0.6;
        }
        
        return Math.min(1.0, score);
    }

    scoreAsIntroducer(employee) {
        const title = (employee.active_experience_title || '').toLowerCase();
        const department = (employee.active_experience_department || '').toLowerCase();
        const connectionsCount = employee.connections_count || 0;
        
        let score = 0;
        
        // Board and Advisory roles
        if (title.includes('board') || title.includes('advisor') || title.includes('consultant')) {
            score += 0.9;
        }
        
        // External relations
        if (title.includes('partnership') || title.includes('business development') || title.includes('alliance')) {
            score += 0.8;
        }
        
        // High network influence
        if (connectionsCount > 500) {
            score += 0.6;
        }
        
        // Industry relations
        if (title.includes('industry') || title.includes('ecosystem') || title.includes('community')) {
            score += 0.7;
        }
        
        return Math.min(1.0, score);
    }

    /**
     * 🔧 HELPER FUNCTIONS
     */
    
    findBestRole(scores) {
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    }

    transformToBuyerGroupMember(candidate) {
        return {
            name: candidate.full_name || 'Unknown',
            title: candidate.active_experience_title || '',
            email: candidate.email || '',
            phone: candidate.phone || '',
            linkedin: candidate.linkedin_url || '',
            confidence: Math.round(candidate.roleScore * 100),
            influenceScore: Math.round(candidate.roleScore * 10) / 10,
            department: candidate.active_experience_department || '',
            managementLevel: candidate.active_experience_management_level || '',
            connectionsCount: candidate.connections_count || 0,
            location: candidate.location_full || '',
            company: candidate.company_name || '',
            roleScore: candidate.roleScore,
            allScores: candidate.allScores,
            assignedRole: candidate.assignedRole
        };
    }

    getCohesionLevel(score) {
        if (score >= 0.8) return 'Excellent';
        if (score >= 0.6) return 'Good';
        if (score >= 0.4) return 'Fair';
        return 'Poor';
    }

    calculateDepartmentAlignment(roles) {
        const departments = Object.values(roles).flat().map(m => m.department).filter(Boolean);
        const uniqueDepartments = new Set(departments).size;
        return Math.min(1.0, uniqueDepartments / 5); // Normalize to 5 departments
    }

    analyzeDecisionFlow(roles) {
        const decisionCount = roles.decision.length;
        const championCount = roles.champion.length;
        
        if (decisionCount >= 2 && championCount >= 2) {
            return 'Top-down with strong champion influence';
        } else if (decisionCount >= 2) {
            return 'Top-down decision making';
        } else if (championCount >= 3) {
            return 'Champion-driven with consensus building';
        } else {
            return 'Collaborative decision making';
        }
    }

    generateEngagementStrategy(roles) {
        const strategies = [];
        
        if (roles.decision.length > 0) {
            strategies.push('Start with decision makers');
        }
        if (roles.champion.length > 0) {
            strategies.push('Leverage champions for internal advocacy');
        }
        if (roles.stakeholder.length > 0) {
            strategies.push('Engage stakeholders for buy-in');
        }
        if (roles.blocker.length > 0) {
            strategies.push('Address blockers early');
        }
        if (roles.introducer.length > 0) {
            strategies.push('Use introducers for warm connections');
        }
        
        return strategies.join(', ');
    }

    detectOpportunitySignals(roles) {
        const signals = [];
        
        if (roles.champion.length >= 3) {
            signals.push({
                signal: 'Multiple champions indicate growth momentum',
                strength: 0.8,
                source: 'champion_abundance',
                confidence: 0.9
            });
        }
        
        if (roles.decision.length >= 2) {
            signals.push({
                signal: 'Multiple decision makers suggest complex approval process',
                strength: 0.7,
                source: 'decision_complexity',
                confidence: 0.8
            });
        }
        
        return signals;
    }

    detectPainSignals(roles) {
        const signals = [];
        
        if (roles.blocker.length > 0) {
            signals.push({
                signal: 'Identified blockers may indicate resistance to change',
                strength: 0.6,
                source: 'blocker_presence',
                confidence: 0.7
            });
        }
        
        return signals;
    }

    calculateRoleDistribution(roles) {
        const total = Object.values(roles).flat().length;
        if (total === 0) return 0;
        
        const targets = { decision: 2, champion: 3, stakeholder: 4, blocker: 1, introducer: 2 };
        let score = 0;
        
        for (const [role, members] of Object.entries(roles)) {
            const target = targets[role] || 0;
            const actual = members.length;
            const roleScore = Math.min(1.0, actual / Math.max(1, target));
            score += roleScore;
        }
        
        return Math.round((score / 5) * 100);
    }

    calculateInfluenceBalance(roles) {
        const influenceScores = Object.values(roles).flat().map(m => m.influenceScore || 0);
        if (influenceScores.length === 0) return 0;
        
        const average = influenceScores.reduce((sum, score) => sum + score, 0) / influenceScores.length;
        const variance = influenceScores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / influenceScores.length;
        
        // Lower variance = better balance
        return Math.max(0, 100 - Math.round(variance * 10));
    }

    getEmptyBuyerGroup(companyName) {
        return {
            id: `${companyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            companyName,
            totalMembers: 0,
            roles: {
                decision: [],
                champion: [],
                stakeholder: [],
                blocker: [],
                introducer: []
            },
            cohesion: {
                score: 0,
                level: 'Poor',
                overallScore: 0,
                departmentAlignment: 0,
                signal: 'No employees found',
                strength: 0,
                source: 'preview_discovery',
                confidence: 0
            },
            dynamics: {
                decisionFlow: 'Unknown',
                engagementStrategy: 'Expand search criteria',
                timeline: 'Unknown'
            },
            opportunitySignals: [],
            painSignals: [],
            benchmark: {
                overallScore: 0,
                roleDistribution: 0,
                influenceBalance: 0,
                cohesionScore: 0,
                dataQuality: 0
            },
            discoveryMethod: 'preview_comprehensive',
            previewStats: {
                candidatesEvaluated: 0,
                roleAssignments: 0,
                creditsUsed: 0
            }
        };
    }

    /**
     * 📊 GET STATISTICS
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.successes + this.stats.failures > 0 
                ? (this.stats.successes / (this.stats.successes + this.stats.failures)) * 100 
                : 0
        };
    }
}

module.exports = BuyerGroupPreviewDiscovery;
