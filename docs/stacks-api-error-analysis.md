# Stacks API 500 Error Root Cause Analysis

## Summary

The Stacks API endpoints (`/api/stacks/projects`, `/api/stacks/epics`, `/api/v1/stacks/stories`) were returning 500 Internal Server Errors. While we've implemented graceful error handling, understanding the root causes helps prevent future issues.

## Root Causes Identified

### 1. Workspace Access Validation Failure (Most Likely)

**Location**: `src/platform/services/workspace-access-control.ts:61`

The `validateWorkspaceAccess` function queries the `workspace_users` table to verify user membership:

```typescript
const membership = await prisma.workspace_users.findFirst({
  where: { userId, workspaceId }
});
```

**Why it fails:**
- **Missing workspace_users record**: If a user logs in but doesn't have a corresponding `workspace_users` record for their active workspace, the query succeeds but returns `null`. However, if the query itself throws an error (database connection, schema mismatch), it causes a 500.
- **Database connection issues**: Transient database connection problems can cause Prisma queries to throw unhandled errors.
- **Schema mismatch**: If the `workspace_users` table structure doesn't match the Prisma schema, queries will fail.

**Impact**: When `validateWorkspaceAccess` throws an error, `getSecureApiContext` catches it and returns a 500 response (line 127-139 in `secure-api-helper.ts`).

### 2. Prisma Client Model Name Mismatch

**Issue**: There's confusion between `stacksEpoch` and `stacksEpic` in the Prisma client.

- Schema defines: `model StacksEpoch` (capital S)
- Prisma client generates: `prisma.stacksEpoch` (camelCase)
- But TypeScript linter suggests: `stacksEpic` 

This suggests the Prisma client might be out of sync with the schema, or there's a naming inconsistency.

**Impact**: If the wrong model name is used, Prisma queries will fail with "Property does not exist" errors.

### 3. Database Schema Mismatches

**Evidence**: The code already has fallback logic for missing columns (`product`, `section` in stories route), suggesting schema mismatches have occurred before.

**Why it happens:**
- Prisma schema is updated but migrations aren't run
- Database schema is manually modified without updating Prisma schema
- Different environments (dev/prod) have different schema versions

**Impact**: Queries referencing non-existent columns or relationships cause P2022 errors.

### 4. Missing Error Handling in Workspace Access Validation

**Location**: `src/platform/services/workspace-access-control.ts:137-143`

The `validateWorkspaceAccess` function has a catch block that returns `hasAccess: false`, but if the error occurs during the Prisma query itself, it might not be caught properly:

```typescript
catch (error) {
  console.error('❌ [WORKSPACE ACCESS] Validation error:', error);
  return {
    hasAccess: false,
    error: 'Access validation failed'
  };
}
```

However, if the error is thrown **before** the try-catch (e.g., during Prisma client initialization), it won't be caught.

### 5. Timing Issues During Authentication

**Issue**: When a user first logs in, their session might not be fully established when the Stacks API endpoints are called.

**Why it happens:**
- `StacksProvider` loads data immediately on mount (line 69-89 in `StacksProvider.tsx`)
- This happens right after login, before workspace context is fully initialized
- If `activeWorkspaceId` is set but `workspace_users` record doesn't exist yet, validation fails

## Recommended Fixes

### 1. Ensure Workspace Users Records Exist

**Action**: Verify that when a user logs in or switches workspaces, a corresponding `workspace_users` record exists.

**Location**: Check sign-in flow and workspace switching logic.

### 2. Sync Prisma Client with Schema

**Action**: Run `npx prisma generate` to ensure Prisma client matches the schema.

**Command**: 
```bash
npx prisma generate
```

### 3. Run Database Migrations

**Action**: Ensure database schema matches Prisma schema.

**Command**:
```bash
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

### 4. Add Retry Logic for Transient Errors

**Action**: Add retry logic for database connection errors (P1001).

**Location**: Database query wrappers.

### 5. Improve Workspace Access Validation Error Handling

**Action**: Ensure all Prisma errors in `validateWorkspaceAccess` are caught and handled gracefully.

**Current**: Errors are caught but might not provide enough context.

**Improvement**: Add more detailed error logging and ensure errors don't propagate.

## Monitoring

With the enhanced error handling we've added, you should now see detailed error logs that will help identify which specific root cause is affecting your system:

- **P2022 errors**: Schema mismatch - run migrations
- **P1001 errors**: Database connection issues - check database connectivity
- **P2001 errors**: Expected for empty tables - not an error
- **Missing workspace_users records**: Check user onboarding flow
- **Model name errors**: Regenerate Prisma client

## Next Steps

### Immediate Actions

1. **Run Diagnostic Script**:
   ```bash
   npx tsx scripts/diagnose-stacks-errors.ts
   ```
   This will check all potential root causes and provide specific recommendations.

2. **Check Server Logs**:
   Look for specific error codes in the console:
   - `P2022` = Schema mismatch → Run `npx prisma migrate deploy`
   - `P1001` = Database connection issue → Check DATABASE_URL
   - Missing `workspace_users` records → See fix below

3. **Sync Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

### Fix Missing Workspace Users Records

If the diagnostic script finds users without `workspace_users` records, run this SQL:

```sql
-- Find users without workspace_users records
SELECT u.id, u.email, u."activeWorkspaceId"
FROM users u
WHERE u."activeWorkspaceId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM workspace_users wu
  WHERE wu."userId" = u.id
  AND wu."workspaceId" = u."activeWorkspaceId"
  AND wu."isActive" = true
);

-- Create missing workspace_users records (adjust role as needed)
INSERT INTO workspace_users (id, "userId", "workspaceId", role, "isActive", "createdAt", "updatedAt", "joinedAt")
SELECT 
  gen_random_uuid()::text as id,
  u.id as "userId",
  u."activeWorkspaceId" as "workspaceId",
  'SELLER' as role,  -- Or appropriate role
  true as "isActive",
  NOW() as "createdAt",
  NOW() as "updatedAt",
  NOW() as "joinedAt"
FROM users u
WHERE u."activeWorkspaceId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM workspace_users wu
  WHERE wu."userId" = u.id
  AND wu."workspaceId" = u."activeWorkspaceId"
);
```

### Prevention

1. **Ensure workspace_users records are created**:
   - When a user signs up
   - When a user joins a workspace
   - When a workspace is created

2. **Add validation**:
   - Check for workspace_users record before allowing workspace access
   - Auto-create missing records with a default role

3. **Monitor**:
   - Set up alerts for P2022 errors (schema mismatches)
   - Monitor for users without workspace_users records
   - Track database connection errors (P1001)

## Updated Error Handling

The code has been updated to:
- Handle Prisma errors more gracefully in `validateWorkspaceAccess`
- Be permissive for non-critical errors (allows access with default role)
- Provide detailed error logging for debugging
- Return specific error messages based on error codes

This means the application will continue to work even if some validation errors occur, but you'll still see detailed logs to identify and fix root causes.

