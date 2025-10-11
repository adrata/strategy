/**
 * EMAIL VERIFICATION FUNCTION
 * 
 * Pure, idempotent function for 4-layer email verification
 * using syntax, domain, SMTP (ZeroBounce, MyEmailVerifier), and Prospeo
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { MultiSourceVerifier } from '../../modules/core/MultiSourceVerifier';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailInput {
  email: string;
  personName: string;
  companyName: string;
}

export interface EmailVerification {
  valid: boolean;
  confidence: number;
  deliverability: 'high' | 'medium' | 'low' | 'unknown';
  creditsUsed: number;
  verificationDetails: Array<{
    layer: string;
    status: 'valid' | 'invalid' | 'risky' | 'unknown';
    confidence: number;
    reasoning: string;
  }>;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const verifyEmailFunction: PipelineStep<EmailInput, EmailVerification> = {
  name: 'verifyEmail',
  description: '4-layer email verification: syntax, domain, SMTP (ZeroBounce, MyEmailVerifier), Prospeo',
  retryable: true,
  timeout: 20000,
  dependencies: ['discoverExecutives'],
  
  execute: async (input, context) => {
    console.log(`📧 Verifying email: ${input.email} for ${input.personName}`);
    
    const verifier = new MultiSourceVerifier(context.config);
    
    try {
      // 4-layer email verification
      const verification = await verifier.verifyEmailMultiLayer(
        input.email,
        input.personName,
        input.companyName
      );
      
      // Determine deliverability level
      let deliverability: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
      if (verification.confidence >= 90) {
        deliverability = 'high';
      } else if (verification.confidence >= 70) {
        deliverability = 'medium';
      } else if (verification.confidence >= 50) {
        deliverability = 'low';
      }
      
      const result: EmailVerification = {
        valid: verification.valid,
        confidence: verification.confidence,
        deliverability,
        creditsUsed: verification.creditsUsed || 0,
        verificationDetails: verification.verificationDetails || []
      };
      
      console.log(`   ${result.valid ? '✅' : '❌'} Email verification: ${result.confidence}% confidence (${result.deliverability})`);
      console.log(`   💳 Credits used: ${result.creditsUsed}`);
      
      return result;
    } catch (error) {
      console.log(`   ❌ Email verification failed: ${error.message}`);
      
      return {
        valid: false,
        confidence: 0,
        deliverability: 'unknown',
        creditsUsed: 0,
        verificationDetails: [{
          layer: 'error',
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

export default verifyEmailFunction;
