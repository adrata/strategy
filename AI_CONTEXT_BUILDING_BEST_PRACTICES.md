# AI Context Building Best Practices

## Research Summary

Based on industry best practices and our current implementation, here are the key recommendations for optimizing AI context building in serverless environments (Vercel).

## Current Implementation Status

✅ **Already Implemented:**
- In-memory caching (5-minute TTL) for workspace context
- Parallelized database queries using `Promise.all()`
- Timeout protection on all database queries (10s per query, 15s per context builder)
- Fallback values when queries timeout
- Singleton PrismaClient pattern to prevent connection pool exhaustion

## Best Practices from Research

### 1. **Context Summarization & Compression** ⭐ HIGH PRIORITY
**Problem:** As context grows, it consumes more tokens and increases latency.

**Solution:**
- Implement intelligent context compression for long conversations
- Summarize older conversation history instead of including full text
- Use relevance scoring to prioritize most important context elements

**Implementation:**
```typescript
// Summarize conversation history if > 10 messages
if (conversationHistory.length > 10) {
  const recentMessages = conversationHistory.slice(-5);
  const olderMessages = conversationHistory.slice(0, -5);
  const summary = await summarizeConversationHistory(olderMessages);
  // Use summary + recent messages instead of full history
}
```

### 2. **Lazy Loading & Progressive Enhancement** ⭐ HIGH PRIORITY
**Problem:** Loading all context upfront causes delays.

**Solution:**
- Load critical context first (user, workspace basics)
- Load detailed context (record intelligence, full workspace data) only if needed
- Use streaming responses where possible

**Current Gap:** We load everything upfront. Consider:
- Load minimal context first → send to AI → enhance context in background if needed
- Use two-phase context building: essential (fast) + enhanced (async)

### 3. **Enhanced Caching Strategy** ⭐ MEDIUM PRIORITY
**Current:** 5-minute in-memory cache for workspace context

**Improvements:**
- Use the existing `UnifiedCache` system for multi-layer caching (L1 memory, L2 Redis, L3 persistent)
- Cache at multiple levels:
  - User context: 15 minutes (rarely changes)
  - Workspace context: 5 minutes (current)
  - Record context: 1 minute (changes frequently)
  - System context: No cache (always fresh)

**Implementation:**
```typescript
// Use UnifiedCache instead of simple Map
import { UnifiedCache } from '@/platform/services/unified-cache';

// Cache with appropriate TTLs
const userContext = await UnifiedCache.get(
  `user-context-${userId}`,
  () => buildUserContext(userId, workspaceId),
  { ttl: 900000, tags: ['user', `user-${userId}`] } // 15 minutes
);
```

### 4. **Query Optimization & Batching** ⭐ MEDIUM PRIORITY
**Current:** Parallel queries with timeouts

**Improvements:**
- Reduce `take: 100` for people data - use `take: 20` for context building
- Only fetch fields actually used in context strings
- Use database indexes on frequently queried fields (`workspaceId`, `userId`)
- Consider materialized views for complex aggregations

**Example:**
```typescript
// Instead of fetching 100 people records
prisma.people.findMany({
  where: { workspaceId },
  select: { tags: true, city: true, state: true, country: true },
  take: 20 // Reduce from 100 to 20 for context building
})
```

### 5. **Context Boundaries & Relevance Scoring** ⭐ LOW PRIORITY
**Problem:** Including too much context reduces relevance.

**Solution:**
- Score context elements by relevance to current query
- Only include top N most relevant context pieces
- Use semantic similarity to filter context

**Future Enhancement:**
```typescript
// Score context relevance
const scoredContext = await scoreContextRelevance({
  userQuery: message,
  availableContext: [userContext, dataContext, recordContext],
  maxContextSize: 4000 // tokens
});
```

### 6. **Monitoring & Observability** ✅ ALREADY IMPLEMENTED
**Current:** Comprehensive logging with request IDs and elapsed times

**Keep:** Continue detailed logging for debugging in production

### 7. **Security & Privacy** ✅ ALREADY IMPLEMENTED
**Current:** 
- Data minimization (only fetch needed fields)
- Access control via `getSecureApiContext`
- Input sanitization via `promptInjectionGuard`

## Recommended Immediate Improvements

### Priority 1: Reduce Database Query Load
1. **Reduce `take: 100` to `take: 20`** in `EnhancedWorkspaceContextService` for people data
2. **Add database indexes** on `workspaceId` and `userId` if not already present
3. **Use UnifiedCache** for workspace context instead of simple Map

### Priority 2: Implement Context Summarization
1. **Summarize long conversation history** (>10 messages)
2. **Compress record context** if it exceeds token limits

### Priority 3: Progressive Context Loading
1. **Two-phase context building:**
   - Phase 1: Essential context (user, workspace basics) - <2s
   - Phase 2: Enhanced context (record intelligence, full data) - async
2. **Stream AI responses** while building enhanced context in background

## Architecture Recommendations

### Current Flow:
```
Request → Build All Context → Send to AI → Response
         (30s timeout risk)
```

### Recommended Flow:
```
Request → Build Essential Context (<2s) → Send to AI → Start Response
         → Build Enhanced Context (async) → Update AI if needed
```

### Alternative: Cache-First Strategy
```
Request → Check Cache → If hit: Use cached + minimal fresh data
         → If miss: Build context → Cache result → Use for response
```

## Performance Targets

Based on research and best practices:

- **Essential Context Build:** <2 seconds
- **Full Context Build:** <5 seconds (with caching)
- **Database Query Timeout:** 10 seconds (current)
- **Total Request Time:** <15 seconds (current target: 60s, too high)

## Next Steps

1. ✅ **DONE:** Add aggressive timeouts to all queries
2. **TODO:** Reduce `take: 100` to `take: 20` for people data
3. **TODO:** Migrate to UnifiedCache for better caching
4. **TODO:** Implement context summarization for long conversations
5. **TODO:** Add two-phase context building (essential + enhanced)

## References

- [Context Engineering Best Practices](https://www.architectureandgovernance.com/applications-technology/understanding-context-engineering-principles-practices-and-its-distinction-from-prompt-engineering/)
- [Serverless Architecture Best Practices](https://kirtanparmar.com/serverless-architectures-best-practices-2025/)
- [AI Agent Context Switching](https://pixeeto.com/mastering-ai-agents-how-to-handle-context-switching-effectively/)

