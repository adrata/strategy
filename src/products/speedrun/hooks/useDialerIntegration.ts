import { useState, useCallback } from "react";
import { SpeedrunPerson, Note } from "../types/SpeedrunTypes";

interface UseDialerIntegrationProps {
  person: SpeedrunPerson;
  allPeople: SpeedrunPerson[];
  onComplete: (personId: number) => void;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export function useDialerIntegration({
  person,
  allPeople,
  onComplete,
  setNotes,
}: UseDialerIntegrationProps) {
  const [showAutoDialerPopup, setShowAutoDialerPopup] = useState(false);
  const [showPowerDialer, setShowPowerDialer] = useState(false);
  const [currentDialerContacts, setCurrentDialerContacts] = useState<
    Array<{
      id: number;
      name: string;
      phone: string;
      company: string;
      title: string;
      nextAction: string;
      priority: string;
    }>
  >([]);

  // Filter contacts with phone numbers for dialer
  const callableContacts = allPeople.filter(
    (p) => p['phone'] && p.phone.trim() !== "",
  );

  // Map to PowerDialer format
  const powerDialerContacts = callableContacts.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    company: p.company,
    title: p.title,
    nextAction: p.nextAction,
    priority: p.priority,
  }));

  const handleStartAutoDialer = useCallback(() => {
    setShowAutoDialerPopup(false);
    setCurrentDialerContacts(powerDialerContacts);
    setShowPowerDialer(true);
  }, [powerDialerContacts]);

  const handleDialSingle = useCallback((selectedPerson: SpeedrunPerson) => {
    setShowAutoDialerPopup(false);
    // Start PowerDialer with just this one person
    const singleContact = [
      {
        id: selectedPerson.id,
        name: selectedPerson.name,
        phone: selectedPerson.phone,
        company: selectedPerson.company,
        title: selectedPerson.title,
        nextAction: selectedPerson.nextAction,
        priority: selectedPerson.priority,
      },
    ];
    setCurrentDialerContacts(singleContact);
    setShowPowerDialer(true);
  }, []);

  const handleCallComplete = useCallback(
    (
      contactId: number,
      notes: string,
      outcome:
        | "connected"
        | "voicemail"
        | "no-answer"
        | "busy"
        | "pitched"
        | "demo-scheduled",
    ) => {
      console.log(
        `📞 Call completed for contact ${contactId}: ${outcome}`,
        notes,
      );

      // Add smart note handling based on outcome
      let systemNote = "";
      switch (outcome) {
        case "connected":
          systemNote = "Called, Answered - Had conversation with prospect";
          break;
        case "pitched":
          systemNote =
            "Called, Pitched - Presented solution, prospect showed interest";
          break;
        case "demo-scheduled":
          systemNote =
            "Called, Demo Scheduled - Successfully booked demonstration meeting";
          break;
        case "voicemail":
          systemNote = "Called, Voicemail - Left voicemail message";
          break;
        case "no-answer":
          systemNote = "Called, No Answer - Contact did not pick up";
          break;
        case "busy":
          systemNote = "Called, Busy - Line was busy, will try again later";
          break;
      }

      // Add system note to the notes
      const newNote: Note = {
        id: Date.now().toString(),
        content: notes ? `${systemNote}\n\nNotes: ${notes}` : systemNote,
        timestamp: new Date().toISOString(),
        author: "System",
      };

      setNotes((prev) => [newNote, ...prev]);
      onComplete(contactId);
    },
    [setNotes, onComplete],
  );

  const handleDialerClose = useCallback(() => {
    setShowPowerDialer(false);
  }, []);

  return {
    showAutoDialerPopup,
    setShowAutoDialerPopup,
    showPowerDialer,
    currentDialerContacts,
    callableContacts,
    handleStartAutoDialer,
    handleDialSingle,
    handleCallComplete,
    handleDialerClose,
  };
}
