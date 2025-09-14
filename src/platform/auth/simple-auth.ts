/**
 * SIMPLE AUTHENTICATION SYSTEM
 * 
 * A basic, working authentication system that bypasses the complex unified auth.
 * This provides immediate functionality while the unified auth system is being fixed.
 */

import { prisma } from '@/platform/database/prisma-client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simple user interface
export interface SimpleUser {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
}

export interface AuthResult {
  success: boolean;
  user?: SimpleUser;
  error?: string;
  token?: string;
}

export class SimpleAuthService {
  private static readonly JWT_SECRET = process['env']['JWT_SECRET'] || 'fallback-secret-key';
  private static readonly JWT_EXPIRES_IN = '24h';

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 [SIMPLE AUTH] Starting sign in for:', email);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          workspaces: {
            take: 1, // Get the first workspace
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!user) {
        console.log('❌ [SIMPLE AUTH] User not found:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('❌ [SIMPLE AUTH] Invalid password for:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Get user's workspace
      const workspace = user['workspaces'][0];
      if (!workspace) {
        console.log('❌ [SIMPLE AUTH] No workspace found for user:', email);
        return {
          success: false,
          error: 'No workspace found for user'
        };
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          workspaceId: workspace.id 
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      // Return success with user data
      const simpleUser: SimpleUser = {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        workspaceId: workspace.id
      };

      console.log('✅ [SIMPLE AUTH] Sign in successful for:', email);
      return {
        success: true,
        user: simpleUser,
        token
      };

    } catch (error) {
      console.error('❌ [SIMPLE AUTH] Sign in error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Verify JWT token and get user
   */
  static async verifyToken(token: string): Promise<SimpleUser | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          workspaces: {
            where: { id: decoded.workspaceId },
            take: 1
          }
        }
      });

      if (!user || !user['workspaces'][0]) {
        return null;
      }

      return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        workspaceId: user['workspaces'][0].id
      };
    } catch (error) {
      console.error('❌ [SIMPLE AUTH] Token verification error:', error);
      return null;
    }
  }

  /**
   * Get current user from token
   */
  static async getCurrentUser(): Promise<SimpleUser | null> {
    if (typeof window === 'undefined') {
      return null; // Server-side
    }

    const token = localStorage.getItem('adrata_auth_token');
    if (!token) {
      return null;
    }

    return this.verifyToken(token);
  }

  /**
   * Sign out
   */
  static signOut(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adrata_auth_token');
      localStorage.removeItem('adrata_user');
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
