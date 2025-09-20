/**
 * 🧪 Unit Tests for Interactive Workflow Validator
 * 
 * Comprehensive testing of core functionality
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractiveWorkflowValidator from '@/app/(locker)/private/TOP/interactive-workflow-validator/page';
import { 
  createMockWorkflowStep, 
  createMockWorkflowExecution,
  mockApiResponse,
  mockApiError,
  waitForAsync
} from '../setup/workflow-validator-setup';

// Mock the components
jest.mock('./components/WorkflowVisualization', () => {
  return function MockWorkflowVisualization({ steps, selectedStep, onStepSelect }: any) {
    return (
      <div data-testid="workflow-visualization">
        <div>Steps: {steps.length}</div>
        <div>Selected: {selectedStep || 'none'}</div>
        <button onClick={() => onStepSelect?.('step1')}>Select Step 1</button>
      </div>
    );
  };
});

jest.mock('./components/RealTimeMonitoring', () => {
  return function MockRealTimeMonitoring({ isActive }: any) {
    return (
      <div data-testid="real-time-monitoring">
        <div>Monitoring Active: {isActive ? 'Yes' : 'No'}</div>
      </div>
    );
  };
});

// Mock PasswordProtection
jest.mock('../../PasswordProtection', () => {
  return function MockPasswordProtection({ children }: any) {
    return <div data-testid="password-protection">{children}</div>;
  };
});

describe('InteractiveWorkflowValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the main interface', () => {
      render(<InteractiveWorkflowValidator />);
      
      expect(screen.getByText('🎯 TOP Interactive Workflow Validator')).toBeInTheDocument();
      expect(screen.getByText('Step-by-step validation of the buyer group generation process')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-visualization')).toBeInTheDocument();
      expect(screen.getByTestId('real-time-monitoring')).toBeInTheDocument();
    });

    it('should display workflow controls', () => {
      render(<InteractiveWorkflowValidator />);
      
      expect(screen.getByText('Workflow Controls')).toBeInTheDocument();
      expect(screen.getByText('⚡ Run All Runnable Steps')).toBeInTheDocument();
      expect(screen.getByText('🔄 Reset Workflow')).toBeInTheDocument();
    });

    it('should show initial workflow state', () => {
      render(<InteractiveWorkflowValidator />);
      
      expect(screen.getByText('Company: Dell Technologies')).toBeInTheDocument();
      expect(screen.getByText('Runnable Steps: 1')).toBeInTheDocument();
      expect(screen.getByText('Completed Steps: 0')).toBeInTheDocument();
    });
  });

  describe('Workflow Steps', () => {
    it('should display all workflow steps', () => {
      render(<InteractiveWorkflowValidator />);
      
      // Check for key steps
      expect(screen.getByText('Input Processing & Validation')).toBeInTheDocument();
      expect(screen.getByText('Company Data Discovery')).toBeInTheDocument();
      expect(screen.getByText('Parallel Search Execution')).toBeInTheDocument();
      expect(screen.getByText('Seller Profile Adaptation')).toBeInTheDocument();
    });

    it('should show step status indicators', () => {
      render(<InteractiveWorkflowValidator />);
      
      // All steps should initially be pending
      const statusIndicators = screen.getAllByText('⏳');
      expect(statusIndicators.length).toBeGreaterThan(0);
    });

    it('should show parallel vs sequential indicators', () => {
      render(<InteractiveWorkflowValidator />);
      
      expect(screen.getByText('⚡ Parallel')).toBeInTheDocument();
      expect(screen.getByText('➡️ Sequential')).toBeInTheDocument();
    });

    it('should allow step selection', async () => {
      const user = userEvent.setup();
      render(<InteractiveWorkflowValidator />);
      
      const firstStep = screen.getByText('Input Processing & Validation').closest('div');
      expect(firstStep).toBeInTheDocument();
      
      await user.click(firstStep!);
      
      // Should show step details
      expect(screen.getByText('Step Details')).toBeInTheDocument();
    });
  });

  describe('Step Execution', () => {
    it('should execute a single step successfully', async () => {
      const user = userEvent.setup();
      mockApiResponse({
        stepId: 'step1',
        status: 'success',
        output: { companyName: 'Dell Technologies', validated: true },
        duration: 150
      });

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText('✅ Completed Input Processing & Validation in 150ms')).toBeInTheDocument();
      });
    });

    it('should handle step execution errors', async () => {
      const user = userEvent.setup();
      mockApiError('API Error', 500);

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText(/❌ Error in Input Processing & Validation/)).toBeInTheDocument();
      });
    });

    it('should show running state during execution', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              stepId: 'step1',
              status: 'success',
              output: {},
              duration: 1000
            })
          }), 100)
        )
      );

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      // Should show running state
      expect(screen.getByText('🔄 Starting Input Processing & Validation...')).toBeInTheDocument();
    });

    it('should only allow running steps with satisfied dependencies', () => {
      render(<InteractiveWorkflowValidator />);
      
      // First step should be runnable
      const firstStepRunButton = screen.getByText('Run');
      expect(firstStepRunButton).toBeEnabled();
      
      // Steps with dependencies should not be runnable initially
      const stepsWithDependencies = screen.getAllByText('Company Data Discovery');
      const stepContainer = stepsWithDependencies[0].closest('div');
      const runButton = stepContainer?.querySelector('button');
      
      // Should not have a run button if dependencies aren't satisfied
      expect(runButton).not.toBeInTheDocument();
    });
  });

  describe('Parallel Execution', () => {
    it('should execute parallel steps simultaneously', async () => {
      const user = userEvent.setup();
      
      // Mock responses for parallel steps
      mockApiResponse({
        stepId: 'step4a',
        status: 'success',
        output: { candidates: [] },
        duration: 2000
      });
      
      mockApiResponse({
        stepId: 'step4b',
        status: 'success',
        output: { adaptedProfile: {} },
        duration: 300
      });

      render(<InteractiveWorkflowValidator />);
      
      // First execute the prerequisite steps
      const firstStepRunButton = screen.getByText('Run');
      await user.click(firstStepRunButton);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ Completed Input Processing & Validation/)).toBeInTheDocument();
      });
      
      // Execute step 2
      const step2RunButton = screen.getAllByText('Run')[0];
      await user.click(step2RunButton);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ Completed Company Data Discovery/)).toBeInTheDocument();
      });
      
      // Execute step 3
      const step3RunButton = screen.getAllByText('Run')[0];
      await user.click(step3RunButton);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ Completed Search Query Generation/)).toBeInTheDocument();
      });
      
      // Now parallel steps should be available
      const runAllButton = screen.getByText('⚡ Run All Runnable Steps');
      await user.click(runAllButton);
      
      await waitFor(() => {
        expect(screen.getByText(/⚡ Executing 2 parallel steps/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Reset', () => {
    it('should reset all steps to pending state', async () => {
      const user = userEvent.setup();
      mockApiResponse({
        stepId: 'step1',
        status: 'success',
        output: {},
        duration: 100
      });

      render(<InteractiveWorkflowValidator />);
      
      // Execute a step
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ Completed/)).toBeInTheDocument();
      });
      
      // Reset workflow
      const resetButton = screen.getByText('🔄 Reset Workflow');
      await user.click(resetButton);
      
      // All steps should be pending again
      const statusIndicators = screen.getAllByText('⏳');
      expect(statusIndicators.length).toBeGreaterThan(0);
      
      // Execution log should show reset message
      expect(screen.getByText('🔄 Workflow reset')).toBeInTheDocument();
    });
  });

  describe('Real-time Monitoring', () => {
    it('should activate monitoring during execution', async () => {
      const user = userEvent.setup();
      mockApiResponse({
        stepId: 'step1',
        status: 'success',
        output: {},
        duration: 100
      });

      render(<InteractiveWorkflowValidator />);
      
      const runAllButton = screen.getByText('⚡ Run All Runnable Steps');
      await user.click(runAllButton);
      
      // Monitoring should be active
      expect(screen.getByText('Monitoring Active: Yes')).toBeInTheDocument();
    });

    it('should deactivate monitoring after execution', async () => {
      const user = userEvent.setup();
      mockApiResponse({
        stepId: 'step1',
        status: 'success',
        output: {},
        duration: 100
      });

      render(<InteractiveWorkflowValidator />);
      
      const runAllButton = screen.getByText('⚡ Run All Runnable Steps');
      await user.click(runAllButton);
      
      await waitFor(() => {
        expect(screen.getByText('Monitoring Active: No')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockApiError('Network Error');

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText(/❌ Error in Input Processing & Validation: Network Error/)).toBeInTheDocument();
      });
    });

    it('should handle invalid API responses', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      await waitFor(() => {
        expect(screen.getByText(/❌ Error in Input Processing & Validation/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid step execution', async () => {
      const user = userEvent.setup();
      
      // Mock fast responses
      mockApiResponse({
        stepId: 'step1',
        status: 'success',
        output: {},
        duration: 50
      });

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      
      // Click multiple times rapidly
      await user.click(runButton);
      await user.click(runButton);
      await user.click(runButton);
      
      // Should handle gracefully without errors
      await waitFor(() => {
        expect(screen.getByText(/✅ Completed/)).toBeInTheDocument();
      });
    });

    it('should update UI responsively during execution', async () => {
      const user = userEvent.setup();
      
      // Mock a response with delay
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              stepId: 'step1',
              status: 'success',
              output: {},
              duration: 500
            })
          }), 200)
        )
      );

      render(<InteractiveWorkflowValidator />);
      
      const runButton = screen.getByText('Run');
      await user.click(runButton);
      
      // Should show immediate feedback
      expect(screen.getByText('🔄 Starting Input Processing & Validation...')).toBeInTheDocument();
      
      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByText(/✅ Completed Input Processing & Validation/)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});

