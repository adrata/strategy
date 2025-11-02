/**
 * Calendar Service
 * 
 * Service for managing calendar Action Blocks with localStorage persistence.
 * Follows the same pattern as useChecklist for consistency.
 */

export interface ActionBlock {
  id: string;
  title: string;
  startTime: string; // Format: "HH:mm" (24-hour format, e.g., "09:00")
  endTime: string; // Format: "HH:mm"
  date: string; // Format: "YYYY-MM-DD"
  status: "pending" | "in-progress" | "completed";
  description?: string;
  createdAt: number;
  completedAt?: number;
  color?: string; // Optional color for the block
}

interface CalendarServiceReturn {
  blocks: ActionBlock[];
  addBlock: (block: Omit<ActionBlock, "id" | "createdAt" | "status">) => void;
  updateBlock: (id: string, updates: Partial<ActionBlock>) => void;
  deleteBlock: (id: string) => void;
  executeBlock: (id: string) => void;
  completeBlock: (id: string) => void;
  getBlocksForDate: (date: string) => ActionBlock[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load calendar blocks from localStorage
 */
function loadCalendarBlocks(storageKey: string): ActionBlock[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item: any) =>
              item &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              typeof item.startTime === "string" &&
              typeof item.endTime === "string" &&
              typeof item.date === "string" &&
              typeof item.createdAt === "number"
          )
          .map((item: any) => ({
            id: item.id,
            title: item.title,
            startTime: item.startTime,
            endTime: item.endTime,
            date: item.date,
            status: item.status || "pending",
            description: item.description,
            createdAt: item.createdAt,
            completedAt: item.completedAt,
            color: item.color,
          }));
      }
    }
  } catch (error) {
    console.warn("Failed to load calendar blocks from localStorage:", error);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      // Ignore errors removing corrupted data
    }
  }

  return [];
}

/**
 * Save calendar blocks to localStorage with error handling
 */
function saveCalendarBlocks(storageKey: string, blocks: ActionBlock[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(storageKey, JSON.stringify(blocks));
    return true;
  } catch (error: any) {
    if (error.name === "QuotaExceededError" || error.code === 22) {
      console.error(
        "localStorage quota exceeded. Cannot save calendar blocks."
      );
      return false;
    }
    console.error("Failed to save calendar blocks to localStorage:", error);
    return false;
  }
}

/**
 * Calendar Service Class
 */
class CalendarServiceClass {
  private blocks: ActionBlock[] = [];
  private storageKey: string | null = null;
  private isLoading = false;
  private error: string | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  /**
   * Initialize the service with user and workspace IDs
   */
  initialize(userId: string | undefined, workspaceId: string | undefined) {
    if (!userId || !workspaceId) {
      this.storageKey = null;
      this.blocks = [];
      this.error = "User or workspace not available";
      this.isLoading = false;
      this.notifyListeners();
      return;
    }

    this.storageKey = `calendar-blocks-${userId}-${workspaceId}`;
    this.isLoading = true;
    this.error = null;

    try {
      this.blocks = loadCalendarBlocks(this.storageKey);
    } catch (err) {
      console.error("Error loading calendar blocks:", err);
      this.error = "Failed to load calendar blocks";
      this.blocks = [];
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Get all blocks
   */
  getBlocks(): ActionBlock[] {
    return this.blocks;
  }

  /**
   * Get blocks for a specific date
   */
  getBlocksForDate(date: string): ActionBlock[] {
    return this.blocks.filter((block) => block.date === date);
  }

  /**
   * Check if a time range conflicts with existing blocks
   */
  checkConflict(
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): ActionBlock[] {
    const dateBlocks = this.getBlocksForDate(date);
    const conflicts: ActionBlock[] = [];

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    for (const block of dateBlocks) {
      if (excludeId && block.id === excludeId) continue;

      const blockStartMinutes = this.timeToMinutes(block.startTime);
      const blockEndMinutes = this.timeToMinutes(block.endTime);

      // Check for overlap
      if (
        (startMinutes >= blockStartMinutes && startMinutes < blockEndMinutes) ||
        (endMinutes > blockStartMinutes && endMinutes <= blockEndMinutes) ||
        (startMinutes <= blockStartMinutes && endMinutes >= blockEndMinutes)
      ) {
        conflicts.push(block);
      }
    }

    return conflicts;
  }

  /**
   * Helper to convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Add a new block
   */
  addBlock(block: Omit<ActionBlock, "id" | "createdAt" | "status">): { success: boolean; conflicts?: ActionBlock[] } {
    // Check for conflicts
    const conflicts = this.checkConflict(block.date, block.startTime, block.endTime);
    
    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }

    const newBlock: ActionBlock = {
      ...block,
      id: generateId(),
      createdAt: Date.now(),
      status: "pending",
    };

    this.blocks = [...this.blocks, newBlock];
    this.saveBlocks();
    this.notifyListeners();
    return { success: true };
  }

  /**
   * Update a block
   */
  updateBlock(
    id: string,
    updates: Partial<ActionBlock>
  ): { success: boolean; conflicts?: ActionBlock[] } {
    const existingBlock = this.blocks.find((b) => b.id === id);
    if (!existingBlock) {
      return { success: false };
    }

    const updatedBlock = { ...existingBlock, ...updates };

    // Check for conflicts if time or date changed
    if (
      (updates.startTime !== undefined ||
        updates.endTime !== undefined ||
        updates.date !== undefined) &&
      updatedBlock.date &&
      updatedBlock.startTime &&
      updatedBlock.endTime
    ) {
      const conflicts = this.checkConflict(
        updatedBlock.date,
        updatedBlock.startTime,
        updatedBlock.endTime,
        id
      );

      if (conflicts.length > 0) {
        return { success: false, conflicts };
      }
    }

    this.blocks = this.blocks.map((block) => {
      if (block.id === id) {
        return updatedBlock;
      }
      return block;
    });
    this.saveBlocks();
    this.notifyListeners();
    return { success: true };
  }

  /**
   * Delete a block
   */
  deleteBlock(id: string): void {
    this.blocks = this.blocks.filter((block) => block.id !== id);
    this.saveBlocks();
    this.notifyListeners();
  }

  /**
   * Execute a block (set status to in-progress)
   */
  executeBlock(id: string): void {
    this.updateBlock(id, { status: "in-progress" });
  }

  /**
   * Complete a block
   */
  completeBlock(id: string): void {
    this.updateBlock(id, {
      status: "completed",
      completedAt: Date.now(),
    });
  }

  /**
   * Save blocks to localStorage (debounced)
   */
  private saveBlocks(): void {
    if (!this.storageKey) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      const success = saveCalendarBlocks(this.storageKey!, this.blocks);
      if (!success) {
        this.error = "Failed to save calendar blocks. Storage may be full.";
      } else {
        this.error = null;
      }
      this.notifyListeners();
    }, 100);
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Get loading state
   */
  getLoadingState(): { isLoading: boolean; error: string | null } {
    return { isLoading: this.isLoading, error: this.error };
  }
}

// Export singleton instance
export const CalendarService = new CalendarServiceClass();

