#!/usr/bin/env node

/**
 * 💰 API COST OPTIMIZER MODULE
 * 
 * Comprehensive API cost tracking and optimization system:
 * 1. Real-time cost tracking for all API calls
 * 2. Cost-per-contact optimization
 * 3. API usage analytics and recommendations
 * 4. Budget management and alerts
 * 5. ROI calculation and reporting
 */

class ApiCostOptimizer {
    constructor(config = {}) {
        this.config = {
            MONTHLY_BUDGET: config.MONTHLY_BUDGET || 1000, // $1000 default monthly budget
            COST_PER_CONTACT_TARGET: config.COST_PER_CONTACT_TARGET || 0.50, // $0.50 target
            ALERT_THRESHOLD: config.ALERT_THRESHOLD || 0.8, // 80% budget threshold
            ...config
        };

        // Current API pricing (August 2025)
        this.apiPricing = {
            // Email Validation
            zerobounce: { cost: 0.007, name: 'ZeroBounce', type: 'email_validation' },
            myemailverifier: { cost: 0.003, name: 'MyEmailVerifier', type: 'email_validation' },
            
            // Email Discovery
            prospeo: { cost: 0.0198, name: 'Prospeo', type: 'email_discovery' },
            dropcontact: { cost: 0.02, name: 'DropContact', type: 'email_discovery' },
            
            // Contact Intelligence
            lusha: { cost: 0.08, name: 'Lusha', type: 'contact_intelligence' },
            coresignal: { cost: 0.05, name: 'CoreSignal', type: 'contact_intelligence' },
            
            // Phone Validation
            twilio: { cost: 0.008, name: 'Twilio Lookup', type: 'phone_validation' },
            
            // AI Research
            perplexity: { cost: 0.002, name: 'Perplexity AI', type: 'ai_research' },
            openai: { cost: 0.001, name: 'OpenAI GPT-4', type: 'ai_research' }
        };

        this.costTracking = {
            totalCost: 0,
            costByApi: {},
            costByType: {},
            contactsProcessed: 0,
            costPerContact: 0,
            monthlySpend: 0,
            budgetRemaining: 0,
            recommendations: []
        };

        this.initializeCostTracking();
    }

    /**
     * 📊 INITIALIZE COST TRACKING
     */
    initializeCostTracking() {
        // Initialize cost tracking for each API
        Object.keys(this.apiPricing).forEach(api => {
            this.costTracking.costByApi[api] = {
                totalCost: 0,
                callCount: 0,
                avgCostPerCall: 0,
                successRate: 0,
                roi: 0
            };
        });

        // Initialize cost tracking by type
        const types = [...new Set(Object.values(this.apiPricing).map(p => p.type))];
        types.forEach(type => {
            this.costTracking.costByType[type] = {
                totalCost: 0,
                callCount: 0,
                successRate: 0
            };
        });
    }

    /**
     * 💰 TRACK API CALL COST
     */
    trackApiCall(apiName, success = true, customCost = null) {
        const pricing = this.apiPricing[apiName];
        if (!pricing) {
            console.warn(`⚠️ Unknown API: ${apiName}`);
            return 0;
        }

        const cost = customCost || pricing.cost;
        
        // Update total cost
        this.costTracking.totalCost += cost;
        
        // Update API-specific tracking
        const apiTracking = this.costTracking.costByApi[apiName];
        apiTracking.totalCost += cost;
        apiTracking.callCount++;
        apiTracking.avgCostPerCall = apiTracking.totalCost / apiTracking.callCount;
        apiTracking.successRate = success ? 
            (apiTracking.successRate * (apiTracking.callCount - 1) + 1) / apiTracking.callCount :
            (apiTracking.successRate * (apiTracking.callCount - 1)) / apiTracking.callCount;

        // Update type-specific tracking
        const typeTracking = this.costTracking.costByType[pricing.type];
        typeTracking.totalCost += cost;
        typeTracking.callCount++;
        typeTracking.successRate = success ?
            (typeTracking.successRate * (typeTracking.callCount - 1) + 1) / typeTracking.callCount :
            (typeTracking.successRate * (typeTracking.callCount - 1)) / typeTracking.callCount;

        console.log(`💰 API Cost: ${pricing.name} - $${cost.toFixed(4)} (Success: ${success})`);
        
        return cost;
    }

    /**
     * 📈 UPDATE CONTACT PROCESSING METRICS
     */
    updateContactMetrics(contactsProcessed = 1) {
        this.costTracking.contactsProcessed += contactsProcessed;
        this.costTracking.costPerContact = this.costTracking.totalCost / this.costTracking.contactsProcessed;
        
        // Check if we're exceeding target cost per contact
        if (this.costTracking.costPerContact > this.config.COST_PER_CONTACT_TARGET) {
            this.addRecommendation('cost_per_contact_high', 
                `Cost per contact ($${this.costTracking.costPerContact.toFixed(4)}) exceeds target ($${this.config.COST_PER_CONTACT_TARGET})`);
        }
    }

    /**
     * 🎯 OPTIMIZE API USAGE
     */
    optimizeApiUsage() {
        const recommendations = [];

        // Analyze email validation efficiency
        const zbCost = this.costTracking.costByApi.zerobounce;
        const mevCost = this.costTracking.costByApi.myemailverifier;
        
        if (zbCost.callCount > 0 && mevCost.callCount > 0) {
            const zbEfficiency = zbCost.successRate / zbCost.avgCostPerCall;
            const mevEfficiency = mevCost.successRate / mevCost.avgCostPerCall;
            
            if (mevEfficiency > zbEfficiency * 1.2) {
                recommendations.push({
                    type: 'api_optimization',
                    priority: 'high',
                    message: 'MyEmailVerifier shows better cost efficiency than ZeroBounce',
                    action: 'Consider using MyEmailVerifier as primary email validator',
                    potentialSavings: (zbCost.avgCostPerCall - mevCost.avgCostPerCall) * zbCost.callCount
                });
            }
        }

        // Analyze contact intelligence ROI
        const lushaCost = this.costTracking.costByApi.lusha;
        const coresignalCost = this.costTracking.costByApi.coresignal;
        
        if (lushaCost.callCount > 0 && coresignalCost.callCount > 0) {
            const lushaRoi = lushaCost.successRate / lushaCost.avgCostPerCall;
            const coresignalRoi = coresignalCost.successRate / coresignalCost.avgCostPerCall;
            
            if (coresignalRoi > lushaRoi * 1.5) {
                recommendations.push({
                    type: 'api_optimization',
                    priority: 'medium',
                    message: 'CoreSignal shows better ROI than Lusha for contact intelligence',
                    action: 'Prioritize CoreSignal over Lusha for contact discovery',
                    potentialSavings: (lushaCost.avgCostPerCall - coresignalCost.avgCostPerCall) * lushaCost.callCount
                });
            }
        }

        // Check for redundant API calls
        const emailValidationCalls = this.costTracking.costByType.email_validation.callCount;
        const emailDiscoveryCalls = this.costTracking.costByType.email_discovery.callCount;
        
        if (emailValidationCalls > emailDiscoveryCalls * 2) {
            recommendations.push({
                type: 'redundancy_reduction',
                priority: 'medium',
                message: 'High validation-to-discovery ratio detected',
                action: 'Implement smarter email pattern generation to reduce validation calls',
                potentialSavings: (emailValidationCalls - emailDiscoveryCalls) * 0.005
            });
        }

        this.costTracking.recommendations = recommendations;
        return recommendations;
    }

    /**
     * 📊 GENERATE COST REPORT
     */
    generateCostReport() {
        const report = {
            summary: {
                totalCost: this.costTracking.totalCost,
                contactsProcessed: this.costTracking.contactsProcessed,
                costPerContact: this.costTracking.costPerContact,
                budgetUtilization: (this.costTracking.totalCost / this.config.MONTHLY_BUDGET) * 100,
                targetMet: this.costTracking.costPerContact <= this.config.COST_PER_CONTACT_TARGET
            },
            apiBreakdown: {},
            typeBreakdown: {},
            recommendations: this.costTracking.recommendations,
            projections: this.calculateProjections()
        };

        // API breakdown
        Object.keys(this.costTracking.costByApi).forEach(api => {
            const data = this.costTracking.costByApi[api];
            if (data.callCount > 0) {
                report.apiBreakdown[api] = {
                    name: this.apiPricing[api].name,
                    totalCost: data.totalCost,
                    callCount: data.callCount,
                    avgCostPerCall: data.avgCostPerCall,
                    successRate: data.successRate,
                    costPercentage: (data.totalCost / this.costTracking.totalCost) * 100
                };
            }
        });

        // Type breakdown
        Object.keys(this.costTracking.costByType).forEach(type => {
            const data = this.costTracking.costByType[type];
            if (data.callCount > 0) {
                report.typeBreakdown[type] = {
                    totalCost: data.totalCost,
                    callCount: data.callCount,
                    successRate: data.successRate,
                    costPercentage: (data.totalCost / this.costTracking.totalCost) * 100
                };
            }
        });

        return report;
    }

    /**
     * 📈 CALCULATE PROJECTIONS
     */
    calculateProjections() {
        const currentRate = this.costTracking.costPerContact;
        const contactsPerDay = this.costTracking.contactsProcessed; // Assuming current session is daily
        
        return {
            dailyCost: currentRate * contactsPerDay,
            weeklyCost: currentRate * contactsPerDay * 7,
            monthlyCost: currentRate * contactsPerDay * 30,
            projectedMonthlyContacts: contactsPerDay * 30,
            budgetRunoutDate: this.calculateBudgetRunoutDate(currentRate * contactsPerDay)
        };
    }

    /**
     * 📅 CALCULATE BUDGET RUNOUT DATE
     */
    calculateBudgetRunoutDate(dailyCost) {
        if (dailyCost <= 0) return null;
        
        const remainingBudget = this.config.MONTHLY_BUDGET - this.costTracking.totalCost;
        const daysRemaining = Math.floor(remainingBudget / dailyCost);
        
        const runoutDate = new Date();
        runoutDate.setDate(runoutDate.getDate() + daysRemaining);
        
        return runoutDate.toISOString().split('T')[0];
    }

    /**
     * ⚠️ ADD RECOMMENDATION
     */
    addRecommendation(type, message, action = null, priority = 'medium') {
        this.costTracking.recommendations.push({
            type,
            message,
            action,
            priority,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 📊 GET REAL-TIME METRICS
     */
    getRealTimeMetrics() {
        return {
            totalCost: this.costTracking.totalCost,
            costPerContact: this.costTracking.costPerContact,
            contactsProcessed: this.costTracking.contactsProcessed,
            budgetUtilization: (this.costTracking.totalCost / this.config.MONTHLY_BUDGET) * 100,
            targetMet: this.costTracking.costPerContact <= this.config.COST_PER_CONTACT_TARGET,
            topCostApis: this.getTopCostApis(),
            recommendations: this.costTracking.recommendations.slice(-3) // Last 3 recommendations
        };
    }

    /**
     * 🔝 GET TOP COST APIS
     */
    getTopCostApis() {
        return Object.entries(this.costTracking.costByApi)
            .filter(([_, data]) => data.callCount > 0)
            .sort((a, b) => b[1].totalCost - a[1].totalCost)
            .slice(0, 5)
            .map(([api, data]) => ({
                name: this.apiPricing[api].name,
                cost: data.totalCost,
                calls: data.callCount,
                successRate: data.successRate
            }));
    }
}

module.exports = { ApiCostOptimizer };
