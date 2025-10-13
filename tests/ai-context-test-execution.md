# AI Context Test Suite Execution Guide

## Overview

This document provides instructions for running the comprehensive AI context test suite that validates the AI's ability to understand and use workspace, user, record, and list view context across all scenarios.

## Test Structure

The test suite is organized into three main categories:

### 1. Unit Tests (`tests/unit/ai-context/`)
- **RecordContextProvider Tests**: Test context provider functionality
- **AIContextService Tests**: Test context building and combination
- **Context Validation Tests**: Test context validation layer

### 2. Integration Tests (`tests/integration/ai-context/`)
- **AI Chat API Tests**: Test API endpoint with context handling
- **ClaudeAIService Tests**: Test AI service with context integration
- **Context Flow Tests**: Test complete context flow from UI to AI

### 3. End-to-End Tests (`tests/e2e/ai-context/`)
- **Speedrun Context Tests**: Test Speedrun-specific context scenarios
- **Pipeline Context Tests**: Test Pipeline-specific context scenarios
- **Workspace Context Tests**: Test workspace context across scenarios
- **AI Response Quality Tests**: Test response quality with context

## Running the Tests

### Prerequisites

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Set up test environment variables:
   ```bash
   cp .env.example .env.test
   # Configure test database and API keys
   ```

3. Set up test database:
   ```bash
   npm run db:test:setup
   ```

### Unit Tests

Run all unit tests:
```bash
npm run test tests/unit/ai-context/
```

Run specific unit test files:
```bash
npm run test tests/unit/ai-context/record-context-provider.test.tsx
npm run test tests/unit/ai-context/ai-context-service.test.ts
npm run test tests/unit/ai-context/context-validation.test.ts
```

### Integration Tests

Run all integration tests:
```bash
npm run test tests/integration/ai-context/
```

Run specific integration test files:
```bash
npm run test tests/integration/ai-context/ai-chat-api.test.ts
npm run test tests/integration/ai-context/claude-ai-service.test.ts
```

### End-to-End Tests

Run all E2E tests:
```bash
npm run test:e2e tests/e2e/ai-context/
```

Run specific E2E test files:
```bash
npm run test:e2e tests/e2e/ai-context/speedrun-context.spec.ts
npm run test:e2e tests/e2e/ai-context/pipeline-context.spec.ts
npm run test:e2e tests/e2e/ai-context/workspace-context.spec.ts
npm run test:e2e tests/e2e/ai-context/ai-response-quality.spec.ts
```

### Complete Test Suite

Run all AI context tests:
```bash
npm run test:ai-context
```

Run with coverage:
```bash
npm run test:ai-context:coverage
```

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage for context providers and services
- **Integration Tests**: 100% coverage of context flow paths
- **E2E Tests**: 100% coverage of 8 core scenarios defined in plan

## Test Scenarios Covered

### 1. Speedrun Context Scenarios
- ✅ Sprint view (list): AI knows about visible prospects
- ✅ Prospect detail view: AI knows about specific prospect
- ✅ Navigation between prospects: Context updates correctly
- ✅ No prospect selected: AI provides general advice
- ✅ AI responses reference specific prospect data

### 2. Pipeline Context Scenarios
- ✅ Leads list view: AI knows about visible leads
- ✅ Lead detail view: AI knows about specific lead
- ✅ Companies list view: AI can compare to ICP
- ✅ Company detail view: AI knows about specific company
- ✅ Prospects list view: AI knows about visible prospects
- ✅ Navigation between records: Context updates

### 3. Workspace Context Scenarios
- ✅ AI knows workspace business model
- ✅ AI knows what products/services are sold
- ✅ AI knows target market and ICP
- ✅ AI provides workspace-specific advice
- ✅ Context switches when changing workspaces

### 4. AI Response Quality Scenarios
- ✅ AI references specific record names from list view
- ✅ AI provides advice specific to current record
- ✅ AI acknowledges when context is incomplete
- ✅ AI suggestions align with workspace business model
- ✅ AI compares prospects to ICP correctly

## Test Data and Factories

The test suite uses comprehensive test data factories located in:
- `tests/utils/ai-context-test-factories.ts`: Test data creation
- `tests/utils/ai-context-test-helpers.ts`: Test utilities and helpers

## Mock Setup

All necessary mocks are configured in:
- `tests/setup/jest.setup.ts`: Jest setup with AI context service mocks

## Debugging Tests

### Unit Test Debugging
```bash
npm run test:debug tests/unit/ai-context/record-context-provider.test.tsx
```

### Integration Test Debugging
```bash
npm run test:debug tests/integration/ai-context/ai-chat-api.test.ts
```

### E2E Test Debugging
```bash
npm run test:e2e:debug tests/e2e/ai-context/speedrun-context.spec.ts
```

## Test Results and Reporting

### Coverage Reports
```bash
npm run test:coverage
# View coverage report at coverage/lcov-report/index.html
```

### Test Reports
```bash
npm run test:report
# View test report at test-results/jest-report.html
```

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run AI Context Tests
  run: |
    npm run test:ai-context
    npm run test:ai-context:coverage
```

## Troubleshooting

### Common Issues

1. **Test Database Connection**: Ensure test database is running and accessible
2. **Mock Configuration**: Verify all mocks are properly configured in jest.setup.ts
3. **Environment Variables**: Check that all required environment variables are set
4. **Dependencies**: Ensure all test dependencies are installed

### Debug Mode

Run tests in debug mode for detailed logging:
```bash
DEBUG=ai-context:* npm run test:ai-context
```

## Performance Considerations

- Unit tests should complete within 30 seconds
- Integration tests should complete within 2 minutes
- E2E tests should complete within 5 minutes
- Total test suite should complete within 10 minutes

## Maintenance

### Adding New Tests

1. Follow the existing test structure and naming conventions
2. Use the provided test factories and helpers
3. Add appropriate mocks for new dependencies
4. Update this documentation with new test scenarios

### Updating Test Data

1. Update test factories in `ai-context-test-factories.ts`
2. Ensure test data reflects realistic scenarios
3. Update test expectations accordingly

### Test Maintenance

- Review and update tests when context structure changes
- Ensure tests remain relevant as features evolve
- Maintain test coverage goals
- Update documentation as needed

## Success Criteria

The AI context test suite is considered successful when:

1. ✅ All tests pass consistently
2. ✅ Coverage goals are met (90%+ unit, 100% integration/E2E)
3. ✅ Tests complete within performance targets
4. ✅ AI responses demonstrate proper context usage
5. ✅ Context validation works correctly
6. ✅ All 8 core scenarios are covered and passing

## Next Steps

After running the test suite:

1. Review any failing tests and fix issues
2. Analyze coverage reports and add tests for uncovered areas
3. Update test data to reflect production scenarios
4. Integrate with CI/CD pipeline
5. Set up automated test execution and reporting
6. Monitor test performance and optimize as needed
