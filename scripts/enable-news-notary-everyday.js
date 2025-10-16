#!/usr/bin/env node

/**
 * Enable News Feature for Notary Everyday Workspace
 * 
 * This script enables the News feature for the Notary Everyday workspace
 * and configures it with appropriate settings for the title insurance industry.
 * 
 * Usage: node scripts/enable-news-notary-everyday.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class NewsEnabler {
  constructor() {
    this.workspaceId = null;
    this.results = {
      workspace: null,
      newsEnabled: false,
      configuration: null,
      errors: []
    };
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'ne', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = workspace.id;
    this.results.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug
    };
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    return workspace;
  }

  async enableNewsFeature() {
    console.log('\n📰 Enabling News feature...');
    
    try {
      const updatedWorkspace = await prisma.workspaces.update({
        where: { id: this.workspaceId },
        data: {
          newsEnabled: true,
          newsIndustries: [
            'Title Insurance',
            'Real Estate',
            'Legal Services',
            'Property Management',
            'Mortgage Services',
            'Real Estate Technology'
          ],
          newsSources: ['perplexity', 'newsapi'],
          updatedAt: new Date()
        }
      });

      this.results.newsEnabled = true;
      this.results.configuration = {
        newsEnabled: updatedWorkspace.newsEnabled,
        newsIndustries: updatedWorkspace.newsIndustries,
        newsSources: updatedWorkspace.newsSources
      };

      console.log('✅ News feature enabled successfully');
      console.log('📋 Configuration:');
      console.log(`   - Industries: ${updatedWorkspace.newsIndustries.join(', ')}`);
      console.log(`   - Sources: ${updatedWorkspace.newsSources.join(', ')}`);

    } catch (error) {
      console.error('❌ Failed to enable News feature:', error);
      this.results.errors.push(`Failed to enable News feature: ${error.message}`);
      throw error;
    }
  }

  async populateInitialNews() {
    console.log('\n📰 Populating initial news data...');
    
    try {
      // Import the news aggregation service
      const { newsAggregationService } = require('../src/platform/services/NewsAggregationService.ts');
      
      // Get workspace configuration
      const config = await newsAggregationService.getWorkspaceNewsConfig(this.workspaceId);
      
      // Aggregate initial news
      const articles = await newsAggregationService.aggregateNewsForWorkspace(config);
      
      console.log(`✅ Populated ${articles.length} initial news articles`);
      
      return articles.length;
    } catch (error) {
      console.error('❌ Failed to populate initial news:', error);
      this.results.errors.push(`Failed to populate initial news: ${error.message}`);
      // Don't throw - this is not critical for enabling the feature
      return 0;
    }
  }

  async generateReport() {
    console.log('\n📊 Generating report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      workspace: this.results.workspace,
      newsEnabled: this.results.newsEnabled,
      configuration: this.results.configuration,
      errors: this.results.errors,
      success: this.results.errors.length === 0
    };

    // Save report
    const fs = require('fs');
    const reportPath = `docs/reports/notary-everyday-news-enablement-${new Date().toISOString().split('T')[0]}.json`;
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ Failed to save report:', error.message);
    }

    return report;
  }

  async run() {
    try {
      console.log('🚀 Starting News feature enablement for Notary Everyday...\n');
      
      // Step 1: Find workspace
      await this.findNotaryEverydayWorkspace();
      
      // Step 2: Enable News feature
      await this.enableNewsFeature();
      
      // Step 3: Populate initial news (optional)
      const articlesCount = await this.populateInitialNews();
      
      // Step 4: Generate report
      const report = await this.generateReport();
      
      console.log('\n🎉 News feature enablement completed!');
      console.log(`📊 Summary:`);
      console.log(`   - Workspace: ${report.workspace.name}`);
      console.log(`   - News Enabled: ${report.newsEnabled ? 'Yes' : 'No'}`);
      console.log(`   - Initial Articles: ${articlesCount}`);
      console.log(`   - Errors: ${report.errors.length}`);
      
      if (report.errors.length > 0) {
        console.log('\n⚠️ Errors encountered:');
        report.errors.forEach(error => console.log(`   - ${error}`));
      }
      
      return report;
      
    } catch (error) {
      console.error('\n💥 News feature enablement failed:', error);
      this.results.errors.push(`Script failed: ${error.message}`);
      
      const report = await this.generateReport();
      return report;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const enabler = new NewsEnabler();
  enabler.run()
    .then(report => {
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = { NewsEnabler };
