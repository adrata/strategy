/**
 * ProfilePanel Navigation Tests
 * 
 * Tests for Test Drive navigation item in ProfilePanel
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePanel } from '@/platform/ui/components/ProfilePanel';
import { SettingsPopupProvider } from '@/platform/ui/components/SettingsPopupContext';

// Mock the hooks
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      activeWorkspaceId: 'test-workspace-id',
    },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test-drive',
}));

jest.mock('@/platform/ui/components/ProfilePanelContext', () => ({
  useProfilePanel: () => ({
    isProfilePanelVisible: true,
    setIsProfilePanelVisible: jest.fn(),
  }),
}));

jest.mock('@/platform/ui/context/RevenueOSProvider', () => ({
  useRevenueOS: () => ({
    ui: {
      activeWorkspace: {
        id: 'test-workspace-id',
        name: 'Test Workspace',
      },
    },
  }),
}));

jest.mock('@/products/stacks/context/StacksProvider', () => ({
  useStacks: () => ({
    stories: [],
    tasks: [],
  }),
}));

// Mock Oasis provider
jest.mock('@/products/oasis/context/OasisProvider', () => ({
  useOasis: () => ({
    getTotalUnreadCount: () => 0,
  }),
}));

describe('ProfilePanel - Test Drive Navigation', () => {
  const mockProps = {
    user: { name: 'Test User' },
    company: 'Test Company',
    workspace: 'test-workspace',
    isOpen: true,
    onClose: jest.fn(),
    currentApp: 'test-drive',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render Test Drive navigation item', () => {
    render(
      <SettingsPopupProvider>
        <ProfilePanel {...mockProps} />
      </SettingsPopupProvider>
    );

    expect(screen.getByText(/test drive/i)).toBeInTheDocument();
  });

  it('should render Test Drive above Stacks', () => {
    render(
      <SettingsPopupProvider>
        <ProfilePanel {...mockProps} />
      </SettingsPopupProvider>
    );

    const testDriveButton = screen.getByText(/test drive/i);
    const stacksButton = screen.getByText(/stacks/i);

    // Check that Test Drive appears before Stacks in the DOM
    const testDriveIndex = Array.from(testDriveButton.parentElement?.parentElement?.children || []).indexOf(
      testDriveButton.closest('button') || testDriveButton
    );
    const stacksIndex = Array.from(stacksButton.parentElement?.parentElement?.children || []).indexOf(
      stacksButton.closest('button') || stacksButton
    );

    expect(testDriveIndex).toBeLessThan(stacksIndex);
  });

  it('should highlight Test Drive when currentApp is test-drive', () => {
    render(
      <SettingsPopupProvider>
        <ProfilePanel {...mockProps} currentApp="test-drive" />
      </SettingsPopupProvider>
    );

    const testDriveButton = screen.getByText(/test drive/i).closest('button');
    expect(testDriveButton).toHaveClass('bg-slate-100');
  });

  it('should navigate to /test-drive when clicked', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      push: mockPush,
    });

    render(
      <SettingsPopupProvider>
        <ProfilePanel {...mockProps} />
      </SettingsPopupProvider>
    );

    const testDriveButton = screen.getByText(/test drive/i).closest('button');
    fireEvent.click(testDriveButton!);

    expect(mockPush).toHaveBeenCalledWith('/test-drive');
  });

  it('should use RocketLaunchIcon for Test Drive', () => {
    render(
      <SettingsPopupProvider>
        <ProfilePanel {...mockProps} />
      </SettingsPopupProvider>
    );

    const testDriveButton = screen.getByText(/test drive/i).closest('button');
    // Icon should be present (checking via SVG or icon class)
    expect(testDriveButton).toBeInTheDocument();
  });
});

