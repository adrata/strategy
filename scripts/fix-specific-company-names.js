#!/usr/bin/env node

/**
 * Fix Specific Problematic Company Names
 * 
 * Targets the specific names mentioned by the user that still need cleanup
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Specific name mappings for the problematic names
const nameMappings = {
  // Single word names that need proper formatting
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
  
  // Names that need proper spacing and formatting
  'Magnolia Title -Arkansas': 'Magnolia Title - Arkansas',
  'American Title Service Agency-Residential/Commercial': 'American Title Service Agency - Residential/Commercial',
  'University of Colorado Denver': 'University of Colorado Denver',
  'RE/MAX CHAMPIONS FLORIDA - MOTTO MORTGAGE CHAMPIONS - CHAMPIONS TITLE SERVICES': 'RE/MAX Champions Florida - Motto Mortgage Champions - Champions Title Services'
};

async function fixSpecificCompanyNames() {
  try {
    console.log('🔧 Fixing specific problematic company names...\n');
    
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

    // Process each name mapping
    for (const [oldName, newName] of Object.entries(nameMappings)) {
      // Find companies with the old name
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          name: {
            contains: oldName,
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
        console.log(`📝 Found ${companies.length} companies with name containing "${oldName}"`);
        
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

    // Also fix any remaining all-caps names
    console.log('🔍 Checking for remaining all-caps names...');
    const allCapsCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        id: true,
        name: true,
        domain: true
      }
    });

    const actualAllCaps = allCapsCompanies.filter(company => 
      /^[A-Z\s&.,]+$/.test(company.name) && 
      company.name.length > 3 && 
      !company.name.includes('LLC') && 
      !company.name.includes('INC') &&
      !company.name.includes('CORP')
    );

    if (actualAllCaps.length > 0) {
      console.log(`📝 Found ${actualAllCaps.length} all-caps names to fix:`);
      
      for (const company of actualAllCaps) {
        const properCase = company.name
          .toLowerCase()
          .split(' ')
          .map((word, index) => {
            if (index === 0 || company.name.split(' ')[index - 1] === '&') {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(' ');
        
        try {
          await prisma.companies.update({
            where: { id: company.id },
            data: { name: properCase }
          });
          
          changes.push({
            id: company.id,
            originalName: company.name,
            newName: properCase,
            domain: company.domain
          });
          
          console.log(`   ✅ "${company.name}" → "${properCase}"`);
        } catch (error) {
          console.error(`   ❌ Error updating company ${company.id}:`, error.message);
        }
      }
    }

    // Generate report
    const report = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      fixDate: new Date().toISOString(),
      totalMappings: Object.keys(nameMappings).length,
      totalFound: found,
      totalFixed: changes.length,
      changes: changes
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-specific-names-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 FIX SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Mappings: ${Object.keys(nameMappings).length}`);
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

    console.log('✅ Specific names fix complete!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificCompanyNames();
