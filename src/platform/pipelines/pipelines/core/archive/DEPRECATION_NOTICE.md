# DEPRECATION NOTICE

## Class-Based Pipeline (DEPRECATED)

**File:** `core-pipeline-class-based.js`

**Status:** ❌ DEPRECATED - Use function-based pipeline instead

**Replaced by:** `cfo-cro-function-pipeline.ts`

## Why This Was Deprecated

The class-based pipeline has been replaced with a modern function-based orchestration system following 2025 best practices:

### Problems with Class-Based Approach:
- ❌ **Not Idempotent** - Retries can cause duplicates
- ❌ **Tight Coupling** - 15+ dependencies in constructor
- ❌ **Hard to Test** - Can't test steps in isolation
- ❌ **No Progress Tracking** - Can't see which step is running
- ❌ **No Cost Tracking** - Don't know cost per step
- ❌ **No Conditional Logic** - Can't skip expensive steps
- ❌ **No Parallel Execution** - Can't run verification steps in parallel
- ❌ **Stateful** - Relies on class instance state
- ❌ **Not Reusable** - Can't reuse steps across pipelines

### Benefits of Function-Based Approach:
- ✅ **Idempotent** - Safe to retry (use upsert, not create)
- ✅ **Testable** - Test each function independently
- ✅ **Visible** - See workflow execution in real-time
- ✅ **Reusable** - Share functions across pipelines
- ✅ **Cost Tracking** - Track API costs per step
- ✅ **Progress** - Show progress for each step
- ✅ **Circuit Breaker** - Prevent cascading failures
- ✅ **Event System** - Real-time monitoring and logging
- ✅ **Saga Pattern** - Compensation logic for rollbacks

## Migration Guide

### Old Usage (DEPRECATED):
```bash
node src/platform/pipelines/pipelines/core/core-pipeline.js
```

### New Usage (RECOMMENDED):
```bash
node src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.ts
```

## Architecture Comparison

### Old (Class-Based):
```javascript
class CorePipeline {
  constructor() { /* initialize 15+ modules */ }
  
  async processCompany(company) {
    // NOT idempotent - retries can cause duplicates
    const result = await this.coresignal.discoverExecutives(...);
    const verified = await this.verifier.verify(...);
    // Tightly coupled, hard to test
  }
}
```

### New (Function-Based):
```typescript
// Pure, idempotent functions
const discoverExecutives = async (company, context) => { /* ... */ };
const verifyPerson = async (person, context) => { /* ... */ };

// Orchestrate with steps
const workflow = createWorkflow({
  steps: {
    discover: { fn: discoverExecutives, dependencies: [] },
    verify: { fn: verifyPerson, dependencies: ['discover'] }
  }
});
```

## Timeline

- **Created:** 2024 (Class-based approach)
- **Deprecated:** January 2025
- **Removal:** Scheduled for March 2025

## Support

If you need to use the old pipeline temporarily, it's available in this archive directory. However, we strongly recommend migrating to the new function-based approach for better reliability, performance, and maintainability.

For migration assistance, please refer to the new pipeline documentation or contact the development team.
