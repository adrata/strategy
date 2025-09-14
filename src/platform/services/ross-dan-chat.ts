import { authFetch } from "@/platform/auth-fetch";
import { UnifiedAuthService } from "@/platform/auth-unified";
import { invoke } from "@tauri-apps/api/core";

export interface RossDanMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  image?: {
    name: string;
    size: number;
    type: string;
    data: string;
  };
}

export interface RossDanChat {
  id: string;
  type: "dm";
  name: string;
  messages: RossDanMessage[];
  members: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

/**
 * 💬 ROSS-DAN CHAT SERVICE
 * Manages the real-time chat between Ross and Dan
 * Integrates with existing Oasis messaging infrastructure
 * FIXED: Now uses real authentication context for proper user identification
 */
export class RossDanChatService {
  private static instance: RossDanChatService;
  private chatData: RossDanChat | null = null;
  private isInitializing: boolean = false; // Prevent concurrent initialization
  private initializationPromise: Promise<RossDanChat | null> | null = null; // Cache the promise
  private readMessageIds: Set<string> = new Set(); // Track read message IDs for current user
  private readonly READ_STATE_KEY = "adrata_ross_dan_read_messages";
  private typingTimeout: NodeJS.Timeout | null = null;
  private isTyping: boolean = false;

  public static getInstance(): RossDanChatService {
    if (!RossDanChatService.instance) {
      RossDanChatService['instance'] = new RossDanChatService();
    }
    return RossDanChatService.instance;
  }

  /**
   * 📖 READ STATE MANAGEMENT: Load read message IDs from localStorage
   */
  private loadReadState(): void {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(this.READ_STATE_KEY);
        if (stored) {
          const readIds = JSON.parse(stored);
          this['readMessageIds'] = new Set(readIds);
          console.log(
            "📖 [READ_STATE] Loaded read messages:",
            this.readMessageIds.size,
          );
        } else {
          console.log("📖 [READ_STATE] No stored read state found");
        }
      }
    } catch (error) {
      console.error("❌ [READ_STATE] Failed to load read state:", error);
      this['readMessageIds'] = new Set();
    }
  }

  /**
   * 💾 READ STATE MANAGEMENT: Save read message IDs to localStorage
   */
  private saveReadState(): void {
    try {
      if (typeof window !== "undefined") {
        const readIds = Array.from(this.readMessageIds);
        localStorage.setItem(this.READ_STATE_KEY, JSON.stringify(readIds));
        console.log("💾 [READ_STATE] Saved read messages:", readIds.length);
      }
    } catch (error) {
      console.error("❌ [READ_STATE] Failed to save read state:", error);
    }
  }

  /**
   * ✅ MARK MESSAGE AS READ: Mark a specific message as read by current user
   */
  markMessageAsRead(messageId: string): void {
    console.log("✅ [READ_STATE] Speedrunng message as read:", messageId);
    this.readMessageIds.add(messageId);
    this.saveReadState();
  }

  /**
   * 📚 MARK ALL MESSAGES AS READ: Mark all current messages as read
   */
  markAllMessagesAsRead(): void {
    if (this.chatData) {
      console.log("📚 [READ_STATE] Speedrunng all messages as read");
      this.chatData.messages.forEach((msg) => {
        this.readMessageIds.add(msg.id);
      });
      this.saveReadState();
    }
  }

  /**
   * 🔍 CHECK IF MESSAGE IS READ: Check if a specific message has been read
   */
  isMessageRead(messageId: string): boolean {
    return this.readMessageIds.has(messageId);
  }

  /**
   * 🧮 GET UNREAD COUNT: Calculate actual unread count for current user
   */
  private async getUnreadCount(): Promise<number> {
    if (!this.chatData) return 0;

    const currentUserEmail = await this.getCurrentUserEmail();

    // Count messages from other users that haven't been read
    const unreadMessages = this.chatData.messages.filter((msg) => {
      // Only count messages from other users (not from current user)
      const isFromOtherUser = msg.sender.email !== currentUserEmail;
      // Only count if not marked as read
      const isUnread = !this.readMessageIds.has(msg.id);

      return isFromOtherUser && isUnread;
    });

    console.log("🧮 [READ_STATE] Unread count calculation:", {
      totalMessages: this.chatData.messages.length,
      currentUserEmail,
      unreadCount: unreadMessages.length,
      readMessageIds: this.readMessageIds.size,
    });

    return unreadMessages.length;
  }

  /**
   * Force refresh chat data from database
   */
  async refreshChat(): Promise<RossDanChat | null> {
    console.log(
      "🔄 [ROSS-DAN-SERVICE] Force refreshing chat data from database...",
    );
    // Clear cached data to force fresh load
    this['chatData'] = null;
    this['isInitializing'] = false;
    this['initializationPromise'] = null;

    return this.initializeChat();
  }

  /**
   * Initialize the Ross-Dan chat (creates if doesn't exist)
   */
  async initializeChat(
    forceRefresh: boolean = false,
  ): Promise<RossDanChat | null> {
    // Load read state first
    this.loadReadState();

    // If already initialized and not forcing refresh, return cached data
    if (this['chatData'] && !forceRefresh) {
      console.log(
        "🔄 [ROSS-DAN-SERVICE] Chat already initialized, returning cached data",
      );
      console.log(
        "🔄 [ROSS-DAN-SERVICE] Use refreshChat() or initializeChat(true) to force refresh",
      );
      return this.chatData;
    }

    if (forceRefresh) {
      console.log(
        "🔄 [ROSS-DAN-SERVICE] Force refresh requested - clearing cache",
      );
      this['chatData'] = null;
      this['isInitializing'] = false;
      this['initializationPromise'] = null;
    }

    // If currently initializing, wait for the existing promise
    if (this['isInitializing'] && this.initializationPromise) {
      console.log(
        "🔄 [ROSS-DAN-SERVICE] Chat initialization in progress, waiting...",
      );
      return this.initializationPromise;
    }

    // Start new initialization
    this['isInitializing'] = true;
    this['initializationPromise'] = this.performInitialization();

    try {
      const result = await this.initializationPromise;
      this['isInitializing'] = false;
      return result;
    } catch (error) {
      this['isInitializing'] = false;
      this['initializationPromise'] = null;
      throw error;
    }
  }

  private async performInitialization(): Promise<RossDanChat | null> {
    try {
      console.log("🔧 [ROSS-DAN-SERVICE] Performing single initialization...");

      // 🖥️ DESKTOP MODE: Enhanced detection for both dev and prod
      const isDesktop =
        typeof window !== "undefined" &&
        // Production build detection
        (process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true" ||
          // Runtime Tauri detection (works in both dev and prod)
          !!(window as any).__TAURI__ ||
          !!(window as any).__TAURI_INTERNALS__ ||
          // Protocol detection for Tauri
          window['location']['protocol'] === "tauri:" ||
          window['location']['hostname'] === "tauri.localhost" ||
          // Port detection for development mode (Tauri dev server)
          (window['location']['port'] === "1420" &&
            window['location']['hostname'] === "localhost"));

      if (isDesktop) {
        console.log(
          "🖥️ [ROSS-DAN-SERVICE] Desktop mode detected - using Tauri commands",
        );
        console.log("🖥️ [ROSS-DAN-SERVICE] Detection details:", {
          NEXT_PUBLIC_IS_DESKTOP: process['env']['NEXT_PUBLIC_IS_DESKTOP'],
          hasTauriAPI: !!(window as any).__TAURI__,
          hasTauriInternals: !!(window as any).__TAURI_INTERNALS__,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
        });

        try {
          const chatData = (await invoke(
            "initialize_ross_dan_chat",
          )) as RossDanChat;

          this['chatData'] = chatData;
          const isFromDatabase = !chatData.id.includes("fallback");
          console.log("✅ Ross-Dan chat initialized via Tauri:", {
            id: chatData.id,
            messageCount: chatData.messages.length,
            members: chatData.members.length,
            dataSource: isFromDatabase ? "DATABASE" : "FALLBACK",
            isPersistent: isFromDatabase,
          });

          if (isFromDatabase) {
            console.log(
              "🗄️ [ROSS-DAN-SERVICE] ✅ PRODUCTION DATABASE: Messages persisted and will survive app restarts",
            );
          } else {
            console.warn(
              "⚠️ [ROSS-DAN-SERVICE] Using fallback data - messages may not persist",
            );
          }

          return chatData;
        } catch (error) {
          console.error("❌ [ROSS-DAN-SERVICE] Tauri command failed:", error);
          console.log(
            "🔄 [ROSS-DAN-SERVICE] Falling back to web API for database access...",
          );
          // Don't use local fallback immediately - try web API
        }
      }

      // 🌐 WEB MODE: Use API route for database persistence
      console.log("🌐 [ROSS-DAN-SERVICE] Web mode - using database API route");
      try {
        const response = await authFetch("/api/chat/ross-dan");

        if (!response.ok) {
          throw new Error(`API response not ok: ${response.status}`);
        }

        const data = await response.json();

        if (data['success'] && data.chat) {
          this['chatData'] = data.chat;
          console.log("✅ Ross-Dan chat initialized via database API:", {
            id: data.chat.id,
            messageCount: data.chat.messages.length,
            members: data.chat.members.length,
            dataSource: "DATABASE",
            isPersistent: true,
          });
          console.log(
            "🗄️ [ROSS-DAN-SERVICE] ✅ PRODUCTION DATABASE: Messages persisted and will survive app restarts",
          );
          return data.chat;
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (apiError) {
        console.error(
          "❌ [ROSS-DAN-SERVICE] Database API call failed:",
          apiError,
        );

        // 📦 EMERGENCY FALLBACK: Only use if both Tauri and API fail
        console.warn(
          "⚠️ [ROSS-DAN-SERVICE] Using emergency fallback data - messages will NOT persist",
        );
        const emergencyFallback = {
          id: "ross-dan-emergency-fallback",
          type: "dm" as const,
          name: "Ross & Dan",
          messages: [
            {
              id: "emergency-welcome",
              content:
                "Welcome to a new world. Where the gap between what you want and what you can achieve disappears. (Emergency Mode - Messages not saved)",
              createdAt: new Date().toISOString(),
              sender: {
                id: "ross-1",
                name: "Ross Sylvester",
                email: "ross@adrata.com",
              },
            },
          ],
          members: [
            {
              user: {
                id: "ross-1",
                name: "Ross Sylvester",
                email: "ross@adrata.com",
              },
            },
            {
              user: {
                id: "dan-1",
                name: "Dan Mirolli",
                email: "dan@adrata.com",
              },
            },
          ],
        };

        this['chatData'] = emergencyFallback;
        console.warn(
          "⚠️ Ross-Dan chat initialized via emergency fallback - DATABASE UNAVAILABLE",
        );
        return emergencyFallback;
      }
    } catch (error) {
      console.error("❌ Failed to initialize Ross-Dan chat:", error);
      this['chatData'] = null; // Clear cache on error
      return null;
    }
  }

  /**
   * Send a message in the Ross-Dan chat
   */
  async sendMessage(
    message: string,
    senderEmail?: string,
  ): Promise<RossDanMessage | null> {
    try {
      // Get actual sender email from auth context if not provided
      const actualSenderEmail =
        senderEmail || (await this.getCurrentUserEmail());

      // Save user identity for future use
      this.setCurrentUser(actualSenderEmail);

      console.log("📤 Sending message from:", actualSenderEmail);

      // 🖥️ DESKTOP MODE: Enhanced detection for both dev and prod
      const isDesktop =
        typeof window !== "undefined" &&
        // Production build detection
        (process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true" ||
          // Runtime Tauri detection (works in both dev and prod)
          !!(window as any).__TAURI__ ||
          !!(window as any).__TAURI_INTERNALS__ ||
          // Protocol detection for Tauri
          window['location']['protocol'] === "tauri:" ||
          window['location']['hostname'] === "tauri.localhost" ||
          // Port detection for development mode (Tauri dev server)
          (window['location']['port'] === "1420" &&
            window['location']['hostname'] === "localhost"));

      if (isDesktop) {
        console.log(
          "🖥️ [ROSS-DAN-SERVICE] Desktop mode - using Pusher API for real-time messaging",
        );
        console.log(
          "🔄 [ROSS-DAN-SERVICE] Skipping Tauri command to ensure real-time compatibility...",
        );
        // Use the same API as web to ensure Pusher real-time messaging works
      }

      // 🌐 WEB MODE: Use API route
      console.log(
        "📤 [ROSS-DAN-SERVICE] Making API call to /api/chat/ross-dan with data:",
        {
          message: message.substring(0, 50) + "...",
          senderEmail: actualSenderEmail,
          skipPusher: false,
        },
      );

      const response = await authFetch("/api/chat/ross-dan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          senderEmail: actualSenderEmail,
          skipPusher: false, // Enable Pusher notifications for real-time sync
        }),
      });

      console.log(
        "📤 [ROSS-DAN-SERVICE] API response status:",
        response.status,
        response.statusText,
      );
      console.log(
        "📤 [ROSS-DAN-SERVICE] API response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [ROSS-DAN-SERVICE] API call failed:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(
          `Failed to send message: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("📤 [ROSS-DAN-SERVICE] API response data:", data);

      if (data['success'] && data.message) {
        console.log("✅ [ROSS-DAN-SERVICE] Message sent via database API:", {
          id: data.message.id,
          sender: data.message.sender.email,
          dataSource: "DATABASE",
          isPersistent: true,
        });
        console.log(
          "🗄️ [ROSS-DAN-SERVICE] ✅ MESSAGE SAVED TO DATABASE: Will persist across app restarts",
        );
        return data.message;
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      return null;
    }
  }

  /**
   * Handle typing events for real-time feedback
   */
  async startTyping(): Promise<void> {
    if (this.isTyping) return; // Already typing

    this['isTyping'] = true;

    try {
      const currentUserEmail = await this.getCurrentUserEmail();

      // Send typing start event via Pusher
      const response = await fetch("/api/chat/ross-dan/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderEmail: currentUserEmail,
          isTyping: true,
        }),
      });

      if (response.ok) {
        console.log("📝 [TYPING] Started typing indicator");
      }
    } catch (error) {
      console.warn("⚠️ Failed to send typing indicator:", error);
    }
  }

  async stopTyping(): Promise<void> {
    if (!this.isTyping) return; // Not typing

    this['isTyping'] = false;

    // Clear timeout if exists
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this['typingTimeout'] = null;
    }

    try {
      const currentUserEmail = await this.getCurrentUserEmail();

      // Send typing stop event via Pusher
      const response = await fetch("/api/chat/ross-dan/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderEmail: currentUserEmail,
          isTyping: false,
        }),
      });

      if (response.ok) {
        console.log("⏹️ [TYPING] Stopped typing indicator");
      }
    } catch (error) {
      console.warn("⚠️ Failed to stop typing indicator:", error);
    }
  }

  handleTyping(): void {
    // Start typing if not already
    this.startTyping();

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    this['typingTimeout'] = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  /**
   * Get the current chat data (cached)
   */
  getCachedChat(): RossDanChat | null {
    return this.chatData;
  }

  /**
   * Convert to Oasis conversation format
   */
  async toOasisConversation(): Promise<any> {
    if (!this.chatData) return null;

    const lastMessage =
      this.chatData['messages'][this.chatData.messages.length - 1];
    const unreadCount = await this.getUnreadCount();

    console.log("💬 [ROSS-DAN-SERVICE] Converting to Oasis format:", {
      totalMessages: this.chatData.messages.length,
      unreadCount,
      lastMessageSender: lastMessage?.sender?.email,
    });

    return {
      id: "ross-dan-real",
      name: "Ross Sylvester",
      company: "Adrata Leadership",
      lastMessage: lastMessage
        ? lastMessage.content
        : "Welcome to a new world...",
      timestamp: lastMessage
        ? new Date(lastMessage.createdAt).toLocaleDateString()
        : "now",
      unread: unreadCount, // 🔧 FIXED: Now uses intelligent unread calculation
      avatar: "RS",
      type: "dm",
      messages: this.chatData.messages.map((msg) => ({
        id: msg.id,
        type: msg['sender']['email'] === "ross@adrata.com" ? "user" : "assistant",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        sender: msg.sender.name,
        // Include image data if present
        ...((msg as any).image && { image: (msg as any).image }),
      })),
    };
  }

  /**
   * Get the current user email (for message sending)
   * FIXED: Now uses actual authentication context instead of hardcoded Dan
   */
  async getCurrentUserEmail(): Promise<string> {
    try {
      // Get session from UnifiedAuthService
      const session = await UnifiedAuthService.getSession();

      if (session?.user?.email) {
        console.log("🔐 [ROSS-DAN-SERVICE] Current user from auth:", {
          email: session.user.email,
          name: session.user.name,
          activeWorkspaceId: session.user.activeWorkspaceId,
        });

        // Validate that user is Ross or Dan
        const isValidUser = ["ross@adrata.com", "dan@adrata.com"].includes(
          session.user.email,
        );

        if (isValidUser) {
          console.log(
            "✅ [ROSS-DAN-SERVICE] Valid user identified:",
            session.user.email,
          );
          return session.user.email;
        } else {
          console.warn(
            "⚠️ [ROSS-DAN-SERVICE] User not valid for Ross-Dan chat:",
            {
              email: session.user.email,
              activeWorkspaceId: session.user.activeWorkspaceId,
              isValidUser,
            },
          );
        }
      }

      // Enhanced fallback logic - try to detect from browser/URL
      console.log(
        "🔄 [ROSS-DAN-SERVICE] Using enhanced fallback user identification",
      );

      // Check if we can detect Ross from URL or other indicators
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const isProduction =
          hostname.includes("adrata.com") ||
          hostname.includes("action.adrata.com");

        // If on production domain, likely Ross
        if (isProduction) {
          console.log(
            "🌐 [ROSS-DAN-SERVICE] Production domain detected - likely Ross",
          );
          return "ross@adrata.com";
        }

        // Check localStorage for previous user preference
        const savedUser = localStorage.getItem("ross_dan_current_user");
        if (
          savedUser &&
          ["ross@adrata.com", "dan@adrata.com"].includes(savedUser)
        ) {
          console.log(
            "💾 [ROSS-DAN-SERVICE] Using saved user preference:",
            savedUser,
          );
          return savedUser;
        }
      }

      // Last resort - default to Dan for development
      console.log("🔄 [ROSS-DAN-SERVICE] Using default fallback: Dan");
      return "dan@adrata.com";
    } catch (error) {
      console.error("❌ [ROSS-DAN-SERVICE] Failed to get current user:", error);
      // Even in error, try to be smart about fallback
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname.includes("adrata.com")) {
          return "ross@adrata.com"; // Production = Ross
        }
      }
      return "dan@adrata.com"; // Development = Dan
    }
  }

  /**
   * Set the current user explicitly (for when Ross logs in)
   */
  setCurrentUser(email: string): void {
    if (["ross@adrata.com", "dan@adrata.com"].includes(email)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("ross_dan_current_user", email);
      }
      console.log("👤 [ROSS-DAN-SERVICE] Current user set to:", email);
    } else {
      console.warn(
        "⚠️ [ROSS-DAN-SERVICE] Invalid user email for setCurrentUser:",
        email,
      );
    }
  }

  /**
   * Check if current user is Ross
   */
  async isCurrentUserRoss(): Promise<boolean> {
    const email = await this.getCurrentUserEmail();
    return email === "ross@adrata.com";
  }

  /**
   * Check if current user is Dan
   */
  async isCurrentUserDan(): Promise<boolean> {
    const email = await this.getCurrentUserEmail();
    return email === "dan@adrata.com";
  }

  /**
   * Get the other user's info
   */
  async getOtherUser(): Promise<{ name: string; email: string }> {
    const isRoss = await this.isCurrentUserRoss();
    if (isRoss) {
      return { name: "Dan", email: "dan@adrata.com" };
    }
    return { name: "Ross", email: "ross@adrata.com" };
  }

  /**
   * ROSS LOGIN HELPER: Create a session for Ross if he needs to respond
   * This allows Ross to log in with workspace 'adrata' and user 'ross'
   */
  async enableRossMessaging(): Promise<boolean> {
    try {
      console.log(
        "👑 [ROSS-DAN-SERVICE] Enabling Ross messaging capabilities...",
      );

      // Check if we're already authenticated as Ross
      const currentEmail = await this.getCurrentUserEmail();
      if (currentEmail === "ross@adrata.com") {
        console.log("✅ [ROSS-DAN-SERVICE] Already authenticated as Ross");
        return true;
      }

      // For testing/demo purposes, allow manual Ross authentication
      // In production, Ross would use normal sign-in flow
      console.log("🔐 [ROSS-DAN-SERVICE] Ross authentication required");
      console.log("📋 [ROSS-DAN-SERVICE] Ross should sign in with:");
      console.log("   - Email: ross@adrata.com");
      console.log("   - Workspace: adrata");
      console.log("   - User ID: ross");

      return false;
    } catch (error) {
      console.error(
        "❌ [ROSS-DAN-SERVICE] Failed to enable Ross messaging:",
        error,
      );
      return false;
    }
  }

  /**
   * Get conversations for the current user (especially for Ross to see all chats)
   */
  async getConversations(): Promise<any[]> {
    try {
      const currentUserEmail = await this.getCurrentUserEmail();
      const userId = currentUserEmail?.split('@')[0] || 'user';

      console.log(
        "📋 [ROSS-DAN-SERVICE] Getting conversations for user:",
        userId,
      );

      // 🖥️ DESKTOP MODE: Enhanced detection for both dev and prod
      const isDesktop =
        typeof window !== "undefined" &&
        // Production build detection
        (process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true" ||
          // Runtime Tauri detection (works in both dev and prod)
          !!(window as any).__TAURI__ ||
          !!(window as any).__TAURI_INTERNALS__ ||
          // Protocol detection for Tauri
          window['location']['protocol'] === "tauri:" ||
          window['location']['hostname'] === "tauri.localhost" ||
          // Port detection for development mode (Tauri dev server)
          (window['location']['port'] === "1420" &&
            window['location']['hostname'] === "localhost"));

      if (isDesktop) {
        console.log(
          "🖥️ [ROSS-DAN-SERVICE] Desktop mode - using unified API approach",
        );
        console.log(
          "🔄 [ROSS-DAN-SERVICE] Skipping Tauri command to ensure consistency...",
        );
        // Use the same approach as web to ensure consistency
      }

      // 🌐 WEB MODE: Return default conversation for web
      const defaultConversation = await this.toOasisConversation();
      return defaultConversation ? [defaultConversation] : [];
    } catch (error) {
      console.error(
        "❌ [ROSS-DAN-SERVICE] Failed to get conversations:",
        error,
      );
      return [];
    }
  }
}

// Export singleton instance
export const rossDanChat = RossDanChatService.getInstance();
