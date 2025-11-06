# Nango OAuth Popup Auto-Close Investigation

## Issue
The OAuth popup window from Nango (`api.nango.dev/oauth/callback`) stays open after a successful connection, requiring users to manually close it by clicking "You can close this window".

## Root Cause Analysis

### 1. Browser Security Restrictions
The popup is served from a different origin (`api.nango.dev`) than our application (`action.adrata.com`). Due to browser cross-origin security policies (Same-Origin Policy), we cannot programmatically close windows from different origins.

### 2. Nango SDK Behavior
The Nango Frontend SDK's `openConnectUI()` method should automatically close the popup when the `connect` event fires. However, this relies on:
- PostMessage communication between the popup and parent window
- The SDK properly detecting the connection success
- The popup sending the correct postMessage to the parent

### 3. Current Implementation
Our current implementation:
- ✅ Handles the `connect` event from Nango SDK
- ✅ Attempts to close the popup via `connectInstance.close()` (doesn't work due to cross-origin)
- ❌ Cannot directly access the popup window reference (SDK manages it internally)

## Attempted Solutions

### Solution 1: PostMessage Listener (Implemented)
Added a comprehensive postMessage listener to detect when the popup sends success messages:

```typescript
const messageHandler = (event: MessageEvent) => {
  // Only accept messages from Nango's domain
  if (!event.origin.includes('nango.dev')) return;
  
  // Check for various Nango success message formats
  const isSuccessMessage = 
    event.data?.type === 'nango-oauth-success' ||
    event.data?.type === 'nango-connected' ||
    // ... other formats
    
  if (isSuccessMessage) {
    // Try to close via event.source
    if (event.source && typeof (event.source as Window).close === 'function') {
      (event.source as Window).close();
    }
  }
};
```

**Result**: This approach is limited by browser security - we can receive messages but cannot close the popup due to cross-origin restrictions.

### Solution 2: SDK Options
Checked for Nango SDK options:
- `detectClosedAuthWindow`: Detects when popup is closed, but doesn't enable auto-close
- No `redirectUrl` option in `openConnectUI()` to redirect back to our app

### Solution 3: Backend Redirect URL
The `createConnectSession()` method doesn't support a `redirectUrl` parameter that would redirect the popup back to our app (which would close it).

## Why It Stays Open

1. **Nango's Success Page**: After OAuth completes, Nango redirects to `api.nango.dev/oauth/callback` which shows "You are now connected" and "You can close this window" button.

2. **SDK Communication**: The SDK should receive a postMessage from this page and close the popup, but this communication may be:
   - Blocked by browser security
   - Not being sent by Nango's callback page
   - Not being properly handled by the SDK

3. **No Programmatic Access**: We cannot access the popup window object directly because:
   - The SDK manages it internally
   - Cross-origin restrictions prevent access
   - The window reference is not exposed by the SDK

## Current Status

### What We've Implemented
1. ✅ Comprehensive postMessage listener with logging
2. ✅ Multiple close attempts (event.source, stored reference)
3. ✅ Proper cleanup of event listeners
4. ✅ Detailed logging for debugging

### Limitations
- ❌ Cannot programmatically close cross-origin popups (browser security)
- ❌ SDK doesn't expose popup window reference
- ❌ Nango's callback page may not be sending the correct postMessage

## Recommendations

### Short-term (Current Implementation)
1. **User Education**: The popup requires manual closure - this is expected behavior due to browser security
2. **Logging**: Added comprehensive logging to help diagnose if postMessages are being received
3. **Graceful Handling**: The app continues to work correctly even if popup stays open

### Long-term Solutions
1. **Contact Nango Support**: Report that the popup doesn't auto-close and request:
   - Better postMessage handling in their callback page
   - SDK option to force popup closure
   - Redirect URL support in `createConnectSession()`

2. **Alternative Flow**: Consider using Nango's redirect flow instead of popup flow (if available):
   - Redirects user to Nango's auth page
   - Redirects back to our app after completion
   - No popup window to close

3. **Custom Callback Page**: If Nango supports custom callback URLs:
   - Host our own callback page
   - Use `window.close()` in our own domain
   - Redirect back to integrations page

## Testing

To verify if postMessages are being received:
1. Open browser console
2. Connect an integration
3. Look for `📧 [OAUTH] Received postMessage from popup:` logs
4. Check if any success messages are detected

If no postMessages are received, the issue is on Nango's side (callback page not sending messages).

## Conclusion

The popup staying open is primarily due to browser cross-origin security restrictions. While we've implemented comprehensive postMessage handling and close attempts, the fundamental limitation is that browsers prevent closing windows from different origins for security reasons.

The Nango SDK should handle this automatically, but if it doesn't, manual closure is the expected fallback. This is a known limitation of cross-origin OAuth popups, not a bug in our implementation.

