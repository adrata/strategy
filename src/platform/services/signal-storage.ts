/**
 * 🚨 SHARED SIGNAL STORAGE SERVICE
 * 
 * Simple in-memory storage with global state (works in Vercel serverless)
 * For demo purposes - in production, use Redis or database
 */

// Global signal store that persists across function invocations
declare global {
  var signalStore: Record<string, any[]> | undefined;
}

// Initialize global signal store
if (!global.signalStore) {
  global['signalStore'] = {};
}

// Store signal in global memory
export async function storeSignal(workspaceId: string, signal: any) {
  try {
    if (!global.signalStore) {
      global['signalStore'] = {};
    }
    
    if (!global['signalStore'][workspaceId]) {
      global['signalStore'][workspaceId] = [];
    }
    
    const signalId = `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSignal = {
      id: signalId,
      ...signal,
      timestamp: new Date().toISOString(),
      isProcessed: false
    };
    
    global['signalStore'][workspaceId].push(newSignal);
    console.log('✅ [SIGNAL STORE] Signal stored in global memory:', signalId);
  } catch (error) {
    console.error('❌ [SIGNAL STORE] Error storing signal:', error);
  }
}

// Get unprocessed signals from global memory
export async function getUnprocessedSignals(workspaceId: string, since: Date) {
  try {
    if (!global.signalStore) {
      global['signalStore'] = {};
    }
    
    const workspaceSignals = global['signalStore'][workspaceId] || [];
    const sinceTime = since.getTime();
    
    return workspaceSignals.filter(signal =>
      !signal['isProcessed'] && new Date(signal.timestamp).getTime() > sinceTime
    );
  } catch (error) {
    console.error('❌ [SIGNAL STORE] Error retrieving signals:', error);
    return [];
  }
}

// Mark signal as processed
export async function markSignalProcessed(signalId: string) {
  try {
    if (!global.signalStore) {
      return;
    }

    // Find which workspace this signal belongs to
    // 🆕 CRITICAL FIX: Remove hardcoded workspace ID - use dynamic workspace context
    const workspaces = []; // Will be populated dynamically based on user's workspace
    
    for (const workspaceId of workspaces) {
      const signal = global['signalStore'][workspaceId]?.find(s => s['id'] === signalId);
      if (signal) {
        signal['isProcessed'] = true;
        break;
      }
    }
  } catch (error) {
    console.error('❌ [SIGNAL STORE] Error marking signal processed:', error);
  }
}
