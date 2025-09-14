import { useEffect } from "react";
import { SpeedrunPerson } from "../types/SpeedrunTypes";

interface UseKeyboardShortcutsProps {
  person: SpeedrunPerson;
  onComplete: (personId: number) => void;
  setShowAutoDialerPopup: (show: boolean) => void;
}

export function useKeyboardShortcuts({
  person,
  onComplete,
  setShowAutoDialerPopup,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when this component is active
      // Check if we're in an input field or textarea
      const target = event.target as HTMLElement;
      const isInputField =
        target['tagName'] === "INPUT" ||
        target['tagName'] === "TEXTAREA" ||
        target['contentEditable'] === "true";

      // Command+Return for speedrunng as DONE - Enhanced detection
      if (
        (event.metaKey || event.ctrlKey) &&
        (event['key'] === "Enter" || event['keyCode'] === 13)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log(
          `⌨️ SpeedrunLeadDetails: Command+Enter pressed for ${person.name} (ID: ${person.id})`,
        );
        console.log(`⌨️ Target element:`, target.tagName, target.className);
        console.log(`⌨️ Is input field:`, isInputField);
        console.log(`🎯 COMPLETING PERSON VIA KEYBOARD SHORTCUT`);
        
        // Call the speedrun completion handler
        onComplete(person.id);
        
        // Also dispatch event to update card status in Monaco
        const completeEvent = new CustomEvent('completeSpeedrunCard');
        document.dispatchEvent(completeEvent);
        console.log('🎯 Dispatched completeSpeedrunCard event for card status update');
        
        return false;
      }
      // Command+D for opening dialer popup - TEMPORARILY DISABLED
      /* 
      if (
        (event.metaKey || event.ctrlKey) &&
        event['key'] === "d" &&
        !isInputField
      ) {
        event.preventDefault();
        event.stopPropagation();
        setShowAutoDialerPopup(true);
      }
      */
    };

    // Add multiple event listeners to ensure we catch the event
    document.addEventListener("keydown", handleKeyDown, true); // Capture phase
    window.addEventListener("keydown", handleKeyDown, true); // Window level
    document.addEventListener("keydown", handleKeyDown, false); // Bubble phase

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [person.id, person.name, onComplete, setShowAutoDialerPopup]);
}
