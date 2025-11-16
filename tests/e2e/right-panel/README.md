# Right Panel Quality Battle Test

Comprehensive end-to-end test suite for the AI Right Panel that validates quality, context awareness, and user experience.

## Overview

This test suite battle-tests the Right Panel with various question types to ensure:
- ✅ Context-aware responses (seller + buyer context)
- ✅ Response quality and relevance
- ✅ Typewriter effect smoothness
- ✅ Auto-scroll functionality
- ✅ Error handling
- ✅ Performance metrics

## Test Categories

1. **Context-Aware Questions**: Tests AI's ability to use seller and buyer context
2. **General Sales Questions**: Tests general sales knowledge
3. **Strategy Questions**: Tests strategic thinking
4. **Messaging Questions**: Tests content generation
5. **Data Analysis Questions**: Tests analytical capabilities
6. **Edge Cases**: Tests error handling and edge cases

## Running the Tests

### Prerequisites

Set environment variables:
```bash
export TEST_EMAIL=your-email@example.com
export TEST_USERNAME=your-username
export TEST_PASSWORD=your-password
export BASE_URL=https://action.adrata.com
export TEST_WORKSPACE=your-workspace
export HEADLESS=false  # Set to 'false' to see browser
```

### Run with Jest (Puppeteer)

```bash
npm run test tests/e2e/right-panel/right-panel-quality-test.spec.ts
```

### Run with Playwright (if configured)

```bash
npm run test:right-panel:quality
npm run test:right-panel:quality:headed  # See browser
npm run test:right-panel:quality:debug   # Debug mode
```

## Test Results

The test generates a comprehensive summary report including:
- Total tests run
- Pass/fail rates
- Average response times
- Quality scores
- Category breakdown
- Failed test details

## Quality Scoring

Each response is scored on a 10-point scale:
- **Length** (2 points): Response should be substantial (>100 chars)
- **Context** (3 points): Response should use seller/buyer context
- **No Errors** (2 points): No error messages
- **Response Time** (2 points): Fast but not too fast
- **Relevance** (1 point): Contains relevant keywords

Minimum passing score: 5-6 points (depending on category)

## Typewriter Speed Optimization

The typewriter effect has been optimized to **35ms per character** based on UX research:
- **Research Finding**: 30-50ms per character is optimal for readability
- **Previous Speed**: 19-27ms (too fast)
- **New Speed**: 35ms (optimal balance)

This speed:
- ✅ Maintains engagement without feeling slow
- ✅ Allows users to read along comfortably
- ✅ Prevents overwhelming fast text
- ✅ Matches natural reading pace

## Continuous Improvement

This test suite should be run regularly to:
- Catch regressions early
- Validate improvements
- Track quality metrics over time
- Ensure world-class user experience

