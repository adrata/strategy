/**
 * 📊 DATA ENHANCER MODULE
 * 
 * Adds derivative data to executive intelligence:
 * - Decision-maker authority mapping
 * - Acquisition impact scoring
 * - Contact strategy recommendations
 * - Territory consolidation analysis
 * - Executive stability indicators
 */

const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

class DataEnhancer {
    constructor() {
        this.enhancedData = [];
    }

    async enhanceWithDerivativeData() {
        console.log('📊 SMART DERIVATIVE DATA ENHANCEMENT');
        console.log('=' .repeat(60));

        // Load current data
        const currentData = await this.loadCurrentData();
        
        // Enhance each record with derivative intelligence
        for (const record of currentData) {
            const enhanced = await this.addDerivativeIntelligence(record);
            this.enhancedData.push(enhanced);
        }

        // Generate enhanced CSV
        await this.generateEnhancedCSV();
        
        console.log('\n✅ SMART DERIVATIVE ENHANCEMENT COMPLETE');
        return this.enhancedData;
    }

    async loadCurrentData() {
        return new Promise((resolve, reject) => {
            const data = [];
            fs.createReadStream('outputs/v4/executive-data-external-v4.csv')
                .pipe(csv())
                .on('data', (row) => data.push(row))
                .on('end', () => resolve(data))
                .on('error', reject);
        });
    }

    async addDerivativeIntelligence(record) {
        console.log(`📈 Enhancing: ${record['Company Name']}...`);

        const enhanced = {
            ...record,
            
            // SMART CONTACT STRATEGY
            primaryContactTarget: this.determinePrimaryContactTarget(record),
            decisionMakerLevel: this.assessDecisionMakerLevel(record),
            budgetAuthority: this.assessBudgetAuthority(record),
            contactComplexity: this.assessContactComplexity(record),
            
            // ACQUISITION INTELLIGENCE
            acquisitionImpact: this.calculateAcquisitionImpact(record),
            integrationStatus: this.assessIntegrationStatus(record),
            parentInfluence: this.assessParentInfluence(record),
            territoryStability: this.assessTerritoryStability(record),
            
            // EXECUTIVE INTELLIGENCE
            executiveStability: this.calculateExecutiveStability(record),
            leadershipRisk: this.assessLeadershipRisk(record),
            contactPriority: this.calculateContactPriority(record),
            
            // STRATEGIC INSIGHTS
            marketPosition: this.assessMarketPosition(record),
            growthIndicators: this.identifyGrowthIndicators(record),
            competitiveContext: this.analyzeCompetitiveContext(record),
            
            // ACTIONABLE RECOMMENDATIONS
            salesStrategy: this.recommendSalesStrategy(record),
            contactTiming: this.recommendContactTiming(record),
            keyTalkingPoints: this.generateKeyTalkingPoints(record),
            riskFactors: this.identifyRiskFactors(record)
        };

        return enhanced;
    }

    // SMART CONTACT STRATEGY METHODS
    determinePrimaryContactTarget(record) {
        const isAcquired = record['Corporate Status'] !== 'Independent';
        const hasParent = record['Parent Company'] && record['Parent Company'] !== '';
        
        if (record['Corporate Status'] === 'Parent Company') {
            return 'Parent Company Executive (Primary Decision Maker)';
        } else if (isAcquired && hasParent) {
            return 'Subsidiary Executive + Parent Company Oversight';
        } else if (record['Public/Private'] === 'Public') {
            return 'Public Company Executive (SEC Validated)';
        }
        return 'Independent Company Executive';
    }

    assessDecisionMakerLevel(record) {
        const corporateStatus = record['Corporate Status'];
        const isPublic = record['Public/Private'] === 'Public';
        
        if (corporateStatus === 'Parent Company') {
            return 'Ultimate Decision Maker';
        } else if (isPublic) {
            return 'High Authority (Public Company)';
        } else if (corporateStatus === 'Subsidiary') {
            return 'Operational Authority (Parent Oversight)';
        }
        return 'Full Authority (Independent)';
    }

    assessBudgetAuthority(record) {
        const corporateStatus = record['Corporate Status'];
        const industry = record['Industry'] || '';
        
        if (corporateStatus === 'Parent Company') {
            return 'Enterprise Budget Authority';
        } else if (corporateStatus === 'Independent' && record['Public/Private'] === 'Public') {
            return 'Full Budget Authority';
        } else if (corporateStatus === 'Subsidiary') {
            if (industry.includes('Technology') || industry.includes('IT')) {
                return 'Departmental Budget (Tech Decisions)';
            }
            return 'Limited Budget (Parent Approval Required)';
        }
        return 'Full Budget Authority';
    }

    assessContactComplexity(record) {
        const corporateStatus = record['Corporate Status'];
        const hasParent = record['Parent Company'] && record['Parent Company'] !== '';
        
        if (corporateStatus === 'Parent Company') {
            return 'Complex (Multiple Subsidiaries)';
        } else if (hasParent) {
            return 'Moderate (Dual Approval Process)';
        } else if (record['Public/Private'] === 'Public') {
            return 'Structured (Corporate Processes)';
        }
        return 'Direct (Single Point of Contact)';
    }

    // ACQUISITION INTELLIGENCE METHODS
    calculateAcquisitionImpact(record) {
        const changeDate = record['Change Date'] || '';
        const corporateStatus = record['Corporate Status'];
        
        if (corporateStatus === 'Independent') {
            return 'No Impact (Independent)';
        }
        
        if (changeDate) {
            const acquisitionYear = new Date(changeDate).getFullYear();
            const currentYear = 2025;
            const yearsSince = currentYear - acquisitionYear;
            
            if (yearsSince <= 1) {
                return 'High Impact (Recent Acquisition - Integration Phase)';
            } else if (yearsSince <= 3) {
                return 'Moderate Impact (Integration Maturing)';
            } else {
                return 'Low Impact (Fully Integrated)';
            }
        }
        
        return 'Unknown Impact';
    }

    assessIntegrationStatus(record) {
        const changeDate = record['Change Date'] || '';
        const corporateStatus = record['Corporate Status'];
        
        if (corporateStatus === 'Independent') {
            return 'N/A (Independent)';
        }
        
        if (changeDate) {
            const acquisitionYear = new Date(changeDate).getFullYear();
            const currentYear = 2025;
            const yearsSince = currentYear - acquisitionYear;
            
            if (yearsSince <= 0.5) {
                return 'Early Integration (0-6 months)';
            } else if (yearsSince <= 1) {
                return 'Active Integration (6-12 months)';
            } else if (yearsSince <= 2) {
                return 'Stabilizing (1-2 years)';
            } else {
                return 'Fully Integrated (2+ years)';
            }
        }
        
        return 'Integration Status Unknown';
    }

    assessParentInfluence(record) {
        const corporateStatus = record['Corporate Status'];
        const parentCompany = record['Parent Company'] || '';
        
        if (corporateStatus === 'Independent') {
            return 'None (Independent)';
        } else if (corporateStatus === 'Parent Company') {
            return 'Controls Subsidiaries';
        } else if (parentCompany.includes('KKR') || parentCompany.includes('Permira')) {
            return 'High (Private Equity Oversight)';
        } else if (parentCompany.includes('Technology') || parentCompany.includes('Holdings')) {
            return 'Moderate (Strategic Parent)';
        }
        return 'Moderate (Corporate Parent)';
    }

    assessTerritoryStability(record) {
        const acquisitionImpact = this.calculateAcquisitionImpact(record);
        const corporateStatus = record['Corporate Status'];
        
        if (acquisitionImpact.includes('Recent')) {
            return 'Unstable (Recent Changes)';
        } else if (corporateStatus === 'Independent') {
            return 'Stable (Independent)';
        } else if (acquisitionImpact.includes('Fully Integrated')) {
            return 'Stable (Mature Integration)';
        }
        return 'Moderate (Evolving Structure)';
    }

    // EXECUTIVE INTELLIGENCE METHODS
    calculateExecutiveStability(record) {
        const ceoName = record['CEO Name'] || '';
        const financeLeader = record['Finance Leader Name'] || '';
        const corporateStatus = record['Corporate Status'];
        
        // Check for executive continuity indicators
        let stabilityScore = 0;
        
        if (ceoName && financeLeader) stabilityScore += 30; // Both positions filled
        if (corporateStatus === 'Independent') stabilityScore += 20; // No acquisition disruption
        if (record['Public/Private'] === 'Public') stabilityScore += 20; // Public company stability
        if (!this.calculateAcquisitionImpact(record).includes('Recent')) stabilityScore += 30; // No recent disruption
        
        if (stabilityScore >= 80) return 'Very Stable';
        if (stabilityScore >= 60) return 'Stable';
        if (stabilityScore >= 40) return 'Moderate';
        return 'Unstable';
    }

    assessLeadershipRisk(record) {
        const acquisitionImpact = this.calculateAcquisitionImpact(record);
        const corporateStatus = record['Corporate Status'];
        
        if (acquisitionImpact.includes('Recent')) {
            return 'High (Recent Acquisition - Potential Changes)';
        } else if (corporateStatus === 'Subsidiary' && record['Parent Company'].includes('Private Equity')) {
            return 'Moderate (PE Ownership - Possible Changes)';
        } else if (record['Public/Private'] === 'Public') {
            return 'Low (Public Company Stability)';
        }
        return 'Low (Stable Structure)';
    }

    calculateContactPriority(record) {
        const decisionLevel = this.assessDecisionMakerLevel(record);
        const stability = this.calculateExecutiveStability(record);
        const budgetAuth = this.assessBudgetAuthority(record);
        
        let priority = 0;
        if (decisionLevel.includes('Ultimate')) priority += 40;
        else if (decisionLevel.includes('High')) priority += 30;
        else if (decisionLevel.includes('Full')) priority += 25;
        else priority += 15;
        
        if (stability === 'Very Stable') priority += 30;
        else if (stability === 'Stable') priority += 20;
        else priority += 10;
        
        if (budgetAuth.includes('Enterprise')) priority += 30;
        else if (budgetAuth.includes('Full')) priority += 25;
        else priority += 15;
        
        if (priority >= 80) return 'Tier 1 (Highest Priority)';
        if (priority >= 60) return 'Tier 2 (High Priority)';
        if (priority >= 40) return 'Tier 3 (Medium Priority)';
        return 'Tier 4 (Lower Priority)';
    }

    // STRATEGIC INSIGHT METHODS
    assessMarketPosition(record) {
        const corporateStatus = record['Corporate Status'];
        const industry = record['Industry'] || '';
        const isPublic = record['Public/Private'] === 'Public';
        
        if (corporateStatus === 'Parent Company') {
            return 'Market Consolidator (Acquirer)';
        } else if (isPublic) {
            return 'Public Market Player';
        } else if (corporateStatus === 'Subsidiary') {
            return 'Acquired Asset (Part of Larger Strategy)';
        }
        return 'Independent Player';
    }

    identifyGrowthIndicators(record) {
        const indicators = [];
        
        if (record['Public/Private'] === 'Public') {
            indicators.push('Public Company (Growth Capital Access)');
        }
        
        const acquisitionImpact = this.calculateAcquisitionImpact(record);
        if (acquisitionImpact.includes('Recent')) {
            indicators.push('Recent Acquisition (Investment/Growth Phase)');
        }
        
        if (record['Corporate Status'] === 'Parent Company') {
            indicators.push('Acquisition Strategy (Growth Through M&A)');
        }
        
        const industry = record['Industry'] || '';
        if (industry.includes('Technology') || industry.includes('Digital')) {
            indicators.push('Tech Sector (High Growth Potential)');
        }
        
        return indicators.length > 0 ? indicators.join('; ') : 'Standard Growth Profile';
    }

    analyzeCompetitiveContext(record) {
        const industry = record['Industry'] || '';
        const corporateStatus = record['Corporate Status'];
        
        if (industry.includes('Market Research')) {
            return 'Consolidating Industry (Nielsen, GfK merger activity)';
        } else if (industry.includes('Digital Communications')) {
            return 'Fragmented Market (Acquisition Opportunities)';
        } else if (industry.includes('Restaurant Technology')) {
            return 'Growing Market (Digital Transformation)';
        } else if (industry.includes('IT Solutions')) {
            return 'Highly Competitive (Consolidation Trend)';
        } else if (industry.includes('Talent')) {
            return 'Service Industry (PE Interest)';
        }
        
        return 'Industry Context Analysis Needed';
    }

    // ACTIONABLE RECOMMENDATION METHODS
    recommendSalesStrategy(record) {
        const corporateStatus = record['Corporate Status'];
        const budgetAuth = this.assessBudgetAuthority(record);
        const acquisitionImpact = this.calculateAcquisitionImpact(record);
        
        if (corporateStatus === 'Parent Company') {
            return 'Enterprise Strategy: Target for multi-subsidiary deals, focus on portfolio-wide solutions';
        } else if (acquisitionImpact.includes('Recent')) {
            return 'Integration Strategy: Approach with integration/efficiency solutions, timing is critical';
        } else if (budgetAuth.includes('Enterprise')) {
            return 'Direct Strategy: Full authority contact, can make large decisions independently';
        } else if (corporateStatus === 'Subsidiary') {
            return 'Dual Strategy: Engage subsidiary + build parent company relationships';
        }
        return 'Standard Strategy: Direct engagement with decision makers';
    }

    recommendContactTiming(record) {
        const acquisitionImpact = this.calculateAcquisitionImpact(record);
        const leadershipRisk = this.assessLeadershipRisk(record);
        
        if (acquisitionImpact.includes('Recent')) {
            return 'Wait 3-6 months (Integration settling) OR Contact immediately (Integration solutions)';
        } else if (leadershipRisk.includes('High')) {
            return 'Contact soon (Leadership may change)';
        } else if (record['Public/Private'] === 'Public') {
            return 'Quarterly timing (Align with earnings cycles)';
        }
        return 'Standard timing (No special considerations)';
    }

    generateKeyTalkingPoints(record) {
        const points = [];
        const corporateStatus = record['Corporate Status'];
        const industry = record['Industry'] || '';
        
        if (corporateStatus === 'Parent Company') {
            points.push('Portfolio optimization opportunities');
            points.push('Multi-subsidiary efficiency gains');
        }
        
        if (this.calculateAcquisitionImpact(record).includes('Recent')) {
            points.push('Integration support and efficiency');
            points.push('Change management solutions');
        }
        
        if (record['Public/Private'] === 'Public') {
            points.push('Investor relations and transparency');
            points.push('Regulatory compliance solutions');
        }
        
        if (industry.includes('Technology')) {
            points.push('Digital transformation acceleration');
            points.push('Scalability and innovation');
        }
        
        return points.length > 0 ? points.join('; ') : 'Standard value proposition';
    }

    identifyRiskFactors(record) {
        const risks = [];
        
        if (this.assessLeadershipRisk(record).includes('High')) {
            risks.push('Executive transition risk');
        }
        
        if (this.calculateAcquisitionImpact(record).includes('Recent')) {
            risks.push('Integration disruption risk');
        }
        
        if (record['Parent Company'].includes('Private Equity')) {
            risks.push('PE exit strategy risk');
        }
        
        if (this.assessTerritoryStability(record).includes('Unstable')) {
            risks.push('Territory/ownership changes');
        }
        
        return risks.length > 0 ? risks.join('; ') : 'Low risk profile';
    }

    // UTILITY METHODS
    assessIntegrationStatus(record) {
        const changeDate = record['Change Date'] || '';
        if (!changeDate || record['Corporate Status'] === 'Independent') return 'N/A';
        
        const monthsSince = (new Date() - new Date(changeDate)) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsSince <= 6) return 'Early Integration';
        if (monthsSince <= 18) return 'Active Integration';
        if (monthsSince <= 36) return 'Stabilizing';
        return 'Fully Integrated';
    }

    assessParentInfluence(record) {
        const parent = record['Parent Company'] || '';
        if (!parent) return 'None';
        
        if (parent.includes('KKR') || parent.includes('Permira')) return 'High (Private Equity)';
        if (parent.includes('Technology') || parent.includes('Holdings')) return 'Moderate (Strategic)';
        return 'Moderate (Corporate)';
    }

    assessTerritoryStability(record) {
        const acquisitionImpact = this.calculateAcquisitionImpact(record);
        if (acquisitionImpact.includes('Recent')) return 'Unstable';
        if (record['Corporate Status'] === 'Independent') return 'Very Stable';
        return 'Stable';
    }

    assessMarketPosition(record) {
        const corporateStatus = record['Corporate Status'];
        if (corporateStatus === 'Parent Company') return 'Market Consolidator';
        if (record['Public/Private'] === 'Public') return 'Public Market Leader';
        if (corporateStatus === 'Subsidiary') return 'Acquired Asset';
        return 'Independent Competitor';
    }

    async generateEnhancedCSV() {
        console.log('\n📄 Generating enhanced CSV with derivative intelligence...');
        
        // Create v5 directory
        if (!fs.existsSync('outputs/v5')) {
            fs.mkdirSync('outputs/v5', { recursive: true });
        }

        const csvWriter = createObjectCsvWriter({
            path: 'outputs/v5/executive-intelligence-enhanced-v5.csv',
            header: [
                // Core Company Data
                { id: 'Company Name', title: 'Company Name' },
                { id: 'Website', title: 'Website' },
                { id: 'Account Owner', title: 'Account Owner' },
                { id: 'Corporate Status', title: 'Corporate Status' },
                { id: 'Parent Company', title: 'Parent Company' },
                { id: 'Public/Private', title: 'Public/Private' },
                { id: 'Industry', title: 'Industry' },
                { id: 'Headquarters', title: 'Headquarters' },
                
                // Executive Information
                { id: 'CEO Name', title: 'CEO Name' },
                { id: 'CEO Title', title: 'CEO Title' },
                { id: 'Finance Leader Name', title: 'Finance Leader Name' },
                { id: 'Finance Leader Title', title: 'Finance Leader Title' },
                
                // SMART CONTACT STRATEGY
                { id: 'primaryContactTarget', title: 'Primary Contact Target' },
                { id: 'decisionMakerLevel', title: 'Decision Maker Level' },
                { id: 'budgetAuthority', title: 'Budget Authority' },
                { id: 'contactComplexity', title: 'Contact Complexity' },
                
                // ACQUISITION INTELLIGENCE
                { id: 'acquisitionImpact', title: 'Acquisition Impact' },
                { id: 'integrationStatus', title: 'Integration Status' },
                { id: 'parentInfluence', title: 'Parent Influence' },
                { id: 'territoryStability', title: 'Territory Stability' },
                
                // EXECUTIVE INTELLIGENCE
                { id: 'executiveStability', title: 'Executive Stability' },
                { id: 'leadershipRisk', title: 'Leadership Risk' },
                { id: 'contactPriority', title: 'Contact Priority' },
                
                // STRATEGIC INSIGHTS
                { id: 'marketPosition', title: 'Market Position' },
                { id: 'growthIndicators', title: 'Growth Indicators' },
                { id: 'competitiveContext', title: 'Competitive Context' },
                
                // ACTIONABLE RECOMMENDATIONS
                { id: 'salesStrategy', title: 'Recommended Sales Strategy' },
                { id: 'contactTiming', title: 'Optimal Contact Timing' },
                { id: 'keyTalkingPoints', title: 'Key Talking Points' },
                { id: 'riskFactors', title: 'Risk Factors' },
                
                // Metadata
                { id: 'Last Updated', title: 'Last Updated' }
            ]
        });

        await csvWriter.writeRecords(this.enhancedData);
        console.log('   ✅ Generated: outputs/v5/executive-intelligence-enhanced-v5.csv');
        
        // Generate summary
        this.generateEnhancementSummary();
    }

    generateEnhancementSummary() {
        console.log('\n📊 DERIVATIVE DATA ENHANCEMENT SUMMARY');
        console.log('=' .repeat(60));
        
        const priorities = {};
        const strategies = {};
        const risks = {};
        
        this.enhancedData.forEach(record => {
            // Count priorities
            const priority = record.contactPriority;
            priorities[priority] = (priorities[priority] || 0) + 1;
            
            // Count strategies  
            const strategy = record.salesStrategy.split(':')[0];
            strategies[strategy] = (strategies[strategy] || 0) + 1;
            
            // Count risks
            const risk = record.leadershipRisk.split(' ')[0];
            risks[risk] = (risks[risk] || 0) + 1;
        });
        
        console.log('🎯 CONTACT PRIORITY DISTRIBUTION:');
        Object.entries(priorities).forEach(([priority, count]) => {
            console.log(`   ${priority}: ${count}`);
        });
        
        console.log('\n📈 SALES STRATEGY DISTRIBUTION:');
        Object.entries(strategies).forEach(([strategy, count]) => {
            console.log(`   ${strategy}: ${count}`);
        });
        
        console.log('\n⚠️ LEADERSHIP RISK DISTRIBUTION:');
        Object.entries(risks).forEach(([risk, count]) => {
            console.log(`   ${risk}: ${count}`);
        });
        
        console.log('\n🎯 KEY VALUE ADDITIONS:');
        console.log('   • Smart contact targeting based on corporate structure');
        console.log('   • Acquisition impact analysis for timing decisions');
        console.log('   • Executive stability scoring for relationship planning');
        console.log('   • Strategic talking points tailored to company situation');
        console.log('   • Risk factor identification for account management');
    }
}

async function main() {
    const enhancer = new SmartDerivativeEnhancer();
    await enhancer.enhanceWithDerivativeData();
    
    console.log('\n🎉 SMART DERIVATIVE ENHANCEMENT COMPLETE!');
    console.log('📊 Enhanced CSV with actionable business intelligence generated');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DataEnhancer };
