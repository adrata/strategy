import { useEffect } from 'react';

/**
 * Custom hook to handle ESC key press for closing modals/popups
 * 
 * @param isOpen - Whether the modal/popup is currently open
 * @param onClose - Function to call when ESC is pressed
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
}
