const fs = require('fs');
const path = require('path');

/**
 * API Usage Database Logger
 * Logs API usage and alerts to database for tracking and analysis
 */
class ApiUsageLogger {
    constructor(config = {}) {
        this.config = config;
        this.dbLogPath = path.join(__dirname, '../../../logs/api-usage-db.json');
        this.initializeDatabase();
    }

    /**
     * Initialize database log file
     */
    initializeDatabase() {
        const logDir = path.dirname(this.dbLogPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        if (!fs.existsSync(this.dbLogPath)) {
            const initialData = {
                api_usage_records: [],
                credit_alerts: [],
                daily_summaries: [],
                pipeline_runs: [],
                last_updated: new Date().toISOString()
            };
            fs.writeFileSync(this.dbLogPath, JSON.stringify(initialData, null, 2));
        }
    }

    /**
     * Log API usage record to database
     */
    async logApiUsage(usageData) {
        const record = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            service: usageData.service,
            operation: usageData.operation,
            count: usageData.count,
            cost: usageData.cost,
            daily_total: usageData.daily_total,
            service_total: usageData.service_total,
            metadata: usageData.metadata || {}
        };

        const dbData = JSON.parse(fs.readFileSync(this.dbLogPath, 'utf8'));
        dbData.api_usage_records.push(record);
        dbData.last_updated = new Date().toISOString();
        
        fs.writeFileSync(this.dbLogPath, JSON.stringify(dbData, null, 2));
        
        return record;
    }

    /**
     * Log credit alert to database
     */
    async logCreditAlert(alertData) {
        const record = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            service: alertData.service,
            level: alertData.level,
            message: alertData.message,
            details: alertData.details,
            resolved: false
        };

        const dbData = JSON.parse(fs.readFileSync(this.dbLogPath, 'utf8'));
        dbData.credit_alerts.push(record);
        dbData.last_updated = new Date().toISOString();
        
        fs.writeFileSync(this.dbLogPath, JSON.stringify(dbData, null, 2));
        
        return record;
    }

    /**
     * Log daily usage summary
     */
    async logDailySummary(summaryData) {
        const record = {
            id: this.generateId(),
            date: summaryData.date,
            timestamp: new Date().toISOString(),
            daily_total_cost: summaryData.daily_total_cost,
            total_cost: summaryData.total_cost,
            services: summaryData.services,
            pipeline_runs: summaryData.pipeline_runs || 0,
            companies_processed: summaryData.companies_processed || 0
        };

        const dbData = JSON.parse(fs.readFileSync(this.dbLogPath, 'utf8'));
        dbData.daily_summaries.push(record);
        dbData.last_updated = new Date().toISOString();
        
        fs.writeFileSync(this.dbLogPath, JSON.stringify(dbData, null, 2));
        
        return record;
    }

    /**
     * Log pipeline run with API usage
     */
    async logPipelineRun(pipelineData) {
        const record = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            companies_processed: pipelineData.companies_processed,
            total_cost: pipelineData.total_cost,
            api_usage: pipelineData.api_usage,
            duration_minutes: pipelineData.duration_minutes,
            success_rate: pipelineData.success_rate,
            cfo_found: pipelineData.cfo_found,
            cro_found: pipelineData.cro_found,
            high_confidence_results: pipelineData.high_confidence_results
        };

        const dbData = JSON.parse(fs.readFileSync(this.dbLogPath, 'utf8'));
        dbData.pipeline_runs.push(record);
        dbData.last_updated = new Date().toISOString();
        
        fs.writeFileSync(this.dbLogPath, JSON.stringify(dbData, null, 2));
        
        return record;
    }

    /**
     * Get usage analytics
     */
    getUsageAnalytics(days = 30) {
        const dbData = JSON.parse(fs.readFileSync(this.dbLogPath, 'utf8'));
        const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        
        const analytics = {
            period_days: days,
            total_api_calls: 0,
            total_cost: 0,
            service_breakdown: {},
            daily_averages: {},
            cost_trends: [],
            alert_summary: {
                total_alerts: 0,
                critical_alerts: 0,
                warning_alerts: 0,
                recent_alerts: []
            }
        };

        // Analyze API usage records
        dbData.api_usage_records
            .filter(record => new Date(record.timestamp) > cutoffDate)
            .forEach(record => {
                analytics.total_api_calls += record.count;
                analytics.total_cost += record.cost;
                
                if (!analytics.service_breakdown[record.service]) {
                    analytics.service_breakdown[record.service] = {
                        calls: 0,
                        cost: 0,
                        operations: {}
                    };
                }
                
                analytics.service_breakdown[record.service].calls += record.count;
                analytics.service_breakdown[record.service].cost += record.cost;
                
                if (!analytics.service_breakdown[record.service].operations[record.operation]) {
                    analytics.service_breakdown[record.service].operations[record.operation] = 0;
                }
                analytics.service_breakdown[record.service].operations[record.operation] += record.count;
            });

        // Analyze alerts
        dbData.credit_alerts
            .filter(alert => new Date(alert.timestamp) > cutoffDate)
            .forEach(alert => {
                analytics.alert_summary.total_alerts++;
                if (alert.level === 'CRITICAL') {
                    analytics.alert_summary.critical_alerts++;
                } else if (alert.level === 'WARNING') {
                    analytics.alert_summary.warning_alerts++;
                }
            });

        // Get recent alerts
        analytics.alert_summary.recent_alerts = dbData.credit_alerts
            .filter(alert => new Date(alert.timestamp) > cutoffDate)
            .slice(-10); // Last 10 alerts

        // Calculate daily averages
        analytics.daily_averages = {
            api_calls: Math.round(analytics.total_api_calls / days),
            cost: Math.round((analytics.total_cost / days) * 100) / 100
        };

        return analytics;
    }

    /**
     * Get cost projections
     */
    getCostProjections() {
        const analytics = this.getUsageAnalytics(7); // Last 7 days
        const dailyAvg = analytics.daily_averages;
        
        return {
            daily_average_cost: dailyAvg.cost,
            weekly_projection: dailyAvg.cost * 7,
            monthly_projection: dailyAvg.cost * 30,
            yearly_projection: dailyAvg.cost * 365,
            service_projections: Object.keys(analytics.service_breakdown).reduce((acc, service) => {
                const serviceData = analytics.service_breakdown[service];
                const dailyServiceCost = serviceData.cost / 7; // Last 7 days average
                
                acc[service] = {
                    daily_average: Math.round(dailyServiceCost * 100) / 100,
                    monthly_projection: Math.round(dailyServiceCost * 30 * 100) / 100,
                    yearly_projection: Math.round(dailyServiceCost * 365 * 100) / 100
                };
                return acc;
            }, {})
        };
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export data for external database
     */
    exportData() {
        const dbData = JSON.parse(fs.readFileSync(this.dbLogPath, 'utf8'));
        const analytics = this.getUsageAnalytics(30);
        const projections = this.getCostProjections();
        
        return {
            export_timestamp: new Date().toISOString(),
            database_records: dbData,
            analytics_30_days: analytics,
            cost_projections: projections
        };
    }
}

module.exports = ApiUsageLogger;
