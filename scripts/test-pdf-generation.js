#!/usr/bin/env node

/**
 * 🧪 TEST PDF GENERATION SCRIPT
 * 
 * Tests the PDF generation service without running the full Next.js app
 */

const { PDFGenerationService } = require('../src/platform/services/pdfGenerationService');

async function testPDFGeneration() {
  console.log('🧪 Testing PDF generation service...');
  
  try {
    // Test metrics data
    const testMetrics = {
      totalPipelineValue: 25000000,
      openDeals: 45,
      winRate: 68,
      averageDealSize: 555555,
      salesVelocity: 45,
      pipelineCoverage: 3.2,
      monthlyGrowth: 12.5,
      quarterlyGrowth: 28.3,
      leadConversion: 15.2,
      prospectConversion: 42.1,
      opportunityConversion: 67.8
    };

    console.log('📊 Test metrics:', testMetrics);

    // Test PDF generation
    const pdfService = PDFGenerationService.getInstance();
    const result = await pdfService.generateMetricsReport(testMetrics, { 
      username: 'test-user', 
      workspaceId: 'test-workspace' 
    });
    
    if (result.success) {
      console.log('✅ PDF generated successfully!');
      console.log('📄 Buffer size:', result.buffer?.byteLength || 0, 'bytes');
      
      // Save test PDF to file
      const fs = require('fs');
      const path = require('path');
      
      const outputPath = path.join(__dirname, 'test-output.pdf');
      fs.writeFileSync(outputPath, Buffer.from(result.buffer));
      
      console.log('💾 Test PDF saved to:', outputPath);
    } else {
      console.error('❌ PDF generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testPDFGeneration();
