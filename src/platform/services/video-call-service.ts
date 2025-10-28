/**
 * Video Call Service
 * 
 * Handles video call creation and management
 * Currently uses Daily.co for video calling functionality
 */

export interface VideoCallRoom {
  id: string;
  name: string;
  url: string;
  participants: string[];
  createdAt: Date;
  expiresAt: Date;
}

export class VideoCallService {
  private static readonly DAILY_API_KEY = process.env.DAILY_API_KEY;
  private static readonly DAILY_DOMAIN = process.env.DAILY_DOMAIN || 'adrata.daily.co';

  /**
   * Create a new video call room
   */
  static async createRoom(
    roomName: string,
    participants: string[],
    duration: number = 60 // minutes
  ): Promise<VideoCallRoom> {
    try {
      if (!this.DAILY_API_KEY) {
        console.warn('⚠️ [VIDEO CALL] No Daily.co API key found, using fallback');
        // Fallback to simple room URL without API
        const roomId = `oasis-${roomName}-${Date.now()}`;
        const roomUrl = `https://${this.DAILY_DOMAIN}/${roomId}`;
        
        return {
          id: roomId,
          name: roomName,
          url: roomUrl,
          participants,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + duration * 60 * 1000)
        };
      }

      // Call Daily.co API to create room
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `oasis-${roomName}-${Date.now()}`,
          properties: {
            max_participants: 10,
            enable_recording: 'cloud',
            enable_transcription: true,
            exp: Math.floor(Date.now() / 1000) + (duration * 60),
            enable_chat: true,
            enable_screenshare: true,
            enable_knocking: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Daily.co API error: ${response.status} ${response.statusText}`);
      }

      const roomData = await response.json();
      
      const room: VideoCallRoom = {
        id: roomData.name,
        name: roomName,
        url: roomData.url,
        participants,
        createdAt: new Date(roomData.created_at),
        expiresAt: new Date(roomData.config?.exp ? roomData.config.exp * 1000 : Date.now() + duration * 60 * 1000)
      };

      console.log(`📹 [VIDEO CALL] Created room: ${room.id}`);
      return room;

    } catch (error) {
      console.error('❌ [VIDEO CALL] Failed to create room:', error);
      throw new Error('Failed to create video call room');
    }
  }

  /**
   * Get room information
   */
  static async getRoom(roomId: string): Promise<VideoCallRoom | null> {
    try {
      // TODO: Fetch from database
      // For now, return null
      return null;
    } catch (error) {
      console.error('❌ [VIDEO CALL] Failed to get room:', error);
      return null;
    }
  }

  /**
   * Join a video call room
   */
  static async joinRoom(roomId: string, userId: string): Promise<string> {
    try {
      if (!this.DAILY_API_KEY) {
        // Fallback to simple room URL
        return `https://${this.DAILY_DOMAIN}/${roomId}`;
      }

      // Generate join token for the room
      const response = await fetch(`https://api.daily.co/v1/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            room_name: roomId,
            user_id: userId,
            is_owner: true,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Daily.co API error: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      return `https://${this.DAILY_DOMAIN}/${roomId}?t=${tokenData.token}`;
    } catch (error) {
      console.error('❌ [VIDEO CALL] Failed to join room:', error);
      // Fallback to simple room URL
      return `https://${this.DAILY_DOMAIN}/${roomId}`;
    }
  }

  /**
   * End a video call room
   */
  static async endRoom(roomId: string): Promise<void> {
    try {
      // TODO: Call Daily.co API to end room
      // TODO: Update database
      console.log(`📹 [VIDEO CALL] Ended room: ${roomId}`);
    } catch (error) {
      console.error('❌ [VIDEO CALL] Failed to end room:', error);
    }
  }

  /**
   * Send video call invitation
   */
  static async sendInvitation(
    roomId: string,
    participants: string[],
    inviterName: string
  ): Promise<void> {
    try {
      // TODO: Send push notifications or emails to participants
      // TODO: Create in-app notifications
      console.log(`📹 [VIDEO CALL] Sent invitations for room: ${roomId}`);
    } catch (error) {
      console.error('❌ [VIDEO CALL] Failed to send invitations:', error);
    }
  }
}
