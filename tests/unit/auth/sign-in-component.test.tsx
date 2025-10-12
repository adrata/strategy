/**
 * Unit Tests: Sign-In Component
 * 
 * Tests for the sign-in page component functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from '@/app/(auth)/sign-in/page';

// Mock the useUnifiedAuth hook
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: jest.fn(() => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    user: null,
    session: null,
    isLoading: false,
    error: null,
  })),
}));

const mockUseUnifiedAuth = require('@/platform/auth').useUnifiedAuth as jest.MockedFunction<any>;

describe('SignInPage Component', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the sign-in form with all required elements', () => {
      render(<SignInPage />);
      
      // Check main elements are present
      expect(screen.getByText('Adrata Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText('Username or Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      expect(screen.getByText("Don't have an account yet?")).toBeInTheDocument();
      expect(screen.getByText('Get a demo')).toBeInTheDocument();
    });

    it('renders form inputs with correct attributes', () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      expect(emailInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your username or email');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
      
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('shows correct button text without keyboard shortcut', () => {
      render(<SignInPage />);
      
      const submitButton = screen.getByRole('button', { name: /start/i });
      expect(submitButton).toHaveTextContent('Start');
      
      // Ensure no keyboard shortcut is displayed
      expect(submitButton.textContent).not.toMatch(/⌘|Ctrl|Enter/);
    });
  });

  describe('Form Interaction', () => {
    it('allows user to type in email field', async () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const testEmail = 'test@adrata.com';
      
      await user.type(emailInput, testEmail);
      expect(emailInput).toHaveValue(testEmail);
    });

    it('allows user to type in password field', async () => {
      render(<SignInPage />);
      
      const passwordInput = screen.getByLabelText('Password');
      const testPassword = 'testpassword123';
      
      await user.type(passwordInput, testPassword);
      expect(passwordInput).toHaveValue(testPassword);
    });

    it('allows user to toggle remember me checkbox', async () => {
      render(<SignInPage />);
      
      const rememberMeCheckbox = screen.getByLabelText('Remember me');
      
      expect(rememberMeCheckbox).not.toBeChecked();
      
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();
      
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('enables submit button when form has valid input', async () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      // Initially enabled (no validation on empty fields)
      expect(submitButton).toBeEnabled();
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'password123');
      
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Form Submission', () => {
    it('calls signIn with correct parameters on form submission', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'test-user-id', email: 'test@adrata.com' },
        accessToken: 'mock-token',
        redirectTo: '/speedrun',
      });
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const rememberMeCheckbox = screen.getByLabelText('Remember me');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@adrata.com', 'password123', true);
      });
    });

    it('shows loading state during form submission', async () => {
      const mockSignIn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          user: { id: 'test-user-id', email: 'test@adrata.com' },
          accessToken: 'mock-token',
          redirectTo: '/speedrun',
        }), 100))
      );
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Check loading state
      expect(submitButton).toHaveTextContent('Starting...');
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    it('displays error message on authentication failure', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('handles unexpected errors gracefully', async () => {
      const mockSignIn = jest.fn().mockRejectedValue(new Error('Network error'));
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('verifies keyboard shortcut functionality was removed from component', () => {
      // This test verifies that the component no longer has keyboard shortcut logic
      // by checking that the button text doesn't include keyboard shortcuts
      render(<SignInPage />);
      
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      // Verify button text is just "Start" without any keyboard shortcut indicators
      expect(submitButton).toHaveTextContent('Start');
      expect(submitButton.textContent).not.toMatch(/⌘|Ctrl|Enter|⏎/);
      
      // Verify no keyboard shortcut text is present anywhere in the component
      expect(screen.queryByText(/⌘|Ctrl.*Enter|Command.*Enter/)).not.toBeInTheDocument();
    });

    it('does NOT trigger form submission with Ctrl+Enter', async () => {
      const mockSignIn = jest.fn();
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'password123');
      
      // Simulate Ctrl+Enter keypress
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      // Wait a bit to ensure no submission occurred
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('allows normal Enter key to submit form when focused on submit button', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'test-user-id', email: 'test@adrata.com' },
        accessToken: 'mock-token',
        redirectTo: '/speedrun',
      });
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'password123');
      
      // Focus submit button and press Enter
      submitButton.focus();
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@adrata.com', 'password123', false);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const rememberMeCheckbox = screen.getByLabelText('Remember me');
      
      expect(emailInput).toHaveAttribute('id', 'username');
      expect(passwordInput).toHaveAttribute('id', 'password');
      expect(rememberMeCheckbox).toHaveAttribute('id', 'remember-me');
    });

    it('has proper form structure', () => {
      render(<SignInPage />);
      
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('noValidate');
    });

    it('has proper heading structure', () => {
      render(<SignInPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Adrata Sign In');
    });
  });

  describe('Error Handling', () => {
    it('keeps error message visible until next form submission', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });
      
      mockUseUnifiedAuth.mockReturnValue({
        signIn: mockSignIn,
        signOut: jest.fn(),
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      render(<SignInPage />);
      
      const emailInput = screen.getByLabelText('Username or Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /start/i });
      
      // Submit with invalid credentials
      await user.type(emailInput, 'test@adrata.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      // Start typing again - error should still be visible
      await user.clear(emailInput);
      await user.type(emailInput, 'new@adrata.com');
      
      // Error should still be visible (component doesn't clear on typing)
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});