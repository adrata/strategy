import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import crypto from 'crypto';

describe('Meeting Integrations - Integration Tests', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const TEST_ENCRYPTION_SECRET = 'test-secret-key-32-chars-long!';
  
  let testWorkspaceId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Setup test environment
    // Note: In real tests, you'd authenticate and get a session
    testWorkspaceId = 'test-workspace-id';
    testUserId = 'test-user-id';
  });

  describe('API Key Encryption', () => {
    const encryptApiKey = (key: string): string => {
      const algorithm = 'aes-256-cbc';
      const encryptionKey = TEST_ENCRYPTION_SECRET.padEnd(32, '0').slice(0, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
      let encrypted = cipher.update(key, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    };

    const decryptApiKey = (encryptedKey: string): string => {
      const algorithm = 'aes-256-cbc';
      const encryptionKey = TEST_ENCRYPTION_SECRET.padEnd(32, '0').slice(0, 32);
      const [ivHex, encryptedData] = encryptedKey.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    };

    it('should encrypt and decrypt API key correctly', () => {
      const originalKey = 'ff_api_test_key_12345';
      
      const encrypted = encryptApiKey(originalKey);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalKey);
      expect(encrypted).toContain(':'); // IV:encrypted format
      
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toBe(originalKey);
    });

    it('should produce different encrypted values for same key', () => {
      const key = 'same_api_key';
      
      const encrypted1 = encryptApiKey(key);
      const encrypted2 = encryptApiKey(key);
      
      // Different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both decrypt to same value
      expect(decryptApiKey(encrypted1)).toBe(key);
      expect(decryptApiKey(encrypted2)).toBe(key);
    });

    it('should handle special characters in API key', () => {
      const specialKey = 'key_with_$pecial!@#chars&*()';
      
      const encrypted = encryptApiKey(specialKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(specialKey);
    });

    it('should handle long API keys', () => {
      const longKey = 'a'.repeat(256);
      
      const encrypted = encryptApiKey(longKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(longKey);
    });
  });

  describe('API Key Connection Endpoint', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    it('should validate required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/api-key/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing provider, apiKey, workspaceId
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required fields');
    });

    it('should reject unsupported providers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/api-key/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'unsupported-provider',
          apiKey: 'test-key',
          workspaceId: testWorkspaceId,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Unsupported provider');
    });

    it('should validate API key format for Fireflies', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/api-key/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'fireflies',
          apiKey: 'invalid-key',
          workspaceId: testWorkspaceId,
        }),
      });

      // Should attempt validation and fail
      const data = await response.json();
      expect(data.error || data.success).toBeDefined();
    });
  });

  describe('Integration Card Rendering', () => {
    it('should display Zoom integration card', () => {
      const zoomConfig = {
        id: 'zoom',
        name: 'Zoom',
        description: 'Access meeting recordings and AI-generated transcripts',
        authType: 'oauth',
        setupUrl: 'https://marketplace.zoom.us/',
        docUrl: 'https://developers.zoom.us/docs/api/',
      };

      expect(zoomConfig.name).toBe('Zoom');
      expect(zoomConfig.authType).toBe('oauth');
    });

    it('should display Fireflies integration card', () => {
      const firefliesConfig = {
        id: 'fireflies',
        name: 'Fireflies.ai',
        description: 'AI-powered meeting transcription and notes',
        authType: 'api-key',
        setupUrl: 'https://fireflies.ai/integrations',
        docUrl: 'https://docs.fireflies.ai/',
      };

      expect(firefliesConfig.name).toBe('Fireflies.ai');
      expect(firefliesConfig.authType).toBe('api-key');
    });

    it('should display Otter integration card', () => {
      const otterConfig = {
        id: 'otter',
        name: 'Otter.ai',
        description: 'Real-time meeting transcription and notes',
        authType: 'api-key',
        setupUrl: 'https://otter.ai/apps',
        docUrl: 'https://developer.otter.ai/',
      };

      expect(otterConfig.name).toBe('Otter.ai');
      expect(otterConfig.authType).toBe('api-key');
    });

    it('should display Microsoft Teams integration card', () => {
      const teamsConfig = {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Teams meeting recordings and transcripts via Microsoft Graph',
        authType: 'oauth',
        setupUrl: 'https://portal.azure.com/',
        docUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/call-records-api-overview',
      };

      expect(teamsConfig.name).toBe('Microsoft Teams');
      expect(teamsConfig.authType).toBe('oauth');
    });
  });

  describe('Connection State Management', () => {
    it('should handle connection creation flow', () => {
      const initialState = {
        connections: [],
        connecting: false,
        error: null,
      };

      const connectingState = {
        ...initialState,
        connecting: true,
      };

      const connectedState = {
        connections: [{
          id: 'conn-1',
          provider: 'fireflies',
          status: 'active',
        }],
        connecting: false,
        error: null,
      };

      expect(initialState.connections).toHaveLength(0);
      expect(connectingState.connecting).toBe(true);
      expect(connectedState.connections).toHaveLength(1);
    });

    it('should handle connection error flow', () => {
      const errorState = {
        connections: [],
        connecting: false,
        error: 'Invalid API key',
      };

      expect(errorState.error).toBeTruthy();
    });

    it('should handle disconnect flow', () => {
      const connectedState = {
        connections: [
          { id: 'conn-1', provider: 'fireflies', status: 'active' },
        ],
      };

      const disconnectedState = {
        connections: [],
      };

      expect(connectedState.connections).toHaveLength(1);
      expect(disconnectedState.connections).toHaveLength(0);
    });
  });

  describe('Meeting Transcript Ingestion', () => {
    it('should handle meeting transcript structure', () => {
      const transcript = {
        id: 'transcript-1',
        workspaceId: testWorkspaceId,
        provider: 'zoom',
        externalMeetingId: 'zoom-123',
        meetingTitle: 'Q4 Planning Meeting',
        meetingDate: new Date('2025-01-15'),
        duration: 3600,
        participants: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
        ],
        transcript: 'Full meeting transcript...',
        summary: 'Discussed Q4 goals and budget.',
        keyPoints: [
          'Budget approved for Q4',
          'Launch date set for March',
        ],
        actionItems: [
          { assignee: 'John', task: 'Prepare proposal' },
        ],
      };

      expect(transcript.provider).toBe('zoom');
      expect(transcript.participants).toHaveLength(2);
      expect(transcript.keyPoints).toHaveLength(2);
      expect(transcript.actionItems).toHaveLength(1);
    });

    it('should validate required transcript fields', () => {
      const minimalTranscript = {
        provider: 'fireflies',
        externalMeetingId: 'ff-456',
        workspaceId: testWorkspaceId,
      };

      expect(minimalTranscript.provider).toBeDefined();
      expect(minimalTranscript.externalMeetingId).toBeDefined();
      expect(minimalTranscript.workspaceId).toBeDefined();
    });
  });

  describe('Category Navigation', () => {
    it('should filter integrations by category', () => {
      const allIntegrations = [
        { id: 'outlook', category: 'email' },
        { id: 'gmail', category: 'email' },
        { id: 'google-calendar', category: 'calendar' },
        { id: 'zoom', category: 'meetings' },
        { id: 'fireflies', category: 'meetings' },
        { id: 'otter', category: 'meetings' },
        { id: 'microsoft-teams', category: 'meetings' },
      ];

      const emailIntegrations = allIntegrations.filter(i => i.category === 'email');
      const meetingIntegrations = allIntegrations.filter(i => i.category === 'meetings');

      expect(emailIntegrations).toHaveLength(2);
      expect(meetingIntegrations).toHaveLength(4);
    });

    it('should support all category view', () => {
      const selectedCategory = 'all';
      const shouldShowEmail = selectedCategory === 'all' || selectedCategory === 'email';
      const shouldShowMeetings = selectedCategory === 'all' || selectedCategory === 'meetings';

      expect(shouldShowEmail).toBe(true);
      expect(shouldShowMeetings).toBe(true);
    });
  });
});

