# Stacks System Comprehensive Audit Report

## Executive Summary

This audit identifies critical inconsistencies, potential bugs, and areas for improvement in the Stacks system. The system has good overall architecture but suffers from API endpoint inconsistencies, workspace ID resolution variability, and type safety issues.

## Critical Issues

### 1. API Endpoint Inconsistency ⚠️ CRITICAL

**Problem**: Mixed usage of `/api/v1/stacks/stories` (v1) and `/api/stacks/stories` (legacy) endpoints.

**Affected Files**:
- `useStacksData.ts` uses legacy endpoints:
  - `updateStory`: `/api/stacks/stories/${id}` (should be `/api/v1/stacks/stories/${id}`)
  - `deleteStory`: `/api/stacks/stories/${id}` (should be `/api/v1/stacks/stories/${id}`)
  - `createStory`: `/api/stacks/stories` (should be `/api/v1/stacks/stories`)
- All components correctly use `/api/v1/stacks/stories` for GET operations
- Tasks API consistently uses `/api/stacks/tasks` (no v1 version exists)

**Impact**: 
- Potential data inconsistency
- May hit different code paths with different validation/error handling
- Confusing for maintenance

**Recommendation**: Standardize on `/api/v1/stacks/stories` for all story operations. Update `useStacksData.ts` to use v1 endpoints.

**Status**: ✅ FIXED - All story operations now use `/api/v1/stacks/stories` endpoints consistently.

### 2. Workspace ID Resolution Inconsistency ⚠️ HIGH

**Problem**: Multiple different fallback strategies for workspace ID resolution across components.

**Current Patterns**:
1. `StacksBacklogTable.tsx`: `ui.activeWorkspace?.id` → `workspaceSlug` → `authUser.activeWorkspaceId`
2. `StacksBoard.tsx`: `ui.activeWorkspace?.id` → `workspaceSlug` → `authUser.activeWorkspaceId`
3. `useStacksData.ts`: Only uses `user.activeWorkspaceId` (no fallbacks)
4. `StacksLeftPanel.tsx`: Similar fallback pattern

**Impact**:
- Different components may resolve different workspace IDs
- Inconsistent behavior when workspace context is missing
- Potential for showing wrong workspace data

**Recommendation**: Create a shared `useWorkspaceId()` hook that implements consistent fallback logic.

### 3. Type Safety Issues ⚠️ MEDIUM

**Problem**: Extensive use of `any` types throughout the codebase.

**Affected Areas**:
- `StacksProvider.tsx`: `selectedItem: any`, `projects: any[]`, etc.
- Component props often use `any` for story/task data
- API responses not properly typed

**Impact**:
- Runtime errors not caught at compile time
- Poor IDE autocomplete
- Difficult to refactor safely

**Recommendation**: Create proper TypeScript interfaces for all stacks entities and use them consistently.

### 4. Error Handling Inconsistency ⚠️ MEDIUM

**Problem**: Different error handling patterns across components.

**Patterns Found**:
- `useStacksData.ts`: Throws errors for tasks, returns empty arrays for stories/projects
- `StacksBacklogTable.tsx`: Catches errors and logs, reverts optimistic updates
- `StacksBoard.tsx`: Catches errors and reverts optimistic updates
- `StacksProvider.tsx`: Uses `Promise.allSettled` to continue on errors

**Impact**:
- Inconsistent user experience
- Some failures silently ignored, others show errors
- Difficult to debug issues

**Recommendation**: Standardize error handling with a common error boundary and error reporting pattern.

## Moderate Issues

### 5. Status Filtering Logic

**Fixed**: Workstream board statuses are now properly excluded from backlog view.

**Status Definitions**:
- Workstream Board: `['up-next', 'in-progress', 'built', 'qa1', 'qa2', 'shipped', 'todo']`
- Backlog: Excludes `['in-progress', 'built', 'qa1', 'qa2', 'shipped', 'done']`
- Up Next: `['up-next', 'todo']`

### 6. Rank Persistence

**Fixed**: Ranks are now properly persisted for:
- Same-column drag-and-drop in StacksBoard
- Right-click move operations in StacksBoard
- Cross-section moves in StacksBacklogTable

**Verification Needed**: Ensure rank updates handle both stories and tasks correctly everywhere.

### 7. Bug Visibility

**Fixed**: Bugs (tasks with `type='bug'`) are now properly preserved in refresh operations.

**Implementation**: 
- `refreshItems()` helper fetches both stories and tasks
- `originalType` field preserved to detect bugs
- All refresh functions use the shared helper

## Code Quality Issues

### 8. Code Duplication

**Issues**:
- Workspace ID resolution logic duplicated across components
- Item mapping logic duplicated in multiple places
- Similar error handling patterns repeated

**Recommendation**: Extract shared utilities for:
- Workspace ID resolution
- Item type detection (story vs task)
- Status mapping

### 9. Performance Concerns

**Potential Issues**:
- Multiple parallel fetches in `useEffect` hooks without proper debouncing
- No caching strategy for frequently accessed data
- Large data sets fetched entirely without pagination

**Recommendation**: 
- Implement React Query or SWR for data fetching
- Add pagination for large lists
- Cache frequently accessed workspace/project data

### 10. Missing Refresh Triggers

**Issues**:
- Some operations don't trigger context refresh
- `createTask` in StacksProvider doesn't trigger refresh (unlike `createStory`)
- Updates may not sync across all components

**Recommendation**: Ensure all mutations trigger `triggerRefresh()` consistently.

**Status**: ✅ FIXED - `createTask` now triggers refresh like `createStory`.

## Positive Findings

### ✅ Good Practices

1. **Consistent API Versioning**: Components correctly use `/api/v1/stacks/stories` for reads
2. **Optimistic Updates**: Both StacksBoard and StacksBacklogTable use optimistic UI updates
3. **Error Reversion**: Failed operations properly revert optimistic updates
4. **Context Provider**: Good use of React Context for shared state
5. **Type Preservation**: `originalType` field properly preserves bug detection

## Recommendations Priority

### Immediate (This Sprint)
1. ✅ **FIXED** - API endpoint inconsistency in `useStacksData.ts` (all story operations now use v1)
2. ✅ **FIXED** - Missing refresh trigger for `createTask`
3. ⏳ Create shared workspace ID resolution hook
4. ⏳ Standardize error handling patterns

### Short Term (Next Sprint)
4. Add proper TypeScript interfaces
5. Implement shared utilities for common operations
6. Add comprehensive error boundaries

### Medium Term (Next Month)
7. Implement React Query for data fetching
8. Add pagination for large lists
9. Performance optimization and caching

## Testing Gaps

**Missing Tests**:
- Workspace ID resolution edge cases
- Error handling paths
- Rank persistence for both stories and tasks
- Status filtering logic
- Bug visibility after operations

**Recommendation**: Add integration tests for critical user flows.

## Files Requiring Updates

1. `src/products/stacks/hooks/useStacksData.ts` - API endpoint fixes
2. `src/frontend/components/stacks/*` - Workspace ID hook usage
3. `src/products/stacks/types/` - Create proper TypeScript interfaces (new file)
4. `src/frontend/components/stacks/utils/` - Shared utilities (new directory)

## Conclusion

The Stacks system is functional but needs consistency improvements. The critical API endpoint inconsistency should be addressed immediately. The workspace ID resolution and type safety improvements will prevent future bugs and improve maintainability.

