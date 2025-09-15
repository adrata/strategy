"use client";

import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 27,
  onComplete,
  className = ""
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasCalledComplete = React.useRef(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete && currentIndex === text.length && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    hasCalledComplete.current = false; // Reset the completion flag
  }, [text]);

  return (
    <div className={`whitespace-pre-line leading-snug ${className}`}>
      {/* Render content with clickable links */}
      {displayedText.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
      {currentIndex < text['length'] && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
};
