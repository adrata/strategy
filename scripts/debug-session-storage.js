#!/usr/bin/env node

/**
 * 🔍 Debug Session Storage
 * 
 * This script helps debug session storage issues between local and production.
 */

console.log('🔍 Debugging Session Storage Issues...');

// Simulate the session storage logic
const AUTH_CONFIG = {
  sessionKey: 'adrata_unified_session_v1'
};

console.log('📋 Session Configuration:');
console.log('- Session Key:', AUTH_CONFIG.sessionKey);
console.log('- Storage Type: localStorage');

// Test session creation
const testSession = {
  user: {
    id: '01K1VBYZMWTCT09FWEKBDMCXZM',
    email: 'dan@adrata.com',
    name: 'Dan',
    workspaces: [{
      id: '01K5D01YCQJ9TJ7CT4DZDE79T1',
      name: 'TOP Engineering Plus',
      role: 'admin'
    }],
    activeWorkspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
  },
  accessToken: 'test-jwt-token-123',
  refreshToken: 'test-refresh-token-456',
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  lastActivity: new Date().toISOString(),
  platform: 'web',
  deviceId: 'web-device-123',
  syncEnabled: true
};

console.log('\n📦 Test Session:');
console.log('- User ID:', testSession.user.id);
console.log('- Email:', testSession.user.email);
console.log('- Active Workspace:', testSession.user.activeWorkspaceId);
console.log('- Has Access Token:', !!testSession.accessToken);
console.log('- Expires:', testSession.expires);

// Test JWT token structure
const jwtPayload = {
  userId: testSession.user.id,
  email: testSession.user.email,
  workspaceId: testSession.user.activeWorkspaceId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
};

console.log('\n🔐 JWT Token Payload:');
console.log('- User ID:', jwtPayload.userId);
console.log('- Email:', jwtPayload.email);
console.log('- Workspace ID:', jwtPayload.workspaceId);
console.log('- Issued At:', new Date(jwtPayload.iat * 1000).toISOString());
console.log('- Expires At:', new Date(jwtPayload.exp * 1000).toISOString());

console.log('\n🎯 Key Differences Between Local and Production:');
console.log('1. **Session Storage**: localStorage vs sessionStorage');
console.log('2. **Domain Security**: localhost vs production domain');
console.log('3. **Cookie Settings**: SameSite=Lax vs SameSite=Strict');
console.log('4. **HTTPS vs HTTP**: Security context differences');
console.log('5. **Browser Security**: CORS and cookie policies');

console.log('\n🔍 Debugging Steps:');
console.log('1. Check if session is stored in localStorage in production');
console.log('2. Verify JWT token is being created with correct workspace/user IDs');
console.log('3. Check if Authorization header is being sent with API requests');
console.log('4. Verify JWT secret matches between token creation and verification');
console.log('5. Check browser console for session storage errors');
