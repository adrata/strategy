import { useState, useCallback } from "react";
import { SpeedrunPerson } from "../types/SpeedrunTypes";

interface UseSpeedrunActionsProps {
  person: SpeedrunPerson;
  onComplete: (personId: number) => void;
  onSnooze: (personId: number) => void;
  onRemove: (personId: number) => void;
}

export function useSpeedrunActions({
  person,
  onComplete,
  onSnooze,
  onRemove,
}: UseSpeedrunActionsProps) {
  const [isListening, setIsListening] = useState(false);

  const handlePulse = useCallback(() => {
    setIsListening(!isListening);
    if (!isListening) {
      console.log(`🎯 Starting Pulse for ${person?.name || 'Unknown'}`);
    } else {
      console.log(`⏹️ Stopping Pulse for ${person?.name || 'Unknown'}`);
    }
  }, [isListening, person.name]);

  const handleComplete = useCallback(() => {
    console.log(`🎯 COMPLETING PERSON: ${person?.name || 'Unknown'} (ID: ${person?.id || 'Unknown'})`);
    onComplete(person.id);
  }, [person.id, person.name, onComplete]);

  const handleSnooze = useCallback(() => {
    console.log(`⏰ SNOOZING PERSON: ${person?.name || 'Unknown'} (ID: ${person?.id || 'Unknown'})`);
    onSnooze(person.id);
  }, [person.id, person.name, onSnooze]);

  const handleRemove = useCallback(() => {
    console.log(`🗑️ REMOVING PERSON: ${person?.name || 'Unknown'} (ID: ${person?.id || 'Unknown'})`);
    onRemove(person.id);
  }, [person.id, person.name, onRemove]);

  return {
    isListening,
    handlePulse,
    handleComplete,
    handleSnooze,
    handleRemove,
  };
}
