/**
 * JSON OUTPUT GENERATION FUNCTION
 * 
 * Pure, idempotent function for generating JSON output with detailed verification trail
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface JSONOutputData {
  outputPath: string;
  record: {
    company: {
      name: string;
      domain: string;
      companyId: string;
    };
    executive: {
      role: 'CFO' | 'CRO';
      name: string;
      title: string;
      email?: string;
      phone?: string;
      linkedinUrl?: string;
    };
    verification: {
      overall: {
        confidence: number;
        verified: boolean;
      };
      person: any;
      email: any;
      phone: any;
      employment: any;
    };
    metadata: {
      timestamp: string;
      pipelineVersion: string;
      executionTime: number;
    };
  };
}

export interface JSONOutputResult {
  path: string;
  recordsWritten: number;
  fileSize: number;
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const generateJSONFunction: PipelineStep<JSONOutputData, JSONOutputResult> = {
  name: 'generateJSON',
  description: 'Generate JSON output with detailed verification trail and metadata',
  retryable: true,
  timeout: 5000,
  dependencies: ['saveExecutive'],
  
  execute: async (input, context) => {
    console.log(`📄 Generating JSON output: ${input.outputPath}`);
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(input.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Check if file exists to determine if we need to create array or append
      const fileExists = fs.existsSync(input.outputPath);
      let existingData: any[] = [];
      
      if (fileExists) {
        try {
          const fileContent = fs.readFileSync(input.outputPath, 'utf8');
          existingData = JSON.parse(fileContent);
          if (!Array.isArray(existingData)) {
            existingData = [existingData]; // Convert single object to array
          }
        } catch (error) {
          console.log(`   ⚠️ Could not parse existing JSON, creating new file`);
          existingData = [];
        }
      }
      
      // Add new record
      existingData.push(input.record);
      
      // Write updated data
      const jsonContent = JSON.stringify(existingData, null, 2);
      fs.writeFileSync(input.outputPath, jsonContent, 'utf8');
      
      // Get file stats
      const stats = fs.statSync(input.outputPath);
      
      const result: JSONOutputResult = {
        path: input.outputPath,
        recordsWritten: 1,
        fileSize: stats.size
      };
      
      console.log(`   ✅ JSON record written: ${input.record.executive.name} (${input.record.executive.role})`);
      console.log(`   📊 Total records: ${existingData.length}`);
      console.log(`   📊 File size: ${(result.fileSize / 1024).toFixed(2)} KB`);
      
      return result;
    } catch (error) {
      console.log(`   ❌ JSON generation failed: ${error.message}`);
      throw error;
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default generateJSONFunction;
