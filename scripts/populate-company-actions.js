#!/usr/bin/env node

/**
 * Populate basic next action data for companies in Dan's workspace
 * This script adds simple next action recommendations to companies that don't have them
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP workspace ID
const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function populateCompanyActions() {
  console.log('🏢 Populating next actions for companies...');
  
  try {
    // Get companies without next actions
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        OR: [
          { nextAction: null },
          { nextAction: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        lastAction: true,
        lastActionDate: true
      },
      take: 100 // Process first 100 companies
    });
    
    console.log(`Found ${companies.length} companies without next actions`);
    
    let updated = 0;
    
    for (const company of companies) {
      try {
        // Generate a simple next action based on company data
        const nextAction = generateNextAction(company);
        
        if (nextAction) {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              nextAction: nextAction.action,
              nextActionDate: nextAction.date,
              actionStatus: 'planned'
            }
          });
          
          updated++;
          console.log(`✅ Updated ${company.name}: ${nextAction.action}`);
        }
      } catch (error) {
        console.error(`❌ Error updating company ${company.name}:`, error.message);
      }
    }
    
    console.log(`🎯 Successfully updated ${updated} companies with next actions`);
    
  } catch (error) {
    console.error('❌ Error populating company actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateNextAction(company) {
  const industry = company.industry?.toLowerCase() || '';
  const name = company.name?.toLowerCase() || '';
  
  // Generate next action based on industry and company characteristics
  let action = '';
  let daysFromNow = 7; // Default to 1 week
  
  if (industry.includes('electric') || industry.includes('power') || industry.includes('utility')) {
    action = 'Schedule infrastructure assessment call';
    daysFromNow = 5;
  } else if (industry.includes('telecom') || industry.includes('broadband') || industry.includes('wifi')) {
    action = 'Discuss network optimization opportunities';
    daysFromNow = 3;
  } else if (industry.includes('cooperative') || industry.includes('municipal')) {
    action = 'Present cost-saving technology solutions';
    daysFromNow = 10;
  } else if (name.includes('city') || name.includes('county') || name.includes('district')) {
    action = 'Schedule government procurement discussion';
    daysFromNow = 14;
  } else {
    action = 'Schedule discovery call to understand needs';
    daysFromNow = 7;
  }
  
  // Set date to daysFromNow from today
  const nextActionDate = new Date();
  nextActionDate.setDate(nextActionDate.getDate() + daysFromNow);
  
  return {
    action,
    date: nextActionDate
  };
}

// Run the script
if (require.main === module) {
  populateCompanyActions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateCompanyActions };
