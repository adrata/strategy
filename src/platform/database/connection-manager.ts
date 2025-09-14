/**
 * 🚀 CONNECTION POOL MANAGER
 * 
 * Manages database connections to prevent pool exhaustion
 * Ensures optimal performance under high concurrent load
 */

export class ConnectionPoolManager {
  private activeQueries = 0;
  private queue: Array<{ query: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private readonly MAX_CONCURRENT_QUERIES = 3; // Reduced to prevent connection pool exhaustion
  
  async executeQuery<T>(query: () => Promise<T>): Promise<T> {
    if (this.activeQueries < this.MAX_CONCURRENT_QUERIES) {
      this.activeQueries++;
      try {
        const result = await query();
        return result;
      } finally {
        this.activeQueries--;
        this.processQueue();
      }
    } else {
      // Queue the query
      return new Promise((resolve, reject) => {
        this.queue.push({ query, resolve, reject });
      });
    }
  }
  
  private async processQueue() {
    if (this.queue.length > 0 && this.activeQueries < this.MAX_CONCURRENT_QUERIES) {
      const { query, resolve, reject } = this.queue.shift()!;
      this.activeQueries++;
      try {
        const result = await query();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.activeQueries--;
        this.processQueue();
      }
    }
  }
  
  getActiveQueries(): number {
    return this.activeQueries;
  }
  
  getQueuedQueries(): number {
    return this.queue.length;
  }
}

// Export singleton instance
export const connectionManager = new ConnectionPoolManager();
