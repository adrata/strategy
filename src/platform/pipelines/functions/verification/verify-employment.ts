/**
 * EMPLOYMENT VERIFICATION FUNCTION
 * 
 * Pure, idempotent function for verifying current employment status
 * using CoreSignal employment dates and Perplexity AI verification
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { MultiSourceVerifier } from '../../modules/core/MultiSourceVerifier';

// ============================================================================
// TYPES
// ============================================================================

export interface EmploymentInput {
  personName: string;
  companyName: string;
  title: string;
  linkedinUrl?: string;
}

export interface EmploymentVerification {
  isCurrent: boolean;
  confidence: number;
  startDate?: string;
  endDate?: string;
  duration?: string;
  creditsUsed: number;
  verificationDetails: Array<{
    source: string;
    status: 'current' | 'former' | 'unknown';
    confidence: number;
    reasoning: string;
  }>;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const verifyEmploymentFunction: PipelineStep<EmploymentInput, EmploymentVerification> = {
  name: 'verifyEmployment',
  description: 'Verify current employment status using CoreSignal dates and Perplexity AI',
  retryable: true,
  timeout: 15000,
  dependencies: ['discoverExecutives'],
  
  execute: async (input, context) => {
    console.log(`💼 Verifying employment: ${input.personName} at ${input.companyName}`);
    
    const verifier = new MultiSourceVerifier(context.config);
    
    try {
      // Multi-source employment verification
      const employment = await verifier.verifyWithPerplexity(
        input.personName,
        input.companyName,
        input.title
      );
      
      // CRITICAL: Reject if not currently employed
      if (!employment.isCurrent) {
        console.log(`   ❌ REJECTED: ${input.personName} is no longer at ${input.companyName}`);
        throw new Error(`${input.personName} is no longer employed at ${input.companyName}`);
      }
      
      const result: EmploymentVerification = {
        isCurrent: employment.isCurrent,
        confidence: employment.confidence,
        startDate: employment.startDate,
        endDate: employment.endDate,
        duration: employment.duration,
        creditsUsed: employment.creditsUsed || 1,
        verificationDetails: employment.verificationDetails || [{
          source: 'perplexity',
          status: 'current',
          confidence: employment.confidence,
          reasoning: employment.reasoning || 'Verified as current employee'
        }]
      };
      
      console.log(`   ✅ Employment verified: ${input.personName} is current employee`);
      console.log(`   📅 Duration: ${result.duration || 'Unknown'}`);
      console.log(`   💳 Credits used: ${result.creditsUsed}`);
      
      return result;
    } catch (error) {
      console.log(`   ❌ Employment verification failed: ${error.message}`);
      
      return {
        isCurrent: false,
        confidence: 0,
        creditsUsed: 0,
        verificationDetails: [{
          source: 'error',
          status: 'unknown',
          confidence: 0,
          reasoning: error.message
        }]
      };
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default verifyEmploymentFunction;
