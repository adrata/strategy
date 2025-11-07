#!/usr/bin/env node

/**
 * Calculate Churn Predictions for All People
 * 
 * Calculates red/orange/green churn risk tags for ALL people in database
 * Based on career history and time in current role
 * 
 * Should be run:
 * 1. Initially for all existing people
 * 2. Weekly via cron to update predictions
 * 3. After any buyer group discovery
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ChurnCalculator {
  constructor(options = {}) {
    this.workspaceId = options.workspaceId || null; // null = all workspaces
    this.forceRecalculate = options.forceRecalculate || false;
    this.batchSize = 50;
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 CHURN PREDICTION CALCULATOR');
      console.log('='.repeat(80));
      
      // Get workspaces to process
      const workspaces = this.workspaceId
        ? [await prisma.workspaces.findUnique({ where: { id: this.workspaceId } })]
        : await prisma.workspaces.findMany({ 
            where: { deletedAt: null, isActive: true },
            select: { id: true, name: true }
          });
      
      console.log(\`\\n📊 Processing \${workspaces.length} workspace(s)\\n\`);
      
      const stats = {
        totalPeople: 0,
        processed: 0,
        calculated: 0,
        red: 0,
        orange: 0,
        green: 0,
        skipped: 0,
        failed: 0
      };
      
      for (const workspace of workspaces) {
        if (!workspace) continue;
        
        console.log(\`\\n📦 Workspace: \${workspace.name}\`);
        console.log('-'.repeat(80));
        
        const workspaceStats = await this.processWorkspace(workspace.id);
        
        stats.totalPeople += workspaceStats.totalPeople;
        stats.processed += workspaceStats.processed;
        stats.calculated += workspaceStats.calculated;
        stats.red += workspaceStats.red;
        stats.orange += workspaceStats.orange;
        stats.green += workspaceStats.green;
        stats.skipped += workspaceStats.skipped;
        stats.failed += workspaceStats.failed;
        
        console.log(\`✅ \${workspace.name}: \${workspaceStats.calculated} calculated\`);
      }
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      console.log('\\n' + '='.repeat(80));
      console.log('📊 CHURN CALCULATION COMPLETE');
      console.log('='.repeat(80));
      console.log(\`\\n👥 People Statistics:\`);
      console.log(\`   Total: \${stats.totalPeople}\`);
      console.log(\`   Processed: \${stats.processed}\`);
      console.log(\`   Calculated: \${stats.calculated}\`);
      console.log(\`   Skipped: \${stats.skipped} (no Coresignal data)\`);
      console.log(\`   Failed: \${stats.failed}\`);
      console.log(\`\\n🎯 Churn Risk Distribution:\`);
      console.log(\`   🔴 Red (High Risk): \${stats.red} (\${Math.round(stats.red/stats.calculated*100)}%)\`);
      console.log(\`   🟠 Orange (Medium Risk): \${stats.orange} (\${Math.round(stats.orange/stats.calculated*100)}%)\`);
      console.log(\`   🟢 Green (Low Risk): \${stats.green} (\${Math.round(stats.green/stats.calculated*100)}%)\`);
      console.log(\`\\n⏱️  Duration: \${minutes}m \${seconds}s\`);
      console.log('='.repeat(80) + '\\n');
      
    } catch (error) {
      console.error('❌ Churn calculation failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async processWorkspace(workspaceId) {
    const stats = {
      totalPeople: 0,
      processed: 0,
      calculated: 0,
      red: 0,
      orange: 0,
      green: 0,
      skipped: 0,
      failed: 0
    };
    
    // Get all people in workspace
    const people = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        customFields: true,
        isBuyerGroupMember: true
      }
    });
    
    stats.totalPeople = people.length;
    console.log(\`   Found \${people.length} people\`);
    
    // Process in batches
    const totalBatches = Math.ceil(people.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = people.slice(batchIndex * this.batchSize, (batchIndex + 1) * this.batchSize);
      
      for (const person of batch) {
        try {
          // Check if already has churn prediction and force recalculate is off
          if (!this.forceRecalculate && person.customFields?.churnPrediction?.refreshColor) {
            stats.skipped++;
            stats.processed++;
            continue;
          }
          
          // Get Coresignal data from customFields
          const coresignalData = person.customFields?.coresignalData;
          
          if (!coresignalData || !coresignalData.experience) {
            stats.skipped++;
            stats.processed++;
            continue;
          }
          
          // Calculate churn prediction
          const churnPrediction = this.calculateChurnPrediction(
            coresignalData.experience
          );
          
          // Update database
          await prisma.people.update({
            where: { id: person.id },
            data: {
              customFields: {
                ...(person.customFields || {}),
                churnPrediction: churnPrediction
              },
              aiIntelligence: {
                ...((person.customFields as any)?.aiIntelligence || {}),
                refreshStatus: {
                  priority: churnPrediction.refreshPriority,
                  color: churnPrediction.refreshColor,
                  frequency: churnPrediction.refreshFrequency,
                  nextRefreshDate: churnPrediction.nextRefreshDate,
                  lastRefreshDate: churnPrediction.lastRefreshDate
                }
              }
            }
          });
          
          stats.calculated++;
          
          if (churnPrediction.refreshColor === 'red') stats.red++;
          else if (churnPrediction.refreshColor === 'orange') stats.orange++;
          else if (churnPrediction.refreshColor === 'green') stats.green++;
          
          stats.processed++;
          
        } catch (error) {
          console.error(\`   ❌ Error processing \${person.fullName}: \${error.message}\`);
          stats.failed++;
          stats.processed++;
        }
      }
      
      // Progress update
      if ((batchIndex + 1) % 10 === 0) {
        console.log(\`   Progress: \${stats.processed}/\${people.length} (\${Math.round(stats.processed/people.length*100)}%)\`);
      }
    }
    
    return stats;
  }

  /**
   * Calculate churn prediction from experience data
   * Extracted from find-buyer-group/index.js
   */
  calculateChurnPrediction(experience = []) {
    if (!Array.isArray(experience) || experience.length === 0) {
      return {
        averageTimeInRoleMonths: null,
        predictedDepartureMonths: null,
        churnRiskScore: 50,
        churnRiskLevel: 'medium',
        predictedDepartureDate: null,
        reasoning: 'Insufficient experience data for churn prediction',
        refreshPriority: 'medium',
        refreshColor: 'orange',
        refreshFrequency: 'weekly',
        nextRefreshDate: this.calculateNextRefreshDate('orange'),
        lastRefreshDate: new Date().toISOString()
      };
    }

    // Get current experience
    const currentExperience = experience.find(exp => exp.active_experience === 1) || experience[0];
    const currentMonthsInRole = currentExperience?.duration_months || 0;

    // Calculate average time in completed roles (excluding current)
    const completedRoles = experience.filter(exp => 
      exp.active_experience === 0 && exp.duration_months && exp.duration_months > 0
    );

    if (completedRoles.length === 0) {
      const defaultAverageMonths = 24;
      const monthsUntilDeparture = Math.max(0, defaultAverageMonths - currentMonthsInRole);
      const churnRiskScore = currentMonthsInRole >= defaultAverageMonths ? 70 : 30;
      
      return {
        averageTimeInRoleMonths: defaultAverageMonths,
        predictedDepartureMonths: monthsUntilDeparture,
        churnRiskScore: churnRiskScore,
        churnRiskLevel: churnRiskScore >= 60 ? 'high' : churnRiskScore >= 40 ? 'medium' : 'low',
        predictedDepartureDate: monthsUntilDeparture > 0 
          ? new Date(Date.now() + monthsUntilDeparture * 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        reasoning: \`No completed roles found, using industry default (\${defaultAverageMonths} months). Current: \${currentMonthsInRole} months.\`,
        completedRolesCount: 0,
        refreshPriority: churnRiskScore >= 60 ? 'high' : 'medium',
        refreshColor: churnRiskScore >= 60 ? 'red' : 'orange',
        refreshFrequency: churnRiskScore >= 60 ? 'daily' : 'weekly',
        nextRefreshDate: this.calculateNextRefreshDate(churnRiskScore >= 60 ? 'red' : 'orange'),
        lastRefreshDate: new Date().toISOString()
      };
    }

    // Calculate average from completed roles
    const totalMonths = completedRoles.reduce((sum, exp) => sum + (exp.duration_months || 0), 0);
    const averageTimeInRoleMonths = Math.round(totalMonths / completedRoles.length);
    const predictedDepartureMonths = Math.max(0, averageTimeInRoleMonths - currentMonthsInRole);

    // Calculate churn risk score (0-100)
    let churnRiskScore = 50;
    
    if (currentMonthsInRole >= averageTimeInRoleMonths) {
      churnRiskScore = 70 + Math.min(20, (currentMonthsInRole - averageTimeInRoleMonths) / 2);
    } else if (currentMonthsInRole >= averageTimeInRoleMonths * 0.8) {
      churnRiskScore = 55 + ((currentMonthsInRole / averageTimeInRoleMonths) * 15);
    } else {
      churnRiskScore = 30 + ((currentMonthsInRole / averageTimeInRoleMonths) * 20);
    }

    // Adjust for job hopping
    if (completedRoles.length >= 5) churnRiskScore += 10;
    else if (completedRoles.length >= 3) churnRiskScore += 5;

    churnRiskScore = Math.max(0, Math.min(100, Math.round(churnRiskScore)));

    // Determine risk level and refresh schedule
    let churnRiskLevel = 'low';
    let refreshColor = 'green';
    let refreshPriority = 'low';
    let refreshFrequency = 'monthly';
    
    if (churnRiskScore >= 60 || predictedDepartureMonths <= 3) {
      churnRiskLevel = 'high';
      refreshColor = 'red';
      refreshPriority = 'high';
      refreshFrequency = 'daily';
    } else if (churnRiskScore >= 40 || predictedDepartureMonths <= 6) {
      churnRiskLevel = 'medium';
      refreshColor = 'orange';
      refreshPriority = 'medium';
      refreshFrequency = 'weekly';
    }

    const predictedDepartureDate = predictedDepartureMonths > 0
      ? new Date(Date.now() + predictedDepartureMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    return {
      averageTimeInRoleMonths: averageTimeInRoleMonths,
      predictedDepartureMonths: predictedDepartureMonths,
      churnRiskScore: churnRiskScore,
      churnRiskLevel: churnRiskLevel,
      predictedDepartureDate: predictedDepartureDate,
      reasoning: \`Average time in role: \${averageTimeInRoleMonths} months. Current: \${currentMonthsInRole} months. Predicted departure in \${predictedDepartureMonths} months.\`,
      completedRolesCount: completedRoles.length,
      refreshPriority: refreshPriority,
      refreshColor: refreshColor,
      refreshFrequency: refreshFrequency,
      refreshFrequencyDays: refreshFrequency === 'daily' ? 1 : refreshFrequency === 'weekly' ? 7 : 30,
      nextRefreshDate: this.calculateNextRefreshDate(refreshColor),
      lastRefreshDate: new Date().toISOString()
    };
  }

  calculateNextRefreshDate(color) {
    const now = new Date();
    const next = new Date(now);
    
    if (color === 'red') {
      next.setDate(next.getDate() + 1); // Tomorrow
    } else if (color === 'orange') {
      next.setDate(next.getDate() + 7); // Next week
    } else {
      next.setMonth(next.getMonth() + 1); // Next month
    }
    
    return next.toISOString();
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let workspaceId = null;
  let forceRecalculate = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace-id') workspaceId = args[++i];
    else if (args[i] === '--force') forceRecalculate = true;
    else if (args[i] === '--all') workspaceId = null;
  }
  
  console.log('\\n🎯 Churn Prediction Calculator');
  console.log('Usage: node calculate-all-churn.js [--workspace-id ID] [--force] [--all]');
  console.log('Examples:');
  console.log('  node calculate-all-churn.js --all');
  console.log('  node calculate-all-churn.js --workspace-id "01K7464TNANHQXPCZT1FYX205V"');
  console.log('  node calculate-all-churn.js --all --force  # Recalculate all\\n');
  
  const calculator = new ChurnCalculator({ workspaceId, forceRecalculate });
  calculator.run().catch(console.error);
}

module.exports = { ChurnCalculator };

