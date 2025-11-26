"use client";

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onUpdate?: () => void; // Called periodically as text updates
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 8, // Fast: 8ms per character for snappy feel
  onComplete,
  onUpdate,
  className = ""
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasCalledComplete = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onUpdateRef = useRef(onUpdate);
  const updateCounterRef = useRef(0);

  // Update refs when callbacks change (but don't trigger re-render)
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onUpdateRef.current = onUpdate;
  }, [onComplete, onUpdate]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        // Call onUpdate periodically (every 5 characters to avoid too many scroll calls)
        updateCounterRef.current += 1;
        if (onUpdateRef.current && updateCounterRef.current % 5 === 0) {
          onUpdateRef.current();
        }
      }, speed);

      return () => clearTimeout(timer);
    } else if (onCompleteRef.current && currentIndex === text.length && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onCompleteRef.current();
      // Final scroll when complete
      if (onUpdateRef.current) {
        onUpdateRef.current();
      }
    }
  }, [currentIndex, text, speed]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    hasCalledComplete.current = false; // Reset the completion flag
    updateCounterRef.current = 0; // Reset update counter
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
              className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
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
