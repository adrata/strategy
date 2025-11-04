/**
 * Workbench Encryption Service
 * 
 * Provides client-side encryption using Web Crypto API with AES-256-GCM
 * for secure document storage and transmission.
 */

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  keyId: string;
  algorithm: string;
}

export interface DecryptionResult {
  decryptedData: string;
  keyId: string;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  keyId: string;
  createdAt: Date;
}

export class CryptoService {
  private static instance: CryptoService;
  private keyCache: Map<string, CryptoKey> = new Map();
  private keyPairCache: Map<string, KeyPair> = new Map();

  private constructor() {}

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  /**
   * Generate a new AES-256-GCM key for document encryption
   */
  public async generateDocumentKey(): Promise<CryptoKey> {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      console.error('Error generating document key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Generate RSA key pair for key encryption
   */
  public async generateKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      const keyId = await this.generateKeyId();
      const keyPairData: KeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        keyId,
        createdAt: new Date(),
      };

      this.keyPairCache.set(keyId, keyPairData);
      return keyPairData;
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Failed to generate key pair');
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  public async encryptData(
    data: string,
    key: CryptoKey,
    keyId: string
  ): Promise<EncryptionResult> {
    try {
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Convert string to ArrayBuffer
      const dataBuffer = new TextEncoder().encode(data);
      
      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Convert to base64 strings for storage
      const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
      const ivString = this.arrayBufferToBase64(iv);

      return {
        encryptedData,
        iv: ivString,
        keyId,
        algorithm: 'AES-GCM-256',
      };
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  public async decryptData(
    encryptedData: string,
    iv: string,
    key: CryptoKey,
    keyId: string
  ): Promise<DecryptionResult> {
    try {
      // Convert base64 strings back to ArrayBuffers
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
        },
        key,
        encryptedBuffer
      );

      // Convert back to string
      const decryptedData = new TextDecoder().decode(decryptedBuffer);

      return {
        decryptedData,
        keyId,
      };
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt a document with automatic key management
   */
  public async encryptDocument(
    content: any,
    workspaceId: string,
    userId: string
  ): Promise<EncryptionResult> {
    try {
      // Get or generate workspace key
      const key = await this.getOrCreateWorkspaceKey(workspaceId, userId);
      const keyId = await this.generateKeyId();
      
      // Serialize content to string
      const contentString = JSON.stringify(content);
      
      // Encrypt the content
      return await this.encryptData(contentString, key, keyId);
    } catch (error) {
      console.error('Error encrypting document:', error);
      throw new Error('Failed to encrypt document');
    }
  }

  /**
   * Decrypt a document
   */
  public async decryptDocument(
    encryptedResult: EncryptionResult,
    workspaceId: string,
    userId: string
  ): Promise<any> {
    try {
      // Get workspace key
      const key = await this.getWorkspaceKey(workspaceId, userId);
      if (!key) {
        throw new Error('Workspace key not found');
      }
      
      // Decrypt the content
      const result = await this.decryptData(
        encryptedResult.encryptedData,
        encryptedResult.iv,
        key,
        encryptedResult.keyId
      );
      
      // Parse back to object
      return JSON.parse(result.decryptedData);
    } catch (error) {
      console.error('Error decrypting document:', error);
      throw new Error('Failed to decrypt document');
    }
  }

  /**
   * Get or create a workspace-specific encryption key
   */
  private async getOrCreateWorkspaceKey(
    workspaceId: string,
    userId: string
  ): Promise<CryptoKey> {
    const keyId = `${workspaceId}-${userId}`;
    
    // Check cache first
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    // Try to load from IndexedDB
    try {
      const storedKey = await this.loadKeyFromStorage(keyId);
      if (storedKey) {
        this.keyCache.set(keyId, storedKey);
        return storedKey;
      }
    } catch (error) {
      console.warn('Failed to load key from storage:', error);
    }

    // Generate new key
    const key = await this.generateDocumentKey();
    
    // Store in cache and IndexedDB
    this.keyCache.set(keyId, key);
    await this.storeKeyInStorage(keyId, key);
    
    return key;
  }

  /**
   * Get workspace key from cache or storage
   */
  private async getWorkspaceKey(
    workspaceId: string,
    userId: string
  ): Promise<CryptoKey | null> {
    const keyId = `${workspaceId}-${userId}`;
    
    // Check cache first
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    // Try to load from IndexedDB
    try {
      const storedKey = await this.loadKeyFromStorage(keyId);
      if (storedKey) {
        this.keyCache.set(keyId, storedKey);
        return storedKey;
      }
    } catch (error) {
      console.warn('Failed to load key from storage:', error);
    }

    return null;
  }

  /**
   * Store encryption key in IndexedDB
   */
  private async storeKeyInStorage(keyId: string, key: CryptoKey): Promise<void> {
    try {
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyData = {
        keyId,
        keyData: this.arrayBufferToBase64(exportedKey),
        createdAt: new Date().toISOString(),
      };

      // Store in IndexedDB
      const request = indexedDB.open('WorkbenchKeys', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'keyId' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['keys'], 'readwrite');
        const store = transaction.objectStore('keys');
        store.put(keyData);
      };
    } catch (error) {
      console.error('Error storing key:', error);
      throw new Error('Failed to store encryption key');
    }
  }

  /**
   * Load encryption key from IndexedDB
   */
  private async loadKeyFromStorage(keyId: string): Promise<CryptoKey | null> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('WorkbenchKeys', 1);
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['keys'], 'readonly');
          const store = transaction.objectStore('keys');
          const getRequest = store.get(keyId);
          
          getRequest.onsuccess = async () => {
            if (getRequest.result) {
              try {
                const keyData = this.base64ToArrayBuffer(getRequest.result.keyData);
                const key = await crypto.subtle.importKey(
                  'raw',
                  keyData,
                  { name: 'AES-GCM' },
                  true,
                  ['encrypt', 'decrypt']
                );
                resolve(key);
              } catch (error) {
                reject(error);
              }
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => reject(getRequest.error);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading key:', error);
      return null;
    }
  }

  /**
   * Generate a unique key ID
   */
  private async generateKeyId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `key_${timestamp}_${random}`;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all cached keys (for logout)
   */
  public clearKeyCache(): void {
    this.keyCache.clear();
    this.keyPairCache.clear();
  }

  /**
   * Check if encryption is supported in this browser
   */
  public static isEncryptionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'crypto' in window &&
      'subtle' in window.crypto &&
      'indexedDB' in window
    );
  }

  /**
   * Get encryption status for a document
   */
  public getEncryptionStatus(content: any): {
    isEncrypted: boolean;
    algorithm?: string;
    keyId?: string;
  } {
    if (typeof content === 'object' && content !== null) {
      if (content.encryptedData && content.iv && content.keyId) {
        return {
          isEncrypted: true,
          algorithm: content.algorithm || 'AES-GCM-256',
          keyId: content.keyId,
        };
      }
    }
    
    return { isEncrypted: false };
  }
}

// Export singleton instance
export const cryptoService = CryptoService.getInstance();
