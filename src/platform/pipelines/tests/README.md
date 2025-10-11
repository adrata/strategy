# Function-Based Pipeline Tests

This directory contains comprehensive tests for the function-based orchestration pipeline.

## Test Structure

### Unit Tests
- **`functions/function-tests.test.ts`** - Unit tests for all pure functions
  - Company resolution function tests
  - Executive discovery function tests
  - Verification function tests (person, email, phone, employment)
  - Database save function tests
  - Output generation function tests
  - Integration tests for complete workflows
  - Error handling tests
  - Performance tests

### Integration Tests
- **`orchestration-integration.test.ts`** - Integration tests for the complete pipeline
  - End-to-end workflow tests
  - Event system integration tests
  - Circuit breaker integration tests
  - Performance integration tests
  - Error recovery tests
  - Data integrity tests

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Unit tests only
npm test -- functions/function-tests.test.ts

# Integration tests only
npm test -- orchestration-integration.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

## Test Categories

### 1. Function Tests
Each pure function is tested for:
- **Correctness** - Produces expected output for given input
- **Idempotency** - Same input always produces same output
- **Error Handling** - Gracefully handles failures
- **Performance** - Completes within timeout limits
- **Type Safety** - Returns properly typed results

### 2. Integration Tests
The complete pipeline is tested for:
- **End-to-End Workflow** - Complete company processing
- **Event System** - Real-time progress and cost tracking
- **Circuit Breaker** - Fault tolerance and recovery
- **Performance** - Scalability and response times
- **Error Recovery** - Graceful handling of failures
- **Data Integrity** - Consistent data across steps

## Test Data

Tests use mock data and simulated API responses to ensure:
- **Deterministic Results** - Tests produce consistent outcomes
- **Fast Execution** - No real API calls during testing
- **Isolation** - Tests don't depend on external services
- **Coverage** - All code paths are tested

## Mock Services

The tests mock the following services:
- **CoreSignal API** - Company and executive discovery
- **Lusha API** - Person and contact verification
- **Prospeo API** - Email and mobile verification
- **Twilio API** - Phone number validation
- **Perplexity API** - Employment verification
- **ZeroBounce API** - Email validation
- **MyEmailVerifier API** - Email validation
- **People Data Labs API** - Contact enrichment

## Test Configuration

Tests are configured with:
- **Jest** - Testing framework
- **TypeScript** - Type-safe test code
- **Mock Functions** - Simulated API responses
- **Timeout Settings** - Reasonable execution limits
- **Coverage Thresholds** - Minimum coverage requirements

## Continuous Integration

Tests run automatically on:
- **Pull Requests** - Validate changes before merge
- **Main Branch** - Ensure main branch stability
- **Scheduled Runs** - Regular health checks

## Debugging Tests

### Run Tests in Debug Mode
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="should resolve company from URL"
```

### Run Tests with Console Output
```bash
npm test -- --silent=false
```

## Test Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Include comprehensive test cases
4. Add to CI/CD pipeline
5. Update documentation

### Updating Existing Tests
1. Ensure backward compatibility
2. Update mock data if needed
3. Verify all tests still pass
4. Update documentation

### Test Data Management
- Use consistent mock data
- Avoid hardcoded values
- Make tests deterministic
- Clean up test artifacts

## Performance Benchmarks

Tests include performance benchmarks for:
- **Function Execution Time** - Individual function performance
- **Pipeline Throughput** - Companies processed per minute
- **Memory Usage** - Memory consumption during execution
- **API Call Efficiency** - Optimal API usage patterns

## Coverage Requirements

Minimum coverage thresholds:
- **Functions** - 90% line coverage
- **Branches** - 85% branch coverage
- **Statements** - 90% statement coverage
- **Overall** - 85% total coverage

## Troubleshooting

### Common Issues
1. **Timeout Errors** - Increase timeout values
2. **Mock Failures** - Check mock implementations
3. **Type Errors** - Verify TypeScript configurations
4. **Import Errors** - Check module paths

### Getting Help
- Check test logs for detailed error messages
- Review mock implementations
- Verify environment setup
- Contact development team
