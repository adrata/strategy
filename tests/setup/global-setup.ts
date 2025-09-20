/**
 * 🧪 Global Test Setup
 * 
 * Setup tasks that run once before all tests
 */
import { setupServer } from 'msw/node';
import { handlers } from './msw-server';

// Create MSW server for all tests
const server = setupServer(...handlers);

export default async function globalSetup() {
  console.log('🧪 Starting global test setup...');
  
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });
  
  console.log('✅ Global test setup completed');
  
  // Store server reference for teardown
  (global as any).__MSW_SERVER__ = server;
}

