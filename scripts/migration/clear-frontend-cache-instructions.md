# Clear Frontend Cache After Migration

After running the name cleaning migration, users need to clear their browser cache to see the cleaned data.

## Instructions for Users

### Option 1: Hard Refresh (Recommended)
- **Mac**: Press `Cmd + Shift + R`
- **Windows/Linux**: Press `Ctrl + Shift + R`

This will clear the cache and reload fresh data from the server.

### Option 2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Click "Clear storage" or "Clear site data"
4. Refresh the page

### Option 3: Clear localStorage Manually
Open browser console and run:
```javascript
// Clear all Adrata cache
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('adrata-')) {
    localStorage.removeItem(key);
  }
});
location.reload();
```

## Technical Details

The frontend caches data in:
- `localStorage` with keys like `adrata-leads-{workspaceId}`
- `sessionStorage` with force-refresh flags
- Browser memory cache

After the migration, the database has clean data, but the frontend cache still contains old data with trailing spaces. A hard refresh will force the frontend to fetch fresh data from the API.

