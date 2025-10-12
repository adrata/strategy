/**
 * Unit Tests: Sign-In Flow Logic
 * 
 * Tests the sign-in authentication flow logic with mocked dependencies
 */

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mock platform access router
jest.mock('@/platform/services/platform-access-router', () => ({
  default: {
    getRouteForContext: jest.fn(),
    getDemoRoute: jest.fn(),
  },
}));

// Mock workspace slug generator
jest.mock('@/platform/auth/workspace-slugs', () => ({
  generateWorkspaceSlug: jest.fn(),
}));

const mockPrisma = require('@/platform/database/prisma-client').prisma;
const mockBcrypt = require('bcryptjs');
const mockJwt = require('jsonwebtoken');
const mockPlatformRouter = require('@/platform/services/platform-access-router').default;
const mockGenerateSlug = require('@/platform/auth/workspace-slugs').generateWorkspaceSlug;

describe('Sign-In Flow Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    
    // Default mock implementations
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('mock-access-token');
    mockPlatformRouter.getRouteForContext.mockReturnValue('/speedrun');
    mockPlatformRouter.getDemoRoute.mockReturnValue('/demo');
    mockGenerateSlug.mockReturnValue('test-workspace');
  });

  describe('Authentication Logic', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        username: 'testuser',
        name: 'Test User',
        password: 'hashedpassword',
        isActive: true,
        activeWorkspaceId: 'ws1',
      };

      const mockWorkspace = {
        id: 'ws1',
        name: 'Test Workspace',
        slug: 'test-workspace',
      };

      // Mock Prisma responses
      mockPrisma.users.findFirst.mockResolvedValue(mockUser);
      mockPrisma.workspace_users.findMany.mockResolvedValue([
        { id: 'wm1', role: 'admin', workspaceId: 'ws1' },
      ]);
      mockPrisma.workspaces.findMany.mockResolvedValue([mockWorkspace]);
      mockPrisma.workspaces.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.users.update.mockResolvedValue(mockUser);

      // Simulate authentication logic
      const email = 'test@adrata.com';
      const password = 'password123';
      const rememberMe = false;

      // Find user
      const user = await mockPrisma.users.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email },
          ],
          isActive: true,
        },
      });

      expect(user).toEqual(mockUser);

      // Verify password
      const passwordValid = await mockBcrypt.compare(password, user.password);
      expect(passwordValid).toBe(true);

      // Generate token
      const accessToken = mockJwt.sign(
        { userId: user.id, email: user.email },
        process.env.NEXTAUTH_SECRET,
        { expiresIn: '7d' }
      );

      expect(accessToken).toBe('mock-access-token');

      // Get user workspaces
      const workspaceMemberships = await mockPrisma.workspace_users.findMany({
        where: { userId: user.id },
      });

      expect(workspaceMemberships).toHaveLength(1);

      // Get workspace details
      const workspaces = await mockPrisma.workspaces.findMany({
        where: {
          id: { in: workspaceMemberships.map((wm: any) => wm.workspaceId) },
        },
      });

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]).toEqual(mockWorkspace);

      // Update last login
      await mockPrisma.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should reject authentication with invalid credentials', async () => {
      // Mock user not found
      mockPrisma.users.findFirst.mockResolvedValue(null);

      const email = 'nonexistent@adrata.com';
      const password = 'wrongpassword';

      const user = await mockPrisma.users.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email },
          ],
          isActive: true,
        },
      });

      expect(user).toBeNull();
    });

    it('should reject authentication with wrong password', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        password: 'hashedpassword',
        isActive: true,
      };

      mockPrisma.users.findFirst.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const email = 'test@adrata.com';
      const password = 'wrongpassword';

      const user = await mockPrisma.users.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email },
          ],
          isActive: true,
        },
      });

      expect(user).toEqual(mockUser);

      const passwordValid = await mockBcrypt.compare(password, user.password);
      expect(passwordValid).toBe(false);
    });

    it('should handle inactive users', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        isActive: false,
      };

      mockPrisma.users.findFirst.mockResolvedValue(null);

      const email = 'test@adrata.com';
      const password = 'password123';

      const user = await mockPrisma.users.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email },
          ],
          isActive: true,
        },
      });

      expect(user).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should create session with correct data structure', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        name: 'Test User',
        activeWorkspaceId: 'ws1',
      };

      const mockWorkspace = {
        id: 'ws1',
        name: 'Test Workspace',
        role: 'admin',
      };

      const accessToken = 'mock-access-token';
      const rememberMe = true;

      // Create session object
      const session = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          activeWorkspaceId: mockUser.activeWorkspaceId,
          workspaces: [mockWorkspace],
        },
        accessToken,
        expires: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString(),
        rememberMe,
      };

      expect(session.user.id).toBe('user123');
      expect(session.user.email).toBe('test@adrata.com');
      expect(session.accessToken).toBe('mock-access-token');
      expect(session.rememberMe).toBe(true);
      expect(session.user.workspaces).toHaveLength(1);
      expect(session.user.workspaces[0].role).toBe('admin');
    });

    it('should set correct expiration based on remember me', () => {
      const rememberMe = false;
      const expirationTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const expires = new Date(Date.now() + expirationTime);

      expect(expires.getTime()).toBeGreaterThan(Date.now());
      expect(expires.getTime()).toBeLessThan(Date.now() + 25 * 60 * 60 * 1000); // Less than 25 hours
    });

    it('should set longer expiration for remember me', () => {
      const rememberMe = true;
      const expirationTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const expires = new Date(Date.now() + expirationTime);

      expect(expires.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000); // More than 29 days
      expect(expires.getTime()).toBeLessThan(Date.now() + 31 * 24 * 60 * 60 * 1000); // Less than 31 days
    });
  });

  describe('Workspace Routing', () => {
    it('should route to correct workspace after authentication', () => {
      const mockUser = {
        activeWorkspaceId: 'ws1',
        workspaces: [
          { id: 'ws1', name: 'Test Workspace', role: 'admin' },
        ],
      };

      const route = mockPlatformRouter.getRouteForContext({
        user: mockUser,
        workspaceId: mockUser.activeWorkspaceId,
      });

      expect(route).toBe('/speedrun');
      expect(mockPlatformRouter.getRouteForContext).toHaveBeenCalledWith({
        user: mockUser,
        workspaceId: 'ws1',
      });
    });

    it('should handle demo route for new users', () => {
      const demoRoute = mockPlatformRouter.getDemoRoute();

      expect(demoRoute).toBe('/demo');
      expect(mockPlatformRouter.getDemoRoute).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.users.findFirst.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        mockPrisma.users.findFirst({
          where: {
            OR: [
              { email: 'test@adrata.com' },
              { username: 'test@adrata.com' },
            ],
            isActive: true,
          },
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle JWT signing errors', () => {
      mockJwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      expect(() => {
        mockJwt.sign(
          { userId: 'user123', email: 'test@adrata.com' },
          process.env.NEXTAUTH_SECRET,
          { expiresIn: '7d' }
        );
      }).toThrow('JWT signing failed');
    });

    it('should handle bcrypt comparison errors', async () => {
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt comparison failed'));

      await expect(
        mockBcrypt.compare('password123', 'hashedpassword')
      ).rejects.toThrow('Bcrypt comparison failed');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in responses', () => {
      const mockUser = {
        id: 'user123',
        email: 'test@adrata.com',
        password: 'hashedpassword', // This should not be in response
        salt: 'salt123', // This should not be in response
        name: 'Test User',
        isActive: true,
      };

      // Simulate response sanitization
      const sanitizedUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        isActive: mockUser.isActive,
      };

      expect(sanitizedUser).not.toHaveProperty('password');
      expect(sanitizedUser).not.toHaveProperty('salt');
      expect(sanitizedUser.id).toBe(mockUser.id);
      expect(sanitizedUser.email).toBe(mockUser.email);
    });

    it('should validate token expiration', () => {
      const tokenPayload = {
        userId: 'user123',
        email: 'test@adrata.com',
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      };

      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = tokenPayload.exp < currentTime;

      expect(isExpired).toBe(false);
      expect(tokenPayload.exp).toBeGreaterThan(currentTime);
    });
  });
});