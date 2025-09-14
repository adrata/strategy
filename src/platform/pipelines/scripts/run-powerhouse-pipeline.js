#!/usr/bin/env node

/**
 * 🚀 POWERHOUSE PIPELINE RUNNER
 * 
 * Convenience wrapper to run the powerhouse pipeline with buyer group AI from the root directory
 * Includes automatic API key setup and validation
 */

const { execSync } = require('child_process');
const { APIKeySetup } = require('./setup-api-keys');
const path = require('path');

async function runPowerhousePipeline() {
    console.log('🚀 Running Powerhouse Pipeline with Buyer Group AI...\n');

    // STEP 1: Setup and validate API keys
    console.log('🔑 Setting up API keys...');
    const apiSetup = new APIKeySetup();
    const results = await apiSetup.autoSetup();
    
    // Check if we can proceed
    if (results.critical.missing > 0) {
        console.error('\n❌ Cannot run pipeline - Critical API keys missing');
        console.log('Please set up the required API keys and try again.');
        process.exit(1);
    }
    
    if (results.high.missing > 0) {
        console.log('\n⚠️ Warning: Some high-priority API keys are missing');
        console.log('Pipeline will run but with reduced functionality.\n');
    } else {
        console.log('\n✅ All API keys validated - Full functionality available\n');
    }

    // STEP 2: Run the powerhouse pipeline
    try {
        execSync('node pipelines/powerhouse/powerhouse-pipeline.js', {
            cwd: __dirname,
            stdio: 'inherit',
            env: { ...process.env } // Pass through all environment variables
        });
        
        console.log('\n🎉 Powerhouse Pipeline completed successfully!');
        
    } catch (error) {
        console.error('❌ Powerhouse Pipeline failed:', error.message);
        process.exit(1);
    }
}

// Run the pipeline
runPowerhousePipeline();
