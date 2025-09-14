/**
 * Adrata Rust WebAssembly API Service
 * 
 * High-performance Rust operations for:
 * - Buyer group generation
 * - Data processing
 * - Intelligence operations
 * - Pipeline processing
 */

import init, { AdrataRustApi } from '/rust-api/adrata_rust_api.js';

class RustApiService {
  private api: AdrataRustApi | null = null;
  private initialized = false;

  /**
   * Initialize the Rust WebAssembly module
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 [RUST-API] Initializing WebAssembly module...');
      await init('/rust-api/adrata_rust_api_bg.wasm');
      this['api'] = new AdrataRustApi();
      this['initialized'] = true;
      console.log('✅ [RUST-API] WebAssembly module initialized successfully');
    } catch (error) {
      console.error('❌ [RUST-API] Failed to initialize WebAssembly module:', error);
      throw new Error('Failed to initialize Rust API');
    }
  }

  /**
   * Ensure API is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Generate buyer group with Rust performance optimization
   * @param companies - Array of company data
   * @returns Processed buyer group data
   */
  async generateBuyerGroup(companies: any[]): Promise<any> {
    await this.ensureInitialized();
    
    try {
      console.log(`🚀 [RUST-API] Generating buyer group for ${companies.length} companies`);
      const companiesJson = JSON.stringify(companies);
      const result = this.api!.generate_buyer_group(companiesJson);
      console.log('✅ [RUST-API] Buyer group generated successfully');
      return result;
    } catch (error) {
      console.error('❌ [RUST-API] Buyer group generation failed:', error);
      throw error;
    }
  }

  /**
   * Process unified data operations
   * @param operation - Operation type
   * @param params - Operation parameters
   * @returns Processed data
   */
  async processData(operation: string, params: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      console.log(`🚀 [RUST-API] Processing data operation: ${operation}`);
      const paramsJson = JSON.stringify(params);
      const result = this.api!.process_data(operation, paramsJson);
      console.log('✅ [RUST-API] Data processing completed');
      return result;
    } catch (error) {
      console.error('❌ [RUST-API] Data processing failed:', error);
      throw error;
    }
  }

  /**
   * Process intelligence operations
   * @param operation - Intelligence operation type
   * @param params - Operation parameters
   * @returns Intelligence analysis results
   */
  async processIntelligence(operation: string, params: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      console.log(`🚀 [RUST-API] Processing intelligence operation: ${operation}`);
      const paramsJson = JSON.stringify(params);
      const result = this.api!.process_intelligence(operation, paramsJson);
      console.log('✅ [RUST-API] Intelligence processing completed');
      return result;
    } catch (error) {
      console.error('❌ [RUST-API] Intelligence processing failed:', error);
      throw error;
    }
  }

  /**
   * Process pipeline operations
   * @param operation - Pipeline operation type
   * @param params - Operation parameters
   * @returns Pipeline processing results
   */
  async processPipeline(operation: string, params: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      console.log(`🚀 [RUST-API] Processing pipeline operation: ${operation}`);
      const paramsJson = JSON.stringify(params);
      const result = this.api!.process_pipeline(operation, paramsJson);
      console.log('✅ [RUST-API] Pipeline processing completed');
      return result;
    } catch (error) {
      console.error('❌ [RUST-API] Pipeline processing failed:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.api) {
      this.api.free();
      this['api'] = null;
      this['initialized'] = false;
      console.log('🧹 [RUST-API] Resources cleaned up');
    }
  }
}

// Export singleton instance
export const rustApiService = new RustApiService();

// Export types for TypeScript
export interface RustApiService {
  initialize(): Promise<void>;
  generateBuyerGroup(companies: any[]): Promise<any>;
  processData(operation: string, params: any): Promise<any>;
  processIntelligence(operation: string, params: any): Promise<any>;
  processPipeline(operation: string, params: any): Promise<any>;
  cleanup(): void;
}
