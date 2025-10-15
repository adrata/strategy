# State-Based Ranking Tests

This directory contains comprehensive tests for the state-based ranking system.

## Test Files

- `state-ranking.test.ts` - Unit tests for the StateRankingService and ranking algorithms
- `speedrun-engine.test.ts` - Unit tests for the speedrun engine functionality

## Running Tests

```bash
# Run all ranking tests
npm test -- tests/unit/ranking/

# Run specific test file
npm test -- tests/unit/ranking/state-ranking.test.ts

# Run with coverage
npm test -- --coverage tests/unit/ranking/
```

## Test Coverage

The tests cover:

### StateRankingService
- ✅ State data retrieval from workspace
- ✅ State data validation (coverage percentage)
- ✅ User preference management
- ✅ State ordering logic
- ✅ Edge cases (empty data, missing states, etc.)

### Ranking Algorithms
- ✅ Global ranking functionality
- ✅ State-based ranking hierarchy
- ✅ Custom state ordering
- ✅ Score calculation
- ✅ Time zone priority handling
- ✅ Large dataset performance

### Edge Cases
- ✅ Missing company data
- ✅ Missing state information
- ✅ Empty contact lists
- ✅ Single contact scenarios
- ✅ Duplicate state entries
- ✅ Invalid input handling

## Mock Data

Tests use realistic mock data including:
- Multiple companies with different states
- Various company sizes and people counts
- Different contact priorities and statuses
- Edge cases for data validation

## Performance Tests

Includes performance tests for:
- Large contact lists (1000+ contacts)
- State data loading efficiency
- Ranking algorithm performance
- Memory usage optimization
