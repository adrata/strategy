import { IntegrationCategory, IntegrationProvider } from '../types/integration';
import {
  CircleStackIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  LifebuoyIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

/**
 * Integration categories with popular providers
 * These map to Nango's 500+ API integrations
 */
export const integrationCategories: IntegrationCategory[] = [
  {
    category: 'CRM',
    color: 'blue',
    providers: [
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'World\'s #1 CRM platform',
        category: 'CRM',
        authType: 'oauth2',
        isConnected: false,
        operations: [
          {
            id: 'create_contact',
            name: 'Create Contact',
            description: 'Create a new contact in Salesforce',
            type: 'action',
            inputs: [
              { name: 'firstName', type: 'string', required: true },
              { name: 'lastName', type: 'string', required: true },
              { name: 'email', type: 'string', required: true },
              { name: 'phone', type: 'string', required: false },
            ],
            outputs: [
              { name: 'id', type: 'string', required: true },
              { name: 'success', type: 'boolean', required: true },
            ],
          },
          {
            id: 'update_contact',
            name: 'Update Contact',
            description: 'Update an existing contact',
            type: 'action',
            inputs: [
              { name: 'contactId', type: 'string', required: true },
              { name: 'fields', type: 'object', required: true },
            ],
            outputs: [
              { name: 'success', type: 'boolean', required: true },
            ],
          },
        ],
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Inbound marketing, sales, and service platform',
        category: 'CRM',
        authType: 'oauth2',
        isConnected: false,
        operations: [
          {
            id: 'create_contact',
            name: 'Create Contact',
            description: 'Create a new contact in HubSpot',
            type: 'action',
            inputs: [
              { name: 'email', type: 'string', required: true },
              { name: 'firstName', type: 'string', required: false },
              { name: 'lastName', type: 'string', required: false },
            ],
            outputs: [
              { name: 'id', type: 'string', required: true },
            ],
          },
        ],
      },
      {
        id: 'pipedrive',
        name: 'Pipedrive',
        description: 'Sales CRM and pipeline management',
        category: 'CRM',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
    ],
  },
  {
    category: 'Communication',
    color: 'purple',
    providers: [
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team communication platform',
        category: 'Communication',
        authType: 'oauth2',
        isConnected: false,
        operations: [
          {
            id: 'send_message',
            name: 'Send Message',
            description: 'Send a message to a Slack channel',
            type: 'action',
            inputs: [
              { name: 'channel', type: 'string', required: true },
              { name: 'text', type: 'string', required: true },
            ],
            outputs: [
              { name: 'ts', type: 'string', required: true },
              { name: 'success', type: 'boolean', required: true },
            ],
          },
        ],
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Collaboration and communication platform',
        category: 'Communication',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Voice, video, and text communication',
        category: 'Communication',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Video conferencing and meeting recordings',
        category: 'Communication',
        authType: 'oauth2',
        isConnected: false,
        operations: [
          {
            id: 'create_meeting',
            name: 'Create Meeting',
            description: 'Schedule a new Zoom meeting',
            type: 'action',
            inputs: [
              { name: 'topic', type: 'string', required: true, description: 'Meeting topic/title' },
              { name: 'start_time', type: 'string', required: true, description: 'Meeting start time (ISO 8601)' },
              { name: 'duration', type: 'number', required: true, description: 'Meeting duration in minutes' },
              { name: 'type', type: 'number', required: false, description: 'Meeting type (1=instant, 2=scheduled, 3=recurring)', default: 2 },
              { name: 'password', type: 'string', required: false, description: 'Meeting password' },
              { name: 'agenda', type: 'string', required: false, description: 'Meeting agenda' },
            ],
            outputs: [
              { name: 'meetingId', type: 'string', required: true },
              { name: 'joinUrl', type: 'string', required: true },
              { name: 'startUrl', type: 'string', required: true },
            ],
          },
          {
            id: 'list_meetings',
            name: 'List Meetings',
            description: 'Get user\'s meetings',
            type: 'action',
            inputs: [
              { name: 'type', type: 'string', required: false, description: 'Meeting type filter', default: 'scheduled' },
              { name: 'page_size', type: 'number', required: false, description: 'Number of meetings per page', default: 30 },
            ],
            outputs: [
              { name: 'meetings', type: 'array', required: true },
              { name: 'totalRecords', type: 'number', required: true },
            ],
          },
          {
            id: 'get_meeting',
            name: 'Get Meeting',
            description: 'Get meeting details by ID',
            type: 'action',
            inputs: [
              { name: 'meetingId', type: 'string', required: true, description: 'Zoom meeting ID' },
            ],
            outputs: [
              { name: 'meeting', type: 'object', required: true },
              { name: 'joinUrl', type: 'string', required: true },
            ],
          },
          {
            id: 'update_meeting',
            name: 'Update Meeting',
            description: 'Update meeting settings',
            type: 'action',
            inputs: [
              { name: 'meetingId', type: 'string', required: true, description: 'Zoom meeting ID' },
              { name: 'topic', type: 'string', required: false, description: 'Meeting topic/title' },
              { name: 'start_time', type: 'string', required: false, description: 'Meeting start time (ISO 8601)' },
              { name: 'duration', type: 'number', required: false, description: 'Meeting duration in minutes' },
              { name: 'password', type: 'string', required: false, description: 'Meeting password' },
              { name: 'agenda', type: 'string', required: false, description: 'Meeting agenda' },
            ],
            outputs: [
              { name: 'meetingId', type: 'string', required: true },
              { name: 'updated', type: 'boolean', required: true },
            ],
          },
          {
            id: 'delete_meeting',
            name: 'Delete Meeting',
            description: 'Cancel/delete a meeting',
            type: 'action',
            inputs: [
              { name: 'meetingId', type: 'string', required: true, description: 'Zoom meeting ID' },
              { name: 'scheduleForReminder', type: 'boolean', required: false, description: 'Send cancellation email', default: true },
            ],
            outputs: [
              { name: 'meetingId', type: 'string', required: true },
              { name: 'deleted', type: 'boolean', required: true },
            ],
          },
          {
            id: 'get_recording',
            name: 'Get Recording',
            description: 'Get meeting recording details',
            type: 'action',
            inputs: [
              { name: 'meetingId', type: 'string', required: true, description: 'Zoom meeting ID' },
            ],
            outputs: [
              { name: 'recording', type: 'object', required: true },
              { name: 'downloadUrl', type: 'string', required: false },
            ],
          },
          {
            id: 'list_recordings',
            name: 'List Recordings',
            description: 'Get all meeting recordings',
            type: 'action',
            inputs: [
              { name: 'from', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)' },
              { name: 'to', type: 'string', required: false, description: 'End date (YYYY-MM-DD)' },
              { name: 'page_size', type: 'number', required: false, description: 'Number of recordings per page', default: 30 },
            ],
            outputs: [
              { name: 'recordings', type: 'array', required: true },
              { name: 'totalRecords', type: 'number', required: true },
            ],
          },
          {
            id: 'download_recording',
            name: 'Download Recording',
            description: 'Download meeting recording file',
            type: 'action',
            inputs: [
              { name: 'meetingId', type: 'string', required: true, description: 'Zoom meeting ID' },
              { name: 'recordingId', type: 'string', required: true, description: 'Recording ID' },
            ],
            outputs: [
              { name: 'downloadUrl', type: 'string', required: true },
              { name: 'fileSize', type: 'number', required: true },
              { name: 'fileName', type: 'string', required: true },
            ],
          },
        ],
      },
    ],
  },
  {
    category: 'Marketing',
    color: 'pink',
    providers: [
      {
        id: 'mailchimp',
        name: 'Mailchimp',
        description: 'Email marketing platform',
        category: 'Marketing',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Email delivery service',
        category: 'Marketing',
        authType: 'api_key',
        isConnected: false,
        operations: [],
      },
    ],
  },
  {
    category: 'Productivity',
    color: 'green',
    providers: [
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        description: 'Gmail, Calendar, Drive, and more',
        category: 'Productivity',
        authType: 'oauth2',
        isConnected: false,
        operations: [
          {
            id: 'send_email',
            name: 'Send Email',
            description: 'Send an email via Gmail',
            type: 'action',
            inputs: [
              { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
              { name: 'subject', type: 'string', required: true, description: 'Email subject' },
              { name: 'body', type: 'string', required: true, description: 'Email body content' },
              { name: 'cc', type: 'string', required: false, description: 'CC recipients' },
              { name: 'bcc', type: 'string', required: false, description: 'BCC recipients' },
            ],
            outputs: [
              { name: 'messageId', type: 'string', required: true },
              { name: 'threadId', type: 'string', required: true },
              { name: 'success', type: 'boolean', required: true },
            ],
          },
          {
            id: 'read_emails',
            name: 'Read Emails',
            description: 'Fetch emails from Gmail inbox',
            type: 'action',
            inputs: [
              { name: 'maxResults', type: 'number', required: false, description: 'Maximum number of emails to fetch', default: 10 },
              { name: 'query', type: 'string', required: false, description: 'Gmail search query' },
              { name: 'labelIds', type: 'array', required: false, description: 'Label IDs to filter by' },
            ],
            outputs: [
              { name: 'messages', type: 'array', required: true },
              { name: 'totalCount', type: 'number', required: true },
            ],
          },
          {
            id: 'search_emails',
            name: 'Search Emails',
            description: 'Search emails using Gmail search syntax',
            type: 'action',
            inputs: [
              { name: 'query', type: 'string', required: true, description: 'Gmail search query' },
              { name: 'maxResults', type: 'number', required: false, description: 'Maximum results', default: 10 },
            ],
            outputs: [
              { name: 'messages', type: 'array', required: true },
              { name: 'totalCount', type: 'number', required: true },
            ],
          },
          {
            id: 'get_email',
            name: 'Get Email',
            description: 'Get a specific email by ID',
            type: 'action',
            inputs: [
              { name: 'messageId', type: 'string', required: true, description: 'Gmail message ID' },
            ],
            outputs: [
              { name: 'message', type: 'object', required: true },
              { name: 'threadId', type: 'string', required: true },
            ],
          },
          {
            id: 'create_draft',
            name: 'Create Draft',
            description: 'Create an email draft',
            type: 'action',
            inputs: [
              { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
              { name: 'subject', type: 'string', required: true, description: 'Email subject' },
              { name: 'body', type: 'string', required: true, description: 'Email body content' },
            ],
            outputs: [
              { name: 'draftId', type: 'string', required: true },
              { name: 'messageId', type: 'string', required: true },
            ],
          },
          {
            id: 'create_calendar_event',
            name: 'Create Calendar Event',
            description: 'Create a new calendar event',
            type: 'action',
            inputs: [
              { name: 'summary', type: 'string', required: true, description: 'Event title' },
              { name: 'start', type: 'object', required: true, description: 'Event start time' },
              { name: 'end', type: 'object', required: true, description: 'Event end time' },
              { name: 'description', type: 'string', required: false, description: 'Event description' },
              { name: 'attendees', type: 'array', required: false, description: 'Event attendees' },
            ],
            outputs: [
              { name: 'eventId', type: 'string', required: true },
              { name: 'htmlLink', type: 'string', required: true },
            ],
          },
          {
            id: 'list_calendar_events',
            name: 'List Calendar Events',
            description: 'Get calendar events',
            type: 'action',
            inputs: [
              { name: 'timeMin', type: 'string', required: false, description: 'Start time (ISO 8601)' },
              { name: 'timeMax', type: 'string', required: false, description: 'End time (ISO 8601)' },
              { name: 'maxResults', type: 'number', required: false, description: 'Maximum results', default: 10 },
            ],
            outputs: [
              { name: 'events', type: 'array', required: true },
              { name: 'totalCount', type: 'number', required: true },
            ],
          },
          {
            id: 'update_calendar_event',
            name: 'Update Calendar Event',
            description: 'Update an existing calendar event',
            type: 'action',
            inputs: [
              { name: 'eventId', type: 'string', required: true, description: 'Calendar event ID' },
              { name: 'summary', type: 'string', required: false, description: 'Event title' },
              { name: 'start', type: 'object', required: false, description: 'Event start time' },
              { name: 'end', type: 'object', required: false, description: 'Event end time' },
              { name: 'description', type: 'string', required: false, description: 'Event description' },
            ],
            outputs: [
              { name: 'eventId', type: 'string', required: true },
              { name: 'updated', type: 'boolean', required: true },
            ],
          },
        ],
      },
      {
        id: 'microsoft-outlook',
        name: 'Microsoft Outlook',
        description: 'Email and calendar via Microsoft Graph',
        category: 'Productivity',
        authType: 'oauth2',
        isConnected: false,
        operations: [
          {
            id: 'send_email',
            name: 'Send Email',
            description: 'Send an email via Outlook',
            type: 'action',
            inputs: [
              { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
              { name: 'subject', type: 'string', required: true, description: 'Email subject' },
              { name: 'body', type: 'string', required: true, description: 'Email body content' },
              { name: 'cc', type: 'string', required: false, description: 'CC recipients' },
              { name: 'bcc', type: 'string', required: false, description: 'BCC recipients' },
            ],
            outputs: [
              { name: 'messageId', type: 'string', required: true },
              { name: 'success', type: 'boolean', required: true },
            ],
          },
          {
            id: 'read_emails',
            name: 'Read Emails',
            description: 'Fetch emails from Outlook inbox',
            type: 'action',
            inputs: [
              { name: 'top', type: 'number', required: false, description: 'Maximum number of emails to fetch', default: 10 },
              { name: 'filter', type: 'string', required: false, description: 'OData filter query' },
              { name: 'folder', type: 'string', required: false, description: 'Folder to read from', default: 'inbox' },
            ],
            outputs: [
              { name: 'messages', type: 'array', required: true },
              { name: 'totalCount', type: 'number', required: true },
            ],
          },
          {
            id: 'search_emails',
            name: 'Search Emails',
            description: 'Search emails using Microsoft Graph search',
            type: 'action',
            inputs: [
              { name: 'query', type: 'string', required: true, description: 'Search query' },
              { name: 'top', type: 'number', required: false, description: 'Maximum results', default: 10 },
            ],
            outputs: [
              { name: 'messages', type: 'array', required: true },
              { name: 'totalCount', type: 'number', required: true },
            ],
          },
          {
            id: 'get_email',
            name: 'Get Email',
            description: 'Get a specific email by ID',
            type: 'action',
            inputs: [
              { name: 'messageId', type: 'string', required: true, description: 'Outlook message ID' },
            ],
            outputs: [
              { name: 'message', type: 'object', required: true },
              { name: 'conversationId', type: 'string', required: true },
            ],
          },
          {
            id: 'create_draft',
            name: 'Create Draft',
            description: 'Create an email draft',
            type: 'action',
            inputs: [
              { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
              { name: 'subject', type: 'string', required: true, description: 'Email subject' },
              { name: 'body', type: 'string', required: true, description: 'Email body content' },
            ],
            outputs: [
              { name: 'draftId', type: 'string', required: true },
              { name: 'messageId', type: 'string', required: true },
            ],
          },
          {
            id: 'create_calendar_event',
            name: 'Create Calendar Event',
            description: 'Create a new calendar event',
            type: 'action',
            inputs: [
              { name: 'subject', type: 'string', required: true, description: 'Event title' },
              { name: 'start', type: 'object', required: true, description: 'Event start time' },
              { name: 'end', type: 'object', required: true, description: 'Event end time' },
              { name: 'body', type: 'string', required: false, description: 'Event description' },
              { name: 'attendees', type: 'array', required: false, description: 'Event attendees' },
            ],
            outputs: [
              { name: 'eventId', type: 'string', required: true },
              { name: 'webLink', type: 'string', required: true },
            ],
          },
          {
            id: 'list_calendar_events',
            name: 'List Calendar Events',
            description: 'Get calendar events',
            type: 'action',
            inputs: [
              { name: 'startDateTime', type: 'string', required: false, description: 'Start time (ISO 8601)' },
              { name: 'endDateTime', type: 'string', required: false, description: 'End time (ISO 8601)' },
              { name: 'top', type: 'number', required: false, description: 'Maximum results', default: 10 },
            ],
            outputs: [
              { name: 'events', type: 'array', required: true },
              { name: 'totalCount', type: 'number', required: true },
            ],
          },
          {
            id: 'update_calendar_event',
            name: 'Update Calendar Event',
            description: 'Update an existing calendar event',
            type: 'action',
            inputs: [
              { name: 'eventId', type: 'string', required: true, description: 'Calendar event ID' },
              { name: 'subject', type: 'string', required: false, description: 'Event title' },
              { name: 'start', type: 'object', required: false, description: 'Event start time' },
              { name: 'end', type: 'object', required: false, description: 'Event end time' },
              { name: 'body', type: 'string', required: false, description: 'Event description' },
            ],
            outputs: [
              { name: 'eventId', type: 'string', required: true },
              { name: 'updated', type: 'boolean', required: true },
            ],
          },
        ],
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'All-in-one workspace',
        category: 'Productivity',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'asana',
        name: 'Asana',
        description: 'Work management platform',
        category: 'Productivity',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
    ],
  },
  {
    category: 'Finance',
    color: 'yellow',
    providers: [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Payment processing platform',
        category: 'Finance',
        authType: 'api_key',
        isConnected: false,
        operations: [],
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Accounting software',
        category: 'Finance',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
    ],
  },
  {
    category: 'E-commerce',
    color: 'orange',
    providers: [
      {
        id: 'shopify',
        name: 'Shopify',
        description: 'E-commerce platform',
        category: 'E-commerce',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        description: 'WordPress e-commerce plugin',
        category: 'E-commerce',
        authType: 'api_key',
        isConnected: false,
        operations: [],
      },
    ],
  },
  {
    category: 'Support',
    color: 'red',
    providers: [
      {
        id: 'zendesk',
        name: 'Zendesk',
        description: 'Customer service platform',
        category: 'Support',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'intercom',
        name: 'Intercom',
        description: 'Customer messaging platform',
        category: 'Support',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
    ],
  },
  {
    category: 'Analytics',
    color: 'indigo',
    providers: [
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        description: 'Web analytics service',
        category: 'Analytics',
        authType: 'oauth2',
        isConnected: false,
        operations: [],
      },
      {
        id: 'mixpanel',
        name: 'Mixpanel',
        description: 'Product analytics platform',
        category: 'Analytics',
        authType: 'api_key',
        isConnected: false,
        operations: [],
      },
    ],
  },
];

/**
 * Get icon for category
 */
export function getCategoryIcon(category: string) {
  const iconMap: Record<string, any> = {
    CRM: CircleStackIcon,
    Communication: ChatBubbleLeftRightIcon,
    Marketing: MegaphoneIcon,
    Productivity: BriefcaseIcon,
    Finance: CurrencyDollarIcon,
    'E-commerce': ShoppingCartIcon,
    Support: LifebuoyIcon,
    Analytics: ChartBarIcon,
  };
  return iconMap[category] || CircleStackIcon;
}

/**
 * Get color classes for category
 */
export function getCategoryColor(color: string) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  };
  return colorMap[color] || colorMap.blue;
}

