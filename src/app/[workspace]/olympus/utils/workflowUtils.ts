import { 
  CircleStackIcon, 
  ArrowPathRoundedSquareIcon, 
  BoltIcon 
} from "@heroicons/react/24/outline";
import { WorkflowStep, WorkflowCategory, WorkflowItem } from '../types';

export const getTypeIcon = (stepId: string) => {
  if (stepId.startsWith('data-')) return CircleStackIcon;
  if (stepId.startsWith('condition') || stepId.startsWith('switch') || stepId.startsWith('loop') || stepId.startsWith('parallel')) return ArrowPathRoundedSquareIcon;
  if (stepId.startsWith('http-request') || stepId.startsWith('webhook') || stepId.startsWith('delay') || stepId.startsWith('schedule')) return BoltIcon;
  return CircleStackIcon; // Default for existing CFO/CRO pipeline steps
};

export const workflowCategories: WorkflowCategory[] = [
  {
    category: 'Data Processing',
    color: 'blue',
    items: [
      { id: 'data-source', title: 'Data Source', description: 'Connect to database or API' },
      { id: 'data-transform', title: 'Transform', description: 'Modify data structure' },
      { id: 'data-filter', title: 'Filter', description: 'Apply conditions to data' },
      { id: 'data-aggregate', title: 'Aggregate', description: 'Group and summarize data' }
    ]
  },
  {
    category: 'Flow Control',
    color: 'purple',
    items: [
      { id: 'condition', title: 'Condition', description: 'If/else branching logic' },
      { id: 'switch', title: 'Switch', description: 'Multiple condition branches' },
      { id: 'loop', title: 'Loop', description: 'Repeat for each item' },
      { id: 'parallel', title: 'Parallel', description: 'Run multiple paths' }
    ]
  },
  {
    category: 'External Actions',
    color: 'green',
    items: [
      { id: 'http-request', title: 'API Call', description: 'Send HTTP request' },
      { id: 'webhook', title: 'Webhook', description: 'Trigger external service' },
      { id: 'delay', title: 'Wait', description: 'Pause execution' },
      { id: 'schedule', title: 'Schedule', description: 'Run at specific time' }
    ]
  }
];

export const generateWorkflowFromAI = (description: string): WorkflowStep[] => {
  const steps: WorkflowStep[] = [];
  const baseY = 100;
  const stepHeight = 120;
  
  // Parse common workflow patterns
  if (description.toLowerCase().includes('email') || description.toLowerCase().includes('send email')) {
    steps.push({
      id: `email-${Date.now()}`,
      title: 'Send Email',
      description: 'Send automated email',
      position: { x: 300, y: baseY + (steps.length * stepHeight) },
      isActive: false
    });
  }
  
  if (description.toLowerCase().includes('data') || description.toLowerCase().includes('fetch')) {
    steps.push({
      id: `data-${Date.now()}`,
      title: 'Fetch Data',
      description: 'Retrieve data from source',
      position: { x: 300, y: baseY + (steps.length * stepHeight) },
      isActive: false
    });
  }
  
  if (description.toLowerCase().includes('process') || description.toLowerCase().includes('transform')) {
    steps.push({
      id: `process-${Date.now()}`,
      title: 'Process Data',
      description: 'Transform and process information',
      position: { x: 300, y: baseY + (steps.length * stepHeight) },
      isActive: false
    });
  }
  
  if (description.toLowerCase().includes('save') || description.toLowerCase().includes('store')) {
    steps.push({
      id: `save-${Date.now()}`,
      title: 'Save Results',
      description: 'Store processed data',
      position: { x: 300, y: baseY + (steps.length * stepHeight) },
      isActive: false
    });
  }
  
  return steps;
};
