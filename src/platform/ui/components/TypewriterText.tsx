import React, { useState, useEffect, useRef } from "react";
import { speakText, initializeVoices } from "../../utils/voiceUtils";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onLinkClick?: (linkId: string) => void;
  enableSpeech?: boolean;
}

export function TypewriterText({
  text,
  speed = 8,
  onLinkClick,
  enableSpeech = false,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const previousTextRef = useRef(text);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
      if (enableSpeech && !hasSpoken && text.length > 0) {
        // Speak the text when typing animation completes
        const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Remove markdown links for speech
        speakText(cleanText);
        setHasSpoken(true);
      }
    }
  }, [currentIndex, text, speed, enableSpeech, hasSpoken]);

  // Reset when text actually changes (not just re-renders)
  useEffect(() => {
    if (previousTextRef.current !== text) {
      setDisplayedText("");
      setCurrentIndex(0);
      setHasSpoken(false);
      setIsComplete(false);
      previousTextRef['current'] = text;
    }
  }, [text]);

  // Parse and render text with links and bold formatting
  const renderFormattedText = (inputText: string) => {
    const parts: React['ReactNode'][] = [];
    let remainingText = inputText;
    let key = 0;

    // Process text character by character to handle nested formatting
    while (remainingText.length > 0) {
      // Check for markdown links first [text](url)
      const linkMatch = remainingText.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const beforeLink = remainingText.substring(0, linkMatch.index!);
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        const linkId = linkUrl?.replace("#", "") ?? "";
        const afterLink = remainingText.substring(
          linkMatch.index! + linkMatch[0].length,
        );

        // Add text before link
        if (beforeLink) {
          parts.push(processBoldText(beforeLink, `before-${key++}`));
        }

        // Add link button
        parts.push(
          <button
            key={`link-${key++}`}
            onClick={() => {
              console.log("🔗 TypewriterText button clicked:", {
                linkId,
                linkText,
                linkUrl,
              });
              onLinkClick?.(linkId);
            }}
            className="inline-block bg-panel-background hover:bg-hover text-gray-700 px-3 py-1.5 rounded-lg cursor-pointer border border-border font-medium text-sm transition-colors"
          >
            {linkText}
          </button>,
        );

        remainingText = afterLink;
      } else {
        // No more links, process remaining text for bold
        parts.push(processBoldText(remainingText, `final-${key++}`));
        break;
      }
    }

    return parts;
  };

  // Helper function to process bold text
  const processBoldText = (text: string, baseKey: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts
      .map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldContent = part.slice(2, -2);
          return (
            <strong key={`${baseKey}-bold-${index}`}>{boldContent}</strong>
          );
        }
        return part || null;
      })
      .filter((part) => part !== null);
  };

  return (
    <div className="whitespace-pre-line">
      {renderFormattedText(displayedText)}
      {currentIndex < text['length'] && (
        <span className="animate-pulse text-foreground">|</span>
      )}
    </div>
  );
}
