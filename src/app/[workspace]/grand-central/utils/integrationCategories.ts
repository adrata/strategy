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
        operations: [],
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

