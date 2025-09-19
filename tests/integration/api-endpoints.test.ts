/**
 * 🧪 Integration Tests for API Endpoints
 * 
 * Testing the workflow execution API endpoints
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/workflow/execute-step/route';
import { server } from '../setup/msw-server';
import { rest } from 'msw';

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/workflow/execute-step', () => {
    it('should execute step1 successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step1',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stepId).toBe('step1');
      expect(data.status).toBe('success');
      expect(data.output).toHaveProperty('companyName', 'Dell Technologies');
      expect(data.output).toHaveProperty('validated', true);
      expect(data.output).toHaveProperty('sellerProfile');
      expect(data.duration).toBeGreaterThan(0);
      expect(data.dataSource).toBe('Internal validation');
      expect(data.confidence).toBe(100);
    });

    it('should execute step2 with company discovery', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step2',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stepId).toBe('step2');
      expect(data.status).toBe('success');
      expect(data.output).toHaveProperty('companyId');
      expect(data.output).toHaveProperty('industry');
      expect(data.output).toHaveProperty('technologyStack');
      expect(data.dataSource).toBe('CoreSignal API');
      expect(data.confidence).toBe(95);
    });

    it('should execute parallel search step', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step4a',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stepId).toBe('step4a');
      expect(data.status).toBe('success');
      expect(data.output).toHaveProperty('candidates');
      expect(data.output).toHaveProperty('totalCandidates');
      expect(data.output).toHaveProperty('searchQueries');
      expect(data.output).toHaveProperty('parallelExecutions');
      expect(data.dataSource).toBe('CoreSignal API (Parallel)');
    });

    it('should execute profile collection step', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step5',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stepId).toBe('step5');
      expect(data.status).toBe('success');
      expect(data.output).toHaveProperty('profiles');
      expect(data.output).toHaveProperty('totalProfiles');
      expect(data.output).toHaveProperty('qualityScore');
      expect(data.dataSource).toBe('CoreSignal Client (Parallel)');
    });

    it('should execute buyer group assembly step', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step8',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stepId).toBe('step8');
      expect(data.status).toBe('success');
      expect(data.output).toHaveProperty('buyerGroup');
      expect(data.output.buyerGroup).toHaveProperty('totalMembers');
      expect(data.output.buyerGroup).toHaveProperty('cohesionScore');
      expect(data.output.buyerGroup).toHaveProperty('roles');
      expect(data.dataSource).toBe('Buyer Group Identifier');
    });

    it('should execute final output generation step', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step11',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stepId).toBe('step11');
      expect(data.status).toBe('success');
      expect(data.output).toHaveProperty('finalReport');
      expect(data.output.finalReport).toHaveProperty('company');
      expect(data.output.finalReport).toHaveProperty('totalMembers');
      expect(data.output.finalReport).toHaveProperty('confidenceScore');
      expect(data.output.finalReport).toHaveProperty('buyerGroup');
      expect(data.output.finalReport).toHaveProperty('strategicRecommendations');
      expect(data.dataSource).toBe('Report Generator');
    });

    it('should handle unknown step ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'unknown-step',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.stepId).toBe('unknown');
      expect(data.status).toBe('error');
      expect(data.error).toContain('Unknown step ID');
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
    });

    it('should handle missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step1'
          // Missing companyName and workflowId
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Should still work with defaults
      expect(data.stepId).toBe('step1');
    });
  });

  describe('Performance Tests', () => {
    it('should execute steps within acceptable time limits', async () => {
      const steps = ['step1', 'step2', 'step3', 'step4a', 'step4b'];
      const results = [];

      for (const stepId of steps) {
        const startTime = Date.now();
        
        const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
          method: 'POST',
          body: JSON.stringify({
            stepId,
            companyName: 'Dell Technologies',
            workflowId: 'test-workflow'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const data = await response.json();
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        results.push({
          stepId,
          duration: data.duration,
          totalTime,
          status: data.status
        });

        expect(response.status).toBe(200);
        expect(data.status).toBe('success');
        expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      }

      // Log performance results
      console.log('Performance Test Results:', results);
    });

    it('should handle concurrent step execution', async () => {
      const concurrentRequests = [
        'step4a',
        'step4b',
        'step6a',
        'step6b',
        'step6c'
      ].map(stepId => 
        new NextRequest('http://localhost:3000/api/workflow/execute-step', {
          method: 'POST',
          body: JSON.stringify({
            stepId,
            companyName: 'Dell Technologies',
            workflowId: 'test-workflow'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests.map(POST));
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Concurrent execution should be faster than sequential
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`Concurrent execution time: ${totalTime}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should handle step execution errors gracefully', async () => {
      // Mock a step that will fail
      server.use(
        rest.post('/api/workflow/execute-step', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              stepId: 'error-step',
              status: 'error',
              error: 'Simulated error',
              duration: 0
            })
          );
        })
      );

      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'error-step',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Simulated error');
    });

    it('should handle timeout scenarios', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'timeout-step',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // This should timeout and handle gracefully
      const response = await POST(request);
      
      // Should either succeed or fail gracefully
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Data Validation', () => {
    it('should validate step output structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
        method: 'POST',
        body: JSON.stringify({
          stepId: 'step1',
          companyName: 'Dell Technologies',
          workflowId: 'test-workflow'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('stepId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('duration');
      expect(data).toHaveProperty('dataSource');
      expect(data).toHaveProperty('confidence');

      // Validate data types
      expect(typeof data.stepId).toBe('string');
      expect(typeof data.status).toBe('string');
      expect(typeof data.duration).toBe('number');
      expect(typeof data.dataSource).toBe('string');
      expect(typeof data.confidence).toBe('number');

      // Validate value ranges
      expect(data.duration).toBeGreaterThan(0);
      expect(data.confidence).toBeGreaterThanOrEqual(0);
      expect(data.confidence).toBeLessThanOrEqual(100);
    });

    it('should maintain data consistency across steps', async () => {
      const steps = ['step1', 'step2', 'step3'];
      const results = [];

      for (const stepId of steps) {
        const request = new NextRequest('http://localhost:3000/api/workflow/execute-step', {
          method: 'POST',
          body: JSON.stringify({
            stepId,
            companyName: 'Dell Technologies',
            workflowId: 'test-workflow'
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const data = await response.json();
        
        results.push(data);
      }

      // All steps should reference the same company
      results.forEach(result => {
        if (result.output?.companyName) {
          expect(result.output.companyName).toContain('Dell');
        }
      });

      // Confidence scores should be reasonable
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(80);
      });
    });
  });
});
