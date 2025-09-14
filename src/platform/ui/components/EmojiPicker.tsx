import React, { useState, useCallback, useEffect, useRef } from "react";
import EmojiPickerReact, { Theme, EmojiStyle } from "emoji-picker-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef['current'] &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiSelect = useCallback(
    (emojiData: any) => {
      onEmojiSelect(emojiData.emoji);
    },
    [onEmojiSelect],
  );

  return (
    <div ref={pickerRef} className="absolute right-0 top-0 z-50">
      <EmojiPickerReact
        onEmojiClick={handleEmojiSelect}
        theme={Theme.LIGHT}
        emojiStyle={EmojiStyle.NATIVE}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled={true}
        width={350}
        height={450}
      />
    </div>
  );
};
