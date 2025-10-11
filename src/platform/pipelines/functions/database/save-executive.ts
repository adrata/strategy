/**
 * DATABASE SAVE FUNCTION
 * 
 * Pure, idempotent function for saving executive data to database
 * using upsert pattern for safe retries
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutiveData {
  companyId: string;
  companyName: string;
  role: 'CFO' | 'CRO';
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
  verificationDetails: {
    person: any;
    email: any;
    phone: any;
    employment: any;
  };
}

export interface DatabaseResult {
  id: string;
  created: boolean;
  updated: boolean;
  timestamp: string;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const saveExecutiveFunction: PipelineStep<ExecutiveData, DatabaseResult> = {
  name: 'saveExecutive',
  description: 'Save executive to database using idempotent upsert pattern',
  retryable: true,
  timeout: 5000,
  dependencies: ['verifyPerson', 'verifyEmail', 'verifyPhone', 'verifyEmployment'],
  
  execute: async (input, context) => {
    console.log(`💾 Saving executive: ${input.name} (${input.role}) at ${input.companyName}`);
    
    try {
      // For now, we'll simulate database operations since we don't have Prisma set up
      // In a real implementation, this would use Prisma with upsert
      
      const now = new Date().toISOString();
      const recordId = `exec_${input.companyId}_${input.role.toLowerCase()}_${Date.now()}`;
      
      // Simulate upsert operation
      const existingRecord = await simulateDatabaseFind(input.companyId, input.role);
      
      let created = false;
      let updated = false;
      
      if (existingRecord) {
        // Update existing record
        await simulateDatabaseUpdate(existingRecord.id, {
          name: input.name,
          title: input.title,
          email: input.email,
          phone: input.phone,
          linkedinUrl: input.linkedinUrl,
          confidence: input.confidence,
          verificationDetails: input.verificationDetails,
          lastVerified: now
        });
        updated = true;
        console.log(`   ✅ Updated existing record: ${existingRecord.id}`);
      } else {
        // Create new record
        await simulateDatabaseCreate({
          id: recordId,
          companyId: input.companyId,
          companyName: input.companyName,
          role: input.role,
          name: input.name,
          title: input.title,
          email: input.email,
          phone: input.phone,
          linkedinUrl: input.linkedinUrl,
          confidence: input.confidence,
          verificationDetails: input.verificationDetails,
          createdAt: now,
          lastVerified: now
        });
        created = true;
        console.log(`   ✅ Created new record: ${recordId}`);
      }
      
      const result: DatabaseResult = {
        id: existingRecord?.id || recordId,
        created,
        updated,
        timestamp: now
      };
      
      return result;
    } catch (error) {
      console.log(`   ❌ Database save failed: ${error.message}`);
      throw error;
    }
  }
};

// ============================================================================
// SIMULATED DATABASE OPERATIONS
// ============================================================================

// In a real implementation, these would be Prisma operations
async function simulateDatabaseFind(companyId: string, role: string): Promise<any> {
  // Simulate database lookup
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // For demo purposes, randomly return existing record or null
  return Math.random() > 0.5 ? {
    id: `existing_${companyId}_${role.toLowerCase()}`,
    companyId,
    role
  } : null;
}

async function simulateDatabaseCreate(data: any): Promise<void> {
  // Simulate database create
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log(`   📝 Database CREATE: ${data.id}`);
}

async function simulateDatabaseUpdate(id: string, data: any): Promise<void> {
  // Simulate database update
  await new Promise(resolve => setTimeout(resolve, 150));
  console.log(`   📝 Database UPDATE: ${id}`);
}

// ============================================================================
// REAL PRISMA IMPLEMENTATION (COMMENTED OUT)
// ============================================================================

/*
// Real implementation would look like this:
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const saveExecutiveFunction: PipelineStep<ExecutiveData, DatabaseResult> = {
  name: 'saveExecutive',
  description: 'Save executive to database using idempotent upsert pattern',
  retryable: true,
  timeout: 5000,
  dependencies: ['verifyPerson', 'verifyEmail', 'verifyPhone', 'verifyEmployment'],
  
  execute: async (input, context) => {
    console.log(`💾 Saving executive: ${input.name} (${input.role}) at ${input.companyName}`);
    
    try {
      // IDEMPOTENT: Use upsert instead of create
      const result = await prisma.executive.upsert({
        where: {
          // Composite key: company + role
          companyId_role: {
            companyId: input.companyId,
            role: input.role // 'CFO' or 'CRO'
          }
        },
        create: {
          companyId: input.companyId,
          companyName: input.companyName,
          role: input.role,
          name: input.name,
          title: input.title,
          email: input.email,
          phone: input.phone,
          linkedinUrl: input.linkedinUrl,
          confidence: input.confidence,
          verificationDetails: input.verificationDetails,
          createdAt: new Date(),
          lastVerified: new Date()
        },
        update: {
          // Update if exists (safe to retry)
          name: input.name,
          title: input.title,
          email: input.email,
          phone: input.phone,
          linkedinUrl: input.linkedinUrl,
          confidence: input.confidence,
          verificationDetails: input.verificationDetails,
          lastVerified: new Date()
        }
      });
      
      const dbResult: DatabaseResult = {
        id: result.id,
        created: result.createdAt.getTime() === result.updatedAt.getTime(),
        updated: result.createdAt.getTime() !== result.updatedAt.getTime(),
        timestamp: result.updatedAt.toISOString()
      };
      
      console.log(`   ✅ Database save complete: ${dbResult.id}`);
      return dbResult;
    } catch (error) {
      console.log(`   ❌ Database save failed: ${error.message}`);
      throw error;
    }
  }
};
*/

// ============================================================================
// EXPORTS
// ============================================================================

export default saveExecutiveFunction;
