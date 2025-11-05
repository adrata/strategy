# Fixing Prisma Generation File Lock Issues on Windows

## Problem

When running `npx prisma generate`, you may see:
```
EPERM: operation not permitted, rename '...query-engine-windows.exe.tmp...' -> '...query-engine-windows.exe'
```

This happens because the Prisma query engine file is locked by a running process (usually your dev server).

## Quick Fix

### Option 1: Stop Dev Server (Recommended)

1. **Stop your dev server:**
   - Find the terminal running `npm run dev`
   - Press `Ctrl+C` to stop it

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Option 2: Use the Fix Script

Run the cleanup script:
```bash
node scripts/fix-prisma-lock.js
```

This will:
- Clean up locked temp files
- Check for running Node processes
- Attempt to regenerate Prisma client

### Option 3: Manual Cleanup

If the script doesn't work:

1. **Stop all Node.js processes:**
   - Close all terminals running Node
   - Close VS Code/Cursor if it has Node processes
   - Open Task Manager (Ctrl+Shift+Esc)
   - End any `node.exe` processes

2. **Delete the Prisma client folder:**
   ```bash
   # Navigate to project root
   cd node_modules\.prisma
   # Delete the client folder
   rmdir /s client
   ```

3. **Regenerate:**
   ```bash
   npm run db:generate
   ```

### Option 4: Nuclear Option (Restart Computer)

If nothing else works:
1. Restart your computer
2. Run `npm run db:generate`
3. Start dev server: `npm run dev`

## Why This Happens

On Windows, when a file is open by a process, it cannot be renamed or deleted. The Prisma query engine file is:
- Loaded by your Next.js dev server
- Locked while the server is running
- Needed by Prisma to generate the new client

## Prevention

Always stop your dev server before running:
- `npm run db:generate`
- `npx prisma generate`
- `npx prisma migrate dev`

## Verification

After generating, verify it worked:
```bash
# Check if the file exists
dir node_modules\.prisma\client\query-engine-windows.exe

# Should see the file without errors
```

## Migration Status

The rank migration is **already applied to the database**. Even if Prisma generation fails temporarily, the database changes are complete. You just need to regenerate the client to use the new `rank` field in your code.

