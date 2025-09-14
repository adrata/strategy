#!/usr/bin/env node

/**
 * 🧠 SCENARIO ROUTER
 * 
 * Intelligently routes different user scenarios to the appropriate processing pipeline
 * Handles: enrich existing, add new, single/bulk, different data completeness levels
 */

import { prisma } from '@/platform/database/prisma-client';
import type { ResearchRequest } from '../types/intelligence';

export interface ScenarioAnalysis {
  scenarioType: 'enrich_existing' | 'add_new' | 'mixed';
  processingMode: 'single' | 'bulk';
  dataCompleteness: 'minimal' | 'partial' | 'complete';
  existingRecords: any[];
  newRecords: any[];
  missingDataTypes: string[];
  recommendedStrategy: string;
  estimatedCost: number;
  estimatedTime: number;
}

export class ScenarioRouter {
  
  /**
   * 🧠 ANALYZE USER SCENARIO
   */
  async analyzeScenario(request: ResearchRequest): Promise<ScenarioAnalysis> {
    console.log(`🧠 [SCENARIO] Analyzing user scenario for ${request.accounts.length} records`);
    
    // Step 1: Check which records already exist in database
    const existingRecords = await this.findExistingRecords(request.accounts, request.workspaceId);
    const newRecords = request.accounts.filter(account => 
      !existingRecords.some(existing => this.matchesAccount(existing, account))
    );
    
    console.log(`   📊 Existing records: ${existingRecords.length}`);
    console.log(`   📊 New records: ${newRecords.length}`);
    
    // Step 2: Analyze data completeness for existing records
    const completenessAnalysis = this.analyzeDataCompleteness(existingRecords);
    
    // Step 3: Determine scenario type
    let scenarioType: 'enrich_existing' | 'add_new' | 'mixed';
    if (existingRecords.length > 0 && newRecords['length'] === 0) {
      scenarioType = 'enrich_existing';
    } else if (existingRecords['length'] === 0 && newRecords.length > 0) {
      scenarioType = 'add_new';
    } else {
      scenarioType = 'mixed';
    }
    
    // Step 4: Determine processing mode
    const processingMode = request['accounts']['length'] === 1 ? 'single' : 'bulk';
    
    // Step 5: Identify missing data types
    const missingDataTypes = this.identifyMissingData(existingRecords);
    
    // Step 6: Generate recommendations
    const recommendedStrategy = this.generateStrategy(scenarioType, processingMode, completenessAnalysis);
    
    // Step 7: Estimate cost and time
    const { cost, time } = this.estimateResources(scenarioType, request.accounts.length, completenessAnalysis);
    
    const analysis: ScenarioAnalysis = {
      scenarioType,
      processingMode,
      dataCompleteness: completenessAnalysis.overall,
      existingRecords,
      newRecords,
      missingDataTypes,
      recommendedStrategy,
      estimatedCost: cost,
      estimatedTime: time
    };
    
    console.log(`✅ [SCENARIO] Analysis complete:`);
    console.log(`   Type: ${scenarioType}`);
    console.log(`   Mode: ${processingMode}`);
    console.log(`   Strategy: ${recommendedStrategy}`);
    console.log(`   Estimated Cost: $${cost.toFixed(2)}`);
    console.log(`   Estimated Time: ${time}s`);
    
    return analysis;
  }
  
  /**
   * 🔍 FIND EXISTING RECORDS
   */
  private async findExistingRecords(accounts: any[], workspaceId: string): Promise<any[]> {
    const existingRecords = [];
    
    for (const account of accounts) {
      // Check for existing account
      const existingAccount = await prisma.accounts.findFirst({
        where: {
          workspaceId,
          OR: [
            { name: account.name , deletedAt: null},
            { website: account.website },
            { domain: account.website }
          ]
        },
        include: {
          contacts: true,
          leads: true
        }
      });
      
      if (existingAccount) {
        existingRecords.push({
          ...existingAccount,
          inputAccount: account,
          hasContacts: existingAccount.contacts.length > 0,
          hasLeads: existingAccount.leads.length > 0
        });
      }
    }
    
    return existingRecords;
  }
  
  /**
   * 🎯 MATCH ACCOUNT
   */
  private matchesAccount(existing: any, input: any): boolean {
    if (existing['name'] && input['name'] && 
        existing.name.toLowerCase() === input.name.toLowerCase()) {
      return true;
    }
    
    if (existing['website'] && input['website'] &&
        this.normalizeUrl(existing.website) === this.normalizeUrl(input.website)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 🔗 NORMALIZE URL
   */
  private normalizeUrl(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
  }
  
  /**
   * 📊 ANALYZE DATA COMPLETENESS
   */
  private analyzeDataCompleteness(existingRecords: any[]): {
    overall: 'minimal' | 'partial' | 'complete';
    details: any;
  } {
    if (existingRecords['length'] === 0) {
      return { overall: 'minimal', details: {} };
    }
    
    let totalContacts = 0;
    let contactsWithEmail = 0;
    let contactsWithPhone = 0;
    let contactsWithLinkedIn = 0;
    let contactsWithRole = 0;
    
    existingRecords.forEach(record => {
      totalContacts += record.contacts.length;
      record.contacts.forEach((contact: any) => {
        if (contact.email) contactsWithEmail++;
        if (contact.phone) contactsWithPhone++;
        if (contact.linkedinUrl) contactsWithLinkedIn++;
        if (contact.jobTitle) contactsWithRole++;
      });
    });
    
    const emailRate = totalContacts > 0 ? contactsWithEmail / totalContacts : 0;
    const phoneRate = totalContacts > 0 ? contactsWithPhone / totalContacts : 0;
    const linkedInRate = totalContacts > 0 ? contactsWithLinkedIn / totalContacts : 0;
    const roleRate = totalContacts > 0 ? contactsWithRole / totalContacts : 0;
    
    const avgCompleteness = (emailRate + phoneRate + linkedInRate + roleRate) / 4;
    
    let overall: 'minimal' | 'partial' | 'complete';
    if (avgCompleteness < 0.3) {
      overall = 'minimal';
    } else if (avgCompleteness < 0.8) {
      overall = 'partial';
    } else {
      overall = 'complete';
    }
    
    return {
      overall,
      details: {
        totalContacts,
        emailRate: Math.round(emailRate * 100),
        phoneRate: Math.round(phoneRate * 100),
        linkedInRate: Math.round(linkedInRate * 100),
        roleRate: Math.round(roleRate * 100),
        avgCompleteness: Math.round(avgCompleteness * 100)
      }
    };
  }
  
  /**
   * 🔍 IDENTIFY MISSING DATA
   */
  private identifyMissingData(existingRecords: any[]): string[] {
    const missing = [];
    
    let needsEmail = false;
    let needsPhone = false;
    let needsLinkedIn = false;
    let needsRoles = false;
    let needsBuyerGroup = false;
    
    existingRecords.forEach(record => {
      record.contacts.forEach((contact: any) => {
        if (!contact.email) needsEmail = true;
        if (!contact.phone) needsPhone = true;
        if (!contact.linkedinUrl) needsLinkedIn = true;
        if (!contact.jobTitle) needsRoles = true;
      });
      
      // Check if buyer group analysis exists
      if (!record.buyerGroupAnalysis) needsBuyerGroup = true;
    });
    
    if (needsEmail) missing.push('email');
    if (needsPhone) missing.push('phone');
    if (needsLinkedIn) missing.push('linkedin');
    if (needsRoles) missing.push('roles');
    if (needsBuyerGroup) missing.push('buyer_group_analysis');
    
    return missing;
  }
  
  /**
   * 📋 GENERATE STRATEGY
   */
  private generateStrategy(
    scenarioType: 'enrich_existing' | 'add_new' | 'mixed',
    processingMode: 'single' | 'bulk',
    completenessAnalysis: any
  ): string {
    
    if (scenarioType === 'enrich_existing') {
      if (completenessAnalysis['overall'] === 'minimal') {
        return processingMode === 'single' 
          ? 'Full contact discovery for single existing account'
          : 'Bulk contact enrichment with parallel processing';
      } else if (completenessAnalysis['overall'] === 'partial') {
        return processingMode === 'single'
          ? 'Targeted data filling for missing fields'
          : 'Bulk data completion with smart gap filling';
      } else {
        return 'Buyer group analysis and relationship mapping';
      }
    }
    
    if (scenarioType === 'add_new') {
      return processingMode === 'single'
        ? 'Complete executive discovery and buyer group analysis'
        : 'Bulk prospect intelligence with decision maker targeting';
    }
    
    // Mixed scenario
    return processingMode === 'bulk'
      ? 'Hybrid processing: enrich existing + discover new with batch optimization'
      : 'Comprehensive single-account analysis with full intelligence';
  }
  
  /**
   * 💰 ESTIMATE RESOURCES
   */
  private estimateResources(
    scenarioType: 'enrich_existing' | 'add_new' | 'mixed',
    accountCount: number,
    completenessAnalysis: any
  ): { cost: number; time: number } {
    
    let baseCostPerAccount = 2.50; // Base cost for full research
    let baseTimePerAccount = 45; // Base time in seconds
    
    // Adjust for scenario type
    if (scenarioType === 'enrich_existing') {
      if (completenessAnalysis['overall'] === 'complete') {
        baseCostPerAccount *= 0.3; // Just buyer group analysis
        baseTimePerAccount *= 0.2;
      } else if (completenessAnalysis['overall'] === 'partial') {
        baseCostPerAccount *= 0.6; // Fill missing data
        baseTimePerAccount *= 0.5;
      }
    }
    
    // Bulk processing efficiency
    if (accountCount > 10) {
      baseCostPerAccount *= 0.8; // 20% bulk discount
      baseTimePerAccount *= 0.7; // Parallel processing efficiency
    }
    
    return {
      cost: baseCostPerAccount * accountCount,
      time: Math.ceil(baseTimePerAccount * accountCount / (accountCount > 5 ? 3 : 1)) // Parallel processing
    };
  }
}
