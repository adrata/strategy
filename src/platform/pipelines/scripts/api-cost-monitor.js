#!/usr/bin/env node

/**
 * 🔍 REAL-TIME API COST MONITOR
 * 
 * Monitors API costs during pipeline execution and alerts when thresholds are reached
 */

const fs = require('fs');
const path = require('path');

class ApiCostMonitor {
    constructor() {
        this.costThresholds = {
            coresignal: 50,      // $50 limit
            lusha: 100,         // $100 limit  
            zerobounce: 25,     // $25 limit
            myemailverifier: 25, // $25 limit
            prospeo: 50,        // $50 limit
            perplexity: 30,     // $30 limit
            peopledatalabs: 50, // $50 limit
            twilio: 50          // $50 limit
        };
        
        this.currentCosts = {
            coresignal: 0,
            lusha: 0,
            zerobounce: 0,
            myemailverifier: 0,
            prospeo: 0,
            perplexity: 0,
            peopledatalabs: 0,
            twilio: 0,
            total: 0
        };
        
        this.startTime = new Date();
        this.lastAlert = {};
    }

    /**
     * Monitor API costs from pipeline output
     */
    startMonitoring() {
        console.log('🔍 API Cost Monitor Started');
        console.log('📊 Cost Thresholds:');
        Object.entries(this.costThresholds).forEach(([api, limit]) => {
            console.log(`   ${api}: $${limit}`);
        });
        console.log('');

        // Monitor the pipeline output file
        this.monitorPipelineOutput();
    }

    /**
     * Monitor pipeline output for cost updates
     */
    monitorPipelineOutput() {
        const outputDir = path.join(__dirname, '../outputs');
        
        // Watch for new output files
        if (fs.existsSync(outputDir)) {
            fs.watch(outputDir, (eventType, filename) => {
                if (filename && filename.includes('core-cro-cfo-data.json')) {
                    this.checkCostsFromOutput(path.join(outputDir, filename));
                }
            });
        }

        // Also check every 30 seconds
        setInterval(() => {
            this.checkForOutputFiles();
        }, 30000);
    }

    /**
     * Check for output files and extract costs
     */
    checkForOutputFiles() {
        const outputDir = path.join(__dirname, '../outputs');
        if (!fs.existsSync(outputDir)) return;

        const files = fs.readdirSync(outputDir);
        const latestFile = files
            .filter(f => f.includes('core-cro-cfo-data.json'))
            .sort()
            .pop();

        if (latestFile) {
            this.checkCostsFromOutput(path.join(outputDir, latestFile));
        }
    }

    /**
     * Extract costs from pipeline output
     */
    checkCostsFromOutput(filePath) {
        try {
            if (!fs.existsSync(filePath)) return;
            
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Extract costs from pipeline stats
            if (data.pipelineStats && data.pipelineStats.apiCosts) {
                this.updateCosts(data.pipelineStats.apiCosts);
            }
            
            // Extract costs from individual company results
            if (data.companies) {
                data.companies.forEach(company => {
                    if (company.apiCosts) {
                        this.updateCosts(company.apiCosts);
                    }
                });
            }
            
        } catch (error) {
            // File might be in use, ignore
        }
    }

    /**
     * Update current costs and check thresholds
     */
    updateCosts(newCosts) {
        let hasChanges = false;
        
        Object.entries(newCosts).forEach(([api, cost]) => {
            if (this.currentCosts[api] !== cost) {
                this.currentCosts[api] = cost;
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            this.currentCosts.total = Object.values(this.currentCosts)
                .filter((_, i) => i < Object.keys(this.currentCosts).length - 1)
                .reduce((sum, cost) => sum + cost, 0);
            
            this.displayCosts();
            this.checkThresholds();
        }
    }

    /**
     * Display current costs
     */
    displayCosts() {
        const runtime = Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60);
        
        console.log(`\n💰 API COSTS UPDATE (${runtime}min runtime):`);
        console.log('=====================================');
        
        Object.entries(this.currentCosts).forEach(([api, cost]) => {
            if (api === 'total') {
                console.log(`📊 TOTAL: $${cost.toFixed(2)}`);
            } else {
                const threshold = this.costThresholds[api];
                const percentage = (cost / threshold * 100).toFixed(1);
                const status = cost >= threshold * 0.8 ? '⚠️' : '✅';
                console.log(`   ${status} ${api}: $${cost.toFixed(2)} / $${threshold} (${percentage}%)`);
            }
        });
        console.log('');
    }

    /**
     * Check if any APIs are approaching limits
     */
    checkThresholds() {
        Object.entries(this.costThresholds).forEach(([api, threshold]) => {
            const current = this.currentCosts[api];
            const percentage = (current / threshold) * 100;
            
            // Alert at 80% and 95%
            if (percentage >= 80 && !this.lastAlert[`${api}_80`]) {
                this.sendAlert(api, current, threshold, percentage);
                this.lastAlert[`${api}_80`] = true;
            } else if (percentage >= 95 && !this.lastAlert[`${api}_95`]) {
                this.sendAlert(api, current, threshold, percentage, true);
                this.lastAlert[`${api}_95`] = true;
            }
        });
    }

    /**
     * Send cost alert
     */
    sendAlert(api, current, threshold, percentage, critical = false) {
        const emoji = critical ? '🚨' : '⚠️';
        const message = critical ? 'CRITICAL' : 'WARNING';
        
        console.log(`\n${emoji} ${message}: ${api.toUpperCase()} API COST ALERT`);
        console.log(`   Current: $${current.toFixed(2)}`);
        console.log(`   Limit: $${threshold}`);
        console.log(`   Usage: ${percentage.toFixed(1)}%`);
        
        if (critical) {
            console.log(`   🛑 CONSIDER STOPPING PIPELINE TO ADD FUNDS`);
        } else {
            console.log(`   💡 Consider adding funds soon`);
        }
        console.log('');
    }

    /**
     * Get current cost summary
     */
    getCostSummary() {
        return {
            ...this.currentCosts,
            runtime: Math.round((Date.now() - this.startTime.getTime()) / 1000 / 60),
            thresholds: this.costThresholds
        };
    }
}

// Start monitoring if run directly
if (require.main === module) {
    const monitor = new ApiCostMonitor();
    monitor.startMonitoring();
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🔍 Cost monitoring stopped');
        process.exit(0);
    });
}

module.exports = ApiCostMonitor;
