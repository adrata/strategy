/**
 * CSV OUTPUT GENERATION FUNCTION
 * 
 * Pure, idempotent function for generating CSV output with verification trail
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface CSVOutputData {
  outputPath: string;
  record: {
    companyName: string;
    role: 'CFO' | 'CRO';
    name: string;
    title: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    confidence: number;
    personVerified: boolean;
    emailValid: boolean;
    phoneValid: boolean;
    employmentCurrent: boolean;
    verificationDetails: any;
    timestamp: string;
  };
}

export interface CSVOutputResult {
  path: string;
  recordsWritten: number;
  fileSize: number;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const generateCSVFunction: PipelineStep<CSVOutputData, CSVOutputResult> = {
  name: 'generateCSV',
  description: 'Generate CSV output with verification trail and detailed contact information',
  retryable: true,
  timeout: 5000,
  dependencies: ['saveExecutive'],
  
  execute: async (input, context) => {
    console.log(`📄 Generating CSV output: ${input.outputPath}`);
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(input.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Check if file exists to determine if we need headers
      const fileExists = fs.existsSync(input.outputPath);
      
      // Define CSV headers
      const headers = [
        { id: 'companyName', title: 'Company Name' },
        { id: 'role', title: 'Role' },
        { id: 'name', title: 'Executive Name' },
        { id: 'title', title: 'Title' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'linkedinUrl', title: 'LinkedIn URL' },
        { id: 'confidence', title: 'Overall Confidence' },
        { id: 'personVerified', title: 'Person Verified' },
        { id: 'emailValid', title: 'Email Valid' },
        { id: 'phoneValid', title: 'Phone Valid' },
        { id: 'employmentCurrent', title: 'Currently Employed' },
        { id: 'verificationDetails', title: 'Verification Details' },
        { id: 'timestamp', title: 'Timestamp' }
      ];
      
      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: input.outputPath,
        header: headers,
        append: fileExists // Append mode for idempotency
      });
      
      // Write record
      await csvWriter.writeRecords([input.record]);
      
      // Get file stats
      const stats = fs.statSync(input.outputPath);
      
      const result: CSVOutputResult = {
        path: input.outputPath,
        recordsWritten: 1,
        fileSize: stats.size
      };
      
      console.log(`   ✅ CSV record written: ${input.record.name} (${input.record.role})`);
      console.log(`   📊 File size: ${(result.fileSize / 1024).toFixed(2)} KB`);
      
      return result;
    } catch (error) {
      console.log(`   ❌ CSV generation failed: ${error.message}`);
      throw error;
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default generateCSVFunction;
