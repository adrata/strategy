import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryMainView } from '../story-views/StoryMainView';

// Mock the hooks
jest.mock('@/platform/ui/hooks/useRevenueOS', () => ({
  useRevenueOS: () => ({
    ui: {
      activeWorkspace: { id: 'workspace-1' }
    }
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock InlineEditField
jest.mock('@/frontend/components/pipeline/InlineEditField', () => ({
  InlineEditField: ({ value, field, placeholder, className, options }: any) => (
    <div data-testid={`inline-edit-${field}`} className={className}>
      {options ? (
        <select data-testid={`select-${field}`}>
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <span>{value || placeholder}</span>
      )}
    </div>
  )
}));

// Mock StacksCommentsSection
jest.mock('../story-views/StacksCommentsSection', () => ({
  StacksCommentsSection: ({ storyId }: { storyId: string }) => (
    <div data-testid="comments-section">Comments for {storyId}</div>
  )
}));

describe('StoryMainView', () => {
  const mockStory = {
    id: 'story-1',
    title: 'Test Story',
    description: 'Test description',
    acceptanceCriteria: 'Test acceptance criteria',
    status: 'in-progress',
    priority: 'high',
    viewType: 'story',
    isFlagged: false,
    assignee: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { users: [] }
      })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render story title', () => {
    render(<StoryMainView story={mockStory} />);
    expect(screen.getByText('Test Story')).toBeInTheDocument();
  });

  it('should render split description and acceptance criteria boxes', () => {
    render(<StoryMainView story={mockStory} />);
    
    // Check for Description section
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByTestId('inline-edit-description')).toBeInTheDocument();
    
    // Check for Acceptance Criteria section
    expect(screen.getByText('Acceptance Criteria')).toBeInTheDocument();
    expect(screen.getByTestId('inline-edit-acceptanceCriteria')).toBeInTheDocument();
  });

  it('should display description and acceptance criteria values', () => {
    render(<StoryMainView story={mockStory} />);
    
    const descriptionField = screen.getByTestId('inline-edit-description');
    const acceptanceCriteriaField = screen.getByTestId('inline-edit-acceptanceCriteria');
    
    expect(descriptionField).toHaveTextContent('Test description');
    expect(acceptanceCriteriaField).toHaveTextContent('Test acceptance criteria');
  });

  it('should render priority dropdown with correct order (Urgent → High → Medium → Low)', () => {
    render(<StoryMainView story={mockStory} />);
    
    const prioritySelect = screen.getByTestId('select-priority');
    const options = Array.from(prioritySelect.querySelectorAll('option')).map(opt => opt.textContent);
    
    expect(options).toEqual(['Urgent', 'High', 'Medium', 'Low']);
  });

  it('should render flag field', () => {
    render(<StoryMainView story={mockStory} />);
    
    expect(screen.getByText('Flag')).toBeInTheDocument();
    expect(screen.getByTestId('inline-edit-isFlagged')).toBeInTheDocument();
  });

  it('should render comments section', () => {
    render(<StoryMainView story={mockStory} />);
    
    expect(screen.getByTestId('comments-section')).toBeInTheDocument();
    expect(screen.getByText(/Comments for story-1/)).toBeInTheDocument();
  });

  it('should handle empty description and acceptance criteria', () => {
    const storyWithoutFields = {
      ...mockStory,
      description: '',
      acceptanceCriteria: ''
    };
    
    render(<StoryMainView story={storyWithoutFields} />);
    
    expect(screen.getByTestId('inline-edit-description')).toBeInTheDocument();
    expect(screen.getByTestId('inline-edit-acceptanceCriteria')).toBeInTheDocument();
  });
});

