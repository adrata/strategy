/**
 * EXECUTIVE DISCOVERY FUNCTION
 * 
 * Pure, idempotent function for discovering CFO and CRO executives
 * using multi-strategy approach with waterfall logic
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { CoreSignalMultiSource } from '../../modules/core/CoreSignalMultiSource';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutiveDiscoveryInput {
  companyId: string;
  companyName: string;
  domain: string;
}

export interface Executive {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
  employmentStatus: {
    isCurrent: boolean;
    startDate?: string;
    duration?: string;
    confidence: number;
  };
}

export interface ExecutiveDiscoveryResult {
  cfo: Executive | null;
  cro: Executive | null;
  creditsUsed: number;
  discoveryMethod: {
    cfo: string;
    cro: string;
  };
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const discoverExecutivesFunction: PipelineStep<ExecutiveDiscoveryInput, ExecutiveDiscoveryResult> = {
  name: 'discoverExecutives',
  description: 'Discover CFO and CRO using multi-strategy approach with waterfall logic',
  retryable: true,
  timeout: 60000,
  dependencies: ['resolveCompany'],
  
  execute: async (input, context) => {
    console.log(`👥 Discovering executives for: ${input.companyName}`);
    console.log(`   🏢 Company ID: ${input.companyId}`);
    
    const coresignal = new CoreSignalMultiSource(context.config);
    let totalCreditsUsed = 0;
    
    // Discover CFO (Finance Executive)
    console.log(`   💰 Discovering CFO...`);
    const cfoResult = await coresignal.discoverExecutiveMultiStrategy(
      input.companyId,
      input.companyName,
      'finance'
    );
    totalCreditsUsed += cfoResult.creditsUsed;
    
    // Discover CRO (Revenue/Sales Executive)
    console.log(`   📈 Discovering CRO...`);
    const croResult = await coresignal.discoverExecutiveMultiStrategy(
      input.companyId,
      input.companyName,
      'revenue'
    );
    totalCreditsUsed += croResult.creditsUsed;
    
    // Process CFO result
    let cfo: Executive | null = null;
    if (cfoResult.executive) {
      console.log(`   ✅ CFO found: ${cfoResult.executive.name} (${cfoResult.executive.title})`);
      cfo = {
        name: cfoResult.executive.name,
        title: cfoResult.executive.title,
        email: cfoResult.executive.email,
        phone: cfoResult.executive.phone,
        linkedinUrl: cfoResult.executive.linkedinUrl,
        confidence: cfoResult.executive.confidence || 80,
        employmentStatus: cfoResult.executive.employmentStatus || {
          isCurrent: true,
          confidence: 80
        }
      };
    } else {
      console.log(`   ❌ No CFO found`);
    }
    
    // Process CRO result
    let cro: Executive | null = null;
    if (croResult.executive) {
      console.log(`   ✅ CRO found: ${croResult.executive.name} (${croResult.executive.title})`);
      cro = {
        name: croResult.executive.name,
        title: croResult.executive.title,
        email: croResult.executive.email,
        phone: croResult.executive.phone,
        linkedinUrl: croResult.executive.linkedinUrl,
        confidence: croResult.executive.confidence || 80,
        employmentStatus: croResult.executive.employmentStatus || {
          isCurrent: true,
          confidence: 80
        }
      };
    } else {
      console.log(`   ❌ No CRO found`);
    }
    
    const result: ExecutiveDiscoveryResult = {
      cfo,
      cro,
      creditsUsed: totalCreditsUsed,
      discoveryMethod: {
        cfo: cfoResult.method || 'not_found',
        cro: croResult.method || 'not_found'
      }
    };
    
    console.log(`   📊 Discovery complete: CFO ${cfo ? '✅' : '❌'}, CRO ${cro ? '✅' : '❌'}`);
    console.log(`   💳 Credits used: ${totalCreditsUsed}`);
    
    return result;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default discoverExecutivesFunction;
