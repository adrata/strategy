/**
 * 🚨 SPEEDRUN SIGNALS HOOK
 * 
 * Simple polling-based hook to check for new Speedrun signals
 * Much more reliable than Pusher for demo purposes
 */

import { useEffect, useState } from 'react';

export interface SpeedrunSignalData {
  type: 'BUYING_INTENT_DETECTED' | 'STATUS_CHANGE' | 'ENGAGEMENT_SPIKE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  contact: {
    id: string;
    name: string;
    company: string;
    type: 'lead' | 'contact';
  };
  note?: {
    title: string;
    content: string;
    source: string;
  };
  action: 'ADD_TO_SPEEDRUN' | 'MOVE_TO_TOP' | 'PRIORITY_BOOST';
  timestamp: string;
}

interface UseSpeedrunSignalsReturn {
  activeSignal: SpeedrunSignalData | null;
  hasActiveSignal: boolean;
  acceptSignal: () => Promise<void>;
  dismissSignal: () => void;
  getSignalDisplayText: () => {
    title: string;
    description: string;
    recommendation: string;
  };
}

export function useSpeedrunSignals(
  workspaceId: string,
  userId: string,
  onSignalAccepted?: (signal: SpeedrunSignalData) => void
): UseSpeedrunSignalsReturn {
  console.log('🚨 [useSpeedrunSignals] Hook initialized with workspaceId:', workspaceId, 'userId:', userId);
  
  const [activeSignal, setActiveSignal] = useState<SpeedrunSignalData | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Poll for new signals every 5 seconds
  useEffect(() => {
    if (!workspaceId || !userId) return;

    const checkForSignals = async () => {
      try {
        console.log('🔍 [Speedrun Signals] Checking for new signals...');
        
        // Call API to check for new signals since lastCheck
        const response = await fetch(`/api/speedrun/check-signals?workspaceId=${workspaceId}&since=${lastCheck.toISOString()}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.signal) {
            console.log('🚨 [Speedrun Signals] New signal received:', data.signal);
            setActiveSignal(data.signal);
            setLastCheck(new Date());
          }
        }
      } catch (error) {
        console.error('❌ [Speedrun Signals] Error checking for signals:', error);
      }
    };

    // Check immediately
    checkForSignals();

    // Then check every 30 seconds (reduced frequency for better performance)
    const interval = setInterval(checkForSignals, 30000);

    return () => clearInterval(interval);
  }, [workspaceId, userId, lastCheck]);

  // Accept signal and add to Speedrun
  const acceptSignal = async (): Promise<void> => {
    if (!activeSignal) return;

    try {
      console.log('🚨 [Speedrun Signals] Accepting signal for:', activeSignal?.contact?.name || 'Unknown');
      
      // Call the API to add contact to Speedrun
      const response = await fetch('/api/speedrun/add-from-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: activeSignal.contact.id,
          contactType: activeSignal.contact.type || 'lead',
          signal: activeSignal,
          workspaceId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Speedrun Signals] API Error:', response.status, errorText);
        throw new Error(`Failed to add contact to Speedrun: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [Speedrun Signals] API Response:', result);

      // Notify parent component
      if (onSignalAccepted) {
        onSignalAccepted(activeSignal);
      }

      // Clear the signal
      setActiveSignal(null);
      
      console.log('✅ [Speedrun Signals] Signal accepted:', activeSignal?.contact?.name || 'Unknown');
    } catch (error) {
      console.error('❌ [Speedrun Signals] Error accepting signal:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  // Dismiss signal without action
  const dismissSignal = (): void => {
    setActiveSignal(null);
    console.log('❌ [Speedrun Signals] Signal dismissed');
  };

  // Generate display text for Monaco Signal popup
  const getSignalDisplayText = () => {
    if (!activeSignal) {
      return {
        title: 'No Active Signal',
        description: '',
        recommendation: ''
      };
    }

    const getPriorityIcon = () => {
      switch (activeSignal.priority) {
        case 'URGENT': return '🔥';
        case 'HIGH': return '⚡';
        case 'MEDIUM': return '⚠️';
        default: return '💡';
      }
    };

    const getActionText = () => {
      switch (activeSignal.action) {
        case 'ADD_TO_SPEEDRUN': return 'Add to Speedrun';
        case 'MOVE_TO_TOP': return 'Move to #1 on Speedrun';
        case 'PRIORITY_BOOST': return 'Boost priority on Speedrun';
        default: return 'Take action';
      }
    };

    let title = '';
    let description = '';
    let recommendation = '';

    if (activeSignal['type'] === 'BUYING_INTENT_DETECTED') {
      title = `${getPriorityIcon()} Buying Intent Detected`;
      description = `${activeSignal?.contact?.name || 'Contact'} at ${activeSignal?.contact?.company || 'Company'} just showed buying signals!`;
      
      if (activeSignal.note) {
        description += ` Note: "${activeSignal.note.title}"`;
      }
      
      recommendation = `${getActionText()} (prime timing for outreach)`;
    } else if (activeSignal['type'] === 'STATUS_CHANGE') {
      title = `${getPriorityIcon()} Status Change Detected`;
      description = `${activeSignal?.contact?.name || 'Contact'} at ${activeSignal?.contact?.company || 'Company'} updated their status`;
      recommendation = `${getActionText()} based on new information`;
    } else {
      title = `${getPriorityIcon()} Engagement Spike`;
              description = `${activeSignal?.contact?.name || 'Contact'} at ${activeSignal?.contact?.company || 'Company'} showing increased engagement`;
      recommendation = `${getActionText()} while engagement is high`;
    }

    return { title, description, recommendation };
  };

  return {
    activeSignal,
    hasActiveSignal: !!activeSignal,
    acceptSignal,
    dismissSignal,
    getSignalDisplayText
  };
}

export default useSpeedrunSignals;
