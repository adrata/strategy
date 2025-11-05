/**
 * Stacks System Constants
 * 
 * Centralized constants for status values, priorities, and other shared values
 * to prevent hardcoded strings and ensure consistency across the codebase.
 */

// Status Values
export const STACK_STATUS = {
  TODO: 'todo',
  UP_NEXT: 'up-next',
  IN_PROGRESS: 'in-progress',
  BUILT: 'built',
  QA1: 'qa1',
  QA2: 'qa2',
  SHIPPED: 'shipped',
  DONE: 'done',
  DEEP_BACKLOG: 'deep-backlog',
  REVIEW: 'review', // Legacy status
} as const;

export type StackStatus = typeof STACK_STATUS[keyof typeof STACK_STATUS];

// Priority Values
export const STACK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type StackPriority = typeof STACK_PRIORITY[keyof typeof STACK_PRIORITY];

// Task Types
export const TASK_TYPE = {
  TASK: 'task',
  BUG: 'bug',
} as const;

export type TaskType = typeof TASK_TYPE[keyof typeof TASK_TYPE];

// Workstream Board Statuses
// These are the statuses that appear on the workstream board
export const WORKSTREAM_BOARD_STATUSES: readonly StackStatus[] = [
  STACK_STATUS.UP_NEXT,
  STACK_STATUS.IN_PROGRESS,
  STACK_STATUS.BUILT,
  STACK_STATUS.QA1,
  STACK_STATUS.QA2,
  STACK_STATUS.SHIPPED,
  STACK_STATUS.TODO,
];

// Backlog Statuses
// These are the statuses that appear in the backlog view
// Excludes workstream board statuses to prevent duplication
export const BACKLOG_STATUSES: readonly StackStatus[] = [
  STACK_STATUS.UP_NEXT,
  STACK_STATUS.TODO,
  // Note: 'in-progress', 'built', 'qa1', 'qa2', 'shipped', 'done' are excluded
  // as they appear on the workstream board only
];

// Status Transitions
// Maps current status to next status in workflow
export const STATUS_WORKFLOW: Record<StackStatus, StackStatus | null> = {
  [STACK_STATUS.UP_NEXT]: STACK_STATUS.IN_PROGRESS,
  [STACK_STATUS.TODO]: STACK_STATUS.IN_PROGRESS,
  [STACK_STATUS.IN_PROGRESS]: STACK_STATUS.BUILT,
  [STACK_STATUS.BUILT]: STACK_STATUS.QA1,
  [STACK_STATUS.QA1]: STACK_STATUS.QA2,
  [STACK_STATUS.QA2]: STACK_STATUS.SHIPPED,
  [STACK_STATUS.SHIPPED]: null, // End of workflow
  [STACK_STATUS.DONE]: null, // End of workflow
  [STACK_STATUS.DEEP_BACKLOG]: STACK_STATUS.UP_NEXT,
  [STACK_STATUS.REVIEW]: STACK_STATUS.IN_PROGRESS, // Legacy status
};

// Status Labels for Display
export const STATUS_LABELS: Record<StackStatus, string> = {
  [STACK_STATUS.TODO]: 'Up Next',
  [STACK_STATUS.UP_NEXT]: 'Up Next',
  [STACK_STATUS.IN_PROGRESS]: 'In Progress',
  [STACK_STATUS.BUILT]: 'Built',
  [STACK_STATUS.QA1]: 'QA1',
  [STACK_STATUS.QA2]: 'QA2',
  [STACK_STATUS.SHIPPED]: 'Shipped',
  [STACK_STATUS.DONE]: 'Done',
  [STACK_STATUS.DEEP_BACKLOG]: 'Deep Backlog',
  [STACK_STATUS.REVIEW]: 'Review',
};

// Helper Functions

/**
 * Check if a status is a workstream board status
 */
export function isWorkstreamBoardStatus(status: string): boolean {
  return WORKSTREAM_BOARD_STATUSES.includes(status as StackStatus);
}

/**
 * Check if a status should appear in backlog
 */
export function isBacklogStatus(status: string): boolean {
  return BACKLOG_STATUSES.includes(status as StackStatus) && 
         !WORKSTREAM_BOARD_STATUSES.includes(status as StackStatus);
}

/**
 * Get the next status in the workflow
 */
export function getNextStatus(currentStatus: StackStatus): StackStatus | null {
  return STATUS_WORKFLOW[currentStatus] || null;
}

/**
 * Get display label for a status
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as StackStatus] || status;
}

/**
 * Map 'todo' status to 'up-next' for display purposes
 */
export function normalizeStatusForDisplay(status: string): StackStatus {
  if (status === STACK_STATUS.TODO) {
    return STACK_STATUS.UP_NEXT;
  }
  return status as StackStatus;
}

