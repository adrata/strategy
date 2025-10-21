import { BuyerGroupEngine } from '../src/platform/intelligence/buyer-group/buyer-group-engine';
import * as fs from 'fs';
import * as path from 'path';

async function discoverBuyerGroups() {
  const engine = new BuyerGroupEngine();
  
  const companies = [
    {
      companyName: "Match Group",
      website: "https://mtch.com",
      enrichmentLevel: "enrich" as const,
      workspaceId: "demo-workspace-winning-variant",
      options: {
        saveToDatabase: true
      }
    },
    {
      companyName: "Brex",
      website: "https://brex.com", 
      enrichmentLevel: "enrich" as const,
      workspaceId: "demo-workspace-winning-variant",
      options: {
        saveToDatabase: true
      }
    },
    {
      companyName: "First Premier Bank",
      website: "https://firstpremier.com",
      enrichmentLevel: "enrich" as const, 
      workspaceId: "demo-workspace-winning-variant",
      options: {
        saveToDatabase: true
      }
    },
    {
      companyName: "Zuora",
      website: "https://zuora.com",
      enrichmentLevel: "enrich" as const,
      workspaceId: "demo-workspace-winning-variant", 
      options: {
        saveToDatabase: true
      }
    }
  ];

  console.log('🚀 Starting buyer group discovery for Winning Variant demo...\n');

  for (const company of companies) {
    try {
      console.log(`\n🎯 Discovering buyer group for: ${company.companyName}`);
      const result = await engine.discover(company);
      
      console.log(`✅ ${company.companyName} - ${result.buyerGroup.totalMembers} members found`);
      console.log(`   Processing time: ${result.processingTime}ms`);
      console.log(`   Cost estimate: $${result.costEstimate.toFixed(2)}`);
      
      // Save result to file for use in reports
      const outputDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename = `${company.companyName.toLowerCase().replace(/\s+/g, '-')}-buyer-group.json`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`   📁 Data saved to: ${filepath}`);
      
    } catch (error) {
      console.error(`❌ Error discovering ${company.companyName}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log('\n🎉 Buyer group discovery complete!');
}

discoverBuyerGroups().catch(console.error);
