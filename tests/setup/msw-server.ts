/**
 * 🧪 MSW Server Setup for Workflow Validator Tests
 * 
 * Mock Service Worker configuration for API testing
 */
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API responses
const mockStepExecutionResponse = {
  stepId: 'step1',
  status: 'success',
  output: {
    companyName: 'Test Company',
    validated: true,
    sellerProfile: {
      product: 'Cloud Infrastructure Solutions',
      industry: 'Technology',
      targetRoles: ['VP Engineering', 'Director IT', 'CTO'],
      companySize: 'Enterprise'
    }
  },
  duration: 150,
  dataSource: 'Internal validation',
  confidence: 100
};

const mockErrorResponse = {
  stepId: 'step1',
  status: 'error',
  error: 'Test error message',
  duration: 0
};

// Define request handlers
const handlers = [
  // Step execution endpoint
  rest.post('/api/workflow/execute-step', (req, res, ctx) => {
    const body = req.body as any;
    
    // Simulate different responses based on step ID
    if (body.stepId === 'error-step') {
      return res(ctx.status(500), ctx.json(mockErrorResponse));
    }
    
    if (body.stepId === 'timeout-step') {
      return res(ctx.delay(10000), ctx.json(mockStepExecutionResponse));
    }
    
    // Simulate processing time
    const delay = Math.random() * 1000 + 100;
    
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json({
        ...mockStepExecutionResponse,
        stepId: body.stepId,
        output: {
          ...mockStepExecutionResponse.output,
          stepId: body.stepId,
          companyName: body.companyName
        }
      })
    );
  }),

  // Health check endpoint
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          apis: 'healthy',
          monitoring: 'healthy'
        }
      })
    );
  }),

  // System metrics endpoint
  rest.get('/api/system/metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        apiCallsPerSecond: Math.random() * 10,
        activeConnections: Math.floor(Math.random() * 50),
        errorRate: Math.random() * 5
      })
    );
  }),

  // Workflow status endpoint
  rest.get('/api/workflow/status/:workflowId', (req, res, ctx) => {
    const { workflowId } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        workflowId,
        status: 'running',
        currentStep: 'step3',
        completedSteps: 2,
        totalSteps: 11,
        progress: 18.2,
        estimatedTimeRemaining: 120000
      })
    );
  }),

  // Catch-all handler for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ error: 'Not found' })
    );
  })
];

// Create and export the server
export const server = setupServer(...handlers);

// Export mock data for use in tests
export const mockData = {
  stepExecutionResponse: mockStepExecutionResponse,
  errorResponse: mockErrorResponse,
  workflowSteps: [
    {
      id: 'step1',
      name: 'Input Processing & Validation',
      description: 'Validate company name and load seller profile',
      status: 'pending' as const,
      dependencies: [],
      parallel: false
    },
    {
      id: 'step2',
      name: 'Company Data Discovery',
      description: 'Search CoreSignal API for company information',
      status: 'pending' as const,
      dependencies: ['step1'],
      parallel: false
    },
    {
      id: 'step4a',
      name: 'Parallel Search Execution',
      description: 'Execute multiple targeted searches simultaneously',
      status: 'pending' as const,
      dependencies: ['step3'],
      parallel: true
    },
    {
      id: 'step4b',
      name: 'Seller Profile Adaptation',
      description: 'Adapt seller profile based on company context',
      status: 'pending' as const,
      dependencies: ['step2'],
      parallel: true
    }
  ]
};
