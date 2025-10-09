const fs = require('fs');
const path = require('path');

/**
 * API Credit Monitoring System
 * Tracks API usage, costs, and provides alerts for low credits
 */
class ApiCreditMonitor {
    constructor(config = {}) {
        this.config = config;
        this.usageLogPath = path.join(__dirname, '../../../logs/api-usage.json');
        this.creditAlertsPath = path.join(__dirname, '../../../logs/credit-alerts.json');
        this.dailyUsagePath = path.join(__dirname, '../../../logs/daily-usage.json');
        
        // API cost tracking
        this.apiCosts = {
            CORESIGNAL: {
                preview: 0.1,      // $0.10 per preview
                full_profile: 0.5, // $0.50 per full profile
                company_data: 0.2  // $0.20 per company lookup
            },
            LUSHA: {
                person_lookup: 0.15,  // $0.15 per person lookup
                phone_verify: 0.10,   // $0.10 per phone verification
                email_verify: 0.08    // $0.08 per email verification
            },
            ZEROBOUNCE: {
                email_verify: 0.005   // $0.005 per email verification
            },
            PERPLEXITY: {
                query: 0.20          // $0.20 per query
            },
            PEOPLE_DATA_LABS: {
                person_lookup: 0.12   // $0.12 per person lookup
            }
        };

        // Credit limits (configurable)
        this.creditLimits = {
            CORESIGNAL: config.CORESIGNAL_CREDIT_LIMIT || 1000,  // $1000 limit
            LUSHA: config.LUSHA_CREDIT_LIMIT || 500,             // $500 limit
            ZEROBOUNCE: config.ZEROBOUNCE_CREDIT_LIMIT || 200,   // $200 limit
            PERPLEXITY: config.PERPLEXITY_CREDIT_LIMIT || 300,   // $300 limit
            PEOPLE_DATA_LABS: config.PDL_CREDIT_LIMIT || 200     // $200 limit
        };

        // Alert thresholds (percentage of limit)
        this.alertThresholds = {
            warning: 0.8,    // 80% of limit
            critical: 0.95   // 95% of limit
        };

        this.initializeLogs();
    }

    /**
     * Initialize log files if they don't exist
     */
    initializeLogs() {
        const logDir = path.dirname(this.usageLogPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Initialize usage log
        if (!fs.existsSync(this.usageLogPath)) {
            fs.writeFileSync(this.usageLogPath, JSON.stringify({
                daily_usage: {},
                total_usage: {},
                last_reset: new Date().toISOString().split('T')[0]
            }, null, 2));
        }

        // Initialize alerts log
        if (!fs.existsSync(this.creditAlertsPath)) {
            fs.writeFileSync(this.creditAlertsPath, JSON.stringify({
                alerts: [],
                last_alert_check: new Date().toISOString()
            }, null, 2));
        }
    }

    /**
     * Log API usage and calculate costs
     */
    async logApiUsage(service, operation, count = 1, metadata = {}) {
        const timestamp = new Date().toISOString();
        const cost = this.calculateCost(service, operation, count);
        
        // Load current usage
        const usageData = JSON.parse(fs.readFileSync(this.usageLogPath, 'utf8'));
        const today = new Date().toISOString().split('T')[0];
        
        // Initialize daily usage if not exists
        if (!usageData.daily_usage[today]) {
            usageData.daily_usage[today] = {};
        }
        
        if (!usageData.daily_usage[today][service]) {
            usageData.daily_usage[today][service] = {
                operations: {},
                total_cost: 0,
                total_calls: 0
            };
        }

        // Update daily usage
        const serviceUsage = usageData.daily_usage[today][service];
        if (!serviceUsage.operations[operation]) {
            serviceUsage.operations[operation] = 0;
        }
        
        serviceUsage.operations[operation] += count;
        serviceUsage.total_cost += cost;
        serviceUsage.total_calls += count;

        // Update total usage
        if (!usageData.total_usage[service]) {
            usageData.total_usage[service] = {
                total_cost: 0,
                total_calls: 0,
                last_updated: timestamp
            };
        }
        
        usageData.total_usage[service].total_cost += cost;
        usageData.total_usage[service].total_calls += count;
        usageData.total_usage[service].last_updated = timestamp;

        // Save updated usage
        fs.writeFileSync(this.usageLogPath, JSON.stringify(usageData, null, 2));

        // Check for alerts
        await this.checkCreditAlerts(service);

        console.log(`💰 API Usage: ${service} ${operation} (${count}x) = $${cost.toFixed(4)}`);
        
        return {
            cost,
            daily_total: serviceUsage.total_cost,
            service_total: usageData.total_usage[service].total_cost
        };
    }

    /**
     * Calculate cost for API operation
     */
    calculateCost(service, operation, count) {
        const serviceCosts = this.apiCosts[service];
        if (!serviceCosts || !serviceCosts[operation]) {
            console.warn(`⚠️ Unknown API cost for ${service}.${operation}`);
            return 0;
        }
        
        return serviceCosts[operation] * count;
    }

    /**
     * Check if service is approaching credit limits
     */
    async checkCreditAlerts(service) {
        const usageData = JSON.parse(fs.readFileSync(this.usageLogPath, 'utf8'));
        const serviceUsage = usageData.total_usage[service];
        const creditLimit = this.creditLimits[service];
        
        if (!serviceUsage || !creditLimit) return;

        const usagePercentage = serviceUsage.total_cost / creditLimit;
        const remainingCredits = creditLimit - serviceUsage.total_cost;
        
        let alertLevel = null;
        if (usagePercentage >= this.alertThresholds.critical) {
            alertLevel = 'CRITICAL';
        } else if (usagePercentage >= this.alertThresholds.warning) {
            alertLevel = 'WARNING';
        }

        if (alertLevel) {
            await this.createAlert(service, alertLevel, {
                usage_percentage: Math.round(usagePercentage * 100),
                total_cost: serviceUsage.total_cost,
                remaining_credits: remainingCredits,
                credit_limit: creditLimit
            });
        }
    }

    /**
     * Create and log credit alert
     */
    async createAlert(service, level, details) {
        const alert = {
            timestamp: new Date().toISOString(),
            service,
            level,
            details,
            message: this.generateAlertMessage(service, level, details)
        };

        // Load alerts log
        const alertsData = JSON.parse(fs.readFileSync(this.creditAlertsPath, 'utf8'));
        alertsData.alerts.push(alert);
        alertsData.last_alert_check = new Date().toISOString();

        // Save alerts
        fs.writeFileSync(this.creditAlertsPath, JSON.stringify(alertsData, null, 2));

        // Console alert
        console.log(`🚨 ${level} ALERT: ${alert.message}`);
        
        // Return alert for database logging
        return alert;
    }

    /**
     * Generate human-readable alert message
     */
    generateAlertMessage(service, level, details) {
        const { usage_percentage, total_cost, remaining_credits, credit_limit } = details;
        
        if (level === 'CRITICAL') {
            return `${service} API: CRITICAL - ${usage_percentage}% of credits used ($${total_cost.toFixed(2)}/${
                credit_limit}) - Only $${remaining_credits.toFixed(2)} remaining!`;
        } else {
            return `${service} API: WARNING - ${usage_percentage}% of credits used ($${total_cost.toFixed(2)}/${
                credit_limit}) - $${remaining_credits.toFixed(2)} remaining`;
        }
    }

    /**
     * Get current usage summary
     */
    getUsageSummary() {
        const usageData = JSON.parse(fs.readFileSync(this.usageLogPath, 'utf8'));
        const today = new Date().toISOString().split('T')[0];
        
        const summary = {
            date: today,
            daily_usage: usageData.daily_usage[today] || {},
            total_usage: usageData.total_usage,
            daily_total_cost: 0,
            total_cost: 0,
            services: {}
        };

        // Calculate totals
        Object.keys(usageData.total_usage).forEach(service => {
            const serviceUsage = usageData.total_usage[service];
            summary.total_cost += serviceUsage.total_cost;
            
            summary.services[service] = {
                total_cost: serviceUsage.total_cost,
                total_calls: serviceUsage.total_calls,
                credit_limit: this.creditLimits[service],
                usage_percentage: Math.round((serviceUsage.total_cost / this.creditLimits[service]) * 100),
                remaining_credits: this.creditLimits[service] - serviceUsage.total_cost
            };
        });

        // Calculate daily total
        if (summary.daily_usage) {
            Object.values(summary.daily_usage).forEach(serviceUsage => {
                summary.daily_total_cost += serviceUsage.total_cost;
            });
        }

        return summary;
    }

    /**
     * Check if pipeline should stop due to credit limits
     */
    shouldStopPipeline(service) {
        const summary = this.getUsageSummary();
        const serviceInfo = summary.services[service];
        
        if (!serviceInfo) return false;
        
        // Stop if at or over 95% of credit limit
        return serviceInfo.usage_percentage >= 95;
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts(hours = 24) {
        const alertsData = JSON.parse(fs.readFileSync(this.creditAlertsPath, 'utf8'));
        const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
        
        return alertsData.alerts.filter(alert => 
            new Date(alert.timestamp) > cutoffTime
        );
    }

    /**
     * Export usage data for database logging
     */
    exportForDatabase() {
        const summary = this.getUsageSummary();
        const recentAlerts = this.getRecentAlerts(24);
        
        return {
            usage_summary: summary,
            recent_alerts: recentAlerts,
            export_timestamp: new Date().toISOString()
        };
    }
}

module.exports = ApiCreditMonitor;
