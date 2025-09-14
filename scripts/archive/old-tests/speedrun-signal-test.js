
// 🚨 SPEEDRUN SIGNAL POPUP TEST
console.log('🚨 Testing Monaco Signal popup on Pipeline Speedrun...');

// Check if we're on the right page
const currentPath = window.location.pathname;
console.log('📍 Current page:', currentPath);

if (!currentPath.includes('/pipeline/speedrun')) {
  console.log('❌ You need to be on /pipeline/speedrun page!');
  console.log('🌐 Go to: http://localhost:3000/pipeline/speedrun');
} else {
  console.log('✅ On correct page - Pipeline Speedrun');
  
  // Method 1: Keyboard event (should work now)
  console.log('📍 Method 1: Dispatching Command+I event...');
  const cmdIEvent = new KeyboardEvent('keydown', {
    key: 'i',
    metaKey: true,
    bubbles: true,
    cancelable: true,
    which: 73,
    keyCode: 73
  });
  
  document.dispatchEvent(cmdIEvent);
  console.log('✅ Command+I event dispatched');
  
  // Method 2: Alternative keyboard event
  setTimeout(() => {
    console.log('📍 Method 2: Alternative keyboard event...');
    const altEvent = new KeyboardEvent('keydown', {
      key: 'i',
      code: 'KeyI',
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(altEvent);
    console.log('✅ Alternative event dispatched');
  }, 500);
  
  // Method 3: Focus and try again
  setTimeout(() => {
    console.log('📍 Method 3: Focus body and try again...');
    document.body.focus();
    const focusedEvent = new KeyboardEvent('keydown', {
      key: 'i',
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    document.body.dispatchEvent(focusedEvent);
    console.log('✅ Focused event dispatched');
  }, 1000);
  
  // Method 4: Direct state manipulation (if React DevTools available)
  setTimeout(() => {
    console.log('📍 Method 4: Looking for React components...');
    
    // Look for elements that might contain React state
    const potentialReactElements = document.querySelectorAll('[data-reactroot], #__next, main, div[class*="pipeline"]');
    console.log('📍 Found', potentialReactElements.length, 'potential React elements');
    
    // Try to trigger custom events that React might listen for
    const customEvent = new CustomEvent('pipeline-speedrun-signal', {
      detail: { action: 'show-popup' }
    });
    
    document.dispatchEvent(customEvent);
    window.dispatchEvent(customEvent);
    console.log('✅ Custom events dispatched');
  }, 1500);
}

console.log('🎯 All methods attempted!');
console.log('👀 Look for a popup in the bottom-right corner');
console.log('⚡ If nothing appears, check browser console for error messages');
console.log('🔧 Also try pressing Cmd+I manually on your keyboard');
