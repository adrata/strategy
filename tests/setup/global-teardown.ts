/**
 * 🧪 Global Test Teardown
 * 
 * Cleanup tasks that run once after all tests
 */
export default async function globalTeardown() {
  console.log('🧪 Starting global test teardown...');
  
  // Close MSW server
  const server = (global as any).__MSW_SERVER__;
  if (server) {
    server.close();
  }
  
  console.log('✅ Global test teardown completed');
}
