
// 🚨 DIRECT MONACO SIGNAL POPUP TRIGGER
console.log('🚨 Triggering Monaco Signal popup directly...');

// Method 1: Dispatch the exact Command+I event that Monaco listens for
const cmdIEvent = new KeyboardEvent('keydown', {
  key: 'i',
  metaKey: true,
  bubbles: true,
  cancelable: true,
  which: 73,
  keyCode: 73
});

console.log('📍 Dispatching Command+I keyboard event...');
document.dispatchEvent(cmdIEvent);

// Method 2: Try to find and trigger React state directly (if possible)
setTimeout(() => {
  try {
    // Look for React component instances that might have setIsSlideUpVisible
    const reactInstances = Array.from(document.querySelectorAll('*')).map(el => {
      return el._reactInternalFiber || el._reactInternalInstance || el.__reactInternalInstance || el.__reactInternalFiber$;
    }).filter(Boolean);
    
    console.log('📍 Found', reactInstances.length, 'React instances');
    
    // Try dispatching a custom event that Monaco might listen for
    window.dispatchEvent(new CustomEvent('monaco-signal-trigger', {
      detail: {
        type: 'BUYING_INTENT_DETECTED',
        priority: 'HIGH',
        contact: {
          id: 'test-signal-' + Date.now(),
          name: 'Sarah Mitchell',
          company: 'Retail Solutions Inc',
          type: 'prospect'
        },
        note: {
          title: 'Strong Buying Intent',
          content: 'Looking to purchase a solution soon - budget approved!',
          source: 'manual_test'
        }
      }
    }));
    
    console.log('📍 Dispatched custom monaco-signal-trigger event');
    
  } catch (e) {
    console.log('⚠️ Could not access React internals:', e.message);
  }
}, 100);

// Method 3: Try alternative keyboard events
setTimeout(() => {
  console.log('📍 Trying alternative keyboard event formats...');
  
  // Try with different key properties
  const altEvent1 = new KeyboardEvent('keydown', {
    key: 'i',
    code: 'KeyI',
    metaKey: true,
    bubbles: true,
    cancelable: true
  });
  
  const altEvent2 = new KeyboardEvent('keydown', {
    keyCode: 73,
    which: 73,
    metaKey: true,
    bubbles: true,
    cancelable: true
  });
  
  document.dispatchEvent(altEvent1);
  document.dispatchEvent(altEvent2);
  
  console.log('📍 Dispatched alternative keyboard events');
}, 200);

// Method 4: Try focus-based approach
setTimeout(() => {
  console.log('📍 Trying focus-based approach...');
  
  // Focus on the main content area first
  const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  if (mainContent) {
    mainContent.focus();
    
    // Then dispatch the event from the focused element
    const focusedEvent = new KeyboardEvent('keydown', {
      key: 'i',
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    
    mainContent.dispatchEvent(focusedEvent);
    console.log('📍 Dispatched from focused element');
  }
}, 300);

// Method 5: Listen for Monaco state changes
setTimeout(() => {
  console.log('📍 Setting up Monaco state listener...');
  
  // Watch for any slide-up elements appearing
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList) {
          if (node.classList.contains('slide-in-from-right') || 
              node.querySelector && node.querySelector('.slide-in-from-right')) {
            console.log('✅ Monaco popup detected!', node);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Stop observing after 5 seconds
  setTimeout(() => observer.disconnect(), 5000);
  
}, 400);

console.log('🎯 All Monaco Signal trigger methods attempted!');
console.log('👀 Look for a popup in the bottom-right corner');
console.log('⚡ If nothing appears, try pressing Cmd+I manually on your keyboard');
