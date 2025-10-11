# Grand Central Nango Troubleshooting Guide

## Quick Diagnosis

If you're not seeing Nango integrations in Grand Central, follow these steps:

### 1. Check Configuration Status
1. Go to `http://localhost:3000/adrata/grand-central`
2. Click "Check Setup Status" button
3. Review the configuration status

### 2. Common Issues & Solutions

#### Issue: "Nango is not configured"
**Symptoms**: No integrations showing, error messages about missing configuration
**Solution**: 
1. Run the setup script: `node scripts/setup-nango.js`
2. Or manually add to `.env.local`:
   ```
   NANGO_SECRET_KEY=your_secret_key_here
   NANGO_PUBLIC_KEY=your_public_key_here
   NANGO_HOST=https://api.nango.dev
   ```
3. Restart your development server

#### Issue: "Nango configuration error"
**Symptoms**: Configuration exists but API calls fail
**Solution**:
1. Verify your Nango credentials are correct
2. Check if your Nango account is active
3. Ensure you're using the correct environment (dev vs prod keys)

#### Issue: "No connections found" but configuration is correct
**Symptoms**: Setup is correct but no integrations appear
**Solution**:
1. Check if you have any existing connections in the database
2. Try adding a new integration via "Add Integration" button
3. Check browser console for JavaScript errors

### 3. Database Issues

#### Check if grand_central_connections table exists:
```bash
npx prisma db execute --stdin --schema=prisma/schema.prisma
# Then run: SELECT COUNT(*) FROM grand_central_connections;
```

#### If table doesn't exist, run migration:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 4. API Testing

Test the connections endpoint directly:
```bash
# With authentication (replace with your session cookie)
curl -H "Cookie: your-session-cookie" \
  "http://localhost:3000/api/grand-central/nango/connections?workspaceId=adrata"
```

Test the configuration endpoint:
```bash
curl "http://localhost:3000/api/grand-central/nango/config"
```

### 5. Browser Debugging

1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh the Grand Central page
4. Look for failed requests to `/api/grand-central/nango/*`
5. Check Console tab for JavaScript errors

### 6. Environment Variables Checklist

Required variables:
- [ ] `NANGO_SECRET_KEY` or `NANGO_SECRET_KEY_DEV`
- [ ] `NANGO_PUBLIC_KEY` (optional but recommended)
- [ ] `NANGO_HOST` (defaults to https://api.nango.dev)

### 7. Nango Account Setup

If you don't have a Nango account:
1. Go to [nango.dev](https://nango.dev)
2. Sign up for a free account
3. Complete email verification
4. Navigate to Environment Settings
5. Copy your Secret Key and Public Key

### 8. Integration Library Issues

If the integration library doesn't load:
1. Check `/api/grand-central/nango/providers` endpoint
2. Verify static provider list is working as fallback
3. Check browser console for JavaScript errors

## Error Messages Reference

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Nango secret key not found" | Missing NANGO_SECRET_KEY | Add environment variable |
| "Failed to initialize Nango" | Invalid credentials | Check Nango account and keys |
| "Connection test failed" | Provider not configured in Nango | Configure provider in Nango dashboard |
| "Unauthorized" | Not logged in | Log in to the application |
| "Database error" | Table doesn't exist | Run Prisma migration |

## Getting Help

1. Check the main setup guide: `docs/guides/GRAND_CENTRAL_NANGO_SETUP.md`
2. Review the API documentation in the code
3. Check Nango documentation: [docs.nango.dev](https://docs.nango.dev)
4. Look at browser console and network tab for specific errors

## Development Tips

- Use the "Check Config" button in error states to diagnose issues
- The configuration endpoint provides detailed status information
- Static provider list works as fallback when Nango is unavailable
- Connection status is verified on each API call
