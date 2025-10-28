/**
 * NotesTab Display Indicators Tests
 * 
 * Tests the NotesTab within UniversalRecordTemplate for both "min read" and "Last saved" indicators
 * to verify they only show when there is actual content.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';

// Mock the record context
jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    record: null,
    setRecord: jest.fn(),
    setCurrentRecord: jest.fn(),
    clearCurrentRecord: jest.fn(),
    loading: false,
    error: null,
    refetch: jest.fn(),
    updateCurrentRecord: jest.fn()
  })
}));

// Mock the auth function
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      activeWorkspaceId: 'test-workspace-id'
    }
  })
}));

// Mock the acquisition OS context
jest.mock('@/platform/ui/context/RevenueOSProvider', () => ({
  useRevenueOS: () => ({
    data: {
      people: [],
      companies: [],
      leads: [],
      prospects: [],
      opportunities: [],
      clients: []
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
    ui: {
      selectedRecord: null,
      setSelectedRecord: jest.fn(),
      showLeftPanel: true,
      setShowLeftPanel: jest.fn(),
      showRightPanel: true,
      setShowRightPanel: jest.fn()
    }
  })
}));

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className}>✓</div>
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className}>🕐</div>
  ),
  ExclamationTriangleIcon: ({ className }: { className?: string }) => (
    <div data-testid="warning-icon" className={className}>⚠️</div>
  )
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock the DeepValueReportView component that's causing issues
jest.mock('@/platform/ui/components/reports/DeepValueReportView', () => ({
  DeepValueReportView: () => <div data-testid="deep-value-report">Mocked Report</div>
}));

describe('NotesTab Display Indicators Tests', () => {
  const createTestRecord = (notes: string | null, updatedAt?: string) => ({
    id: 'test-record-id',
    fullName: 'Test Person',
    notes: notes,
    updatedAt: updatedAt || '2024-01-15T10:30:00Z',
    workspaceId: 'test-workspace-id'
  });

  const defaultProps = {
    record: createTestRecord(''),
    recordType: 'people',
    tabConfig: {
      id: 'notes',
      label: 'Notes',
      component: 'NotesTab'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'test-record-id',
          notes: '',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      })
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Min Read Indicator', () => {
    it('should not show "min read" for blank notes', () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Should not show "min read" for blank notes
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });

    it('should not show "min read" for whitespace-only notes', () => {
      const recordWithWhitespace = createTestRecord('   \n\t  ');
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithWhitespace} 
        />
      );
      
      // Should not show "min read" for whitespace-only notes
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });

    it('should show "1 min read" for notes with 1-200 words', () => {
      const shortContent = 'This is a short note with a few words.';
      const recordWithContent = createTestRecord(shortContent);
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Should show "1 min read" for short content
      expect(screen.getByText('1 min read')).toBeInTheDocument();
    });

    it('should show "2 min read" for notes with 201-400 words', () => {
      // Create content with approximately 250 words
      const longContent = Array(25).fill('This is a sentence with ten words in it to test the min read calculation properly.').join(' ');
      const recordWithContent = createTestRecord(longContent);
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Should show "2 min read" for longer content
      expect(screen.getByText('2 min read')).toBeInTheDocument();
    });

    it('should calculate correct min read for various word counts', () => {
      const testCases = [
        { words: 1, expected: '1 min read' },
        { words: 200, expected: '1 min read' },
        { words: 201, expected: '2 min read' },
        { words: 400, expected: '2 min read' },
        { words: 401, expected: '3 min read' },
        { words: 600, expected: '3 min read' }
      ];

      testCases.forEach(({ words, expected }) => {
        // Create content with specified word count
        const content = Array(words).fill('word').join(' ');
        const recordWithContent = createTestRecord(content);
        
        const { unmount } = render(
          <UniversalRecordTemplate 
            {...defaultProps} 
            record={recordWithContent} 
          />
        );
        
        // Should show correct min read calculation
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Last Saved Indicator', () => {
    it('should not initialize lastSavedAt for records with blank notes', () => {
      const recordWithBlankNotes = createTestRecord('');
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithBlankNotes} 
        />
      );
      
      // Should not show "Last saved" for blank notes
      expect(screen.queryByText(/Last saved/)).not.toBeInTheDocument();
    });

    it('should initialize lastSavedAt for records with existing notes', () => {
      const recordWithNotes = createTestRecord('Existing notes content');
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithNotes} 
        />
      );
      
      // Should show "Last saved" when notes exist
      expect(screen.getByText(/Last saved/)).toBeInTheDocument();
    });

    it('should show "Last saved" only when notes have content', () => {
      const recordWithContent = createTestRecord('Some actual content here');
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Should show "Last saved" when content exists
      expect(screen.getByText(/Last saved/)).toBeInTheDocument();
    });

    it('should hide "Last saved" when all content is deleted', async () => {
      const user = userEvent.setup();
      const recordWithContent = createTestRecord('Content to be deleted');
      
      const { rerender } = render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Initially should show "Last saved"
      expect(screen.getByText(/Last saved/)).toBeInTheDocument();
      
      // Update record to have blank notes
      const recordWithBlankNotes = createTestRecord('');
      rerender(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithBlankNotes} 
        />
      );
      
      // Should hide "Last saved" when content is deleted
      expect(screen.queryByText(/Last saved/)).not.toBeInTheDocument();
    });
  });

  describe('Word and Character Counts', () => {
    it('should show correct word count for blank notes (0 words)', () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Should show 0 words for blank notes
      expect(screen.getByText('0 words')).toBeInTheDocument();
    });

    it('should show correct character count for blank notes (0 characters)', () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Should show 0 characters for blank notes
      expect(screen.getByText('0 characters')).toBeInTheDocument();
    });

    it('should show correct word count for content with words', () => {
      const content = 'This is a test with five words';
      const recordWithContent = createTestRecord(content);
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Should show correct word count
      expect(screen.getByText('5 words')).toBeInTheDocument();
    });

    it('should show correct character count for content', () => {
      const content = 'Test content';
      const recordWithContent = createTestRecord(content);
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Should show correct character count (including spaces)
      expect(screen.getByText('12 characters')).toBeInTheDocument();
    });

    it('should handle whitespace-only content correctly', () => {
      const whitespaceContent = '   \n\t  ';
      const recordWithWhitespace = createTestRecord(whitespaceContent);
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithWhitespace} 
        />
      );
      
      // Should show 0 words for whitespace-only content
      expect(screen.getByText('0 words')).toBeInTheDocument();
      
      // Should show character count for whitespace
      expect(screen.getByText('6 characters')).toBeInTheDocument();
    });
  });

  describe('Combined Indicator Behavior', () => {
    it('should show both indicators when content exists', () => {
      const content = 'This is a test note with some content to verify both indicators work correctly.';
      const recordWithContent = createTestRecord(content);
      
      render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Should show both indicators when content exists
      expect(screen.getByText(/Last saved/)).toBeInTheDocument();
      expect(screen.getByText(/min read/)).toBeInTheDocument();
    });

    it('should hide both indicators when content is blank', () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Should hide both indicators when content is blank
      expect(screen.queryByText(/Last saved/)).not.toBeInTheDocument();
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });

    it('should handle transition from content to blank correctly', () => {
      const content = 'Initial content';
      const recordWithContent = createTestRecord(content);
      
      const { rerender } = render(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithContent} 
        />
      );
      
      // Initially should show both indicators
      expect(screen.getByText(/Last saved/)).toBeInTheDocument();
      expect(screen.getByText(/min read/)).toBeInTheDocument();
      
      // Update to blank content
      const recordWithBlankNotes = createTestRecord('');
      rerender(
        <UniversalRecordTemplate 
          {...defaultProps} 
          record={recordWithBlankNotes} 
        />
      );
      
      // Should hide both indicators
      expect(screen.queryByText(/Last saved/)).not.toBeInTheDocument();
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });
  });
});
