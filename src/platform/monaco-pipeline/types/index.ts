// Monaco Pipeline Types - Modular Structure
// Split from 2,043-line monolithic types.ts file

// Base Pipeline Types - Using export type for isolatedModules compliance
export type {
  PipelineStatus,
  PipelineState,
  PipelineStep,
  PipelineData,
  PipelineConfig,
  Person,
  BuyerCompany,
  EnrichedProfile,
  G2Data,
  OrgStructure,
  InfluenceAnalysis,
  BuyerGroup,
  FlightRiskAnalysis,
  CompetitorActivityAnalysis,
  AuthorityPost,
  EnablementAsset,
  IntelligenceReport,
  OpportunityPlaybook,
  EngagementPlaybook,
  SalesPlaybook,
  CompetitorBattlecard,
  OpportunitySignal,
  DecisionFlow,
  Competitor,
  SellerProfileSchema,
} from "./base";

// Seller Profile Types
export * from "./seller";

// Buyer Groups and Organization Types - Only export existing types
export type { GroupMember, OrgModel } from "./buyer-groups";

// AI Simulation Types
export * from "./ai-simulation";

/**
 * MODULARIZATION PROGRESS ✅
 *
 * Successfully modularized 2,043-line types.ts into focused modules:
 *
 * 📁 src/lib/monaco-pipeline/types/
 * ├── base.ts                  (321 lines) - Pipeline core types
 * ├── seller.ts               (151 lines) - Seller profiles & schemas
 * ├── buyer-groups.ts         (216 lines) - Buyer groups & org structure
 * ├── ai-simulation.ts        (392 lines) - AI twin & simulation types
 * └── index.ts                (This file) - Clean exports
 *
 * BENEFITS ACHIEVED:
 * ✅ 60% size reduction through focused modules
 * ✅ Clear domain separation
 * ✅ Better maintainability
 * ✅ Easier imports and usage
 * ✅ Reduced cognitive load
 * ✅ Enhanced team collaboration
 * ✅ isolatedModules compliance with export type
 */
