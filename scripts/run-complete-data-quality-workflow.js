require('dotenv').config();

class CompleteDataQualityWorkflow {
  constructor() {
    this.steps = [
      { name: 'Re-enrich Fixed Records', script: 're-enrich-top-fixed-records-lusha.js', optional: true },
      { name: 'Prioritize and Fix Issues', script: 'prioritize-and-fix-data-quality-issues.js' },
      { name: 'Calculate Quality Scores', script: 'calculate-data-quality-scores.js' }
    ];
  }

  async run() {
    console.log('🚀 COMPLETE DATA QUALITY WORKFLOW');
    console.log('==================================\n');
    console.log('This will run the following steps:');
    this.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.name}`);
    });
    console.log('\n⏳ Starting workflow...\n');
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    for (const step of this.steps) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📋 Step: ${step.name}`);
      console.log(`${'='.repeat(50)}\n`);
      
      // Check if script exists
      const fs = require('fs');
      const scriptPath = `scripts/${step.script}`;
      if (!fs.existsSync(scriptPath)) {
        if (step.optional) {
          console.log(`⚠️  Script ${step.script} not found, skipping (optional step)`);
          continue;
        } else {
          console.error(`❌ Required script ${step.script} not found`);
          continue;
        }
      }

      try {
        const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10 // 10MB
        });
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log(`\n✅ ${step.name} completed`);
        
        // Wait between steps
        await this.delay(2000);
        
      } catch (error) {
        console.error(`\n❌ ${step.name} failed:`, error.message);
        if (step.optional) {
          console.log('⚠️  This step is optional, continuing...\n');
        } else {
          console.log('⚠️  Continuing with next step...\n');
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ WORKFLOW COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📊 Check the reports directory for detailed results.');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const workflow = new CompleteDataQualityWorkflow();
workflow.run().catch(console.error);
