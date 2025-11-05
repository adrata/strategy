/**
 * Tests for alphanumeric rank calculation (1A, 2B, etc.)
 * Ranks are calculated by grouping stories by priority, then assigning letters within each priority group
 */

describe('Rank Calculation', () => {
  const priorityOrder = ['urgent', 'high', 'medium', 'low'];

  const calculateRank = (stories: any[], currentStoryId: string): string => {
    const currentStory = stories.find(s => s.id === currentStoryId);
    if (!currentStory) return '1A';

    const currentPriority = currentStory.priority || 'medium';
    
    // Group stories by priority
    const groupedByPriority: Record<string, any[]> = {};
    stories.forEach((s) => {
      const priority = s.priority || 'medium';
      if (!groupedByPriority[priority]) {
        groupedByPriority[priority] = [];
      }
      groupedByPriority[priority].push(s);
    });
    
    // Calculate rank: number based on priority tier, letter based on position within tier
    let tierNumber = 1;
    let letterIndex = 0;
    
    for (const priority of priorityOrder) {
      const groupStories = groupedByPriority[priority] || [];
      const storyInGroup = groupStories.find(s => s.id === currentStoryId);
      
      if (storyInGroup) {
        // Found the story's priority group
        letterIndex = groupStories.indexOf(storyInGroup);
        break;
      }
      // Move to next tier: add count of stories in this priority group
      tierNumber += groupStories.length;
    }
    
    // Convert to alphanumeric: tier number + letter (A=0, B=1, C=2, etc.)
    const letter = String.fromCharCode(65 + letterIndex); // A, B, C, etc.
    return `${tierNumber}${letter}`;
  };

  it('should assign 1A to first urgent story', () => {
    const stories = [
      { id: 'story-1', priority: 'urgent' }
    ];
    
    expect(calculateRank(stories, 'story-1')).toBe('1A');
  });

  it('should assign 1A and 1B to two urgent stories', () => {
    const stories = [
      { id: 'story-1', priority: 'urgent' },
      { id: 'story-2', priority: 'urgent' }
    ];
    
    expect(calculateRank(stories, 'story-1')).toBe('1A');
    expect(calculateRank(stories, 'story-2')).toBe('1B');
  });

  it('should assign correct ranks for mixed priorities', () => {
    const stories = [
      { id: 'story-1', priority: 'urgent' },
      { id: 'story-2', priority: 'urgent' },
      { id: 'story-3', priority: 'high' },
      { id: 'story-4', priority: 'high' },
      { id: 'story-5', priority: 'medium' }
    ];
    
    // Urgent stories: 1A, 1B
    expect(calculateRank(stories, 'story-1')).toBe('1A');
    expect(calculateRank(stories, 'story-2')).toBe('1B');
    
    // High stories: tier 3 (1 + 2 urgent stories), so 3A, 3B
    expect(calculateRank(stories, 'story-3')).toBe('3A');
    expect(calculateRank(stories, 'story-4')).toBe('3B');
    
    // Medium story: tier 5 (1 + 2 urgent + 2 high), so 5A
    expect(calculateRank(stories, 'story-5')).toBe('5A');
  });

  it('should handle all priority levels', () => {
    const stories = [
      { id: 'urgent-1', priority: 'urgent' },
      { id: 'high-1', priority: 'high' },
      { id: 'medium-1', priority: 'medium' },
      { id: 'low-1', priority: 'low' }
    ];
    
    expect(calculateRank(stories, 'urgent-1')).toBe('1A');
    expect(calculateRank(stories, 'high-1')).toBe('2A');
    expect(calculateRank(stories, 'medium-1')).toBe('3A');
    expect(calculateRank(stories, 'low-1')).toBe('4A');
  });

  it('should handle multiple stories in same priority with correct letters', () => {
    const stories = [
      { id: 'story-1', priority: 'high' },
      { id: 'story-2', priority: 'high' },
      { id: 'story-3', priority: 'high' },
      { id: 'story-4', priority: 'high' }
    ];
    
    expect(calculateRank(stories, 'story-1')).toBe('1A');
    expect(calculateRank(stories, 'story-2')).toBe('1B');
    expect(calculateRank(stories, 'story-3')).toBe('1C');
    expect(calculateRank(stories, 'story-4')).toBe('1D');
  });

  it('should handle missing priority (defaults to medium)', () => {
    const stories = [
      { id: 'story-1' }, // No priority
      { id: 'story-2', priority: 'medium' }
    ];
    
    // Both should be in medium group, so 1A and 1B
    expect(calculateRank(stories, 'story-1')).toBe('1A');
    expect(calculateRank(stories, 'story-2')).toBe('1B');
  });
});

