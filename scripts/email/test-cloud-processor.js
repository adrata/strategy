const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCloudProcessor() {
  try {
    console.log('🧪 Testing Cloud Email Processor...');
    
    // Test the cloud processor service directly
    const { cloudEmailProcessor } = require('../../src/platform/services/cloud-email-processor.ts');
    
    const config = {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      priority: 'recent',
      batchSize: 5,
      maxProcessingTime: 30000,
      continuousMode: false,
      intervalMs: 60000
    };
    
    console.log('📧 Running single batch processing...');
    const result = await cloudEmailProcessor.runSingleBatch(config);
    
    console.log('✅ Cloud processor test completed:');
    console.log(`   Processed: ${result.processedCount} emails`);
    console.log(`   Linked: ${result.linkedCount} emails`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Success rate: ${result.successRate.toFixed(1)}%`);
    console.log(`   Processing time: ${result.processingTimeMs}ms`);
    
  } catch (error) {
    console.error('❌ Cloud processor test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCloudProcessor();
