import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryDetailView } from '../StoryDetailView';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack
  }),
  usePathname: () => '/workspace/stacks/story-1'
}));

// Mock the hooks
jest.mock('@/platform/ui/context/RevenueOSProvider', () => ({
  useRevenueOS: () => ({
    ui: {
      activeWorkspace: { id: 'workspace-1' }
    }
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock StoryMainView
jest.mock('../story-views/StoryMainView', () => ({
  StoryMainView: ({ story }: { story: any }) => (
    <div data-testid="story-main-view">
      <div>{story.title}</div>
    </div>
  )
}));

describe('StoryDetailView', () => {
  const mockStories = [
    { id: 'story-1', title: 'Story 1', priority: 'urgent' },
    { id: 'story-2', title: 'Story 2', priority: 'urgent' },
    { id: 'story-3', title: 'Story 3', priority: 'high' },
    { id: 'story-4', title: 'Story 4', priority: 'high' },
    { id: 'story-5', title: 'Story 5', priority: 'medium' }
  ];

  const mockStory = {
    id: 'story-1',
    title: 'Story 1',
    description: 'Test description',
    status: 'up-next',
    priority: 'urgent',
    viewType: 'story',
    isFlagged: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stories/story-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ story: mockStory })
        });
      }
      if (url.includes('/stories?workspaceId=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stories: mockStories })
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display alphanumeric rank for urgent story', async () => {
    render(<StoryDetailView storyId="story-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Story 1')).toBeInTheDocument();
    });

    // Story 1 is first urgent story, so should be 1A
    await waitFor(() => {
      const rankElement = screen.getByText('1A');
      expect(rankElement).toBeInTheDocument();
    });
  });

  it('should display correct rank for second story in same priority', async () => {
    // Mock story 2 as current story
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stories/story-2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ story: { ...mockStory, id: 'story-2', title: 'Story 2' } })
        });
      }
      if (url.includes('/stories?workspaceId=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stories: mockStories })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<StoryDetailView storyId="story-2" />);
    
    await waitFor(() => {
      // Story 2 is second urgent story, so should be 1B
      const rankElement = screen.getByText('1B');
      expect(rankElement).toBeInTheDocument();
    });
  });

  it('should display correct rank for high priority story', async () => {
    // Mock story 3 as current story
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stories/story-3')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ story: { ...mockStory, id: 'story-3', title: 'Story 3', priority: 'high' } })
        });
      }
      if (url.includes('/stories?workspaceId=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stories: mockStories })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<StoryDetailView storyId="story-3" />);
    
    await waitFor(() => {
      // Story 3 is first high priority story, and there are 2 urgent stories before it
      // So tier number = 3 (1 + 2 urgent stories), letter = A (first in high group)
      const rankElement = screen.getByText('3A');
      expect(rankElement).toBeInTheDocument();
    });
  });

  it('should display Update Story button for story viewType', async () => {
    render(<StoryDetailView storyId="story-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Update Story')).toBeInTheDocument();
    });
  });

  it('should display Update Bug button for bug viewType', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stories/story-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ story: { ...mockStory, viewType: 'bug' } })
        });
      }
      if (url.includes('/stories?workspaceId=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stories: mockStories })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<StoryDetailView storyId="story-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Update Bug')).toBeInTheDocument();
    });
  });

  it('should display Update Task button for task viewType', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stories/story-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ story: { ...mockStory, viewType: 'task' } })
        });
      }
      if (url.includes('/stories?workspaceId=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stories: mockStories })
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<StoryDetailView storyId="story-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Update Task')).toBeInTheDocument();
    });
  });

  it('should italicize status in Advance button', async () => {
    render(<StoryDetailView storyId="story-1" />);
    
    await waitFor(() => {
      const advanceButton = screen.getByText(/Advance to/);
      expect(advanceButton).toBeInTheDocument();
      
      // Check that "In Progress" is in an italic span
      const italicSpan = advanceButton.querySelector('.italic');
      expect(italicSpan).toBeInTheDocument();
      expect(italicSpan).toHaveTextContent('In Progress');
    });
  });
});

