/**
 * Y.js Provider for Atrium Real-time Collaboration
 * 
 * Provides real-time collaborative editing using Y.js CRDTs and WebSockets
 * with conflict resolution and offline support.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    selection?: {
      start: number;
      end: number;
    };
  };
}

export interface CollaborationState {
  isConnected: boolean;
  users: Map<string, CollaborationUser>;
  awareness: any;
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  persistence: IndexeddbPersistence | null;
}

export class YjsProvider {
  private static instance: YjsProvider;
  private state: CollaborationState;
  private documentId: string | null = null;
  private workspaceId: string | null = null;
  private userId: string | null = null;
  private userInfo: CollaborationUser | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.state = {
      isConnected: false,
      users: new Map(),
      awareness: null,
      doc: new Y.Doc(),
      provider: null,
      persistence: null,
    };
  }

  public static getInstance(): YjsProvider {
    if (!YjsProvider.instance) {
      YjsProvider.instance = new YjsProvider();
    }
    return YjsProvider.instance;
  }

  /**
   * Initialize collaboration for a document
   */
  public async initialize(
    documentId: string,
    workspaceId: string,
    userId: string,
    userInfo: Omit<CollaborationUser, 'id'>
  ): Promise<void> {
    try {
      this.documentId = documentId;
      this.workspaceId = workspaceId;
      this.userId = userId;
      this.userInfo = { ...userInfo, id: userId };

      // Create new Y.Doc for this document
      this.state.doc = new Y.Doc();

      // Set up offline persistence
      await this.setupPersistence();

      // Set up WebSocket provider
      await this.setupWebSocketProvider();

      // Set up awareness (cursor tracking)
      this.setupAwareness();

      // Set up event listeners
      this.setupEventListeners();

      this.emit('initialized', { documentId, workspaceId });
    } catch (error) {
      console.error('Error initializing Y.js provider:', error);
      throw new Error('Failed to initialize collaboration');
    }
  }

  /**
   * Set up offline persistence using IndexedDB
   */
  private async setupPersistence(): Promise<void> {
    try {
      this.state.persistence = new IndexeddbPersistence(
        `atrium-doc-${this.documentId}`,
        this.state.doc
      );

      // Wait for persistence to be ready
      await new Promise<void>((resolve) => {
        this.state.persistence!.on('synced', () => {
          console.log('Document synced from IndexedDB');
          resolve();
        });
      });
    } catch (error) {
      console.error('Error setting up persistence:', error);
      // Continue without persistence if it fails
    }
  }

  /**
   * Set up WebSocket provider for real-time sync
   */
  private async setupWebSocketProvider(): Promise<void> {
    try {
      const wsUrl = this.getWebSocketUrl();
      
      this.state.provider = new WebsocketProvider(
        wsUrl,
        `atrium-doc-${this.documentId}`,
        this.state.doc,
        {
          connect: true,
          awareness: this.state.awareness,
        }
      );

      // Set up connection event listeners
      this.state.provider.on('status', (event: any) => {
        this.state.isConnected = event.status === 'connected';
        this.emit('connection-status', { connected: this.state.isConnected });
      });

      this.state.provider.on('connection-error', (error: any) => {
        console.error('WebSocket connection error:', error);
        this.emit('connection-error', error);
      });

      this.state.provider.on('connection-close', (event: any) => {
        console.log('WebSocket connection closed:', event);
        this.emit('connection-close', event);
      });

    } catch (error) {
      console.error('Error setting up WebSocket provider:', error);
      throw new Error('Failed to set up real-time collaboration');
    }
  }

  /**
   * Set up awareness for cursor tracking and user presence
   */
  private setupAwareness(): void {
    if (!this.state.provider) return;

    this.state.awareness = this.state.provider.awareness;

    // Set local user state
    this.state.awareness.setLocalStateField('user', this.userInfo);

    // Listen for awareness changes
    this.state.awareness.on('change', () => {
      this.updateUsers();
    });

    // Listen for awareness updates
    this.state.awareness.on('update', ({ added, updated, removed }: any) => {
      this.emit('awareness-update', { added, updated, removed });
    });
  }

  /**
   * Set up event listeners for document changes
   */
  private setupEventListeners(): void {
    // Listen for document updates
    this.state.doc.on('update', (update: Uint8Array, origin: any) => {
      this.emit('document-update', { update, origin });
    });

    // Listen for document changes
    this.state.doc.on('beforeTransaction', (transaction: Y.Transaction) => {
      this.emit('before-transaction', { transaction });
    });

    this.state.doc.on('afterTransaction', (transaction: Y.Transaction) => {
      this.emit('after-transaction', { transaction });
    });
  }

  /**
   * Update users map from awareness state
   */
  private updateUsers(): void {
    if (!this.state.awareness) return;

    const newUsers = new Map<string, CollaborationUser>();
    
    this.state.awareness.getStates().forEach((state: any, clientId: number) => {
      if (state.user && clientId !== this.state.awareness.clientID) {
        newUsers.set(clientId.toString(), state.user);
      }
    });

    this.state.users = newUsers;
    this.emit('users-updated', { users: Array.from(newUsers.values()) });
  }

  /**
   * Get WebSocket URL for collaboration server
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/workshop/collaboration`;
  }

  /**
   * Get Y.Text for text-based documents
   */
  public getText(key: string): Y.Text {
    return this.state.doc.getText(key);
  }

  /**
   * Get Y.Array for array-based documents
   */
  public getArray(key: string): Y.Array<any> {
    return this.state.doc.getArray(key);
  }

  /**
   * Get Y.Map for object-based documents
   */
  public getMap(key: string): Y.Map<any> {
    return this.state.doc.getMap(key);
  }

  /**
   * Update cursor position
   */
  public updateCursor(cursor: CollaborationUser['cursor']): void {
    if (!this.state.awareness || !this.userInfo) return;

    this.state.awareness.setLocalStateField('user', {
      ...this.userInfo,
      cursor,
    });
  }

  /**
   * Update selection range
   */
  public updateSelection(selection: { start: number; end: number }): void {
    if (!this.state.awareness || !this.userInfo) return;

    const currentCursor = this.userInfo.cursor || { x: 0, y: 0 };
    this.state.awareness.setLocalStateField('user', {
      ...this.userInfo,
      cursor: {
        ...currentCursor,
        selection,
      },
    });
  }

  /**
   * Clear cursor and selection
   */
  public clearCursor(): void {
    if (!this.state.awareness || !this.userInfo) return;

    this.state.awareness.setLocalStateField('user', {
      ...this.userInfo,
      cursor: undefined,
    });
  }

  /**
   * Get current users
   */
  public getUsers(): CollaborationUser[] {
    return Array.from(this.state.users.values());
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get document
   */
  public getDocument(): Y.Doc {
    return this.state.doc;
  }

  /**
   * Disconnect from collaboration
   */
  public disconnect(): void {
    if (this.state.provider) {
      this.state.provider.destroy();
      this.state.provider = null;
    }

    if (this.state.persistence) {
      this.state.persistence.destroy();
      this.state.persistence = null;
    }

    this.state.doc.destroy();
    this.state.isConnected = false;
    this.state.users.clear();
    this.state.awareness = null;

    this.emit('disconnected', {});
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Export document state
   */
  public exportDocument(): Uint8Array {
    return Y.encodeStateAsUpdate(this.state.doc);
  }

  /**
   * Import document state
   */
  public importDocument(state: Uint8Array): void {
    Y.applyUpdate(this.state.doc, state);
  }

  /**
   * Get document state vector
   */
  public getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.state.doc);
  }

  /**
   * Get updates since state vector
   */
  public getUpdatesSince(stateVector: Uint8Array): Uint8Array {
    return Y.encodeStateAsUpdate(this.state.doc, stateVector);
  }

  /**
   * Check if collaboration is supported
   */
  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'WebSocket' in window &&
      'indexedDB' in window
    );
  }
}

// Export singleton instance
export const yjsProvider = YjsProvider.getInstance();
