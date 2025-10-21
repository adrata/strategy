# Preview API Enhancement Guide

**Date**: January 2025  
**Status**: Implementation Complete  
**Version**: 1.0

## Overview

The Preview API enhancement transforms buyer group discovery from narrow, targeted searches to comprehensive, intelligent discovery. This guide explains the implementation and usage of the enhanced buyer group engine.

## What Changed

### Before: Limited Visibility
```javascript
// Old approach - narrow searches
const cfoResult = await coresignal.discoverExecutives(companyName, ['CFO']);
const ceoResult = await coresignal.discoverExecutives(companyName, ['CEO']);
const ctoResult = await coresignal.discoverExecutives(companyName, ['CTO']);

// Result: 8-12 members (forced by search limitations)
```

### After: Comprehensive Discovery
```javascript
// New approach - Preview API
const previewResult = await previewDiscovery.discoverBuyerGroup(companyName, {
  enrichmentLevel: 'identify',
  website: company.website
});

// Result: 20-30 high-quality members (comprehensive visibility)
```

## Key Components

### 1. BuyerGroupPreviewDiscovery
**Location**: `src/platform/pipelines/modules/core/BuyerGroupPreviewDiscovery.js`

Main orchestrator for Preview API-based buyer group discovery:

```javascript
const previewDiscovery = new BuyerGroupPreviewDiscovery();

const buyerGroup = await previewDiscovery.discoverBuyerGroup('Nike', {
  enrichmentLevel: 'identify',
  website: 'nike.com'
});
```

**Features**:
- Preview search for 100 employees (1 credit)
- Intelligent role scoring and classification
- Smart candidate selection
- Comprehensive buyer group structure

### 2. CoreSignalPreviewClient
**Location**: `src/platform/pipelines/modules/core/CoreSignalPreviewClient.js`

Specialized client for CoreSignal Preview API:

```javascript
const previewClient = new CoreSignalPreviewClient();

// Employee preview search
const employees = await previewClient.searchBuyerGroupEmployees('Nike');

// Company preview search
const companies = await previewClient.searchCompanyByName('Nike');
```

**Features**:
- Employee Preview API integration
- Company Preview API integration
- Proper field mapping
- Rate limiting and error handling

### 3. PreviewRoleScoringEngine
**Location**: `src/platform/pipelines/modules/core/PreviewRoleScoringEngine.js`

Advanced role scoring algorithms:

```javascript
const scoringEngine = new PreviewRoleScoringEngine();

const scores = scoringEngine.scoreCandidate(employee);
// Returns: { decision: 0.8, champion: 0.6, stakeholder: 0.4, ... }
```

**Features**:
- Title-based scoring (40% weight)
- Department-based scoring (30% weight)
- Seniority-based scoring (20% weight)
- Network influence scoring (10% weight)

## Integration Points

### 1. Buyer Group Engine Enhancement
**File**: `src/platform/intelligence/buyer-group/buyer-group-engine.ts`

```typescript
// Enhanced discovery method
async discover(request: EnrichmentRequest): Promise<EnrichmentResult> {
  // Use Preview API for comprehensive discovery
  const previewResult = await this.previewDiscovery.discoverBuyerGroup(
    request.companyName, 
    {
      enrichmentLevel: request.enrichmentLevel,
      website: request.website
    }
  );

  // Process with progressive enrichment
  const result = await this.enrichmentEngine.enrich({
    ...request,
    previewData: previewResult
  });

  return result;
}
```

### 2. Progressive Enrichment Integration
**File**: `src/platform/intelligence/buyer-group/progressive-enrichment.ts`

```typescript
// Level 1: Preview-based identification
private async enrichLevel1_Identify(request: EnrichmentRequest): Promise<BuyerGroup> {
  if (request.previewData) {
    // Use Preview API data for comprehensive identification
    return {
      companyName: request.previewData.companyName,
      totalMembers: request.previewData.totalMembers,
      roles: request.previewData.roles,
      discoveryMethod: 'preview_comprehensive'
    };
  }
  
  // Fallback to traditional pipeline
  // ...
}
```

## Usage Examples

### 1. Basic Preview Discovery
```javascript
const previewDiscovery = new BuyerGroupPreviewDiscovery();

const result = await previewDiscovery.discoverBuyerGroup('Nike', {
  enrichmentLevel: 'identify'
});

console.log(`Found ${result.totalMembers} buyer group members`);
console.log(`Cohesion Score: ${result.cohesion.score}%`);
```

### 2. Enhanced Buyer Group Engine
```javascript
const buyerGroupEngine = new BuyerGroupEngine();

const result = await buyerGroupEngine.discover({
  companyName: 'Nike',
  website: 'nike.com',
  enrichmentLevel: 'identify',
  workspaceId: 'workspace-123'
});

console.log(`Buyer Group: ${result.buyerGroup.totalMembers} members`);
console.log(`Discovery Method: ${result.buyerGroup.discoveryMethod}`);
```

### 3. Role Scoring Analysis
```javascript
const scoringEngine = new PreviewRoleScoringEngine();

const employee = {
  active_experience_title: 'VP of Finance',
  active_experience_department: 'Finance',
  active_experience_management_level: 'VP-Level',
  connections_count: 500
};

const scores = scoringEngine.scoreCandidate(employee);
console.log(`Best role: ${scores.bestRole} (${Math.round(scores.bestScore * 100)}%)`);
```

## Preview API Response Fields

The Preview API returns these curated fields perfect for buyer group discovery:

```typescript
interface EmployeePreview {
  // Core identification
  id: number;
  full_name: string;
  linkedin_url: string;
  headline: string;
  
  // Location
  location_full: string;
  location_country: string;
  
  // Network metrics
  connections_count: number;
  followers_count: number;
  
  // Current company info
  company_name: string;
  company_linkedin_url: string;
  company_website: string;
  company_industry: string;
  
  // Current role info (CRITICAL for buyer group)
  active_experience_title: string;
  active_experience_department: string;
  active_experience_management_level: string;
  
  // Company details
  company_hq_full_address: string;
  company_hq_country: string;
  
  // Scoring
  _score: number;
}
```

## Role Scoring Algorithm

### Decision Maker Scoring
- **C-level executives**: 1.0 score
- **VPs with budget authority**: 0.9 score
- **Directors with P&L**: 0.7 score
- **Finance/Operations departments**: +0.3 bonus

### Champion Scoring
- **Sales/Marketing leaders**: 1.0 score
- **Operations/Product leaders**: 0.8 score
- **Growth/Revenue roles**: 0.7 score
- **Relevant departments**: +0.3 bonus

### Stakeholder Scoring
- **Directors/Managers**: 0.9 score
- **Product/IT/Operations**: 0.8 score
- **Technical roles**: 0.7 score
- **Head of roles**: 0.5 score

### Blocker Scoring
- **Legal/Compliance**: 1.0 score
- **Security/Risk**: 0.9 score
- **Procurement**: 0.8 score
- **Finance gatekeepers**: 0.6 score

### Introducer Scoring
- **Board/Advisory roles**: 1.0 score
- **Partnership/Ecosystem**: 0.9 score
- **High network influence**: 0.8 score
- **Industry relations**: 0.7 score

## Quality Metrics

### Cohesion Scoring
```javascript
const cohesionScore = {
  score: Math.round(averageScore * 100),
  level: getCohesionLevel(averageScore), // Excellent/Good/Fair/Poor
  departmentAlignment: calculateDepartmentAlignment(roles),
  confidence: Math.min(0.9, averageScore + 0.2)
};
```

### Role Distribution
```javascript
const roleDistribution = {
  decision: { min: 1, max: 3, ideal: 2 },
  champion: { min: 2, max: 4, ideal: 3 },
  stakeholder: { min: 3, max: 5, ideal: 4 },
  blocker: { min: 0, max: 2, ideal: 1 },
  introducer: { min: 1, max: 3, ideal: 2 }
};
```

## Testing

### Integration Test
```bash
# Run comprehensive test suite
node src/platform/pipelines/tests/preview-api-integration-test.js
```

### Test Coverage
- Preview API connectivity
- Role scoring accuracy
- Buyer group quality metrics
- Performance benchmarks
- Error handling

## Performance Benefits

### Cost Efficiency
- **Before**: 3-5 narrow searches × 1 credit = 3-5 credits
- **After**: 1 preview search = 1 credit
- **Savings**: 60-80% cost reduction

### Coverage Improvement
- **Before**: ~15-20 employees visible
- **After**: 100 employees visible
- **Improvement**: 5x better coverage

### Quality Enhancement
- **Before**: Force-fit role assignments
- **After**: Score-based intelligent selection
- **Result**: Better buyer group quality

## Migration Guide

### 1. Update Imports
```javascript
// Add Preview API components
const BuyerGroupPreviewDiscovery = require('./modules/core/BuyerGroupPreviewDiscovery');
const CoreSignalPreviewClient = require('./modules/core/CoreSignalPreviewClient');
const PreviewRoleScoringEngine = require('./modules/core/PreviewRoleScoringEngine');
```

### 2. Update Buyer Group Engine
```typescript
// Enhanced buyer group engine
export class BuyerGroupEngine {
  private previewDiscovery: BuyerGroupPreviewDiscovery;

  constructor() {
    this.previewDiscovery = new BuyerGroupPreviewDiscovery();
  }

  async discover(request: EnrichmentRequest): Promise<EnrichmentResult> {
    // Use Preview API for comprehensive discovery
    const previewResult = await this.previewDiscovery.discoverBuyerGroup(
      request.companyName, 
      options
    );
    
    // Process with existing enrichment pipeline
    return await this.enrichmentEngine.enrich({
      ...request,
      previewData: previewResult
    });
  }
}
```

### 3. Update Progressive Enrichment
```typescript
// Enhanced Level 1 identification
private async enrichLevel1_Identify(request: EnrichmentRequest): Promise<BuyerGroup> {
  if (request.previewData) {
    // Use Preview API data
    return transformPreviewData(request.previewData);
  }
  
  // Fallback to traditional pipeline
  return await this.traditionalDiscovery(request);
}
```

## Troubleshooting

### Common Issues

1. **Preview API returns no results**
   - Check company name variations
   - Verify API key configuration
   - Try broader search criteria

2. **Low role scores**
   - Adjust scoring thresholds
   - Review title/department patterns
   - Check data quality

3. **Poor cohesion scores**
   - Analyze role distribution
   - Review department alignment
   - Consider candidate selection criteria

### Debug Mode
```javascript
const previewDiscovery = new BuyerGroupPreviewDiscovery({
  debug: true,
  verbose: true
});
```

## Future Enhancements

### Planned Features
1. **AI-Powered Scoring**: Machine learning-based role scoring
2. **Dynamic Thresholds**: Adaptive scoring based on company size
3. **Industry Specialization**: Industry-specific role patterns
4. **Real-time Updates**: Live buyer group monitoring

### API Improvements
1. **Batch Processing**: Multiple companies in single request
2. **Caching**: Intelligent result caching
3. **Rate Limiting**: Advanced rate limiting strategies
4. **Monitoring**: Comprehensive performance monitoring

## Conclusion

The Preview API enhancement transforms buyer group discovery from a narrow, limited process to a comprehensive, intelligent system. By providing broad visibility into organizational structures and using sophisticated scoring algorithms, it delivers significantly better buyer groups with the same API costs.

The implementation maintains backward compatibility while providing substantial improvements in coverage, quality, and efficiency. The modular design allows for easy integration and future enhancements.
