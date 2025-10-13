"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { SpeedrunRecordTemplate } from "./components/SpeedrunRecordTemplate";
import { SnoozeRemoveModal } from "./SnoozeRemoveModal";
import { AIEmailComposer } from "./AIEmailComposer";
import { PowerDialer } from "./components/PowerDialer";
import { sendEmail, type EmailData } from "./EmailService";
import { useUnifiedAuth } from "@/platform/auth";
import { CompleteActionModal, ActionLogData } from "./components/CompleteActionModal";
import { TodayActivityTracker } from "./TodayActivityTracker";
import { getCommonShortcut, COMMON_SHORTCUTS } from '@/platform/utils/keyboard-shortcuts';
import { CongratulationsModal } from "./components/CongratulationsModal";

// EmailData will be imported from EmailService, removing duplicate type definition

interface SpeedrunPerson {
  id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  mobilePhone?: string;
  linkedin?: string;
  photo: string | null;
  priority: string;
  status: string;
  lastContact: string;
  nextAction: string;
  relationship: string;
  bio: string;
  interests: string[];
  recentActivity: string;
  commission: string;
  stableIndex?: number | undefined; // Add stable index that doesn't change when people are completed
}

interface SpeedrunContentProps {
  isSpeedrunStarted: boolean;
  setIsSpeedrunStarted: (started: boolean) => void;
  selectedPerson: SpeedrunPerson | null;
  setSelectedPerson: (person: SpeedrunPerson | null) => void;
  SpeedrunPeople: SpeedrunPerson[];
  onPersonComplete: (personId: number) => void;
  onPersonSkip?: (personId: number) => void;
  readyCount: number;
  doneCount: number;
  onAddMore: () => void;
  onCompanyClick?: (company: string) => void;
  dailyProgress: {
    completed: number;
    target: number;
    percentage: number;
    isComplete: boolean;
  };
  weeklyProgress: {
    completed: number;
    target: number;
    percentage: number;
    isComplete: boolean;
  };
  // New achievement tracking props
  onOutreachSent?: (count: number) => Promise<void>;
  onAddMoreLeads?: (addedCount: number) => Promise<void>;
  currentStats?: {
    today: number;
    thisWeek: number;
    totalAdded: number;
    lastAddedCount: number;
  };
  targets?: {
    daily: number;
    weekly: number;
    userId?: string;
  };
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "#ef4444"; // red-500
    case "Urgent":
      return "#dc2626"; // red-600
    case "Medium":
      return "#f59e0b"; // amber-500
    case "Low":
      return "#10b981"; // emerald-500
    case "Critical":
      return "#7c2d12"; // red-900
    default:
      return "#6b7280";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "#10b981"; // emerald-500
    case "Engaged":
      return "#3b82f6"; // blue-500
    case "Decision":
      return "#8b5cf6"; // violet-500
    case "Qualified":
      return "#06b6d4"; // cyan-500
    case "New":
      return "#93c5fd"; // blue-300
    case "Research":
      return "#bfdbfe"; // blue-200
    case "Prospect":
      return "#dbeafe"; // blue-100
    default:
      return "#6b7280";
  }
};

// ⚡ LIGHTNING-FAST: Memoize the heavy component to prevent unnecessary re-renders
export const SpeedrunContent = React.memo(function SpeedrunContent({
  isSpeedrunStarted,
  setIsSpeedrunStarted,
  selectedPerson,
  setSelectedPerson,
  SpeedrunPeople,
  onPersonComplete,
  onPersonSkip,
  readyCount,
  doneCount,
  onAddMore,
  onCompanyClick,
  dailyProgress,
  weeklyProgress,
  onOutreachSent,
  onAddMoreLeads,
  currentStats,
  targets,
}: SpeedrunContentProps) {
  console.log("🎬 SpeedrunContent: Component starting with props:", {
    isSpeedrunStarted,
    selectedPersonName: selectedPerson?.name,
    selectedPersonId: selectedPerson?.id,
    selectedPersonCompany: selectedPerson?.company,
    SpeedrunPeopleCount: SpeedrunPeople.length,
    readyCount,
    doneCount,
    timestamp: Date.now(),
  });

  const [showSnoozeRemoveModal, setShowSnoozeRemoveModal] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showPowerDialer, setShowPowerDialer] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [batchInfo, setBatchInfo] = useState<{
    batchNumber: number;
    completedCount: number;
    message?: string;
  } | null>(null);

  // Track completed IDs for potential future use
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  // Undo system state
  const [lastCompletedAction, setLastCompletedAction] = useState<{
    actionData: ActionLogData;
    person: SpeedrunPerson;
    actionId: string; // Store the action ID for deletion
    wasCompleted: boolean;
  } | null>(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  let user;
  try {
    const authResult = useUnifiedAuth();
    user = authResult.user;
    console.log("✅ SpeedrunContent: useUnifiedAuth successful");
  } catch (error) {
    console.error("❌ SpeedrunContent: useUnifiedAuth failed:", error);
    user = null;
  }

  // Debug effect to track selectedPerson changes and ensure middle panel updates
  useEffect(() => {
    console.log(
      "🔥 [SYNC DEBUG] SpeedrunContent: selectedPerson changed to:",
      selectedPerson?.name || "null",
      "ID:",
      selectedPerson?.id || "none",
    );

    // Force re-render check for center panel
    if (selectedPerson) {
      console.log(
        "🔥 [SYNC DEBUG] SpeedrunContent: Should show center panel for:",
        selectedPerson.name,
      );
      console.log("🔥 [SYNC DEBUG] SpeedrunContent: Person data:", {
        id: selectedPerson.id,
        name: selectedPerson.name,
        company: selectedPerson.company,
        title: selectedPerson.title,
        email: selectedPerson.email,
        status: selectedPerson.status,
        relationship: selectedPerson.relationship,
        priority: selectedPerson.priority,
        source: "production-data",
        reactKey: `lead-${selectedPerson.id}-${Date.now()}`,
      });

      // FORCE STATE UPDATE: Force component to recognize this is a new person
      setTimeout(() => {
        console.log(
          "🔥 [SYNC DEBUG] Delayed verification - selectedPerson is still:",
          selectedPerson?.name,
        );
        console.log(
          "🔥 [SYNC DEBUG] Middle panel should be showing details for:",
          selectedPerson?.name,
        );
      }, 100);
    } else {
      console.log(
        "🔥 [SYNC DEBUG] SpeedrunContent: No person selected - should show welcome screen",
      );
    }
  }, [selectedPerson]);

  // Cross-platform keyboard shortcut detection
  const isModifierKeyPressed = (event: KeyboardEvent) => {
    // Mac: metaKey (⌘), Windows/Linux: ctrlKey (Ctrl)
    // Also check for both to handle edge cases
    return event.metaKey || event.ctrlKey;
  };

  // Listen for batch completion events
  useEffect(() => {
    const handleBatchComplete = (event: CustomEvent) => {
      const { batchNumber, completedCount, message } = event.detail;
      setBatchInfo({ batchNumber, completedCount, message });
      setShowCongratulationsModal(true);
    };

    window.addEventListener('speedrun-batch-complete', handleBatchComplete as EventListener);

    return () => {
      window.removeEventListener('speedrun-batch-complete', handleBatchComplete as EventListener);
    };
  }, []);


  // Generate random success messages
  const getRandomSuccessMessage = () => {
    const messages = [
      "Nice work! 🎯",
      "Great job! ⚡",
      "Excellent! 🚀",
      "Well done! 💪",
      "Outstanding! 🌟",
      "Fantastic! 🎉",
      "Amazing! 🔥",
      "Perfect! ✅",
      "Brilliant! 💎",
      "Incredible! 🎊",
      "Superb! 🏆",
      "Outstanding work! 🎯",
      "You're on fire! 🔥",
      "Keep it up! 💪",
      "Crushing it! 🚀"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Show success message with auto-hide
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000); // Hide after 3 seconds
  };

  // Undo system - handle ⌘Z/Ctrl+Z to undo last action
  useEffect(() => {
    const handleUndoKeyDown = (event: KeyboardEvent) => {
      // Debug logging
      console.log('🔍 Key pressed:', {
        key: event.key,
        code: event.code,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        hasLastAction: !!lastCompletedAction,
        modalsOpen: {
          complete: showCompleteModal,
          snooze: showSnoozeRemoveModal,
          email: showEmailComposer,
          dialer: showPowerDialer
        }
      });

      // Check for ⌘Z (Mac) or Ctrl+Z (Windows/Linux) - ensure no Shift key
      if (isModifierKeyPressed(event) && event.key === 'z' && !event.shiftKey && !event.altKey) {
        console.log('🎯 Undo shortcut detected!');
        event.preventDefault();
        event.stopPropagation();
        
        // Only allow undo if we have a last completed action and no modal is open
        if (lastCompletedAction && !showCompleteModal && !showSnoozeRemoveModal && !showEmailComposer && !showPowerDialer) {
          console.log('🔄 Undoing last action for:', lastCompletedAction.person.name);
          
          // Delete the action from the database
          handleUndoAction(lastCompletedAction);
        } else {
          console.log('❌ Undo blocked:', {
            hasLastAction: !!lastCompletedAction,
            modalsOpen: showCompleteModal || showSnoozeRemoveModal || showEmailComposer || showPowerDialer
          });
        }
      }
    };

    // Add event listener with capture to ensure we get the event early
    document.addEventListener('keydown', handleUndoKeyDown, true);
    return () => document.removeEventListener('keydown', handleUndoKeyDown, true);
  }, [lastCompletedAction, showCompleteModal, showSnoozeRemoveModal, showEmailComposer, showPowerDialer, handleUndoAction]);

  // Handle undo action - delete from database and restore person
  const handleUndoAction = useCallback(async (undoData: typeof lastCompletedAction) => {
    if (!undoData) return;

    try {
      console.log('🗑️ Deleting action from database:', undoData.actionId);
      
      // Delete the action from the database
      const response = await fetch('/api/speedrun/action-log', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId: undoData.actionId,
          personId: undoData.person.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete action log');
      }

      console.log('✅ Action deleted from database');

      // Restore the person to the speedrun list
      // Note: This would need to be implemented in the parent component
      // For now, we'll just set the person as selected and reopen the modal
      setSelectedPerson(undoData.person);
      setShowCompleteModal(true);
      
      // Clear the undo data
      setLastCompletedAction(null);
      
    } catch (error) {
      console.error('❌ Error undoing action:', error);
      alert('Failed to undo action. Please try again.');
    }
  }, []);

  // REMOVED: Auto-selection is now handled at the provider level to prevent conflicts
  // This ensures consistent state management and eliminates race conditions

  // Filter contacts with phone numbers for dialer
  const callableContacts = SpeedrunPeople
    .filter((person) => person['phone'] && person.phone.trim() !== "")
    .map((person) => ({
      id: person.id,
      name: person.name,
      phone: person.phone,
      company: person.company,
      title: person.title,
      nextAction: person.nextAction,
      priority: person.priority,
    }));

  const handleStartPowerDialer = () => {
    if (callableContacts['length'] === 0) {
      alert("No contacts with phone numbers found!");
      return;
    }
    setShowPowerDialer(true);
  };

  const handleCallComplete = (
    contactId: number,
    notes: string,
    outcome:
      | "connected"
      | "voicemail"
      | "no-answer"
      | "busy"
      | "pitched"
      | "demo-scheduled"
      | "not-interested"
      | "callback-later"
      | "wrong-number"
      | "failed",
  ) => {
    console.log(
      `📞 Call completed for contact ${contactId}: ${outcome}`,
      notes,
    );

    // Mark the contact as complete in the speedrun
    onPersonComplete(contactId);

    // Here you could also save the call notes and outcome to your database
    // await saveCallNotes(contactId, notes, outcome);
  };

  const handleDialerClose = () => {
    setShowPowerDialer(false);
  };

  // Wrap onAddMore to track achievements
  const handleAddMoreClick = useCallback(() => {
    // Simulate adding leads (in real implementation, this would come from the modal/dialog)
    const addedCount = Math.floor(Math.random() * 30) + 10; // 10-40 leads added

    if (onAddMoreLeads) {
      onAddMoreLeads(addedCount).catch(console.error);
    }

    onAddMore();
  }, [onAddMore, onAddMoreLeads]);

  const handleComplete = useCallback((personId?: number) => {
    // Use passed personId or fall back to selectedPerson
    const targetPerson = personId ? SpeedrunPeople.find(p => p['id'] === personId) : selectedPerson;
    
    if (!targetPerson) {
      console.warn("❌ No person found for completion");
      return;
    }

    console.log(`📝 Opening complete modal for ${targetPerson.name} (ID: ${targetPerson.id})`);
    
    // Ensure the target person is selected before showing modal
    if (targetPerson.id !== selectedPerson?.id) {
      setSelectedPerson(targetPerson);
    }
    
    setShowCompleteModal(true);
  }, [selectedPerson, SpeedrunPeople, setSelectedPerson]);

  const handleActionLogSubmit = useCallback(async (actionData: ActionLogData) => {
    if (!selectedPerson || !user) return;

    // Check if this is a resubmission after undo (has lastCompletedAction)
    const isResubmission = !!lastCompletedAction;
    
    if (isResubmission) {
      console.log('🔄 Processing resubmission after undo - will save to database');
      // Clear undo data since we're resubmitting
      setLastCompletedAction(null);
    }

    setIsSubmittingAction(true);
    
    try {
      // Get workspace context
      const { workspaceId, userId } = await WorkspaceDataRouter.getApiParams();
      
      // Save action log to backend
      const response = await fetch('/api/speedrun/action-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: selectedPerson.id,
          personName: selectedPerson.name,
          actionType: actionData.type,
          notes: actionData.notes,
          nextAction: actionData.nextAction,
          nextActionDate: actionData.nextActionDate,
          workspaceId,
          userId,
          actionPerformedBy: actionData.actionPerformedBy || userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save action log');
      }

      const result = await response.json();
      const actionId = result.data?.id;

      console.log(`✅ Action log saved for ${selectedPerson.name} with ID: ${actionId}`);

      // Show success message
      showSuccessMessage(getRandomSuccessMessage());

      // Store action data for potential undo AFTER successful save
      setLastCompletedAction({
        actionData: { ...actionData },
        person: { ...selectedPerson },
        actionId: actionId || '',
        wasCompleted: true
      });

      // Get next person BEFORE marking as completed (since onPersonComplete will modify the array)
      const currentIndex = SpeedrunPeople.findIndex(
        (p) => p['id'] === selectedPerson.id,
      );
      const nextPerson = SpeedrunPeople[currentIndex + 1];
      
      // Mark as completed in the speedrun system
      onPersonComplete(selectedPerson.id);

      // Auto-advance to next person
      if (nextPerson) {
        console.log(`➡️ Advancing to next person: ${nextPerson.name}`);
        setSelectedPerson(nextPerson);
      } else {
        console.log(`🏁 No more people to advance to`);
        setSelectedPerson(null);
      }

      // Close modal
      setShowCompleteModal(false);
      
    } catch (error) {
      console.error('❌ Error saving action log:', error);
      alert('Failed to save action log. Please try again.');
      // Clear undo data on error
      setLastCompletedAction(null);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [selectedPerson, user, onPersonComplete, SpeedrunPeople, setSelectedPerson, lastCompletedAction]);

  const handleSkip = useCallback(() => {
    if (!selectedPerson || !onPersonSkip) return;

    console.log(`⏭️ Skipping ${selectedPerson.name}`);
    
    // Get next person BEFORE skipping (since onPersonSkip will modify the array)
    const currentIndex = SpeedrunPeople.findIndex(
      (p) => p['id'] === selectedPerson.id,
    );
    const nextPerson = SpeedrunPeople[currentIndex + 1];
    
    onPersonSkip(selectedPerson.id);

    // Auto-advance to next person
    if (nextPerson) {
      console.log(`➡️ Advancing to next person: ${nextPerson.name}`);
      setSelectedPerson(nextPerson);
    } else {
      console.log(`🏁 No more people to advance to`);
      setSelectedPerson(null);
    }
  }, [selectedPerson, onPersonSkip, SpeedrunPeople, setSelectedPerson]);

  const handleSnoozeRemoveAction = useCallback(
    (action: "snoozed" | "removed", leadId: string) => {
      // Remove the person from the list
      const currentIndex = SpeedrunPeople.findIndex(
        (p) => p['id'] === parseInt(leadId),
      );
      const nextPerson = SpeedrunPeople[currentIndex + 1];

      // Track snooze/remove action

      // Auto-advance to next person
      if (nextPerson) {
        setSelectedPerson(nextPerson);
      } else {
        setSelectedPerson(null);
      }

      console.log(`📋 Lead ${leadId} ${action}`);
    },
    [SpeedrunPeople, setSelectedPerson],
  );

  const handleSendEmail = useCallback(
    async (subject: string, body: string): Promise<boolean> => {
      if (!selectedPerson) return false;

      try {
        const emailData: EmailData = {
          to: selectedPerson.email,
          subject,
          body,
          leadId: selectedPerson.id.toString(),
          type: "introduction", // Could be determined by AI or user selection
        };

        const success = await sendEmail(emailData);

        if (success) {
          console.log(`✅ Email sent to ${selectedPerson.name}`);

          // 🚨 CRITICAL: Record email activity for smart ranking
          TodayActivityTracker.recordEmailSent(
            selectedPerson.id.toString(),
            selectedPerson.name,
            selectedPerson.company,
            "sent"
          );

          // Track outreach achievement
          if (onOutreachSent) {
            onOutreachSent(1).catch(console.error);
          }

          // Optionally mark as completed or advance to next person
          return true;
        } else {
          console.error(`❌ Failed to send email to ${selectedPerson.name}`);
          return false;
        }
      } catch (error) {
        console.error("❌ Error in handleSendEmail:", error);
        return false;
      }
    },
    [selectedPerson, onOutreachSent],
  );

  // Render the modals outside all the conditional returns
  const renderModals = () => {
    if (!selectedPerson) return null;

    return (
      <>
        <SnoozeRemoveModal
          isOpen={showSnoozeRemoveModal}
          onClose={() => setShowSnoozeRemoveModal(false)}
          leadId={selectedPerson.id.toString()}
          leadName={selectedPerson.name}
          leadCompany={selectedPerson.company}
          onAction={handleSnoozeRemoveAction}
        />

        <AIEmailComposer
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          leadName={selectedPerson.name}
          leadCompany={selectedPerson.company}
          leadTitle={selectedPerson.title}
          leadEmail={selectedPerson.email}
          leadLinkedIn={selectedPerson.linkedin || ""}
          leadBio={selectedPerson.bio}
          leadRecentActivity={selectedPerson.recentActivity}
          onSendEmail={handleSendEmail}
        />

        <CompleteActionModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={handleActionLogSubmit}
          personName={selectedPerson.name}
          isLoading={isSubmittingAction}
          initialData={lastCompletedAction?.actionData}
        />

        <CongratulationsModal
          isOpen={showCongratulationsModal}
          onClose={() => setShowCongratulationsModal(false)}
          batchNumber={batchInfo?.batchNumber || 1}
          completedCount={batchInfo?.completedCount || 50}
          message={batchInfo?.message}
        />
      </>
    );
  };

  // Simplified for Tauri compatibility - removed complex dependencies

  // Main content logic - simplified to always show lead details when person is selected
  let content: React.ReactNode;

  // If we have a selected person, show their details
  if (selectedPerson) {
    content = (
      <SpeedrunRecordTemplate
        key={selectedPerson.id}
        person={selectedPerson}
        personIndex={SpeedrunPeople.findIndex((p) => p['id'] === selectedPerson.id)}
        totalPersons={SpeedrunPeople.length}
        allPeople={SpeedrunPeople}
        onBack={() => {
          console.log("🔙 Navigating back to lead list");
          setSelectedPerson(null);
        }}
        onNavigatePrevious={() => {
          const currentIndex = SpeedrunPeople.findIndex(
            (p) => p['id'] === selectedPerson.id,
          );
          if (currentIndex > 0) {
            const previousPerson = SpeedrunPeople[currentIndex - 1];
            console.log(`⬅️ Navigating to previous: ${previousPerson?.name}`);
            setSelectedPerson(previousPerson || null);
          }
        }}
        onNavigateNext={() => {
          const currentIndex = SpeedrunPeople.findIndex(
            (p) => p['id'] === selectedPerson.id,
          );
          if (currentIndex < SpeedrunPeople.length - 1) {
            const nextPerson = SpeedrunPeople[currentIndex + 1];
            console.log(`➡️ Navigating to next: ${nextPerson?.name}`);
            setSelectedPerson(nextPerson || null);
          }
        }}
        onSnooze={(personId: number) => {
          console.log(`😴 Snoozing person with ID: ${personId}`);
          if (onPersonSkip) {
            onPersonSkip(personId);
          }
        }}
        onRemove={async (personId: number) => {
          console.log(`🗑️ Removing person with ID: ${personId}`);
          
          // Import the delete service
          const { SpeedrunDeleteService } = await import('@/platform/services/speedrun-delete-service');
          
          try {
            // Determine record type and call appropriate delete method
            const person = SpeedrunPeople.find(p => p['id'] === personId);
            if (!person) {
              SpeedrunDeleteService.showErrorMessage('Person not found');
              return;
            }
            
            // For now, assume it's a lead - you can enhance this logic based on your data structure
            const result = await SpeedrunDeleteService.deleteLead(String(personId), {
              reason: 'Removed from Speedrun'
            });
            
            if (result.success) {
              SpeedrunDeleteService.showSuccessMessage(result.message);
              
              // Also remove from local state
              if (onPersonSkip) {
                onPersonSkip(personId);
              }
            } else {
              SpeedrunDeleteService.showErrorMessage(result.message);
            }
            
          } catch (error) {
            console.error('Error deleting person:', error);
            SpeedrunDeleteService.showErrorMessage('Failed to delete person');
          }
        }}
        onComplete={handleComplete}
      />
    );
  }
  // If no person selected but we have people, show simple message
  else if (SpeedrunPeople.length > 0) {
    content = (
      <div className="p-4 bg-[var(--background)] h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Ready for Outreach
          </h2>
          <p className="text-[var(--muted)] mb-4">
            Select a contact from the left to begin your outreach workflow
          </p>
          <p className="text-sm text-[var(--muted)]">
            {SpeedrunPeople.length} contacts ready for outreach
          </p>
        </div>
      </div>
    );
  }
  // If no people at all, show loading state
  else {
    content = (
      <div className="p-4 bg-[var(--background)] h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Loading Contacts
          </h2>
          <p className="text-[var(--muted)] mb-4">
            Preparing your outreach workflow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      {renderModals()}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Debug: Undo Available Indicator */}
      {lastCompletedAction && !showCompleteModal && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Press {getCommonShortcut('UNDO')} to undo</span>
            </div>
          </div>
        </div>
      )}

      {/* Power Dialer Modal */}
      {showPowerDialer && (
        <PowerDialer
          contacts={callableContacts}
          onCallComplete={handleCallComplete}
          onDialerClose={handleDialerClose}
          userId={user?.id || "anonymous"}
          workspaceId={user?.activeWorkspaceId || user?.workspaces?.[0]?.id || ""}
        />
      )}
    </>
  );
}); // End of React.memo
