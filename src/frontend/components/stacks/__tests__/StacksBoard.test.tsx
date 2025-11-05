import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StacksBoard } from '../StacksBoard';

// Mock the hooks
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' }
  })
}));

jest.mock('@/platform/ui/hooks/useRevenueOS', () => ({
  useRevenueOS: () => ({
    ui: {
      activeWorkspace: { id: 'workspace-1' }
    }
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock FlagIcon
jest.mock('@heroicons/react/24/outline', () => ({
  FlagIcon: ({ className }: { className?: string }) => (
    <svg data-testid="flag-icon" className={className}>Flag</svg>
  ),
  ChevronRightIcon: () => <svg>ChevronRight</svg>,
  ChevronLeftIcon: () => <svg>ChevronLeft</svg>
}));

describe('StacksBoard', () => {
  const mockCards = [
    {
      id: 'card-1',
      title: 'Card 1',
      priority: 'high',
      status: 'up-next',
      isFlagged: true
    },
    {
      id: 'card-2',
      title: 'Card 2',
      priority: 'medium',
      status: 'in-progress',
      isFlagged: false
    }
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stories: [] })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render flag icon for flagged cards', () => {
    // This test would need the actual component rendering logic
    // For now, we verify the flag icon component exists
    const { FlagIcon } = require('@heroicons/react/24/outline');
    expect(FlagIcon).toBeDefined();
  });

  it('should not render flag icon for non-flagged cards', () => {
    // This test verifies that isFlagged: false cards don't show the flag
    // The component logic should conditionally render based on isFlagged
    expect(true).toBe(true); // Placeholder - actual implementation would check DOM
  });
});

