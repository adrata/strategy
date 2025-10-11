/**
 * PERSON VERIFICATION FUNCTION
 * 
 * Pure, idempotent function for multi-source person identity verification
 * using Lusha, Perplexity, and CoreSignal
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { MultiSourceVerifier } from '../../modules/core/MultiSourceVerifier';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonInput {
  personName: string;
  companyName: string;
  domain: string;
  linkedinUrl?: string;
}

export interface PersonVerification {
  verified: boolean;
  confidence: number;
  sources: string[];
  creditsUsed: number;
  verificationDetails: Array<{
    source: string;
    status: 'verified' | 'failed' | 'not_found';
    confidence: number;
    reasoning: string;
  }>;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const verifyPersonFunction: PipelineStep<PersonInput, PersonVerification> = {
  name: 'verifyPerson',
  description: 'Multi-source person identity verification using Lusha, Perplexity, and CoreSignal',
  retryable: true,
  timeout: 30000,
  dependencies: ['discoverExecutives'],
  
  execute: async (input, context) => {
    console.log(`🔍 Verifying person: ${input.personName} at ${input.companyName}`);
    
    const verifier = new MultiSourceVerifier(context.config);
    
    try {
      // 3-source verification (Lusha, Perplexity, CoreSignal)
      const verification = await verifier.verifyPersonIdentity(
        input.personName,
        input.companyName,
        input.domain,
        input.linkedinUrl
      );
      
      const result: PersonVerification = {
        verified: verification.confidence >= 70,
        confidence: verification.confidence,
        sources: verification.sources || [],
        creditsUsed: verification.creditsUsed || 0,
        verificationDetails: verification.verificationDetails || []
      };
      
      console.log(`   ${result.verified ? '✅' : '❌'} Person verification: ${result.confidence}% confidence`);
      console.log(`   📊 Sources: ${result.sources.join(', ')}`);
      console.log(`   💳 Credits used: ${result.creditsUsed}`);
      
      return result;
    } catch (error) {
      console.log(`   ❌ Person verification failed: ${error.message}`);
      
      return {
        verified: false,
        confidence: 0,
        sources: [],
        creditsUsed: 0,
        verificationDetails: [{
          source: 'error',
          status: 'failed',
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

export default verifyPersonFunction;
