/**
 * Daily 100 Preset Templates
 * 
 * Provides predefined daily action lists for sales professionals.
 * Each preset contains 5 items optimized for specific sales goals.
 */

export type PresetTemplateId = 
  | 'elite-seller'
  | 'pipeline-builder'
  | 'relationship-builder'
  | 'growth-mindset'
  | 'balanced'
  | 'custom-only';

export interface PresetItem {
  id: string;
  text: string;
}

export interface PresetTemplate {
  id: PresetTemplateId;
  name: string;
  description: string;
  items: PresetItem[];
}

/**
 * Elite Seller - Default preset focused on deal execution
 */
const eliteSellerPreset: PresetTemplate = {
  id: 'elite-seller',
  name: 'Elite Seller',
  description: 'Focus on closing deals and hitting your number',
  items: [
    { id: 'elite-1', text: 'Review daily plan & prioritize top 3 deals' },
    { id: 'elite-2', text: 'Make 20 outbound touches (calls/emails/LinkedIn)' },
    { id: 'elite-3', text: 'Review pipeline & update next steps' },
    { id: 'elite-4', text: 'Read 15 min sales content or practice pitch' },
    { id: 'elite-5', text: 'Check in with 1 existing client' }
  ]
};

/**
 * Pipeline Builder - Focused on prospecting and pipeline growth
 */
const pipelineBuilderPreset: PresetTemplate = {
  id: 'pipeline-builder',
  name: 'Pipeline Builder',
  description: 'Build and expand your pipeline with consistent prospecting',
  items: [
    { id: 'pipeline-1', text: 'Build 10 new prospect profiles' },
    { id: 'pipeline-2', text: 'Make 30 outbound touches' },
    { id: 'pipeline-3', text: 'Research 5 target companies' },
    { id: 'pipeline-4', text: 'Send 5 personalized outreach messages' },
    { id: 'pipeline-5', text: 'Update CRM with all activity' }
  ]
};

/**
 * Relationship Builder - Focused on nurturing existing relationships
 */
const relationshipBuilderPreset: PresetTemplate = {
  id: 'relationship-builder',
  name: 'Relationship Builder',
  description: 'Deepen relationships with existing clients and key accounts',
  items: [
    { id: 'relationship-1', text: 'Deep dive on 2 key accounts' },
    { id: 'relationship-2', text: 'Send 3 value-add insights to clients' },
    { id: 'relationship-3', text: 'Schedule 2 follow-up calls' },
    { id: 'relationship-4', text: 'Review client satisfaction scores' },
    { id: 'relationship-5', text: 'Map decision makers for top 5 deals' }
  ]
};

/**
 * Growth Mindset - Focused on learning and skill development
 */
const growthMindsetPreset: PresetTemplate = {
  id: 'growth-mindset',
  name: 'Growth Mindset',
  description: 'Continuous learning and skill development',
  items: [
    { id: 'growth-1', text: 'Read/watch 20 min sales training' },
    { id: 'growth-2', text: 'Practice objection handling (5 scenarios)' },
    { id: 'growth-3', text: 'Review lost deals & learnings' },
    { id: 'growth-4', text: 'Study competitor positioning' },
    { id: 'growth-5', text: 'Update personal sales playbook' }
  ]
};

/**
 * Balanced - Mix of prospecting, relationship building, and learning
 */
const balancedPreset: PresetTemplate = {
  id: 'balanced',
  name: 'Balanced',
  description: 'A balanced approach to all aspects of sales',
  items: [
    { id: 'balanced-1', text: 'Review daily priorities (top 3)' },
    { id: 'balanced-2', text: 'Make 15 outbound touches' },
    { id: 'balanced-3', text: 'Update pipeline status' },
    { id: 'balanced-4', text: 'Learn 1 new sales technique' },
    { id: 'balanced-5', text: 'Nurture 1 key relationship' }
  ]
};

/**
 * Custom Only - No preset items, user creates their own
 */
const customOnlyPreset: PresetTemplate = {
  id: 'custom-only',
  name: 'Custom Only',
  description: 'Create your own daily checklist items',
  items: []
};

/**
 * All available preset templates
 */
export const PRESET_TEMPLATES: PresetTemplate[] = [
  eliteSellerPreset,
  pipelineBuilderPreset,
  relationshipBuilderPreset,
  growthMindsetPreset,
  balancedPreset,
  customOnlyPreset
];

/**
 * Get a preset template by ID
 */
export function getPresetTemplate(id: PresetTemplateId): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find(preset => preset.id === id);
}

/**
 * Get default preset (Elite Seller)
 */
export function getDefaultPreset(): PresetTemplate {
  return eliteSellerPreset;
}

/**
 * Get preset items for a given template ID
 */
export function getPresetItems(presetId: PresetTemplateId): PresetItem[] {
  const preset = getPresetTemplate(presetId);
  return preset ? preset.items : [];
}
