export interface APIEndpoint {
  method: string;
  path: string;
  description: string;
}

export interface APIAuthentication {
  type: string;
  envVars: string[];
}

export interface APIPricing {
  model: string;
  cost: string;
  rateLimit?: string;
}

export interface APIDocumentation {
  url: string;
  setupGuide: string;
}

export interface APIRegistryItem {
  id: string;
  ulid: string;
  name: string;
  category: 'data-enrichment' | 'ai-llm' | 'communication' | 'integration' | 'oauth';
  description: string;
  status: 'active' | 'inactive' | 'configured' | 'not-configured';
  endpoints: APIEndpoint[];
  authentication: APIAuthentication;
  pricing: APIPricing;
  documentation: APIDocumentation;
  usageLocations: string[];
}

export const API_REGISTRY: APIRegistryItem[] = [
  // Data Enrichment & Intelligence APIs
  {
    id: 'coresignal',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T0V',
    name: 'CoreSignal',
    category: 'data-enrichment',
    description: 'Company resolution and executive discovery with multi-source employee data',
    status: 'configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl',
        description: 'Search for employees using Elasticsearch DSL queries'
      },
      {
        method: 'GET',
        path: 'https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/{employeeId}',
        description: 'Collect detailed employee profile data'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['CORESIGNAL_API_KEY']
    },
    pricing: {
      model: 'Credits',
      cost: '~2-3 credits per company',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.coresignal.com',
      setupGuide: 'Sign up at coresignal.com, get API key from dashboard, add CORESIGNAL_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/pipelines/modules/core/CoreSignalMultiSource.js',
      'src/platform/pipelines/modules/core/CoreSignalPreviewClient.js',
      'src/scripts/enrich-remaining-people-coresignal.js',
      'src/scripts/enrich-all-remaining-people-coresignal.js'
    ]
  },
  {
    id: 'lusha',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T1W',
    name: 'Lusha',
    category: 'data-enrichment',
    description: 'Person lookup and phone discovery with high accuracy contact data',
    status: 'configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://api.lusha.com/v2/person',
        description: 'Find person by name and company'
      },
      {
        method: 'POST',
        path: 'https://api.lusha.com/person',
        description: 'Search for person with company context'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['LUSHA_API_KEY']
    },
    pricing: {
      model: 'Per Lookup',
      cost: '~$0.08 per lookup',
      rateLimit: '2000 calls/day'
    },
    documentation: {
      url: 'https://docs.lusha.com',
      setupGuide: 'Sign up at lusha.com, get API key from dashboard, add LUSHA_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/intelligence/modules/ContactIntelligence.ts',
      'src/platform/intelligence/services/PeopleDiscoveryEngine.ts',
      'src/platform/pipelines/modules/core/MultiSourceVerifier.js'
    ]
  },
  {
    id: 'perplexity',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T2X',
    name: 'Perplexity',
    category: 'ai-llm',
    description: 'Employment status verification and real-time research using AI',
    status: 'configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://api.perplexity.ai/chat/completions',
        description: 'Chat completions for real-time research and verification'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['PERPLEXITY_API_KEY']
    },
    pricing: {
      model: 'Per Request',
      cost: '~$0.01 per company',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.perplexity.ai',
      setupGuide: 'Sign up at perplexity.ai, get API key from account settings, add PERPLEXITY_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/services/perplexity-enrichment.ts',
      'src/platform/services/PerplexityNewsService.ts',
      'src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.ts'
    ]
  },
  {
    id: 'people-data-labs',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T3Y',
    name: 'People Data Labs',
    category: 'data-enrichment',
    description: 'Person enrichment and phone verification with comprehensive contact data',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://api.peopledatalabs.com/v5/person/enrich',
        description: 'Enrich person data with contact information'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['PEOPLE_DATA_LABS_API_KEY']
    },
    pricing: {
      model: 'Per Lookup',
      cost: '~$0.10 per lookup',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.peopledatalabs.com',
      setupGuide: 'Sign up at peopledatalabs.com, get API key from dashboard, add PEOPLE_DATA_LABS_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.ts'
    ]
  },
  {
    id: 'prospeo',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T4Z',
    name: 'Prospeo',
    category: 'communication',
    description: 'Email verification and validation with multi-layer validation',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://api.prospeo.io/email-verifier/v1/verify',
        description: 'Verify email address deliverability'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['PROSPEO_API_KEY']
    },
    pricing: {
      model: 'Per Verification',
      cost: '~$0.05 per verification',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.prospeo.io',
      setupGuide: 'Sign up at prospeo.io, get API key from dashboard, add PROSPEO_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/intelligence/modules/ContactIntelligence.ts'
    ]
  },
  // Email & Communication APIs
  {
    id: 'zerobounce',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T5A',
    name: 'ZeroBounce',
    category: 'communication',
    description: 'Email validation with high accuracy and deliverability scoring',
    status: 'configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://api.zerobounce.net/v2/validate',
        description: 'Validate email address and get deliverability score'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['ZEROBOUNCE_API_KEY']
    },
    pricing: {
      model: 'Per Validation',
      cost: '~$0.005 per validation',
      rateLimit: 'No documented limits'
    },
    documentation: {
      url: 'https://www.zerobounce.net/docs/',
      setupGuide: 'Sign up at zerobounce.net, get API key from dashboard, add ZEROBOUNCE_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.ts'
    ]
  },
  {
    id: 'myemailverifier',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T6B',
    name: 'MyEmailVerifier',
    category: 'communication',
    description: 'Email validation fallback service with cost-effective verification',
    status: 'not-configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://api.myemailverifier.com/v1/verify',
        description: 'Verify email address with fallback validation'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['MYEMAILVERIFIER_API_KEY']
    },
    pricing: {
      model: 'Per Validation',
      cost: '~$0.001 per validation',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.myemailverifier.com',
      setupGuide: 'Sign up at myemailverifier.com, get API key from dashboard, add MYEMAILVERIFIER_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.ts'
    ]
  },
  {
    id: 'twilio',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T7C',
    name: 'Twilio',
    category: 'communication',
    description: 'Phone number validation and SMS services with global coverage',
    status: 'configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://lookups.twilio.com/v1/PhoneNumbers/{phoneNumber}',
        description: 'Validate phone number and get carrier information'
      },
      {
        method: 'POST',
        path: 'https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json',
        description: 'Send SMS messages'
      }
    ],
    authentication: {
      type: 'Account SID + Auth Token',
      envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
    },
    pricing: {
      model: 'Per Lookup',
      cost: '~$0.008 per lookup',
      rateLimit: 'Based on account limits'
    },
    documentation: {
      url: 'https://www.twilio.com/docs',
      setupGuide: 'Sign up at twilio.com, get Account SID and Auth Token, add to .env'
    },
    usageLocations: [
      'src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.ts'
    ]
  },
  // AI & LLM APIs
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    category: 'ai-llm',
    description: 'Strategic analysis, AI insights, and chat with Claude Sonnet 4.5',
    status: 'configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://api.anthropic.com/v1/messages',
        description: 'Chat completions with Claude models'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['ANTHROPIC_API_KEY']
    },
    pricing: {
      model: 'Per Token',
      cost: 'Variable based on model and usage',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.anthropic.com',
      setupGuide: 'Sign up at anthropic.com, get API key from dashboard, add ANTHROPIC_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/services/ClaudeAIService.ts',
      'src/platform/ai/services/claudeService.ts',
      'src/platform/services/PersonIntelligenceService.ts',
      'src/platform/services/CompanyIntelligenceService.ts'
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai-llm',
    description: 'AI analysis, embeddings, and chat with GPT models',
    status: 'configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://api.openai.com/v1/chat/completions',
        description: 'Chat completions with GPT models'
      },
      {
        method: 'POST',
        path: 'https://api.openai.com/v1/embeddings',
        description: 'Generate embeddings for text'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['OPENAI_API_KEY']
    },
    pricing: {
      model: 'Per Token',
      cost: 'Variable based on model and usage',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://platform.openai.com/docs',
      setupGuide: 'Sign up at platform.openai.com, get API key from dashboard, add OPENAI_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/utils/openaiService.ts',
      'src/platform/ai/services/openaiService.ts',
      'src/platform/hooks/useChat.ts'
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'ai-llm',
    description: 'Multi-model AI routing with access to various LLM providers',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: 'https://openrouter.ai/api/v1/chat/completions',
        description: 'Route requests to various AI models'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['OPENROUTER_API_KEY']
    },
    pricing: {
      model: 'Per Request',
      cost: 'Variable based on model selection',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://openrouter.ai/docs',
      setupGuide: 'Sign up at openrouter.ai, get API key from dashboard, add OPENROUTER_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/services/OpenRouterService.ts',
      'src/platform/services/smartModelRouter.ts'
    ]
  },
  // Integration & Data APIs
  {
    id: 'nango',
    name: 'Nango',
    category: 'integration',
    description: '500+ API integrations management with OAuth and webhook support',
    status: 'configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://api.nango.dev/integrations',
        description: 'List available integrations'
      },
      {
        method: 'POST',
        path: 'https://api.nango.dev/connect/{provider}',
        description: 'Initiate OAuth flow for provider'
      }
    ],
    authentication: {
      type: 'Secret Key',
      envVars: ['NANGO_SECRET_KEY', 'NANGO_HOST']
    },
    pricing: {
      model: 'Per Integration',
      cost: 'Based on integration usage',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.nango.dev',
      setupGuide: 'Sign up at nango.dev, get secret key, add NANGO_SECRET_KEY to .env'
    },
    usageLocations: [
      'src/app/[workspace]/grand-central/services/NangoService.ts',
      'src/app/api/v1/integrations/nango/'
    ]
  },
  {
    id: 'brightdata',
    name: 'BrightData',
    category: 'integration',
    description: 'Web scraping and data collection with residential and datacenter proxies',
    status: 'not-configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://api.brightdata.com/v1/proxies',
        description: 'Access proxy network for web scraping'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['BRIGHTDATA_API_KEY']
    },
    pricing: {
      model: 'Per GB',
      cost: 'Variable based on proxy type and usage',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.brightdata.com',
      setupGuide: 'Sign up at brightdata.com, get API key from dashboard, add BRIGHTDATA_API_KEY to .env'
    },
    usageLocations: [
      'src/platform/grand-central/monaco-integration.ts'
    ]
  },
  {
    id: 'daytona',
    name: 'Daytona',
    category: 'integration',
    description: 'Development environment management with containerized workspaces',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: '{DAYTONA_API_URL}/workspaces',
        description: 'Create and manage development workspaces'
      }
    ],
    authentication: {
      type: 'API Key + URL',
      envVars: ['DAYTONA_API_KEY', 'DAYTONA_API_URL']
    },
    pricing: {
      model: 'Per Workspace',
      cost: 'Based on workspace usage and resources',
      rateLimit: 'Based on subscription plan'
    },
    documentation: {
      url: 'https://docs.daytona.io',
      setupGuide: 'Sign up at daytona.io, get API key and URL, add to .env'
    },
    usageLocations: [
      'src/app/[workspace]/encode/services/DaytonaService.ts'
    ]
  },
  // OAuth Providers
  {
    id: 'google-oauth',
    name: 'Google OAuth',
    category: 'oauth',
    description: 'Google Workspace integration with Gmail, Calendar, and Drive access',
    status: 'configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://www.googleapis.com/oauth2/v2/userinfo',
        description: 'Get user profile information'
      },
      {
        method: 'GET',
        path: 'https://www.googleapis.com/gmail/v1/users/me/messages',
        description: 'Access Gmail messages'
      }
    ],
    authentication: {
      type: 'OAuth 2.0',
      envVars: ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    },
    pricing: {
      model: 'Free',
      cost: 'No additional cost',
      rateLimit: 'Based on Google API quotas'
    },
    documentation: {
      url: 'https://developers.google.com/identity/protocols/oauth2',
      setupGuide: 'Create OAuth app in Google Cloud Console, add client ID and secret to .env'
    },
    usageLocations: [
      'src/platform/services/oauth-service.ts'
    ]
  },
  {
    id: 'microsoft-oauth',
    name: 'Microsoft OAuth',
    category: 'oauth',
    description: 'Microsoft Graph integration with Mail, Calendar, and User profile access',
    status: 'configured',
    endpoints: [
      {
        method: 'GET',
        path: 'https://graph.microsoft.com/v1.0/me',
        description: 'Get user profile information'
      },
      {
        method: 'GET',
        path: 'https://graph.microsoft.com/v1.0/me/messages',
        description: 'Access Outlook messages'
      }
    ],
    authentication: {
      type: 'OAuth 2.0',
      envVars: ['MICROSOFT_CLIENT_SECRET']
    },
    pricing: {
      model: 'Free',
      cost: 'No additional cost',
      rateLimit: 'Based on Microsoft Graph quotas'
    },
    documentation: {
      url: 'https://docs.microsoft.com/en-us/graph/auth/',
      setupGuide: 'Register app in Azure Portal, add client secret to .env'
    },
    usageLocations: [
      'src/platform/services/oauth-service.ts'
    ]
  }
];

export const getAPIsByCategory = (category: string) => {
  return API_REGISTRY.filter(api => api.category === category);
};

export const getAPIById = (id: string) => {
  return API_REGISTRY.find(api => api.id === id);
};

export const getConfiguredAPIs = () => {
  return API_REGISTRY.filter(api => api.status === 'configured');
};

export const getNotConfiguredAPIs = () => {
  return API_REGISTRY.filter(api => api.status === 'not-configured');
};
