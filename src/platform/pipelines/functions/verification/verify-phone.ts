/**
 * PHONE VERIFICATION FUNCTION
 * 
 * Pure, idempotent function for 4-source phone verification
 * using Lusha, People Data Labs, Twilio, and Prospeo Mobile
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { MultiSourceVerifier } from '../../modules/core/MultiSourceVerifier';

// ============================================================================
// TYPES
// ============================================================================

export interface PhoneInput {
  phone: string;
  personName: string;
  companyName: string;
  linkedinUrl?: string;
}

export interface PhoneVerification {
  valid: boolean;
  confidence: number;
  carrier?: string;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown';
  creditsUsed: number;
  verificationDetails: Array<{
    source: string;
    status: 'valid' | 'invalid' | 'unknown';
    confidence: number;
    reasoning: string;
  }>;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const verifyPhoneFunction: PipelineStep<PhoneInput, PhoneVerification> = {
  name: 'verifyPhone',
  description: '4-source phone verification: Lusha, People Data Labs, Twilio, Prospeo Mobile',
  retryable: true,
  timeout: 20000,
  dependencies: ['discoverExecutives'],
  
  execute: async (input, context) => {
    console.log(`📞 Verifying phone: ${input.phone} for ${input.personName}`);
    
    const verifier = new MultiSourceVerifier(context.config);
    
    try {
      // 4-source phone verification
      const verification = await verifier.verifyPhone(
        input.phone,
        input.personName,
        input.companyName,
        input.linkedinUrl
      );
      
      // Determine line type from verification details
      let lineType: 'mobile' | 'landline' | 'voip' | 'unknown' = 'unknown';
      const details = verification.verificationDetails || [];
      for (const detail of details) {
        if (detail.reasoning.toLowerCase().includes('mobile')) {
          lineType = 'mobile';
          break;
        } else if (detail.reasoning.toLowerCase().includes('landline')) {
          lineType = 'landline';
          break;
        } else if (detail.reasoning.toLowerCase().includes('voip')) {
          lineType = 'voip';
          break;
        }
      }
      
      const result: PhoneVerification = {
        valid: verification.valid,
        confidence: verification.confidence,
        carrier: verification.carrier,
        lineType,
        creditsUsed: verification.creditsUsed || 0,
        verificationDetails: verification.verificationDetails || []
      };
      
      console.log(`   ${result.valid ? '✅' : '❌'} Phone verification: ${result.confidence}% confidence (${result.lineType})`);
      console.log(`   💳 Credits used: ${result.creditsUsed}`);
      
      return result;
    } catch (error) {
      console.log(`   ❌ Phone verification failed: ${error.message}`);
      
      return {
        valid: false,
        confidence: 0,
        lineType: 'unknown',
        creditsUsed: 0,
        verificationDetails: [{
          source: 'error',
          status: 'invalid',
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

export default verifyPhoneFunction;
