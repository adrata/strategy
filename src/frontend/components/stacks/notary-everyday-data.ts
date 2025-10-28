export interface Story {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'up-next' | 'in-progress' | 'built' | 'qa1' | 'qa2' | 'done';
  epicId: string;
  epochId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  stories: Story[];
  epochId: string;
  assignee: string;
  status: 'up-next' | 'in-progress' | 'built' | 'qa1' | 'qa2' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Epoch {
  id: string;
  title: string; // Video, Cold, Referral, Events, Social
  description: string;
  epics: Epic[];
  workstream: string;
  assignee: string;
  status: 'up-next' | 'in-progress' | 'built' | 'qa1' | 'qa2' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Video Epoch
const videoEpoch: Epoch = {
  id: 'epoch-video',
  title: 'Video',
  description: 'Video content creation and distribution workstream',
  workstream: 'Video',
  assignee: 'Ryan',
  status: 'in-progress',
  priority: 'high',
  dueDate: '2024-03-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  epics: [
    {
      id: 'epic-podcast',
      title: 'Podcast',
      description: 'Podcast content creation and distribution',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2024-02-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-podcast-plan',
          title: 'Plan episodes',
          description: 'Create episode calendar and content planning',
          assignee: 'Ryan',
          status: 'done',
          epicId: 'epic-podcast',
          epochId: 'epoch-video',
          priority: 'high',
          dueDate: '2024-01-10',
          tags: ['planning', 'content'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z'
        },
        {
          id: 'story-podcast-record',
          title: 'Record content',
          description: 'Record podcast episodes with guests',
          assignee: 'Ryan',
          status: 'in-progress',
          epicId: 'epic-podcast',
          epochId: 'epoch-video',
          priority: 'high',
          dueDate: '2024-02-01',
          tags: ['recording', 'content'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-podcast-edit',
          title: 'Edit and publish',
          description: 'Edit recorded content and publish to platforms',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-podcast',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['editing', 'publishing'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-homegrown',
      title: 'Homegrown',
      description: 'Create original video content',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-02-28',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-homegrown-create',
          title: 'Create video content',
          description: 'Produce original video content for marketing',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-homegrown',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['video', 'content'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-homegrown-edit',
          title: 'Edit videos',
          description: 'Edit and polish video content',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-homegrown',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['editing', 'video'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-homegrown-publish',
          title: 'Publish to channels',
          description: 'Distribute videos across all platforms',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-homegrown',
          epochId: 'epoch-video',
          priority: 'low',
          dueDate: '2024-02-28',
          tags: ['publishing', 'distribution'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-commercial',
      title: 'Commercial/Promo',
      description: 'Create commercial and promotional video content',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-commercial-script',
          title: 'Script writing',
          description: 'Write scripts for commercial content',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-commercial',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['scripting', 'commercial'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-commercial-production',
          title: 'Video production',
          description: 'Produce commercial video content',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-commercial',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-03-01',
          tags: ['production', 'commercial'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-commercial-distribution',
          title: 'Distribution',
          description: 'Distribute commercial content to platforms',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-commercial',
          epochId: 'epoch-video',
          priority: 'low',
          dueDate: '2024-03-15',
          tags: ['distribution', 'commercial'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-testimonial',
      title: 'Testimonial',
      description: 'Collect and create customer testimonial videos',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'high',
      dueDate: '2024-02-20',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-testimonial-collect',
          title: 'Collect testimonials',
          description: 'Gather customer testimonials and feedback',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-testimonial',
          epochId: 'epoch-video',
          priority: 'high',
          dueDate: '2024-02-01',
          tags: ['testimonials', 'collection'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-testimonial-edit',
          title: 'Edit footage',
          description: 'Edit testimonial video footage',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-testimonial',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-10',
          tags: ['editing', 'testimonials'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-testimonial-publish',
          title: 'Publish',
          description: 'Publish testimonial videos',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-testimonial',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['publishing', 'testimonials'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-mvp',
      title: 'MVP',
      description: 'Minimum Viable Product for video platform',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'urgent',
      dueDate: '2024-02-10',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-mvp-define',
          title: 'Define MVP features',
          description: 'Define core features for video platform MVP',
          assignee: 'Ryan',
          status: 'in-progress',
          epicId: 'epic-mvp',
          epochId: 'epoch-video',
          priority: 'urgent',
          dueDate: '2024-01-20',
          tags: ['mvp', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-mvp-build',
          title: 'Build MVP',
          description: 'Develop the video platform MVP',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-mvp',
          epochId: 'epoch-video',
          priority: 'urgent',
          dueDate: '2024-02-01',
          tags: ['mvp', 'development'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-mvp-test',
          title: 'Test and iterate',
          description: 'Test MVP and iterate based on feedback',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-mvp',
          epochId: 'epoch-video',
          priority: 'high',
          dueDate: '2024-02-10',
          tags: ['mvp', 'testing'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-demos',
      title: 'Demos',
      description: 'Create product demonstration videos',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-demos-scripts',
          title: 'Create demo scripts',
          description: 'Write scripts for product demonstrations',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-demos',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['demos', 'scripting'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-demos-record',
          title: 'Record demos',
          description: 'Record product demonstration videos',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-demos',
          epochId: 'epoch-video',
          priority: 'medium',
          dueDate: '2024-02-25',
          tags: ['demos', 'recording'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-demos-share',
          title: 'Share with prospects',
          description: 'Distribute demo videos to prospects',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-demos',
          epochId: 'epoch-video',
          priority: 'low',
          dueDate: '2024-03-01',
          tags: ['demos', 'distribution'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-iep-roadmap',
      title: 'IEP Roadmap',
      description: 'Individualized Education Program roadmap',
      epochId: 'epoch-video',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'low',
      dueDate: '2024-03-31',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-iep-define',
          title: 'Define roadmap',
          description: 'Define IEP roadmap and milestones',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-iep-roadmap',
          epochId: 'epoch-video',
          priority: 'low',
          dueDate: '2024-03-01',
          tags: ['iep', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-iep-prioritize',
          title: 'Prioritize features',
          description: 'Prioritize features for IEP implementation',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-iep-roadmap',
          epochId: 'epoch-video',
          priority: 'low',
          dueDate: '2024-03-15',
          tags: ['iep', 'prioritization'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-iep-execute',
          title: 'Execute plan',
          description: 'Execute IEP roadmap implementation',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-iep-roadmap',
          epochId: 'epoch-video',
          priority: 'low',
          dueDate: '2024-03-31',
          tags: ['iep', 'execution'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    }
  ]
};

// Cold Epoch (Work with Dan on cold outreach)
const coldEpoch: Epoch = {
  id: 'epoch-cold',
  title: 'Cold',
  description: 'Cold outreach and lead generation workstream',
  workstream: 'Cold',
  assignee: 'Work with Dan on cold outreach',
  status: 'in-progress',
  priority: 'high',
  dueDate: '2024-02-28',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  epics: [
    {
      id: 'epic-cold-outreach',
      title: 'Cold Outreach',
      description: 'Direct cold outreach campaigns',
      epochId: 'epoch-cold',
      assignee: 'Work with Dan on cold outreach',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2024-02-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-cold-prospect-list',
          title: 'Build prospect list',
          description: 'Build comprehensive prospect list for cold outreach',
          assignee: 'Work with Dan on cold outreach',
          status: 'in-progress',
          epicId: 'epic-cold-outreach',
          epochId: 'epoch-cold',
          priority: 'high',
          dueDate: '2024-01-25',
          tags: ['prospecting', 'cold-outreach'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-cold-templates',
          title: 'Create email templates',
          description: 'Create effective cold email templates',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-cold-outreach',
          epochId: 'epoch-cold',
          priority: 'high',
          dueDate: '2024-02-01',
          tags: ['templates', 'cold-outreach'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-cold-execute',
          title: 'Execute outreach campaign',
          description: 'Execute cold outreach campaign',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-cold-outreach',
          epochId: 'epoch-cold',
          priority: 'high',
          dueDate: '2024-02-15',
          tags: ['execution', 'cold-outreach'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-emails',
      title: 'Emails',
      description: 'Email marketing and sequences',
      epochId: 'epoch-cold',
      assignee: 'Work with Dan on cold outreach',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-02-20',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-emails-copy',
          title: 'Write email copy',
          description: 'Write compelling email copy for campaigns',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-emails',
          epochId: 'epoch-cold',
          priority: 'medium',
          dueDate: '2024-02-05',
          tags: ['copywriting', 'emails'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-emails-sequences',
          title: 'Set up sequences',
          description: 'Set up automated email sequences',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-emails',
          epochId: 'epoch-cold',
          priority: 'medium',
          dueDate: '2024-02-10',
          tags: ['automation', 'emails'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-emails-track',
          title: 'Track responses',
          description: 'Track and analyze email response rates',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-emails',
          epochId: 'epoch-cold',
          priority: 'low',
          dueDate: '2024-02-20',
          tags: ['analytics', 'emails'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-tech-sms',
      title: 'Tech/SMS',
      description: 'SMS and technology-based outreach',
      epochId: 'epoch-cold',
      assignee: 'Work with Dan on cold outreach',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-02-28',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-sms-platform',
          title: 'Set up SMS platform',
          description: 'Set up SMS platform for outreach',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-tech-sms',
          epochId: 'epoch-cold',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['sms', 'platform'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-sms-templates',
          title: 'Create SMS templates',
          description: 'Create SMS message templates',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-tech-sms',
          epochId: 'epoch-cold',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['sms', 'templates'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-sms-launch',
          title: 'Launch SMS campaign',
          description: 'Launch SMS outreach campaign',
          assignee: 'Work with Dan on cold outreach',
          status: 'up-next',
          epicId: 'epic-tech-sms',
          epochId: 'epoch-cold',
          priority: 'low',
          dueDate: '2024-02-28',
          tags: ['sms', 'campaign'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    }
  ]
};

// Referral Epoch
const referralEpoch: Epoch = {
  id: 'epoch-referral',
  title: 'Referral',
  description: 'Referral and relationship building workstream',
  workstream: 'Referral',
  assignee: 'Ryan',
  status: 'up-next',
  priority: 'medium',
  dueDate: '2024-03-15',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  epics: [
    {
      id: 'epic-coffee',
      title: 'Meet for Coffee',
      description: 'Coffee meetings and relationship building',
      epochId: 'epoch-referral',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-02-28',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-coffee-schedule',
          title: 'Schedule meetings',
          description: 'Schedule coffee meetings with prospects',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-coffee',
          epochId: 'epoch-referral',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['meetings', 'scheduling'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-coffee-prepare',
          title: 'Prepare talking points',
          description: 'Prepare talking points for coffee meetings',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-coffee',
          epochId: 'epoch-referral',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['preparation', 'meetings'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-coffee-followup',
          title: 'Follow up',
          description: 'Follow up after coffee meetings',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-coffee',
          epochId: 'epoch-referral',
          priority: 'low',
          dueDate: '2024-02-28',
          tags: ['follow-up', 'meetings'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-sms-drip',
      title: 'SMS Drip Campaign',
      description: 'SMS drip campaign for referrals',
      epochId: 'epoch-referral',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-sms-drip-plan',
          title: 'Plan drip sequence',
          description: 'Plan SMS drip campaign sequence',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-sms-drip',
          epochId: 'epoch-referral',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['sms', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-sms-drip-content',
          title: 'Write SMS content',
          description: 'Write SMS content for drip campaign',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-sms-drip',
          epochId: 'epoch-referral',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['sms', 'content'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-sms-drip-launch',
          title: 'Launch campaign',
          description: 'Launch SMS drip campaign',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-sms-drip',
          epochId: 'epoch-referral',
          priority: 'low',
          dueDate: '2024-03-01',
          tags: ['sms', 'launch'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-email-drip',
      title: 'Email Drip',
      description: 'Email drip campaign for referrals',
      epochId: 'epoch-referral',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-05',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-email-drip-design',
          title: 'Design email flow',
          description: 'Design email drip campaign flow',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-email-drip',
          epochId: 'epoch-referral',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['email', 'design'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-email-drip-content',
          title: 'Write email content',
          description: 'Write email content for drip campaign',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-email-drip',
          epochId: 'epoch-referral',
          priority: 'medium',
          dueDate: '2024-02-25',
          tags: ['email', 'content'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-email-drip-automation',
          title: 'Set up automation',
          description: 'Set up email automation system',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-email-drip',
          epochId: 'epoch-referral',
          priority: 'low',
          dueDate: '2024-03-05',
          tags: ['email', 'automation'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-leisure',
      title: 'Leisure',
      description: 'Leisure activities for relationship building',
      epochId: 'epoch-referral',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'low',
      dueDate: '2024-03-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-leisure-plan',
          title: 'Plan leisure activities',
          description: 'Plan leisure activities for prospects',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-leisure',
          epochId: 'epoch-referral',
          priority: 'low',
          dueDate: '2024-03-01',
          tags: ['leisure', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-leisure-invite',
          title: 'Invite prospects',
          description: 'Invite prospects to leisure activities',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-leisure',
          epochId: 'epoch-referral',
          priority: 'low',
          dueDate: '2024-03-08',
          tags: ['leisure', 'invitations'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-leisure-followup',
          title: 'Follow up',
          description: 'Follow up after leisure activities',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-leisure',
          epochId: 'epoch-referral',
          priority: 'low',
          dueDate: '2024-03-15',
          tags: ['leisure', 'follow-up'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    }
  ]
};

// Events Epoch
const eventsEpoch: Epoch = {
  id: 'epoch-events',
  title: 'Events',
  description: 'Events and networking workstream',
  workstream: 'Events',
  assignee: 'Ryan',
  status: 'up-next',
  priority: 'medium',
  dueDate: '2024-03-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  epics: [
    {
      id: 'epic-dealer-demo',
      title: 'Powered by (Dealer Demo)',
      description: 'Dealer demonstration events',
      epochId: 'epoch-events',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'high',
      dueDate: '2024-02-20',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-demo-plan',
          title: 'Plan event',
          description: 'Plan dealer demonstration event',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-dealer-demo',
          epochId: 'epoch-events',
          priority: 'high',
          dueDate: '2024-02-01',
          tags: ['events', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-demo-invite',
          title: 'Invite attendees',
          description: 'Invite attendees to dealer demo',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-dealer-demo',
          epochId: 'epoch-events',
          priority: 'high',
          dueDate: '2024-02-10',
          tags: ['events', 'invitations'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-demo-execute',
          title: 'Execute event',
          description: 'Execute dealer demonstration event',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-dealer-demo',
          epochId: 'epoch-events',
          priority: 'high',
          dueDate: '2024-02-15',
          tags: ['events', 'execution'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-demo-followup',
          title: 'Follow up',
          description: 'Follow up after dealer demo',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-dealer-demo',
          epochId: 'epoch-events',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['events', 'follow-up'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-industry-events',
      title: 'Industry Events',
      description: 'Industry events and conferences',
      epochId: 'epoch-events',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-industry-research',
          title: 'Research events',
          description: 'Research relevant industry events',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-industry-events',
          epochId: 'epoch-events',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['research', 'events'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-industry-register',
          title: 'Register/sponsor',
          description: 'Register for or sponsor industry events',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-industry-events',
          epochId: 'epoch-events',
          priority: 'medium',
          dueDate: '2024-02-28',
          tags: ['registration', 'sponsorship'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-industry-attend',
          title: 'Attend and network',
          description: 'Attend events and network with attendees',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-industry-events',
          epochId: 'epoch-events',
          priority: 'medium',
          dueDate: '2024-03-15',
          tags: ['attendance', 'networking'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-national-event',
      title: 'National Event (Lexington Title)',
      description: 'National event with Lexington Title',
      epochId: 'epoch-events',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'high',
      dueDate: '2024-03-31',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-national-plan',
          title: 'Plan national event',
          description: 'Plan national event with Lexington Title',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-national-event',
          epochId: 'epoch-events',
          priority: 'high',
          dueDate: '2024-03-01',
          tags: ['national', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-national-coordinate',
          title: 'Coordinate logistics',
          description: 'Coordinate logistics for national event',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-national-event',
          epochId: 'epoch-events',
          priority: 'high',
          dueDate: '2024-03-15',
          tags: ['coordination', 'logistics'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-national-execute',
          title: 'Execute event',
          description: 'Execute national event',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-national-event',
          epochId: 'epoch-events',
          priority: 'high',
          dueDate: '2024-03-31',
          tags: ['execution', 'national'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    }
  ]
};

// Social Epoch
const socialEpoch: Epoch = {
  id: 'epoch-social',
  title: 'Social',
  description: 'Social media and content marketing workstream',
  workstream: 'Social',
  assignee: 'Ryan',
  status: 'up-next',
  priority: 'medium',
  dueDate: '2024-03-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  epics: [
    {
      id: 'epic-social-podcast',
      title: 'Podcast',
      description: 'Social media podcast content',
      epochId: 'epoch-social',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-02-28',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-social-podcast-plan',
          title: 'Plan episodes',
          description: 'Plan social media podcast episodes',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-social-podcast',
          epochId: 'epoch-social',
          priority: 'medium',
          dueDate: '2024-02-01',
          tags: ['podcast', 'planning'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-social-podcast-record',
          title: 'Record',
          description: 'Record social media podcast content',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-social-podcast',
          epochId: 'epoch-social',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['podcast', 'recording'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-social-podcast-promote',
          title: 'Promote',
          description: 'Promote podcast on social media',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-social-podcast',
          epochId: 'epoch-social',
          priority: 'low',
          dueDate: '2024-02-28',
          tags: ['podcast', 'promotion'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-reports',
      title: 'Reports',
      description: 'Social media reports and analytics',
      epochId: 'epoch-social',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-reports-templates',
          title: 'Create report templates',
          description: 'Create social media report templates',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-reports',
          epochId: 'epoch-social',
          priority: 'medium',
          dueDate: '2024-02-20',
          tags: ['reports', 'templates'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-reports-generate',
          title: 'Generate reports',
          description: 'Generate social media reports',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-reports',
          epochId: 'epoch-social',
          priority: 'medium',
          dueDate: '2024-03-01',
          tags: ['reports', 'generation'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-reports-share',
          title: 'Share insights',
          description: 'Share report insights with team',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-reports',
          epochId: 'epoch-social',
          priority: 'low',
          dueDate: '2024-03-15',
          tags: ['reports', 'sharing'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-social-comp',
      title: 'Social Comp (LinkedIn, Instagram, TikTok)',
      description: 'Social media content creation and management',
      epochId: 'epoch-social',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'medium',
      dueDate: '2024-03-20',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-social-content-calendar',
          title: 'Create content calendar',
          description: 'Create social media content calendar',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-social-comp',
          epochId: 'epoch-social',
          priority: 'medium',
          dueDate: '2024-02-15',
          tags: ['content', 'calendar'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-social-design-posts',
          title: 'Design posts',
          description: 'Design social media posts',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-social-comp',
          epochId: 'epoch-social',
          priority: 'medium',
          dueDate: '2024-03-01',
          tags: ['design', 'posts'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-social-schedule-publish',
          title: 'Schedule and publish',
          description: 'Schedule and publish social media content',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-social-comp',
          epochId: 'epoch-social',
          priority: 'low',
          dueDate: '2024-03-20',
          tags: ['scheduling', 'publishing'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    },
    {
      id: 'epic-sentence-builder',
      title: 'Sentence Builder',
      description: 'Sentence builder tool for content creation',
      epochId: 'epoch-social',
      assignee: 'Ryan',
      status: 'up-next',
      priority: 'low',
      dueDate: '2024-03-31',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      stories: [
        {
          id: 'story-sentence-templates',
          title: 'Build sentence templates',
          description: 'Build sentence templates for content',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-sentence-builder',
          epochId: 'epoch-social',
          priority: 'low',
          dueDate: '2024-03-01',
          tags: ['templates', 'sentences'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-sentence-test',
          title: 'Test with users',
          description: 'Test sentence builder with users',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-sentence-builder',
          epochId: 'epoch-social',
          priority: 'low',
          dueDate: '2024-03-15',
          tags: ['testing', 'users'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'story-sentence-refine',
          title: 'Refine',
          description: 'Refine sentence builder based on feedback',
          assignee: 'Ryan',
          status: 'up-next',
          epicId: 'epic-sentence-builder',
          epochId: 'epoch-social',
          priority: 'low',
          dueDate: '2024-03-31',
          tags: ['refinement', 'feedback'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]
    }
  ]
};

// Export all epochs
export const NOTARY_EVERYDAY_EPOCHS: Epoch[] = [
  videoEpoch,
  coldEpoch,
  referralEpoch,
  eventsEpoch,
  socialEpoch
];

// Helper function to get all stories from all epochs
export const getAllStories = (): Story[] => {
  return NOTARY_EVERYDAY_EPOCHS.flatMap(epoch => 
    epoch.epics.flatMap(epic => epic.stories)
  );
};

// Helper function to get all epics from all epochs
export const getAllEpics = (): Epic[] => {
  return NOTARY_EVERYDAY_EPOCHS.flatMap(epoch => epoch.epics);
};
