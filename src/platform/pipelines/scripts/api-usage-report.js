#!/usr/bin/env node

/**
 * API Usage Report Generator
 * Provides detailed API usage analytics and cost projections
 */

const path = require('path');
const ApiCreditMonitor = require('../modules/core/ApiCreditMonitor');
const ApiUsageLogger = require('../modules/core/ApiUsageLogger');

async function generateApiUsageReport() {
    console.log('📊 API USAGE REPORT GENERATOR');
    console.log('=' .repeat(60));
    
    try {
        // Initialize monitoring components
        const apiMonitor = new ApiCreditMonitor();
        const apiLogger = new ApiUsageLogger();
        
        // Get current usage summary
        console.log('\n🔍 CURRENT API USAGE STATUS');
        console.log('-'.repeat(40));
        const usageSummary = apiMonitor.getUsageSummary();
        
        console.log(`📅 Date: ${usageSummary.date}`);
        console.log(`💰 Daily Total: $${usageSummary.daily_total_cost.toFixed(2)}`);
        console.log(`💰 Total Cost: $${usageSummary.total_cost.toFixed(2)}`);
        
        // Service breakdown
        console.log('\n📈 SERVICE BREAKDOWN:');
        Object.keys(usageSummary.services).forEach(service => {
            const serviceInfo = usageSummary.services[service];
            const status = serviceInfo.usage_percentage >= 95 ? '🚨 CRITICAL' : 
                          serviceInfo.usage_percentage >= 80 ? '⚠️ WARNING' : '✅ OK';
            
            console.log(`   ${service}:`);
            console.log(`     Status: ${status}`);
            console.log(`     Usage: $${serviceInfo.total_cost.toFixed(2)}/${serviceInfo.credit_limit} (${serviceInfo.usage_percentage}%)`);
            console.log(`     Remaining: $${serviceInfo.remaining_credits.toFixed(2)}`);
            console.log(`     Total Calls: ${serviceInfo.total_calls.toLocaleString()}`);
            console.log('');
        });
        
        // Recent alerts
        console.log('🚨 RECENT ALERTS (Last 24 hours):');
        const recentAlerts = apiMonitor.getRecentAlerts(24);
        if (recentAlerts.length === 0) {
            console.log('   ✅ No recent alerts');
        } else {
            recentAlerts.forEach(alert => {
                const timeAgo = getTimeAgo(new Date(alert.timestamp));
                console.log(`   ${alert.level}: ${alert.message} (${timeAgo})`);
            });
        }
        
        // Analytics
        console.log('\n📊 30-DAY ANALYTICS:');
        console.log('-'.repeat(40));
        const analytics = apiLogger.getUsageAnalytics(30);
        
        console.log(`Total API Calls: ${analytics.total_api_calls.toLocaleString()}`);
        console.log(`Total Cost: $${analytics.total_cost.toFixed(2)}`);
        console.log(`Daily Average: ${analytics.daily_averages.api_calls} calls, $${analytics.daily_averages.cost}`);
        
        // Service analytics
        console.log('\n📈 SERVICE ANALYTICS:');
        Object.keys(analytics.service_breakdown).forEach(service => {
            const serviceData = analytics.service_breakdown[service];
            console.log(`   ${service}:`);
            console.log(`     Calls: ${serviceData.calls.toLocaleString()}`);
            console.log(`     Cost: $${serviceData.cost.toFixed(2)}`);
            console.log(`     Operations:`);
            Object.keys(serviceData.operations).forEach(operation => {
                console.log(`       ${operation}: ${serviceData.operations[operation].toLocaleString()}`);
            });
            console.log('');
        });
        
        // Cost projections
        console.log('🔮 COST PROJECTIONS:');
        console.log('-'.repeat(40));
        const projections = apiLogger.getCostProjections();
        
        console.log(`Daily Average: $${projections.daily_average_cost}`);
        console.log(`Weekly Projection: $${projections.weekly_projection}`);
        console.log(`Monthly Projection: $${projections.monthly_projection}`);
        console.log(`Yearly Projection: $${projections.yearly_projection}`);
        
        console.log('\n📊 SERVICE PROJECTIONS:');
        Object.keys(projections.service_projections).forEach(service => {
            const proj = projections.service_projections[service];
            console.log(`   ${service}:`);
            console.log(`     Daily: $${proj.daily_average}`);
            console.log(`     Monthly: $${proj.monthly_projection}`);
            console.log(`     Yearly: $${proj.yearly_projection}`);
        });
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(40));
        
        const criticalServices = Object.keys(usageSummary.services).filter(service => 
            usageSummary.services[service].usage_percentage >= 95
        );
        
        const warningServices = Object.keys(usageSummary.services).filter(service => 
            usageSummary.services[service].usage_percentage >= 80 && 
            usageSummary.services[service].usage_percentage < 95
        );
        
        if (criticalServices.length > 0) {
            console.log('🚨 IMMEDIATE ACTION REQUIRED:');
            criticalServices.forEach(service => {
                console.log(`   - ${service}: Purchase additional credits immediately`);
            });
        }
        
        if (warningServices.length > 0) {
            console.log('⚠️ MONITOR CLOSELY:');
            warningServices.forEach(service => {
                console.log(`   - ${service}: Consider purchasing credits soon`);
            });
        }
        
        // Cost optimization suggestions
        const highCostServices = Object.keys(analytics.service_breakdown)
            .sort((a, b) => analytics.service_breakdown[b].cost - analytics.service_breakdown[a].cost)
            .slice(0, 3);
        
        if (highCostServices.length > 0) {
            console.log('\n💰 COST OPTIMIZATION:');
            console.log('   Top cost services to optimize:');
            highCostServices.forEach((service, index) => {
                const cost = analytics.service_breakdown[service].cost;
                console.log(`   ${index + 1}. ${service}: $${cost.toFixed(2)} (${((cost/analytics.total_cost)*100).toFixed(1)}%)`);
            });
        }
        
        // Export data
        console.log('\n💾 EXPORTING DATA:');
        const exportData = apiLogger.exportData();
        const exportPath = path.join(__dirname, '../logs/api-usage-export.json');
        require('fs').writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
        console.log(`   Data exported to: ${exportPath}`);
        
        console.log('\n✅ Report generated successfully!');
        
    } catch (error) {
        console.error('❌ Error generating report:', error.message);
        process.exit(1);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Run the report
if (require.main === module) {
    generateApiUsageReport().catch(console.error);
}

module.exports = { generateApiUsageReport };
