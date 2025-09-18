#!/usr/bin/env node

/**
 * Fix Engagement Scores Script
 * 
 * This script reads the original CSV file and updates the engagement scores
 * and funnel stages in the database to match the CSV data.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function fixEngagementScores() {
  try {
    console.log('🔄 Starting engagement scores fix...');
    
    // Read the CSV file
    const csvData = [];
    const csvPath = '_data/people_final_with_workspace.csv';
    
    console.log(`📖 Reading CSV file: ${csvPath}`);
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${csvData.length} records in CSV`);
    
    // Create a mapping of fullName to engagement score and funnel stage
    const csvMapping = {};
    csvData.forEach(row => {
      const fullName = row.fullName;
      const engagementScore = parseFloat(row.engagement_score) || 0;
      const funnelStage = row.funnel_stage;
      
      if (fullName) {
        csvMapping[fullName] = {
          engagementScore,
          funnelStage
        };
      }
    });
    
    console.log(`📋 Created mapping for ${Object.keys(csvMapping).length} unique names`);
    
    // Get all people from the database
    const people = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        deletedAt: null
      }
    });
    
    console.log(`📊 Found ${people.length} people in database`);
    
    // Update engagement scores and funnel stages
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const person of people) {
      const csvData = csvMapping[person.fullName];
      
      if (csvData) {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            engagementScore: csvData.engagementScore,
            funnelStage: csvData.funnelStage
          }
        });
        updatedCount++;
      } else {
        notFoundCount++;
        console.log(`⚠️ No CSV data found for: ${person.fullName}`);
      }
    }
    
    console.log(`✅ Updated ${updatedCount} people`);
    console.log(`⚠️ ${notFoundCount} people not found in CSV`);
    
    // Verify the updates
    const updatedPeople = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        deletedAt: null
      },
      select: { engagementScore: true, funnelStage: true }
    });
    
    const scoreDistribution = {};
    const stageDistribution = {};
    
    updatedPeople.forEach(person => {
      const score = person.engagementScore || 0;
      const stage = person.funnelStage || 'Unknown';
      
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
      stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    });
    
    console.log('📊 Engagement Score Distribution:');
    Object.entries(scoreDistribution).forEach(([score, count]) => {
      console.log(`  Score ${score}: ${count} people`);
    });
    
    console.log('📊 Funnel Stage Distribution:');
    Object.entries(stageDistribution).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count} people`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing engagement scores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixEngagementScores()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
