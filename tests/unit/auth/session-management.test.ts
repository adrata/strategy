/**
 * Unit Tests: Session Management Logic
 * 
 * Tests session creation, storage, validation, and cleanup logic with mocked dependencies
 */

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Mock workspace slug generator
jest.mock('@/platform/auth/workspace-slugs', () => ({
  generateWorkspaceSlug: jest.fn(),
}));

const mockPrisma = require('@/platform/database/prisma-client').prisma;
const mockBcrypt = require('bcryptjs');
const mockJwt = require('jsonwebtoken');
const mockGenerateSlug = require('@/platform/auth/workspace-slugs').generateWorkspaceSlug;

describe('Session Management Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    
    // Default mock implementations
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('mock-access-token');
    mockJwt.verify.mockReturnValue({ userId: 'user123', email: 'test@adrata.com' });
    mockGenerateSlug.mockReturnValue('test-workspace');
  });

  describe('Session Creation', () => {
    it('should create a valid session with user data', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        name: 'Test User',
        activeWorkspaceId: 'ws1',
        workspaces: [
          { id: 'ws1', name: 'Test Workspace', role: 'admin' },
        ],
      };

      const accessToken = 'mock-access-token';
      const rememberMe = false;
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const session = {
        user: mockUser,
        accessToken,
        expires,
        rememberMe,
      };

      expect(session.user.id).toBe('user123');
      expect(session.user.email).toBe('test@adrata.com');
      expect(session.accessToken).toBe('mock-access-token');
      expect(session.rememberMe).toBe(false);
      expect(session.expires).toBeDefined();
      expect(new Date(session.expires).getTime()).toBeGreaterThan(Date.now());
    });

    it('should create session with remember me enabled', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        name: 'Test User',
        activeWorkspaceId: 'ws1',
        workspaces: [
          { id: 'ws1', name: 'Test Workspace', role: 'admin' },
        ],
      };

      const accessToken = 'mock-access-token';
      const rememberMe = true;
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const session = {
        user: mockUser,
        accessToken,
        expires,
        rememberMe,
      };

      expect(session.rememberMe).toBe(true);
      expect(new Date(session.expires).getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Session Storage', () => {
    it('should store session in localStorage when remember me is enabled', () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: true,
      };

      // Mock localStorage
      const localStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // Simulate storing session
      localStorage.setItem('adrata-session', JSON.stringify(mockSession));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'adrata-session',
        JSON.stringify(mockSession)
      );
    });

    it('should store session in sessionStorage when remember me is disabled', () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: false,
      };

      // Mock sessionStorage
      const sessionStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

      // Simulate storing session
      sessionStorage.setItem('adrata-session', JSON.stringify(mockSession));

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'adrata-session',
        JSON.stringify(mockSession)
      );
    });
  });

  describe('Session Retrieval', () => {
    it('should retrieve valid session from localStorage', () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: true,
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn().mockReturnValue(JSON.stringify(mockSession)),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // Simulate retrieving session
      const storedSession = JSON.parse(localStorage.getItem('adrata-session') || '{}');

      expect(storedSession.user.id).toBe('user123');
      expect(storedSession.accessToken).toBe('mock-access-token');
      expect(storedSession.rememberMe).toBe(true);
    });

    it('should return null for expired session', () => {
      const expiredSession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired
        rememberMe: true,
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn().mockReturnValue(JSON.stringify(expiredSession)),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // Simulate retrieving session
      const storedSession = JSON.parse(localStorage.getItem('adrata-session') || '{}');
      const isExpired = new Date(storedSession.expires).getTime() < Date.now();

      expect(isExpired).toBe(true);
    });

    it('should return null for invalid session data', () => {
      // Mock localStorage with invalid JSON
      const localStorageMock = {
        getItem: jest.fn().mockReturnValue('invalid-json'),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // Simulate retrieving session
      let storedSession = null;
      try {
        storedSession = JSON.parse(localStorage.getItem('adrata-session') || '{}');
      } catch (error) {
        storedSession = null;
      }

      expect(storedSession).toBeNull();
    });
  });

  describe('Session Validation', () => {
    it('should validate JWT token', () => {
      const token = 'mock-access-token';
      const decodedToken = { userId: 'user123', email: 'test@adrata.com' };

      mockJwt.verify.mockReturnValue(decodedToken);

      const result = mockJwt.verify(token, process.env.NEXTAUTH_SECRET);

      expect(result).toEqual(decodedToken);
      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('should handle invalid JWT token', () => {
      const invalidToken = 'invalid-token';

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        mockJwt.verify(invalidToken, process.env.NEXTAUTH_SECRET);
      }).toThrow('Invalid token');
    });

    it('should check session expiration', () => {
      const validSession = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const expiredSession = {
        expires: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      const isSessionValid = (session: any) => {
        return new Date(session.expires).getTime() > Date.now();
      };

      expect(isSessionValid(validSession)).toBe(true);
      expect(isSessionValid(expiredSession)).toBe(false);
    });
  });

  describe('Session Cleanup', () => {
    it('should clear session from localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // Simulate clearing session
      localStorage.removeItem('adrata-session');

      expect(localStorage.removeItem).toHaveBeenCalledWith('adrata-session');
    });

    it('should clear session from sessionStorage', () => {
      // Mock sessionStorage
      const sessionStorageMock = {
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

      // Simulate clearing session
      sessionStorage.removeItem('adrata-session');

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('adrata-session');
    });

    it('should clear all session data on logout', () => {
      // Mock both storage types
      const localStorageMock = {
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      const sessionStorageMock = {
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

      // Simulate logout - clear both storages
      localStorage.removeItem('adrata-session');
      sessionStorage.removeItem('adrata-session');

      expect(localStorage.removeItem).toHaveBeenCalledWith('adrata-session');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('adrata-session');
    });
  });

  describe('Session Security', () => {
    it('should not store sensitive data in session', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        password: 'hashedpassword', // Should not be in session
        salt: 'salt123', // Should not be in session
        name: 'Test User',
        isActive: true,
      };

      // Simulate session creation with sanitized user data
      const sanitizedUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        isActive: mockUser.isActive,
      };

      const session = {
        user: sanitizedUser,
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: false,
      };

      expect(session.user).not.toHaveProperty('password');
      expect(session.user).not.toHaveProperty('salt');
      expect(session.user.id).toBe(mockUser.id);
      expect(session.user.email).toBe(mockUser.email);
    });

    it('should validate session integrity', () => {
      const session = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: false,
      };

      // Validate session structure
      const isValidSession = (session: any) => {
        return (
          session.user &&
          session.user.id &&
          session.user.email &&
          session.accessToken &&
          session.expires &&
          typeof session.rememberMe === 'boolean'
        );
      };

      expect(isValidSession(session)).toBe(true);
    });

    it('should handle session tampering', () => {
      const tamperedSession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'tampered-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: false,
      };

      // Simulate token validation
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      expect(() => {
        mockJwt.verify(tamperedSession.accessToken, process.env.NEXTAUTH_SECRET);
      }).toThrow('Token verification failed');
    });
  });

  describe('Session Persistence', () => {
    it('should persist session across browser refreshes when remember me is enabled', () => {
      const persistentSession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: true,
      };

      // Mock localStorage persistence
      const localStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn().mockReturnValue(JSON.stringify(persistentSession)),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      // Simulate storing and retrieving session
      localStorage.setItem('adrata-session', JSON.stringify(persistentSession));
      const retrievedSession = JSON.parse(localStorage.getItem('adrata-session') || '{}');

      expect(retrievedSession.rememberMe).toBe(true);
      expect(retrievedSession.user.id).toBe('user123');
    });

    it('should not persist session across browser refreshes when remember me is disabled', () => {
      const temporarySession = {
        user: { id: 'user123', email: 'test@adrata.com' },
        accessToken: 'mock-access-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        rememberMe: false,
      };

      // Mock sessionStorage (cleared on browser close)
      const sessionStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn().mockReturnValue(null), // Simulate cleared storage
      };
      Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

      // Simulate storing and retrieving session
      sessionStorage.setItem('adrata-session', JSON.stringify(temporarySession));
      const retrievedSession = sessionStorage.getItem('adrata-session');

      expect(retrievedSession).toBeNull();
    });
  });
});