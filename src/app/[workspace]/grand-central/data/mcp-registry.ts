export interface MCPEndpoint {
  method: string;
  path: string;
  description: string;
}

export interface MCPAuthentication {
  type: string;
  envVars: string[];
}

export interface MCPRegistryItem {
  id: string;
  ulid: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'configured' | 'not-configured';
  endpoints: MCPEndpoint[];
  authentication: MCPAuthentication;
  documentation: {
    url: string;
    setupGuide: string;
  };
  usageLocations: string[];
}

export const MCP_REGISTRY: MCPRegistryItem[] = [
  {
    id: 'filesystem-mcp',
    ulid: '01HQEX7Y2K3M4N5P6Q7R8S9T4Z',
    name: 'Filesystem MCP',
    description: 'Model Context Protocol server for file system operations',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: '/mcp/filesystem/read',
        description: 'Read file contents'
      },
      {
        method: 'POST',
        path: '/mcp/filesystem/write',
        description: 'Write file contents'
      }
    ],
    authentication: {
      type: 'Local Socket',
      envVars: []
    },
    documentation: {
      url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
      setupGuide: 'Install MCP filesystem server and configure in MCP settings'
    },
    usageLocations: []
  },
  {
    id: 'sqlite-mcp',
    name: 'SQLite MCP',
    description: 'Model Context Protocol server for SQLite database operations',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: '/mcp/sqlite/query',
        description: 'Execute SQL queries'
      },
      {
        method: 'POST',
        path: '/mcp/sqlite/schema',
        description: 'Get database schema'
      }
    ],
    authentication: {
      type: 'Local Socket',
      envVars: []
    },
    documentation: {
      url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
      setupGuide: 'Install MCP SQLite server and configure database connection'
    },
    usageLocations: []
  },
  {
    id: 'github-mcp',
    name: 'GitHub MCP',
    description: 'Model Context Protocol server for GitHub repository operations',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: '/mcp/github/repos',
        description: 'List repositories'
      },
      {
        method: 'POST',
        path: '/mcp/github/issues',
        description: 'Get repository issues'
      }
    ],
    authentication: {
      type: 'GitHub Token',
      envVars: ['GITHUB_TOKEN']
    },
    documentation: {
      url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
      setupGuide: 'Install MCP GitHub server and configure GitHub token'
    },
    usageLocations: []
  },
  {
    id: 'web-search-mcp',
    name: 'Web Search MCP',
    description: 'Model Context Protocol server for web search operations',
    status: 'not-configured',
    endpoints: [
      {
        method: 'POST',
        path: '/mcp/web/search',
        description: 'Perform web search'
      },
      {
        method: 'POST',
        path: '/mcp/web/summarize',
        description: 'Summarize web content'
      }
    ],
    authentication: {
      type: 'API Key',
      envVars: ['SERPER_API_KEY']
    },
    documentation: {
      url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/web-search',
      setupGuide: 'Install MCP web search server and configure search API key'
    },
    usageLocations: []
  }
];

export const getMCPById = (id: string) => {
  return MCP_REGISTRY.find(mcp => mcp.id === id);
};

export const getConfiguredMCPs = () => {
  return MCP_REGISTRY.filter(mcp => mcp.status === 'configured');
};

export const getNotConfiguredMCPs = () => {
  return MCP_REGISTRY.filter(mcp => mcp.status === 'not-configured');
};
