/**
 * RTP Engine Types
 * Separated to prevent circular dependencies
 */

import { RTPConfig } from "./RTPEnginePopup";

export interface AdvancedRTPConfig extends RTPConfig {
  // Advanced AI-powered features
  aiPredictiveScoring: boolean;
  behavioralTriggers: {
    emailEngagement: number;
    websiteActivity: number;
    contentDownloads: number;
    socialMediaActivity: number;
    meetingRequests: number;
  };
  
  // Product-specific strategies
  productStrategies: {
    [productId: string]: {
      name: string;
      priorityMultiplier: number;
      dealSizeRange: { min: number; max: number };
      targetPersonas: string[];
      salesCycleWeight: number;
    };
  };
  
  // Market intelligence
  marketFactors: {
    industryTrends: number;
    competitorMoves: number;
    seasonalFactors: number;
    budgetCycles: number;
    economicIndicators: number;
  };
  
  // Dynamic thresholds
  dynamicAdjustments: {
    pipelineHealthBoost: boolean;
    quotaAttainmentFactor: boolean;
    teamPerformanceWeight: boolean;
    marketConditionAdjustment: boolean;
  };
  
  // Advanced scoring
  advancedScoring: {
    intentDataWeight: number;
    engagementVelocity: number;
    contentConsumption: number;
    socialSignals: number;
    technographicMatch: number;
  };
}
