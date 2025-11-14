# TOP Competitor Field Manual Testing Guide

This document describes how to test the TOP Competitor Field Manual integration with the AI system.

## Overview

The TOP Competitor Field Manual has been integrated into Adrata's AI context system. This allows users to query the AI about competitive positioning, competitor strategies, and TOP's differentiation.

## Test Files

### Unit Tests
- **Location**: `tests/unit/services/top-competitor-field-manual.test.ts`
- **Purpose**: Tests the knowledge base service directly
- **Coverage**: All methods, content sections, and competitor profiles

### Integration Tests
- **Location**: `tests/integration/ai-context/top-competitor-field-manual.test.ts`
- **Purpose**: Tests AI integration and context detection
- **Coverage**: Context detection, system prompt integration, query handling

### Manual Test Script
- **Location**: `scripts/test-top-competitor-manual.ts`
- **Purpose**: End-to-end testing with actual AI API calls
- **Usage**: `npx ts-node scripts/test-top-competitor-manual.ts`

## Running Tests

### Unit Tests
```bash
npm test tests/unit/services/top-competitor-field-manual.test.ts
```

### Integration Tests
```bash
npm test tests/integration/ai-context/top-competitor-field-manual.test.ts
```

### All Tests
```bash
npm test -- top-competitor-field-manual
```

### Manual Test Script
```bash
# Make sure ANTHROPIC_API_KEY is set in your .env file
npx ts-node scripts/test-top-competitor-manual.ts
```

## Test Scenarios

### 1. Knowledge Base Service Tests
- ✅ Complete manual retrieval
- ✅ Individual competitor profiles (Burns & McDonnell, Black & Veatch, Lockard & White)
- ✅ Positioning playbook
- ✅ Sales cheat sheet
- ✅ Competitor profile detection by name
- ✅ Contextual manual generation

### 2. Context Detection Tests
- ✅ Queries about "TOP" trigger manual inclusion
- ✅ Queries about competitors trigger manual inclusion
- ✅ Queries about competitive positioning trigger manual inclusion
- ✅ EPC-related queries trigger manual inclusion
- ✅ Unrelated queries do not trigger manual inclusion
- ✅ TOP workspace automatically includes manual

### 3. AI Query Tests
The manual test script tests the following queries:

1. **TOP Competitive Advantages**
   - Query: "What are TOP's competitive advantages?"
   - Expected: References to elite, fast, full-service, speed, agility

2. **Burns & McDonnell Competition**
   - Query: "How do we compete against Burns & McDonnell?"
   - Expected: References to slow mobilization, overhead, agility

3. **Black & Veatch Vulnerabilities**
   - Query: "What are Black & Veatch's weaknesses?"
   - Expected: References to PLTE orthodoxy, slow adaptation, hybrid architectures

4. **Lockard & White Positioning**
   - Query: "How do we win against Lockard & White?"
   - Expected: References to EPC capacity, end-to-end accountability

5. **Discovery Questions**
   - Query: "What questions should I ask when competing against Burns & McDonnell?"
   - Expected: Specific discovery questions from the manual

6. **Talk Tracks**
   - Query: "What talk tracks work against large EPCs?"
   - Expected: Principal-led teams, agility, speed references

7. **RFP Language**
   - Query: "What RFP language should I use to favor TOP?"
   - Expected: Specific RFP language traps from the manual

8. **Positioning Strategy**
   - Query: "How should TOP position itself in proposals?"
   - Expected: Elite, leaner, smarter, faster positioning

9. **Competitive Comparison**
   - Query: "How does TOP compare to Burns & McDonnell and Black & Veatch?"
   - Expected: Comparison of all three competitors

10. **Sales Cheat Sheet**
    - Query: "What are the key positioning anchors for TOP?"
    - Expected: Core positioning anchors from cheat sheet

## Expected Behavior

### When Manual is Included
The AI should:
- Reference specific competitor information from the manual
- Provide talk tracks and discovery questions from the manual
- Suggest RFP language from the manual
- Use positioning strategies from the playbook
- Reference the sales cheat sheet for quick answers

### When Manual is Not Included
The AI should:
- Respond normally without competitive intelligence
- Not reference TOP-specific competitive content

## Verification Checklist

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual test script runs successfully
- [ ] AI responds correctly to competitive queries
- [ ] AI includes manual content in responses
- [ ] Context detection works for all trigger phrases
- [ ] Competitor-specific profiles are returned correctly
- [ ] Positioning playbook is accessible
- [ ] Sales cheat sheet is accessible

## Troubleshooting

### Tests Fail to Import Modules
- **Issue**: TypeScript modules not found
- **Solution**: Use `npx ts-node` or compile TypeScript first

### AI Doesn't Include Manual
- **Issue**: Context detection not working
- **Solution**: Check query contains trigger keywords (TOP, competitor names, EPC, etc.)

### API Calls Fail
- **Issue**: Missing or invalid ANTHROPIC_API_KEY
- **Solution**: Set ANTHROPIC_API_KEY in .env file

### Responses Don't Match Expected Keywords
- **Issue**: AI may paraphrase or use different language
- **Solution**: Check if response contains similar concepts, not exact keywords

## Success Criteria

✅ All unit tests pass
✅ All integration tests pass
✅ Manual test script shows 80%+ keyword match rate
✅ AI responses demonstrate understanding of manual content
✅ Context detection works correctly for all scenarios

