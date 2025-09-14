import { ulid } from 'ulid';

export interface ZohoSyncRecord {
  id: string;
  zohoId: string | null;
  tableName: string;
  lastSyncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
}

export class IDManagementService {
  private static instance: IDManagementService;

  private constructor() {}

  static getInstance(): IDManagementService {
    if (!IDManagementService.instance) {
      IDManagementService['instance'] = new IDManagementService();
    }
    return IDManagementService.instance;
  }

  /**
   * Generate a new ULID
   */
  generateULID(): string {
    return ulid();
  }

  /**
   * Check if a string is a valid ULID
   */
  isValidULID(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    if (str.length !== 26) return false;
    
    // ULID pattern: 10 chars timestamp + 16 chars randomness
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    return ulidPattern.test(str);
  }

  /**
   * Check if a string is a valid CUID
   */
  isValidCUID(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    if (str.length !== 25) return false;
    
    // CUID pattern: 'c' + 24 chars
    const cuidPattern = /^c[0-9a-z]{24}$/;
    return cuidPattern.test(str);
  }

  /**
   * Extract timestamp from ULID
   */
  getTimestampFromULID(ulidStr: string): Date | null {
    if (!this.isValidULID(ulidStr)) return null;
    
    try {
      // Extract timestamp part (first 10 characters)
      const timestampPart = ulidStr.substring(0, 10);
      
      // Convert base32 to decimal
      const timestamp = parseInt(timestampPart, 32);
      
      // ULID timestamp is in milliseconds since Unix epoch
      return new Date(timestamp);
    } catch (error) {
      console.error('Error extracting timestamp from ULID:', error);
      return null;
    }
  }

  /**
   * Generate Zoho ID placeholder
   */
  generateZohoIDPlaceholder(id: string): string {
    return `PENDING_${id.slice(-8)}`;
  }

  /**
   * Check if Zoho ID is a placeholder
   */
  isZohoIDPlaceholder(zohoId: string | null): boolean {
    if (!zohoId) return true;
    return zohoId.startsWith('PENDING_');
  }

  /**
   * Validate Zoho ID format
   */
  isValidZohoID(zohoId: string): boolean {
    if (!zohoId) return false;
    
    // Zoho CRM IDs are typically 18-20 digit numbers
    const zohoIDPattern = /^\d{18,20}$/;
    return zohoIDPattern.test(zohoId);
  }

  /**
   * Generate sync status for a record
   */
  getSyncStatus(zohoId: string | null, lastSyncedAt?: Date): 'pending' | 'synced' | 'failed' | 'conflict' {
    if (!zohoId || this.isZohoIDPlaceholder(zohoId)) {
      return 'pending';
    }
    
    if (!this.isValidZohoID(zohoId)) {
      return 'failed';
    }
    
    if (lastSyncedAt) {
      // Check if sync is recent (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastSyncedAt > oneHourAgo) {
        return 'synced';
      }
    }
    
    return 'conflict';
  }

  /**
   * Create a new record with ULID and Zoho placeholder
   */
  createRecordData(workspaceId: string, additionalData: Record<string, any> = {}): Record<string, any> {
    const ulid = this.generateULID();
    const zohoId = this.generateZohoIDPlaceholder(ulid);
    
    return {
      id: ulid,
      workspaceId,
      zohoId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...additionalData
    };
  }

  /**
   * Batch generate ULIDs
   */
  generateULIDs(count: number): string[] {
    const ulids: string[] = [];
    for (let i = 0; i < count; i++) {
      ulids.push(this.generateULID());
    }
    return ulids;
  }

  /**
   * Sort ULIDs chronologically
   */
  sortULIDs(ulids: string[]): string[] {
    return ulids.sort((a, b) => {
      const timestampA = this.getTimestampFromULID(a);
      const timestampB = this.getTimestampFromULID(b);
      
      if (!timestampA || !timestampB) return 0;
      return timestampA.getTime() - timestampB.getTime();
    });
  }

  /**
   * Get ULID creation time range
   */
  getULIDTimeRange(ulids: string[]): { earliest: Date | null; latest: Date | null } {
    let earliest: Date | null = null;
    let latest: Date | null = null;
    
    for (const ulid of ulids) {
      const timestamp = this.getTimestampFromULID(ulid);
      if (timestamp) {
        if (!earliest || timestamp < earliest) {
          earliest = timestamp;
        }
        if (!latest || timestamp > latest) {
          latest = timestamp;
        }
      }
    }
    
    return { earliest, latest };
  }
}

export const getIDManagement = () => IDManagementService.getInstance(); 