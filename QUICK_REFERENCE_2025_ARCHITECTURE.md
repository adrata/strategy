# Quick Reference: 2025 Architecture

## 🎯 How to Use the New System

### Import Pure Functions

```typescript
// Import any function from the library
import {
  validateCompanyInput,
  discoverPeople,
  enrichContacts,
  analyzePersonIntelligence,
  calculateCompanyFitScore
} from '@/platform/pipelines/functions';

// Use them anywhere - they're pure!
const score = calculateCompanyFitScore(company, { innovationSegment: 'innovators' });
```

### Import Orchestrators

```typescript
// Import orchestrators for full pipelines
import {
  RoleDiscoveryPipeline,
  CompanyDiscoveryPipeline,
  PersonResearchPipeline,
  BuyerGroupDiscoveryPipeline,
  UnifiedIntelligencePipeline
} from '@/platform/pipelines/orchestrators';

// Use them in APIs or services
const pipeline = new RoleDiscoveryPipeline(apis);
const result = await pipeline.discover({ roles: ['VP Marketing'], companies: ['Salesforce'] });
```

---

## 📦 File Organization

```
functions/          Pure business logic (100% testable)
├── validation/     Input validation functions
├── discovery/      Entity discovery functions
├── enrichment/     Contact enrichment functions
├── analysis/       Intelligence analysis functions
└── scoring/        Scoring and calculation functions

orchestrators/      Thin coordination layer
├── RoleDiscoveryPipeline.ts
├── CompanyDiscoveryPipeline.ts
├── PersonResearchPipeline.ts
├── BuyerGroupDiscoveryPipeline.ts
└── UnifiedIntelligencePipeline.ts
```

---

## 🔑 Key Principles

### 1. Pure Functions (Business Logic)
- **No side effects**
- **Deterministic** (same input = same output)
- **Testable** (100% unit test coverage)
- **Composable** (can be combined easily)

### 2. Thin Orchestrators (Coordination)
- **Just coordinates** (no business logic)
- **Dependency injection** (all APIs passed in constructor)
- **Error handling** (try/catch, return success/error)
- **Logging** (console.log for visibility)

---

## 🚀 Common Patterns

### Pattern 1: Validate → Discover → Enrich → Analyze

```typescript
async discover(criteria: RoleCriteria): Promise<RoleDiscoveryResult> {
  // Step 1: Validate (pure function)
  const validated = validateRoleCriteria(criteria);
  
  // Step 2: Discover (pure function)
  const discovered = await discoverPeople(validated.roles, validated.companies, this.apis);
  
  // Step 3: Enrich (pure function)
  const enriched = await enrichContacts(discovered.people, validated.enrichmentLevel, this.apis);
  
  // Step 4: Return
  return { success: true, people: enriched };
}
```

### Pattern 2: Compose Pure Functions

```typescript
// Functions compose naturally
const pipeline = pipe(
  validateInput,
  discoverEntities,
  enrichData,
  analyzeResults,
  calculateScores
);
```

---

## 📋 Actions & Enrichment Levels

### Actions (What to Do)
- **discover** - Find entities (companies, people, roles, buyer groups)
- **enrich** - Add contact information (email, phone, LinkedIn)
- **research** - Deep intelligence analysis (6 dimensions)

### Enrichment Levels (How Much Data)
- **discover** - Basic data only (name, title, company)
- **enrich** - + Contact info (email, phone, LinkedIn)
- **research** - + Deep intelligence (all 6 dimensions)

---

## 🧪 Testing

### Test Pure Functions (Easy!)

```typescript
describe('calculateCompanyFitScore', () => {
  it('should score innovators highest', () => {
    const company = { name: 'Salesforce', industry: 'SaaS' };
    const score = calculateCompanyFitScore(company, { innovationSegment: 'innovators' });
    
    expect(score.innovationAdoption).toBe(95);
    expect(score.overall).toBeGreaterThan(70);
  });
  
  it('should handle missing data gracefully', () => {
    const company = { name: 'Unknown' };
    const score = calculateCompanyFitScore(company);
    
    expect(score.overall).toBe(50); // Base score
  });
});
```

### Test Orchestrators (Mock APIs)

```typescript
describe('RoleDiscoveryPipeline', () => {
  it('should discover roles successfully', async () => {
    const mockAPIs = {
      coreSignal: { searchPeople: jest.fn().mockResolvedValue([...]) }
    };
    
    const pipeline = new RoleDiscoveryPipeline(mockAPIs);
    const result = await pipeline.discover({ roles: ['VP Marketing'], companies: ['Salesforce'] });
    
    expect(result.success).toBe(true);
    expect(result.people.length).toBeGreaterThan(0);
  });
});
```

---

## 🎓 When to Use What

### Use Pure Functions When:
- ✅ You need to test business logic
- ✅ You need to reuse logic across pipelines
- ✅ You want deterministic behavior
- ✅ You want composable components

### Use Orchestrators When:
- ✅ You need to coordinate multiple steps
- ✅ You need to make API calls
- ✅ You need to handle errors
- ✅ You need to manage side effects

---

## 💡 Examples

### Example 1: Add New Validation Function

```typescript
// functions/validation/validateEmailInput.ts
export function validateEmailInput(email: string): string {
  const trimmed = email.trim().toLowerCase();
  
  if (!trimmed.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  return trimmed;
}

// Export in functions/index.ts
export * from './validation/validateEmailInput';

// Use anywhere
import { validateEmailInput } from '@/platform/pipelines/functions';
const cleanEmail = validateEmailInput('USER@EXAMPLE.COM');
// Returns: 'user@example.com'
```

### Example 2: Add New Scoring Function

```typescript
// functions/scoring/calculateInfluenceScore.ts
export function calculateInfluenceScore(person: Person): number {
  let score = 50; // Base score
  
  if (person.title.includes('VP')) score += 20;
  if (person.title.includes('C-level')) score += 30;
  
  return Math.min(100, score);
}

// Export in functions/index.ts
export * from './scoring/calculateInfluenceScore';

// Use in any pipeline
import { calculateInfluenceScore } from '@/platform/pipelines/functions';
const score = calculateInfluenceScore(person);
```

### Example 3: Create New Pipeline

```typescript
// orchestrators/LeadScoringPipeline.ts
import { validateCompanyInput, calculateCompanyFitScore } from '../functions';

export class LeadScoringPipeline {
  constructor(private apis: APIClients) {}
  
  async score(input: CompanyInput): Promise<LeadScoreResult> {
    // Step 1: Validate (pure function)
    const validated = validateCompanyInput(input);
    
    // Step 2: Fetch data (API call)
    const companyData = await this.apis.coreSignal.getCompany(validated.companyName);
    
    // Step 3: Calculate score (pure function)
    const fitScore = calculateCompanyFitScore(companyData);
    
    return { success: true, score: fitScore };
  }
}
```

---

## 🔧 Troubleshooting

### "Cannot find module '@/platform/pipelines/functions'"

**Fix:** Make sure you're importing from the index:
```typescript
// ✅ Correct
import { validateCompanyInput } from '@/platform/pipelines/functions';

// ❌ Wrong
import { validateCompanyInput } from '@/platform/pipelines/functions/validation/validateCompanyInput';
```

### "Function X is not exported"

**Fix:** Add export to `functions/index.ts`:
```typescript
export * from './category/yourFunction';
```

### "Pipeline returns undefined"

**Fix:** Make sure all functions return values:
```typescript
// ❌ Wrong
function calculate(x) {
  x * 2; // No return!
}

// ✅ Correct
function calculate(x) {
  return x * 2;
}
```

---

## 📚 Additional Resources

- **Main Documentation:** `REFACTORING_COMPLETE_2025.md`
- **Architecture Plan:** `Pipeline Architecture 2025.md` (in plans)
- **Function Library:** `src/platform/pipelines/functions/`
- **Orchestrators:** `src/platform/pipelines/orchestrators/`

---

**Questions?** Check the main documentation or look at existing functions for examples!

