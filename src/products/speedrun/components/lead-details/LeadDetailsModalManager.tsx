import React from "react";
import { LeadDetailsModalManagerProps } from "./LeadDetailsTypes";
import { LeadDetailsUtilities } from "./LeadDetailsUtilities";

// Import modal components
import { AutoDialerPopup } from "../../AutoDialerPopup";
import { PowerDialer } from "../PowerDialer";
import { SnoozeRemoveModal } from "../../SnoozeRemoveModal";

export function LeadDetailsModalManager({
  person,
  allPeople,
  showSnoozeRemoveModal,
  showAutoDialerPopup,
  showPowerDialer,
  currentDialerContacts,
  userId,
  workspaceId,
  onSnoozeRemoveModalClose,
  onAutoDialerClose,
  onPowerDialerClose,
  onSnooze,
  onRemove,
  onComplete,
  onStartAutoDialer,
  onDialSingle,
  onCallComplete,
}: LeadDetailsModalManagerProps) {
  const callableContacts = LeadDetailsUtilities.getCallableContacts(allPeople);

  return (
    <>
      {/* Snooze/Remove Modal */}
      <SnoozeRemoveModal
        isOpen={showSnoozeRemoveModal}
        onClose={onSnoozeRemoveModalClose}
        leadId={person.id.toString()}
        leadName={person.name}
        leadCompany={typeof person.company === 'object' ? person.company?.name : person.company}
        onAction={(action, leadId) => {
          if (action === "snoozed") {
            onSnooze(parseInt(leadId));
          } else if (action === "removed") {
            onRemove(parseInt(leadId));
          }
          onSnoozeRemoveModalClose();
        }}
      />

      {/* Auto Dialer Popup */}
      <AutoDialerPopup
        isOpen={showAutoDialerPopup}
        onClose={onAutoDialerClose}
        selectedPerson={person}
        allCallableContacts={callableContacts}
        onStartAutoDialer={onStartAutoDialer}
        onDialSingle={onDialSingle}
      />

      {/* Power Dialer */}
      {showPowerDialer && (
        <PowerDialer
          contacts={currentDialerContacts}
          onCallComplete={onCallComplete}
          onDialerClose={onPowerDialerClose}
          userId={userId}
          workspaceId={workspaceId}
        />
      )}
    </>
  );
}
