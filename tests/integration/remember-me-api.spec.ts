import { test, expect } from '@playwright/test';

/**
 * Remember Me API Integration Tests
 * 
 * Tests the API endpoints directly to verify remember me functionality
 * including token expiration, cookie handling, and response format.
 */

test.describe('Remember Me API Integration', () => {
  const API_BASE = 'http://localhost:3000/api';
  const TEST_CREDENTIALS = {
    email: 'ross@adrata.com',
    password: 'rosspass',
  };

  test('API returns 30-day expiration with rememberMe=true', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        ...TEST_CREDENTIALS,
        rememberMe: true,
      },
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.rememberMe).toBe(true);

    // Verify expiration is ~30 days
    const expiresDate = new Date(data.expires);
    const now = new Date();
    const daysDiff = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThan(29);
    expect(daysDiff).toBeLessThan(31);

    // Verify user data is returned
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(TEST_CREDENTIALS.email);
    expect(data.accessToken).toBeDefined();
  });

  test('API returns 7-day expiration with rememberMe=false', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        ...TEST_CREDENTIALS,
        rememberMe: false,
      },
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.rememberMe).toBe(false);

    // Verify expiration is ~7 days
    const expiresDate = new Date(data.expires);
    const now = new Date();
    const daysDiff = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThan(6);
    expect(daysDiff).toBeLessThan(8);

    // Verify user data is returned
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(TEST_CREDENTIALS.email);
    expect(data.accessToken).toBeDefined();
  });

  test('API sets auth-token cookie with correct maxAge for remember me', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        ...TEST_CREDENTIALS,
        rememberMe: true,
      },
    });

    expect(response.status()).toBe(200);
    
    const cookies = response.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    
    // Find auth-token cookie
    const authTokenCookie = cookies.find((cookie: string) => 
      cookie.startsWith('auth-token=')
    );
    expect(authTokenCookie).toBeDefined();
    
    // Verify cookie has long expiration (30 days)
    expect(authTokenCookie).toContain('Max-Age=2592000'); // 30 days in seconds
  });

  test('API sets auth-token cookie with shorter maxAge without remember me', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        ...TEST_CREDENTIALS,
        rememberMe: false,
      },
    });

    expect(response.status()).toBe(200);
    
    const cookies = response.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    
    // Find auth-token cookie
    const authTokenCookie = cookies.find((cookie: string) => 
      cookie.startsWith('auth-token=')
    );
    expect(authTokenCookie).toBeDefined();
    
    // Verify cookie has shorter expiration (7 days)
    expect(authTokenCookie).toContain('Max-Age=604800'); // 7 days in seconds
  });

  test('API handles invalid credentials gracefully', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword',
        rememberMe: true,
      },
    });

    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Invalid email or password');
  });

  test('API validates rememberMe parameter', async ({ request }) => {
    // Test with string "true" instead of boolean
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        ...TEST_CREDENTIALS,
        rememberMe: 'true', // String instead of boolean
      },
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    // Should treat string "true" as false (strict boolean check)
    expect(data.rememberMe).toBe(false);
  });

  test('API works with unified auth endpoint', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/unified`, {
      data: {
        action: 'login',
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
        rememberMe: true,
      },
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.auth.rememberMe).toBe(true);
    expect(data.auth.user.email).toBe(TEST_CREDENTIALS.email);
    
    // Verify token expiration
    const expiresDate = new Date(data.auth.expiresAt);
    const now = new Date();
    const daysDiff = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThan(29); // ~30 days
  });

  test('API returns consistent response format', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/sign-in`, {
      data: {
        ...TEST_CREDENTIALS,
        rememberMe: true,
      },
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Verify required fields are present
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data).toHaveProperty('expires');
    expect(data).toHaveProperty('rememberMe');
    expect(data).toHaveProperty('message');
    
    // Verify data types
    expect(typeof data.success).toBe('boolean');
    expect(typeof data.user).toBe('object');
    expect(typeof data.accessToken).toBe('string');
    expect(typeof data.refreshToken).toBe('string');
    expect(typeof data.expires).toBe('string');
    expect(typeof data.rememberMe).toBe('boolean');
    expect(typeof data.message).toBe('string');
  });
});
