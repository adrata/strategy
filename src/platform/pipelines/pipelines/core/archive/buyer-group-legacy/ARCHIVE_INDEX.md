# Buyer Group Legacy Code Archive

**Archive Date**: October 10, 2025  
**Reason**: Consolidation of all buyer group functionality into the new unified pipeline  
**New Location**: `src/platform/pipelines/pipelines/core/buyer-group-pipeline.js`

## 📁 Archive Structure

### `/services/` - Core Buyer Group Services
**Original Location**: `src/platform/services/buyer-group/`

Contains the original TypeScript buyer group intelligence modules:
- `buyer-group-identifier.ts` - Main buyer group identification logic
- `role-assignment-engine.ts` - Role assignment algorithms
- `cohesion-analyzer.ts` - Buyer group cohesion analysis
- `authority-analyzer.ts` - Decision-making authority analysis
- `title-matcher.ts` - Title pattern matching system
- `profile-analyzer.ts` - Profile data transformation
- `query-builder.ts` - CoreSignal search query generation
- `coresignal-client.ts` - CoreSignal API integration
- `pain-intelligence.ts` - Pain signal detection
- `company-intelligence.ts` - Company analysis
- `candidate-ranker.ts` - Candidate scoring and ranking
- `influence-calculator.ts` - Influence scoring
- `role-balancer.ts` - Role distribution optimization
- `industry-adapter.ts` - Industry-specific adaptations
- `benchmark.ts` - Quality benchmarking
- `report-generator.ts` - Report generation
- `seller-profiles.ts` - Pre-built seller profiles
- `types.ts` - TypeScript type definitions
- `index.ts` - Main pipeline orchestrator
- `README.md` - Original documentation
- `USAGE.md` - Usage instructions

**Status**: ✅ **INTEGRATED** - All functionality has been integrated into the new pipeline via `buyer-group-bridge.js`

### `/monaco-pipeline/` - Monaco Pipeline Buyer Group Steps
**Original Location**: `src/platform/monaco-pipeline/steps/`

Contains Monaco pipeline specific buyer group modules:
- `identifyBuyerGroups.ts` - Buyer group identification step
- `analyzeBuyerGroupDynamics.ts` - Buyer group dynamics analysis
- `findOptimalBuyers.ts` - Optimal buyer identification
- `generateEngagementPlaybooks.ts` - Engagement strategy generation
- `generateOpportunityPlaybooks.ts` - Opportunity playbook generation
- `generateSalesPlaybooks.ts` - Sales playbook generation
- `generateDecisionFlows.ts` - Decision flow mapping
- `generateOpportunitySignals.ts` - Opportunity signal detection
- `generateAuthorityContent.ts` - Authority content generation
- `generateBudgetTimingPredictions.ts` - Budget timing analysis
- `generateCompetitorBattlecards.ts` - Competitor analysis
- `generateComprehensiveIntelligence.ts` - Comprehensive intelligence
- `generateDepartmentalIntelligence.ts` - Department-specific intelligence
- `generateEnablementAssets.ts` - Sales enablement assets
- `generateHypermodernReports.ts` - Advanced reporting
- `generateIntelligenceReports.ts` - Intelligence report generation
- `generateOutreachSequences.ts` - Outreach sequence generation
- `identifyDecisionMakers.ts` - Decision maker identification
- `modelOrgStructure.ts` - Organizational structure modeling
- `normalizeTitles.ts` - Title normalization
- `smartTargetingEngine.ts` - Smart targeting algorithms
- `traceDecisionJourneys.ts` - Decision journey mapping

**Status**: 🔄 **PARTIALLY INTEGRATED** - Core functionality integrated, Monaco-specific features preserved

### `/scripts/` - Buyer Group Analysis Scripts
**Original Location**: `scripts/`

Contains various buyer group analysis and testing scripts:
- `complete-buyer-group-analysis.js` - Complete analysis pipeline
- `run-buyer-group.js` - Main execution script
- `run-buyer-group.ts` - TypeScript version
- `smart-buyer-group-discovery.js` - Smart discovery algorithm
- `optimized-buyer-group-discovery.js` - Optimized discovery
- `hierarchical-buyer-group-discovery.js` - Hierarchical discovery
- `bulk-buyer-group-discovery.js` - Bulk processing
- `test-buyer-group-distribution.js` - Distribution testing
- `test-buyer-group-parallel-optimization.js` - Parallel optimization testing
- `audit-buyer-group-system.js` - System auditing
- `audit-buyer-groups.js` - Buyer group auditing
- `audit-buyer-group-precision.js` - Precision auditing
- `audit-buyer-group-roles.js` - Role auditing
- `check-buyer-group-progress.js` - Progress monitoring
- `check-top-buyer-groups.js` - Top buyer group analysis
- `check-recent-buyer-groups.js` - Recent buyer group analysis
- `check-not-in-buyer-group.js` - Missing buyer group analysis
- `verify-buyer-group-roles.js` - Role verification
- `validate-buyer-group-timeline.js` - Timeline validation
- `fix-buyer-group-roles.js` - Role fixing
- `optimize-buyer-groups-for-launch.js` - Launch optimization
- `optimize-existing-buyer-groups.js` - Existing optimization
- `optimize-buyer-group-distribution.js` - Distribution optimization
- `investigate-buyer-group-storage.js` - Storage investigation
- `create-placeholder-buyer-groups.js` - Placeholder creation
- `buyer-group-enhancement-summary.js` - Enhancement summary
- Various 5bars analysis scripts
- Various Alabama Power analysis scripts
- Various Dan buyer group test scripts
- Various demo and test scripts

**Status**: 🔄 **REPLACED** - Functionality replaced by new pipeline and test scripts

### `/frontend/` - Frontend Buyer Group Components
**Original Location**: `src/frontend/components/pipeline/tabs/`

Contains frontend buyer group components:
- `UniversalBuyerGroupsTab.tsx` - Universal buyer groups tab
- `UniversalBuyerGroupTab.tsx` - Universal buyer group tab

**Status**: ✅ **ACTIVE** - Still in use, not archived (components remain in original location)

### `/powerhouse-modules/` - Powerhouse Pipeline Modules
**Original Location**: `src/platform/pipelines/modules/powerhouse/`

Contains advanced buyer group modules:
- `effortless-buyer-group-ai.js` - Effortless AI buyer group discovery
- `retail-fixtures-buyer-groups.js` - Retail fixtures specialized buyer groups
- `ai-buyer-group-system.js` - Advanced AI buyer group system
- `personalized-buyer-group-ai.js` - Personalized AI buyer group generation

**Status**: 🔄 **EVALUATING** - Advanced features may be integrated later

### `/analysis/` - Analysis Scripts and Data
**Original Location**: `scripts/analysis/`

Contains Python analysis scripts:
- `view_buyer_groups.py` - Buyer group visualization
- `find_mux_buyer_group.py` - Mux buyer group analysis
- `find_clumio_buyer_group.py` - Clumio buyer group analysis
- `enrich_mux_buyer_groups.py` - Mux buyer group enrichment
- `analyze_yello_expanded_buyer_group.py` - Yello expanded analysis
- `analyze_yello_buyer_group.py` - Yello buyer group analysis
- `analyze_clumio_expanded_buyer_group.py` - Clumio expanded analysis
- `analyze_clumio_buyer_group.py` - Clumio buyer group analysis

**Status**: 🔄 **PRESERVED** - Analysis scripts preserved for historical reference

## 🔄 Migration Status

### ✅ **FULLY INTEGRATED**
- Core buyer group identification logic
- Role assignment algorithms
- Cohesion analysis
- Contact enrichment
- Quality assessment
- CSV output generation
- Progress monitoring
- Error handling
- Caching system

### 🔄 **PARTIALLY INTEGRATED**
- Monaco pipeline specific features
- Advanced AI buyer group systems
- Industry-specific adaptations
- Personalized buyer group generation

### 📋 **REPLACED BY NEW PIPELINE**
- All analysis scripts
- Testing scripts
- Bulk processing scripts
- Audit scripts
- Optimization scripts

## 🎯 **NEW UNIFIED LOCATION**

All active buyer group functionality is now consolidated in:

```
src/platform/pipelines/pipelines/core/
├── buyer-group-pipeline.js          # Main pipeline (production ready)
├── buyer-group-config.js            # Configuration
├── buyer-group-bridge.js            # TypeScript integration bridge
├── test-buyer-group-pipeline.js     # Test suite
└── BUYER_GROUP_EXECUTION_GUIDE.md   # Documentation
```

## 📞 **Support**

For questions about the archived code or migration:
1. Check the new pipeline documentation: `BUYER_GROUP_EXECUTION_GUIDE.md`
2. Review the test suite: `test-buyer-group-pipeline.js`
3. Examine the bridge module: `buyer-group-bridge.js`

## 🚀 **Next Steps**

1. **Production Use**: Use the new unified pipeline for all buyer group discovery
2. **Testing**: Run the test suite to validate functionality
3. **Monitoring**: Use the progress checker for pipeline monitoring
4. **Customization**: Modify configuration as needed for specific use cases

---

**Note**: This archive preserves all historical buyer group code for reference and potential future integration of advanced features. The new unified pipeline provides all essential functionality with improved performance, reliability, and maintainability.
