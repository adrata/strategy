#!/usr/bin/env node

/**
 * 🔑 API KEYS SETUP AND VALIDATION
 * 
 * Ensures all required API keys are available for pipeline execution
 * Validates keys and provides setup instructions if missing
 */

const fs = require('fs');
const path = require('path');

class APIKeySetup {
    constructor() {
        // Required API keys for all pipelines
        this.requiredKeys = {
            // Core AI Services
            PERPLEXITY_API_KEY: {
                description: 'Perplexity AI for executive research and web intelligence',
                required: true,
                priority: 'CRITICAL'
            },
            OPENAI_API_KEY: {
                description: 'OpenAI for buyer group analysis and advanced AI features',
                required: true,
                priority: 'CRITICAL'
            },
            
            // Contact Intelligence
            CORESIGNAL_API_KEY: {
                description: 'CoreSignal for people data (emails, experience, salary)',
                required: true,
                priority: 'HIGH'
            },
            LUSHA_API_KEY: {
                description: 'Lusha for contact discovery and validation',
                required: true,
                priority: 'HIGH'
            },
            
            // Email Validation
            ZEROBOUNCE_API_KEY: {
                description: 'ZeroBounce for email validation',
                required: true,
                priority: 'MEDIUM'
            },
            MYEMAILVERIFIER_API_KEY: {
                description: 'MyEmailVerifier for additional email validation',
                required: false,
                priority: 'LOW'
            },
            DROPCONTACT_API_KEY: {
                description: 'DropContact for email enrichment',
                required: false,
                priority: 'LOW'
            },
            PROSPEO_API_KEY: {
                description: 'Prospeo for email discovery',
                required: false,
                priority: 'LOW'
            },
            
            // Phone Validation
            TWILIO_ACCOUNT_SID: {
                description: 'Twilio Account SID for phone validation',
                required: false,
                priority: 'LOW'
            },
            TWILIO_AUTH_TOKEN: {
                description: 'Twilio Auth Token for phone validation',
                required: false,
                priority: 'LOW'
            },
            
            // Optional Services
            NEWS_API_KEY: {
                description: 'News API for intelligence gathering',
                required: false,
                priority: 'LOW'
            },
            GOOGLE_SEARCH_API_KEY: {
                description: 'Google Search API for additional intelligence',
                required: false,
                priority: 'LOW'
            },
            GOOGLE_SEARCH_ENGINE_ID: {
                description: 'Google Search Engine ID',
                required: false,
                priority: 'LOW'
            }
        };
    }

    /**
     * Check all API keys and report status
     */
    checkAPIKeys() {
        console.log('🔑 API KEYS VALIDATION');
        console.log('=' .repeat(80));
        
        const results = {
            critical: { available: 0, missing: 0, keys: [] },
            high: { available: 0, missing: 0, keys: [] },
            medium: { available: 0, missing: 0, keys: [] },
            low: { available: 0, missing: 0, keys: [] }
        };
        
        for (const [keyName, config] of Object.entries(this.requiredKeys)) {
            const value = process.env[keyName];
            const isAvailable = value && value.length > 0;
            const priority = config.priority.toLowerCase();
            
            if (isAvailable) {
                results[priority].available++;
                results[priority].keys.push({ name: keyName, status: 'AVAILABLE', description: config.description });
                console.log(`✅ ${keyName}: Available (${this.maskKey(value)})`);
            } else {
                results[priority].missing++;
                results[priority].keys.push({ name: keyName, status: 'MISSING', description: config.description });
                const required = config.required ? '🚨 REQUIRED' : '⚠️ Optional';
                console.log(`❌ ${keyName}: Missing ${required}`);
            }
        }
        
        this.printSummary(results);
        return results;
    }

    /**
     * Mask API key for security (show first 4 and last 4 characters)
     */
    maskKey(key) {
        if (!key || key.length < 8) return 'sk-***';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }

    /**
     * Print summary and recommendations
     */
    printSummary(results) {
        console.log('\n📊 API KEYS SUMMARY');
        console.log('=' .repeat(80));
        
        console.log(`🚨 CRITICAL: ${results.critical.available}/${results.critical.available + results.critical.missing} available`);
        console.log(`🔥 HIGH: ${results.high.available}/${results.high.available + results.high.missing} available`);
        console.log(`⚠️ MEDIUM: ${results.medium.available}/${results.medium.available + results.medium.missing} available`);
        console.log(`ℹ️ LOW: ${results.low.available}/${results.low.available + results.low.missing} available`);
        
        // Check if pipelines can run
        const criticalMissing = results.critical.missing > 0;
        const highMissing = results.high.missing > 0;
        
        console.log('\n🎯 PIPELINE READINESS:');
        if (criticalMissing) {
            console.log('❌ PIPELINES CANNOT RUN - Missing critical API keys');
            console.log('   Required: PERPLEXITY_API_KEY, OPENAI_API_KEY');
        } else if (highMissing) {
            console.log('⚠️ PIPELINES CAN RUN - But with limited functionality');
            console.log('   Missing high-priority keys will reduce contact intelligence');
        } else {
            console.log('✅ PIPELINES READY - All critical and high-priority keys available');
        }
        
        if (criticalMissing || highMissing) {
            this.printSetupInstructions(results);
        }
    }

    /**
     * Print setup instructions for missing keys
     */
    printSetupInstructions(results) {
        console.log('\n🔧 SETUP INSTRUCTIONS:');
        console.log('=' .repeat(80));
        
        const missingCritical = results.critical.keys.filter(k => k.status === 'MISSING');
        const missingHigh = results.high.keys.filter(k => k.status === 'MISSING');
        
        if (missingCritical.length > 0) {
            console.log('\n🚨 CRITICAL API KEYS (Required):');
            missingCritical.forEach(key => {
                console.log(`   ${key.name}: ${key.description}`);
            });
        }
        
        if (missingHigh.length > 0) {
            console.log('\n🔥 HIGH PRIORITY API KEYS (Recommended):');
            missingHigh.forEach(key => {
                console.log(`   ${key.name}: ${key.description}`);
            });
        }
        
        console.log('\n📝 TO SET UP API KEYS:');
        console.log('1. Copy the main project .env file:');
        console.log('   cp ../.env .');
        console.log('');
        console.log('2. Or set environment variables directly:');
        console.log('   export PERPLEXITY_API_KEY="your_key_here"');
        console.log('   export OPENAI_API_KEY="your_key_here"');
        console.log('   export CORESIGNAL_API_KEY="your_key_here"');
        console.log('   export LUSHA_API_KEY="your_key_here"');
        console.log('');
        console.log('3. Or create a local .env file in this directory');
    }

    /**
     * Copy API keys from main project if available
     */
    async copyKeysFromMainProject() {
        const mainEnvPath = path.join(__dirname, '../.env');
        const mainEnvLocalPath = path.join(__dirname, '../.env.local');
        const localEnvPath = path.join(__dirname, '.env');
        
        if (fs.existsSync(mainEnvPath) || fs.existsSync(mainEnvLocalPath)) {
            console.log('\n🔄 Copying API keys from main project...');
            
            try {
                // Read main .env files (both .env and .env.local)
                let allEnvContent = '';
                
                if (fs.existsSync(mainEnvPath)) {
                    allEnvContent += fs.readFileSync(mainEnvPath, 'utf8') + '\n';
                }
                
                if (fs.existsSync(mainEnvLocalPath)) {
                    allEnvContent += fs.readFileSync(mainEnvLocalPath, 'utf8') + '\n';
                }
                
                // Extract relevant API keys
                const relevantKeys = [];
                const lines = allEnvContent.split('\n');
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine && !trimmedLine.startsWith('#')) {
                        const [key] = trimmedLine.split('=');
                        if (this.requiredKeys[key]) {
                            relevantKeys.push(trimmedLine);
                        }
                    }
                }
                
                if (relevantKeys.length > 0) {
                    // Create local .env file with relevant keys
                    const localEnvContent = [
                        '# API Keys for Top100 Pipeline',
                        '# Copied from main project .env file',
                        '',
                        ...relevantKeys
                    ].join('\n');
                    
                    fs.writeFileSync(localEnvPath, localEnvContent);
                    console.log(`✅ Copied ${relevantKeys.length} API keys to local .env file`);
                    
                    // Load the new environment variables
                    require('dotenv').config({ path: localEnvPath });
                    
                    return true;
                } else {
                    console.log('⚠️ No relevant API keys found in main project .env file');
                    return false;
                }
                
            } catch (error) {
                console.error(`❌ Failed to copy API keys: ${error.message}`);
                return false;
            }
        } else {
            console.log('⚠️ Main project .env file not found');
            return false;
        }
    }

    /**
     * Auto-setup API keys and validate
     */
    async autoSetup() {
        console.log('🚀 AUTO-SETUP API KEYS FOR PIPELINES');
        console.log('=' .repeat(80));
        
        // Try to load existing .env file
        const localEnvPath = path.join(__dirname, '.env');
        if (fs.existsSync(localEnvPath)) {
            console.log('📁 Loading existing local .env file...');
            require('dotenv').config({ path: localEnvPath });
        }
        
        // Check current status
        let results = this.checkAPIKeys();
        
        // If critical keys are missing, try to copy from main project
        if (results.critical.missing > 0) {
            const copied = await this.copyKeysFromMainProject();
            if (copied) {
                console.log('\n🔄 Re-checking API keys after copy...');
                results = this.checkAPIKeys();
            }
        }
        
        return results;
    }
}

// Run auto-setup when script is executed directly
if (require.main === module) {
    const setup = new APIKeySetup();
    setup.autoSetup().then(results => {
        const canRun = results.critical.missing === 0;
        process.exit(canRun ? 0 : 1);
    });
}

module.exports = { APIKeySetup };
