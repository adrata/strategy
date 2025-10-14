#!/usr/bin/env node

/**
 * Fix Only the Specific Problematic Company Names
 * 
 * Only targets the exact names mentioned by the user
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Only the specific problematic names mentioned by the user
const specificNameMappings = {
  'Titleandabstract': 'Title and Abstract',
  'Com': 'Com Title Services',
  'Atlastitlesvc': 'Atlas Title Services',
  'Worldconnectionc21': 'World Connection C21',
  'Driggstitle': 'Driggs Title',
  'Homepartnerstitle': 'Home Partners Title',
  'Alliancegroupfl': 'Alliance Group FL',
  'Signatureflorida': 'Signature Florida',
  'Teematitle': 'Tee Ma Title',
  'Armourtitlecompany': 'Armour Title Company',
  'Thefund': 'The Fund Title',
  'Bosshardtrealty': 'Bosshard Realty',
  'Joinbrokernation': 'Join Broker Nation',
  'Cleartitleaz': 'Clear Title AZ',
  'Cetitle': 'CE Title',
  'Ctctitle': 'CTC Title',
  'Cbfloridahomes': 'CB Florida Homes',
  'Dennisrealty': 'Dennis Realty',
  'Ects': 'ECTS Title',
  'Expresstitleservicesllc': 'Express Title Services LLC',
  'Fntic': 'FNTIC Title',
  'Firstaztitle': 'First AZ Title',
  'Firstintitle': 'First In Title',
  'Yourfloridatitle': 'Your Florida Title',
  'Goldendogtitle': 'Golden Dog Title',
  'Azgat': 'AZGAT Title',
  'Titlerate': 'Title Rate',
  'Magnoliatitleteam': 'Magnolia Title Team',
  'Navititle': 'Navi Title',
  'Fntarizona': 'FNTA Arizona',
  'Ptanow': 'PTA Now',
  'Premiertitlepartners': 'Premier Title Partners',
  'Premiumproperties': 'Premium Properties',
  'Bocaratonrealestatefamily': 'Boca Raton Real Estate Family',
  'Scrutinyproperty': 'Scrutiny Property',
  'Suncoastone': 'Sun Coast One',
  'Kcorealty': 'KCO Realty',
  'Tieronetitle': 'Tier One Title',
  'Tsvaz': 'TSVAZ Title',
  'Titlesvs': 'Title SVS',
  'Titlewaveres': 'Title Wave Real Estate Solutions',
  'Mytotaltitle': 'My Total Title',
  'Votainc': 'VOTA Inc',
  'Magnolia Title -Arkansas': 'Magnolia Title - Arkansas',
  'RE/MAX CHAMPIONS FLORIDA - MOTTO MORTGAGE CHAMPIONS - CHAMPIONS TITLE SERVICES': 'RE/MAX Champions Florida - Motto Mortgage Champions - Champions Title Services'
};

async function fixTargetedCompanyNames() {
  try {
    console.log('🎯 Fixing only the specific problematic company names...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    const changes = [];
    let found = 0;

    // Process each specific name mapping
    for (const [oldName, newName] of Object.entries(specificNameMappings)) {
      // Find companies with the exact old name (case insensitive)
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          name: {
            equals: oldName,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          domain: true
        }
      });

      if (companies.length > 0) {
        found += companies.length;
        console.log(`📝 Found ${companies.length} companies with exact name "${oldName}"`);
        
        for (const company of companies) {
          try {
            await prisma.companies.update({
              where: { id: company.id },
              data: { name: newName }
            });
            
            changes.push({
              id: company.id,
              originalName: company.name,
              newName: newName,
              domain: company.domain
            });
            
            console.log(`   ✅ "${company.name}" → "${newName}"`);
          } catch (error) {
            console.error(`   ❌ Error updating company ${company.id}:`, error.message);
          }
        }
        console.log('');
      }
    }

    // Generate report
    const report = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      fixDate: new Date().toISOString(),
      totalMappings: Object.keys(specificNameMappings).length,
      totalFound: found,
      totalFixed: changes.length,
      changes: changes
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-targeted-names-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 TARGETED FIX SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Mappings: ${Object.keys(specificNameMappings).length}`);
    console.log(`Companies Found: ${found}`);
    console.log(`Companies Fixed: ${changes.length}`);
    console.log('');

    if (changes.length > 0) {
      console.log('✨ FIXED NAMES:');
      console.log('='.repeat(50));
      changes.forEach((change, index) => {
        console.log(`${index + 1}. "${change.originalName}"`);
        console.log(`   → "${change.newName}"`);
        if (change.domain) console.log(`   Domain: ${change.domain}`);
        console.log('');
      });
    }

    console.log('✅ Targeted names fix complete!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixTargetedCompanyNames();
