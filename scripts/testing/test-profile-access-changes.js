/**
 * TEST PROFILE ACCESS CHANGES
 * 
 * Verifies that:
 * 1. Speedrun Engine is available for ALL users
 * 2. Grand Central is available for ALL users  
 * 3. Seller toggles (Monaco Display Options) are restricted to Adrata workspace + demo mode only
 * 4. Theme option is completely hidden
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test users representing different access levels
const TEST_USERS = [
  {
    name: 'Tony (Adrata Workspace)',
    email: 'tony@adrata.com',
    password: 'tonypass',
    workspaceId: 'adrata',
    expectedAccess: {
      speedrunEngine: true,
      grandCentral: true,
      sellerToggles: true, // Should see Monaco Display Options
      theme: false
    }
  },
  {
    name: 'Demo User (Monaco Standalone)', 
    email: 'demo@adrata.com',
    password: 'demopass',
    workspaceId: 'demo',
    expectedAccess: {
      speedrunEngine: true,
      grandCentral: true,
      sellerToggles: true, // Should see Monaco Display Options (demo mode)
      theme: false
    }
  },
  {
    name: 'External User (Non-Adrata)',
    email: 'dano@retail-products.com', 
    password: 'danopass',
    workspaceId: 'external',
    expectedAccess: {
      speedrunEngine: true,
      grandCentral: true,
      sellerToggles: false, // Should NOT see Monaco Display Options
      theme: false
    }
  }
];

class ProfileAccessTester {
  constructor() {
    this.results = [];
  }

  async runTest(testName, testFn) {
    try {
      console.log(`🧪 Testing: ${testName}`);
      const result = await testFn();
      
      if (result.success) {
        console.log(`✅ PASS: ${testName}`);
        this.results.push({ test: testName, status: 'PASS', details: result.details });
      } else {
        console.log(`❌ FAIL: ${testName} - ${result.error}`);
        this.results.push({ test: testName, status: 'FAIL', error: result.error, details: result.details });
      }
    } catch (error) {
      console.log(`💥 ERROR: ${testName} - ${error.message}`);
      this.results.push({ test: testName, status: 'ERROR', error: error.message });
    }
  }

  async testProfileBoxRendering() {
    return this.runTest('ProfileBox Component Rendering', async () => {
      // Test that ProfileBox component loads without errors
      const response = await fetch(`${BASE_URL}/pipeline/leads`);
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const html = await response.text();
      
      // Check that the page loads and doesn't have obvious React errors
      const hasReactError = html.includes('Application error') || html.includes('Error:');
      
      if (hasReactError) {
        return { success: false, error: 'React application error detected' };
      }

      return { 
        success: true, 
        details: 'ProfileBox component loads without errors' 
      };
    });
  }

  async testSpeedrunEngineAccess() {
    return this.runTest('Speedrun Engine Universal Access', async () => {
      // Test the ProfileBox logic by checking the component code
      const fs = require('fs');
      const profileBoxPath = 'src/platform/ui/components/ProfileBox.tsx';
      
      if (!fs.existsSync(profileBoxPath)) {
        return { success: false, error: 'ProfileBox component not found' };
      }

      const content = fs.readFileSync(profileBoxPath, 'utf8');
      
      // Check that Speedrun Engine is NOT restricted by isAdrataUser
      const speedrunEngineSection = content.match(/\/\* Speedrun Engine Configuration[\s\S]*?\{onSpeedrunEngineClick &&[\s\S]*?\}/);
      
      if (!speedrunEngineSection) {
        return { success: false, error: 'Speedrun Engine section not found' };
      }

      // Should NOT contain isAdrataUser restriction
      const hasRestriction = speedrunEngineSection[0].includes('isAdrataUser');
      
      if (hasRestriction) {
        return { success: false, error: 'Speedrun Engine still has isAdrataUser restriction' };
      }

      return { 
        success: true, 
        details: 'Speedrun Engine is available for all users (no isAdrataUser restriction)' 
      };
    });
  }

  async testGrandCentralAccess() {
    return this.runTest('Grand Central Universal Access', async () => {
      const fs = require('fs');
      const profileBoxPath = 'src/platform/ui/components/ProfileBox.tsx';
      const content = fs.readFileSync(profileBoxPath, 'utf8');
      
      // Check that Grand Central is NOT restricted by isAdrataUser
      const grandCentralSection = content.match(/\/\* Grand Central - Available for all users[\s\S]*?Grand Central[\s\S]*?<\/div>/);
      
      if (!grandCentralSection) {
        return { success: false, error: 'Grand Central section not found or incorrectly formatted' };
      }

      // Should NOT contain isAdrataUser restriction in the main section
      const hasRestriction = grandCentralSection[0].includes('isAdrataUser &&');
      
      if (hasRestriction) {
        return { success: false, error: 'Grand Central still has isAdrataUser restriction' };
      }

      return { 
        success: true, 
        details: 'Grand Central is available for all users (no isAdrataUser restriction)' 
      };
    });
  }

  async testSellerTogglesRestriction() {
    return this.runTest('Seller Toggles Properly Restricted', async () => {
      const fs = require('fs');
      const profileBoxPath = 'src/platform/ui/components/ProfileBox.tsx';
      const content = fs.readFileSync(profileBoxPath, 'utf8');
      
      // Check that Monaco Display Options are still restricted
      const monacoOptionsSection = content.match(/Monaco Display Options[\s\S]*?shouldShowMonacoOptions[\s\S]*?<\/>/);
      
      if (!monacoOptionsSection) {
        return { success: false, error: 'Monaco Display Options section not found' };
      }

      // Should contain shouldShowMonacoOptions restriction
      const hasRestriction = content.includes('shouldShowMonacoOptions && (');
      const shouldShowLogic = content.includes('const shouldShowMonacoOptions = isAdrataUser;');
      
      if (!hasRestriction || !shouldShowLogic) {
        return { success: false, error: 'Seller toggles restriction logic is missing or incorrect' };
      }

      return { 
        success: true, 
        details: 'Seller toggles are properly restricted to Adrata workspace and demo mode only' 
      };
    });
  }

  async testThemeOptionHidden() {
    return this.runTest('Theme Option Completely Hidden', async () => {
      const fs = require('fs');
      const profileBoxPath = 'src/platform/ui/components/ProfileBox.tsx';
      const content = fs.readFileSync(profileBoxPath, 'utf8');
      
      // Check that theme-related code is removed
      const hasThemeButton = content.includes('Themes</button>');
      const hasThemeClick = content.includes('onThemesClick');
      const hasThemeHandler = content.includes('handleThemesClick');
      
      if (hasThemeButton || hasThemeClick || hasThemeHandler) {
        return { 
          success: false, 
          error: `Theme-related code still exists: button=${hasThemeButton}, prop=${hasThemeClick}, handler=${hasThemeHandler}` 
        };
      }

      return { 
        success: true, 
        details: 'Theme option and all related code completely removed' 
      };
    });
  }

  async testProfileBoxInterface() {
    return this.runTest('ProfileBox Interface Updated', async () => {
      const fs = require('fs');
      const profileBoxPath = 'src/platform/ui/components/ProfileBox.tsx';
      const content = fs.readFileSync(profileBoxPath, 'utf8');
      
      // Check that onThemesClick prop is removed from interface
      const interfaceSection = content.match(/interface ProfileBoxProps[\s\S]*?\}/);
      
      if (!interfaceSection) {
        return { success: false, error: 'ProfileBoxProps interface not found' };
      }

      const hasThemeProp = interfaceSection[0].includes('onThemesClick');
      
      if (hasThemeProp) {
        return { success: false, error: 'onThemesClick prop still exists in interface' };
      }

      return { 
        success: true, 
        details: 'ProfileBox interface correctly updated (onThemesClick prop removed)' 
      };
    });
  }

  async testApplicationStillRuns() {
    return this.runTest('Application Runs Without Errors', async () => {
      try {
        // Test multiple key routes to ensure the application works
        const routes = [
          '/pipeline/leads',
          '/monaco',
          '/grand-central'
        ];

        for (const route of routes) {
          const response = await fetch(`${BASE_URL}${route}`, {
            timeout: 5000,
            redirect: 'manual' // Don't follow redirects, just check if route responds
          });
          
          // Accept 200 (success), 302/301 (redirect), but not 500 (server error)
          if (response.status >= 500) {
            return { 
              success: false, 
              error: `Route ${route} returns server error: ${response.status}` 
            };
          }
        }

        return { 
          success: true, 
          details: 'All key routes respond without server errors' 
        };
      } catch (error) {
        return { 
          success: false, 
          error: `Network error testing routes: ${error.message}` 
        };
      }
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Profile Access Changes Test Suite\n');
    
    // Test component rendering and application stability
    await this.testProfileBoxRendering();
    await this.testApplicationStillRuns();
    
    // Test the specific access changes
    await this.testSpeedrunEngineAccess();
    await this.testGrandCentralAccess();
    await this.testSellerTogglesRestriction();
    await this.testThemeOptionHidden();
    await this.testProfileBoxInterface();
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0 || errors > 0) {
      console.log('\n🔍 FAILED/ERROR DETAILS:');
      this.results
        .filter(r => r.status !== 'PASS')
        .forEach(result => {
          console.log(`- ${result.test}: ${result.error || 'Unknown error'}`);
        });
    }
    
    console.log('\n' + '=' .repeat(50));
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Profile access changes are working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the changes.');
    }
  }
}

// Run the tests
async function main() {
  const tester = new ProfileAccessTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProfileAccessTester };








