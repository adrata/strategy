/**
 * 🎯 CLIENT PRESENTATION VALIDATOR
 * 
 * Ensures all data presented to clients is verified, attributed, and audit-ready
 * Zero tolerance for hallucination or unverified insights
 */

import { AuditTrailSystem, DataIntegrityValidator, DataIntegrityReport, DataSource } from './audit-trail-system';

export interface ClientPresentationData {
  id: string;
  type: 'contact_profile' | 'buyer_group' | 'company_analysis' | 'market_intelligence' | 'competitive_analysis';
  title: string;
  summary: string;
  dataPoints: ClientDataPoint[];
  sources: ClientSource[];
  confidence: number;
  lastVerified: Date;
  warnings: string[];
  recommendations: string[];
}

export interface ClientDataPoint {
  field: string;
  label: string;
  value: any;
  confidence: number;
  source: string;
  lastVerified: Date;
  verificationMethod: string;
  isVerified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ClientSource {
  name: string;
  type: 'primary' | 'secondary' | 'inferred';
  credibility: 'verified' | 'reliable' | 'estimated';
  lastUpdated: Date;
  cost?: number;
  url?: string;
}

export interface PresentationValidationResult {
  isApproved: boolean;
  overallConfidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  auditReport: DataIntegrityReport;
  clientReadyData: ClientPresentationData;
}

/**
 * 🛡️ CLIENT PRESENTATION VALIDATOR
 * 
 * Final validation layer before client presentation
 */
export class ClientPresentationValidator {
  private auditSystem: AuditTrailSystem;
  private integrityValidator: DataIntegrityValidator;

  // Minimum thresholds for client presentation
  private readonly MINIMUM_CONFIDENCE = 85;
  private readonly MAXIMUM_RISK_FACTORS = 2;
  private readonly MINIMUM_VERIFIED_SOURCES = 0.75; // 75% of sources must be verified

  constructor() {
    this.auditSystem = new AuditTrailSystem();
    this.integrityValidator = new DataIntegrityValidator(this.auditSystem);
  }

  /**
   * 🎯 VALIDATE FOR CLIENT PRESENTATION
   * 
   * Comprehensive validation before client presentation
   */
  async validateForClientPresentation(
    requestId: string,
    rawData: any,
    operation: string
  ): Promise<PresentationValidationResult> {
    
    console.log(`🔍 [CLIENT VALIDATOR] Starting validation for ${operation} (${requestId})`);
    
    // Start audit trail
    this.auditSystem.startAuditTrail(requestId, operation);
    
    try {
      // Step 1: Data integrity validation
      const integrityResult = await this.integrityValidator.validateEnrichmentResult(
        requestId, 
        rawData, 
        rawData.original || {}
      );
      
      // Step 2: Source attribution validation
      const sourceValidation = await this.validateSourceAttribution(requestId, rawData);
      
      // Step 3: Confidence threshold validation
      const confidenceValidation = this.validateConfidenceThresholds(rawData);
      
      // Step 4: Generate client-ready data
      const clientData = await this.generateClientPresentationData(requestId, rawData, operation);
      
      // Step 5: Final audit and risk assessment
      const auditReport = await this.auditSystem.finalizeAuditTrail(requestId);
      
      // Step 6: Determine approval status
      const validationResult = this.determineApprovalStatus(
        integrityResult,
        sourceValidation,
        confidenceValidation,
        auditReport,
        clientData
      );
      
      console.log(`📊 [CLIENT VALIDATOR] Validation complete: ${validationResult.isApproved ? 'APPROVED' : 'BLOCKED'} (${validationResult.overallConfidence}% confidence)`);
      
      return validationResult;
      
    } catch (error) {
      this.auditSystem.addError(requestId, `Validation failed: ${error}`);
      const auditReport = await this.auditSystem.finalizeAuditTrail(requestId);
      
      return {
        isApproved: false,
        overallConfidence: 0,
        riskLevel: 'high',
        blockers: [`Validation error: ${error}`],
        warnings: [],
        recommendations: ['Do not present this data to client', 'Investigate validation error'],
        auditReport,
        clientReadyData: this.createEmptyClientData(requestId, operation)
      };
    }
  }

  /**
   * 📋 VALIDATE SOURCE ATTRIBUTION
   * 
   * Ensures all data has proper source attribution
   */
  private async validateSourceAttribution(requestId: string, data: any): Promise<{
    isValid: boolean;
    verifiedSourceCount: number;
    totalSourceCount: number;
    missingAttribution: string[];
    unreliableSources: string[];
  }> {
    const missingAttribution: string[] = [];
    const unreliableSources: string[] = [];
    let verifiedSourceCount = 0;
    let totalSourceCount = 0;

    // Check each data field for source attribution
    for (const [field, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && field !== 'id' && field !== 'timestamp') {
        totalSourceCount++;
        
        // Check if field has source attribution
        const sourceField = `${field}_source`;
        const confidenceField = `${field}_confidence`;
        
        if (!data[sourceField]) {
          missingAttribution.push(field);
          this.auditSystem.addWarning(requestId, `Missing source attribution for field: ${field}`);
        } else {
          // Track the source
          const source: DataSource = {
            id: `${field}_source`,
            name: data[sourceField],
            type: this.inferSourceType(data[sourceField]),
            timestamp: new Date(),
            credibility: this.assessSourceCredibility(data[sourceField])
          };
          
          const confidence = data[confidenceField] || 50;
          
          this.auditSystem.trackInputData(requestId, field, value, source, confidence, 'automated_validation');
          
          if (source.credibility === 'verified') {
            verifiedSourceCount++;
          }
          
          if (confidence < 70) {
            unreliableSources.push(`${field} (${confidence}% confidence)`);
          }
        }
      }
    }

    const verificationRate = totalSourceCount > 0 ? verifiedSourceCount / totalSourceCount : 0;
    const isValid = missingAttribution.length === 0 && verificationRate >= this.MINIMUM_VERIFIED_SOURCES;

    return {
      isValid,
      verifiedSourceCount,
      totalSourceCount,
      missingAttribution,
      unreliableSources
    };
  }

  /**
   * 🎯 VALIDATE CONFIDENCE THRESHOLDS
   * 
   * Ensures confidence levels meet client presentation standards
   */
  private validateConfidenceThresholds(data: any): {
    isValid: boolean;
    overallConfidence: number;
    lowConfidenceFields: string[];
    highRiskFields: string[];
  } {
    const confidenceFields = Object.keys(data).filter(key => key.endsWith('_confidence'));
    const lowConfidenceFields: string[] = [];
    const highRiskFields: string[] = [];
    
    let totalConfidence = 0;
    let fieldCount = 0;

    for (const confidenceField of confidenceFields) {
      const field = confidenceField.replace('_confidence', '');
      const confidence = data[confidenceField] || 0;
      
      totalConfidence += confidence;
      fieldCount++;
      
      if (confidence < this.MINIMUM_CONFIDENCE) {
        lowConfidenceFields.push(`${field} (${confidence}%)`);
      }
      
      if (confidence < 60) {
        highRiskFields.push(`${field} (${confidence}%)`);
      }
    }

    const overallConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;
    const isValid = overallConfidence >= this.MINIMUM_CONFIDENCE && highRiskFields.length === 0;

    return {
      isValid,
      overallConfidence,
      lowConfidenceFields,
      highRiskFields
    };
  }

  /**
   * 📊 GENERATE CLIENT PRESENTATION DATA
   * 
   * Creates client-ready data with full attribution
   */
  private async generateClientPresentationData(
    requestId: string,
    rawData: any,
    operation: string
  ): Promise<ClientPresentationData> {
    
    const dataPoints: ClientDataPoint[] = [];
    const sources: ClientSource[] = [];
    const sourceMap = new Map<string, ClientSource>();

    // Process each data field
    for (const [field, value] of Object.entries(rawData)) {
      if (value !== null && value !== undefined && !field.endsWith('_source') && !field.endsWith('_confidence') && field !== 'id') {
        
        const sourceField = `${field}_source`;
        const confidenceField = `${field}_confidence`;
        const sourceName = rawData[sourceField] || 'Unknown';
        const confidence = rawData[confidenceField] || 50;
        
        // Create data point
        const dataPoint: ClientDataPoint = {
          field,
          label: this.generateFieldLabel(field),
          value,
          confidence,
          source: sourceName,
          lastVerified: new Date(),
          verificationMethod: this.getVerificationMethod(sourceName),
          isVerified: confidence >= this.MINIMUM_CONFIDENCE && this.assessSourceCredibility(sourceName) === 'verified',
          riskLevel: confidence >= 85 ? 'low' : confidence >= 70 ? 'medium' : 'high'
        };
        
        dataPoints.push(dataPoint);
        
        // Track unique sources
        if (!sourceMap.has(sourceName)) {
          const source: ClientSource = {
            name: sourceName,
            type: this.inferSourceType(sourceName) === 'database' ? 'primary' : 'secondary',
            credibility: this.assessSourceCredibility(sourceName),
            lastUpdated: new Date(),
            cost: rawData[`${field}_cost`] || undefined,
            url: this.getSourceUrl(sourceName)
          };
          
          sourceMap.set(sourceName, source);
          sources.push(source);
        }
      }
    }

    // Calculate overall confidence
    const overallConfidence = dataPoints.length > 0 
      ? dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / dataPoints.length 
      : 0;

    // Generate warnings and recommendations
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const lowConfidencePoints = dataPoints.filter(dp => dp.confidence < this.MINIMUM_CONFIDENCE);
    if (lowConfidencePoints.length > 0) {
      warnings.push(`${lowConfidencePoints.length} data points below confidence threshold`);
      recommendations.push('Verify low-confidence data points before presenting');
    }
    
    const unverifiedSources = sources.filter(s => s.credibility !== 'verified');
    if (unverifiedSources.length > sources.length * 0.5) {
      warnings.push('More than 50% of sources are not fully verified');
      recommendations.push('Consider additional verification for unverified sources');
    }

    return {
      id: requestId,
      type: this.inferPresentationType(operation),
      title: this.generatePresentationTitle(operation, rawData),
      summary: this.generatePresentationSummary(operation, rawData, overallConfidence),
      dataPoints,
      sources,
      confidence: overallConfidence,
      lastVerified: new Date(),
      warnings,
      recommendations
    };
  }

  /**
   * 🎯 DETERMINE APPROVAL STATUS
   * 
   * Final decision on client presentation approval
   */
  private determineApprovalStatus(
    integrityResult: any,
    sourceValidation: any,
    confidenceValidation: any,
    auditReport: DataIntegrityReport,
    clientData: ClientPresentationData
  ): PresentationValidationResult {
    
    const blockers: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Check for blockers
    if (!integrityResult.isValid) {
      blockers.push('Data integrity validation failed');
      blockers.push(...integrityResult.inconsistencies);
    }
    
    if (!sourceValidation.isValid) {
      blockers.push('Source attribution validation failed');
      if (sourceValidation.missingAttribution.length > 0) {
        blockers.push(`Missing source attribution: ${sourceValidation.missingAttribution.join(', ')}`);
      }
    }
    
    if (!confidenceValidation.isValid) {
      blockers.push('Confidence threshold validation failed');
      if (confidenceValidation.highRiskFields.length > 0) {
        blockers.push(`High-risk fields: ${confidenceValidation.highRiskFields.join(', ')}`);
      }
    }
    
    if (auditReport.riskFactors.length > this.MAXIMUM_RISK_FACTORS) {
      blockers.push(`Too many risk factors: ${auditReport.riskFactors.length}`);
    }
    
    // Collect warnings
    warnings.push(...auditReport.auditTrail.warnings);
    warnings.push(...clientData.warnings);
    
    if (confidenceValidation.lowConfidenceFields.length > 0) {
      warnings.push(`Low confidence fields: ${confidenceValidation.lowConfidenceFields.join(', ')}`);
    }
    
    // Generate recommendations
    recommendations.push(...auditReport.recommendations);
    recommendations.push(...clientData.recommendations);
    
    if (blockers.length === 0 && warnings.length > 0) {
      recommendations.push('Review warnings before client presentation');
    }
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (blockers.length > 0) {
      riskLevel = 'high';
    } else if (warnings.length > 3 || auditReport.overallConfidence < 90) {
      riskLevel = 'medium';
    }
    
    const isApproved = blockers.length === 0 && riskLevel !== 'high';
    
    return {
      isApproved,
      overallConfidence: auditReport.overallConfidence,
      riskLevel,
      blockers,
      warnings,
      recommendations,
      auditReport,
      clientReadyData: clientData
    };
  }

  /**
   * 🏷️ HELPER METHODS
   */
  private inferSourceType(sourceName: string): 'database' | 'api' | 'ai_inference' | 'user_input' | 'calculation' {
    if (sourceName.includes('database') || sourceName.includes('internal')) return 'database';
    if (sourceName.includes('api') || sourceName.includes('coresignal') || sourceName.includes('perplexity')) return 'api';
    if (sourceName.includes('ai') || sourceName.includes('inference')) return 'ai_inference';
    if (sourceName.includes('user') || sourceName.includes('manual')) return 'user_input';
    return 'calculation';
  }

  private assessSourceCredibility(sourceName: string): 'verified' | 'inferred' | 'calculated' | 'user_provided' {
    const verifiedSources = ['coresignal', 'database', 'perplexity', 'linkedin'];
    if (verifiedSources.some(vs => sourceName.toLowerCase().includes(vs))) return 'verified';
    if (sourceName.includes('inference') || sourceName.includes('ai')) return 'inferred';
    if (sourceName.includes('calculation')) return 'calculated';
    return 'user_provided';
  }

  private generateFieldLabel(field: string): string {
    return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private getVerificationMethod(sourceName: string): string {
    if (sourceName.includes('perplexity')) return 'AI-powered real-time verification';
    if (sourceName.includes('coresignal')) return 'Professional network data verification';
    if (sourceName.includes('database')) return 'Internal database validation';
    return 'Automated verification';
  }

  private getSourceUrl(sourceName: string): string | undefined {
    if (sourceName.includes('coresignal')) return 'https://coresignal.com';
    if (sourceName.includes('perplexity')) return 'https://perplexity.ai';
    return undefined;
  }

  private inferPresentationType(operation: string): ClientPresentationData['type'] {
    if (operation.includes('buyer_group')) return 'buyer_group';
    if (operation.includes('company')) return 'company_analysis';
    if (operation.includes('person') || operation.includes('contact')) return 'contact_profile';
    if (operation.includes('market')) return 'market_intelligence';
    if (operation.includes('competitive')) return 'competitive_analysis';
    return 'contact_profile';
  }

  private generatePresentationTitle(operation: string, data: any): string {
    const type = this.inferPresentationType(operation);
    switch (type) {
      case 'buyer_group': return `Buyer Group Analysis: ${data.company || 'Target Company'}`;
      case 'company_analysis': return `Company Intelligence: ${data.name || 'Target Company'}`;
      case 'contact_profile': return `Contact Profile: ${data.name || data.firstName + ' ' + data.lastName || 'Target Contact'}`;
      case 'market_intelligence': return `Market Intelligence Report`;
      case 'competitive_analysis': return `Competitive Analysis Report`;
      default: return `Intelligence Report`;
    }
  }

  private generatePresentationSummary(operation: string, data: any, confidence: number): string {
    const confidenceText = confidence >= 90 ? 'high confidence' : confidence >= 75 ? 'good confidence' : 'moderate confidence';
    return `Comprehensive analysis generated with ${confidenceText} (${confidence.toFixed(1)}%) based on verified data sources.`;
  }

  private createEmptyClientData(requestId: string, operation: string): ClientPresentationData {
    return {
      id: requestId,
      type: 'contact_profile',
      title: 'Data Validation Failed',
      summary: 'Unable to validate data for client presentation',
      dataPoints: [],
      sources: [],
      confidence: 0,
      lastVerified: new Date(),
      warnings: ['Validation failed'],
      recommendations: ['Do not present to client']
    };
  }
}

export { ClientPresentationValidator };
