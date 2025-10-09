/**
 * Console Helper Functions
 * Provides easy access to logging controls from the browser console
 */

import { logger } from './logger';

// Make logging controls available globally
if (typeof window !== 'undefined') {
  (window as any).adrata = {
    // Logging controls
    setLogLevel: (level: 'silent' | 'error' | 'warn' | 'info' | 'debug') => {
      logger.setLevel(level);
      console.log(`🔧 [ADRATA] Log level set to: ${level}`);
    },
    
    // Quick presets
    quiet: () => {
      logger.setLevel('silent');
      console.log('🔇 [ADRATA] Logging set to quiet mode (errors only)');
    },
    
    normal: () => {
      logger.setLevel('warn');
      console.log('🔊 [ADRATA] Logging set to normal mode (warnings and errors)');
    },
    
    verbose: () => {
      logger.setLevel('debug');
      console.log('📢 [ADRATA] Logging set to verbose mode (all logs)');
    },
    
    // Show current status
    status: () => {
      console.log(`📊 [ADRATA] Current log level: ${logger.getLevel()}`);
      console.log('Available commands:');
      console.log('  adrata.quiet()    - Only show errors');
      console.log('  adrata.normal()   - Show warnings and errors (default)');
      console.log('  adrata.verbose()  - Show all logs');
      console.log('  adrata.setLogLevel("silent") - Custom level');
    }
  };
  
  // Show help on load
  console.log('🔧 [ADRATA] Console helpers loaded! Type "adrata.status()" for options.');
}
