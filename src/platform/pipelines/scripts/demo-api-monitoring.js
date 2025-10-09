#!/usr/bin/env node

/**
 * API Monitoring Demo
 * Demonstrates the API credit monitoring system with simulated usage
 */

const ApiCreditMonitor = require('../modules/core/ApiCreditMonitor');
const ApiUsageLogger = require('../modules/core/ApiUsageLogger');

async function demoApiMonitoring() {
    console.log('🧪 API MONITORING DEMO');
    console.log('=' .repeat(50));
    
    try {
        // Initialize monitoring components
        const apiMonitor = new ApiCreditMonitor({
            CORESIGNAL_CREDIT_LIMIT: 100,  // $100 limit for demo
            LUSHA_CREDIT_LIMIT: 50,        // $50 limit for demo
            ZEROBOUNCE_CREDIT_LIMIT: 25,   // $25 limit for demo
            PERPLEXITY_CREDIT_LIMIT: 75,   // $75 limit for demo
            PDL_CREDIT_LIMIT: 30           // $30 limit for demo
        });
        const apiLogger = new ApiUsageLogger();
        
        console.log('📊 Simulating API usage...\n');
        
        // Simulate CoreSignal usage (will trigger warning at 80%)
        console.log('🔍 Simulating CoreSignal API calls...');
        for (let i = 0; i < 8; i++) {
            await apiMonitor.logApiUsage('CORESIGNAL', 'preview', 1, { company: `company-${i}` });
            await apiLogger.logApiUsage({
                service: 'CORESIGNAL',
                operation: 'preview',
                count: 1,
                cost: 0.1,
                daily_total: (i + 1) * 0.1,
                service_total: (i + 1) * 0.1,
                metadata: { company: `company-${i}` }
            });
        }
        
        // Simulate Lusha usage (will trigger critical at 95%)
        console.log('\n🔍 Simulating Lusha API calls...');
        for (let i = 0; i < 30; i++) {
            await apiMonitor.logApiUsage('LUSHA', 'person_lookup', 1, { person: `person-${i}` });
            await apiLogger.logApiUsage({
                service: 'LUSHA',
                operation: 'person_lookup',
                count: 1,
                cost: 0.15,
                daily_total: (i + 1) * 0.15,
                service_total: (i + 1) * 0.15,
                metadata: { person: `person-${i}` }
            });
        }
        
        // Simulate ZeroBounce usage
        console.log('\n🔍 Simulating ZeroBounce API calls...');
        for (let i = 0; i < 10; i++) {
            await apiMonitor.logApiUsage('ZEROBOUNCE', 'email_verify', 1, { email: `email-${i}` });
            await apiLogger.logApiUsage({
                service: 'ZEROBOUNCE',
                operation: 'email_verify',
                count: 1,
                cost: 0.005,
                daily_total: (i + 1) * 0.005,
                service_total: (i + 1) * 0.005,
                metadata: { email: `email-${i}` }
            });
        }
        
        // Check current status
        console.log('\n📊 Current API Usage Status:');
        const usageSummary = apiMonitor.getUsageSummary();
        
        Object.keys(usageSummary.services).forEach(service => {
            const serviceInfo = usageSummary.services[service];
            const status = serviceInfo.usage_percentage >= 95 ? '🚨 CRITICAL' : 
                          serviceInfo.usage_percentage >= 80 ? '⚠️ WARNING' : '✅ OK';
            
            console.log(`   ${service}: ${status}`);
            console.log(`     Usage: $${serviceInfo.total_cost.toFixed(2)}/${serviceInfo.credit_limit} (${serviceInfo.usage_percentage}%)`);
            console.log(`     Remaining: $${serviceInfo.remaining_credits.toFixed(2)}`);
        });
        
        // Check for alerts
        console.log('\n🚨 Recent Alerts:');
        const recentAlerts = apiMonitor.getRecentAlerts(1);
        if (recentAlerts.length === 0) {
            console.log('   ✅ No recent alerts');
        } else {
            recentAlerts.forEach(alert => {
                console.log(`   ${alert.level}: ${alert.message}`);
            });
        }
        
        // Test pipeline stop conditions
        console.log('\n🛑 Pipeline Stop Conditions:');
        const services = ['CORESIGNAL', 'LUSHA', 'ZEROBOUNCE', 'PERPLEXITY', 'PEOPLE_DATA_LABS'];
        services.forEach(service => {
            const shouldStop = apiMonitor.shouldStopPipeline(service);
            console.log(`   ${service}: ${shouldStop ? '🛑 STOP' : '✅ CONTINUE'}`);
        });
        
        // Generate analytics
        console.log('\n📈 Usage Analytics:');
        const analytics = apiLogger.getUsageAnalytics(1); // Last 1 day
        console.log(`   Total API Calls: ${analytics.total_api_calls}`);
        console.log(`   Total Cost: $${analytics.total_cost.toFixed(2)}`);
        
        // Cost projections
        console.log('\n🔮 Cost Projections:');
        const projections = apiLogger.getCostProjections();
        console.log(`   Daily Average: $${projections.daily_average_cost}`);
        console.log(`   Monthly Projection: $${projections.monthly_projection}`);
        
        console.log('\n✅ Demo completed successfully!');
        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Real-time API usage tracking');
        console.log('   ✅ Credit limit monitoring with alerts');
        console.log('   ✅ Pipeline stop conditions');
        console.log('   ✅ Cost calculations and projections');
        console.log('   ✅ Database logging for analysis');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    }
}

// Run the demo
if (require.main === module) {
    demoApiMonitoring().catch(console.error);
}

module.exports = { demoApiMonitoring };
