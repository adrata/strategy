"use client";

import React from 'react';

interface PulseIconProps {
  isActive?: boolean;
  isListening?: boolean;
  className?: string;
}

export function PulseIcon({ isActive = false, isListening = false, className = "" }: PulseIconProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Main voice wave icon */}
      <div className="relative z-10 flex items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${
            isActive ? 'text-white' : isListening ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          {/* Voice wave design */}
          <path
            d="M3 12C3 8.5 5.5 6 9 6H15C18.5 6 21 8.5 21 12C21 15.5 18.5 18 15 18H9C5.5 18 3 15.5 3 12Z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M6 12C6 9.5 7.5 8 10 8H14C16.5 8 18 9.5 18 12C18 14.5 16.5 16 14 16H10C7.5 16 6 14.5 6 12Z"
            fill="currentColor"
            opacity="0.4"
          />
          <path
            d="M9 12C9 10.5 10 9.5 11.5 9.5H12.5C14 9.5 15 10.5 15 12C15 13.5 14 14.5 12.5 14.5H11.5C10 14.5 9 13.5 9 12Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Animated pulse rings */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-75"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-50" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-25" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-10" style={{ animationDelay: '0.9s' }}></div>
        </>
      )}

      {/* Active state glow */}
      {isActive && !isListening && (
        <div className="absolute inset-0 rounded-full bg-blue-600 animate-pulse opacity-30"></div>
      )}
    </div>
  );
}

// Cool animated sound wave icon
export function WaveIcon({ isActive = false, isListening = false, className = "" }: PulseIconProps) {
  return (
    <div className={`flex items-center space-x-0.5 ${className}`}>
      {[2, 4, 6, 8, 6, 4, 2].map((height, index) => (
        <div
          key={index}
          className={`w-0.5 rounded-full transition-all duration-200 ${
            isActive ? 'bg-white' : isListening ? 'bg-blue-600' : 'bg-gray-500'
          } ${
            isListening ? 'animate-pulse' : ''
          }`}
          style={{
            height: `${height}px`,
            animationDelay: isListening ? `${index * 0.1}s` : '0s',
            animationDuration: isListening ? '0.8s' : '0s'
          }}
        />
      ))}
    </div>
  );
}

// Futuristic voice command icon
export function VoiceCommandIcon({ isActive = false, isListening = false, className = "" }: PulseIconProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative z-10 flex items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${
            isActive ? 'text-white' : isListening ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          {/* Futuristic voice command design */}
          <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.1" />
          <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          
          {/* Command lines */}
          <path d="M2 12H6" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <path d="M18 12H22" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <path d="M12 2V6" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <path d="M12 18V22" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        </svg>
      </div>

      {/* Rotating command rings */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full border border-blue-500 animate-spin opacity-60" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 rounded-full border border-blue-500 animate-spin opacity-30" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
        </>
      )}
    </div>
  );
}

// AI Brain with sound waves
export function AIBrainIcon({ isActive = false, isListening = false, className = "" }: PulseIconProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative z-10 flex items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-300 ${
            isActive ? 'text-white' : isListening ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          {/* AI Brain shape */}
          <path
            d="M12 2C8 2 5 5 5 9C5 11 6 12.5 7 13.5C7.5 14 8 14.5 8.5 15C9 15.5 9.5 16 10 16.5C10.5 17 11 17.5 11.5 18C12 18.5 12.5 18.5 13 18C13.5 17.5 14 17 14.5 16.5C15 16 15.5 15.5 16 15C16.5 14.5 17 14 17.5 13.5C18 12.5 19 11 19 9C19 5 16 2 12 2Z"
            fill="currentColor"
            opacity="0.8"
          />
          {/* Neural network dots */}
          <circle cx="9" cy="8" r="1" fill="currentColor" opacity="0.6" />
          <circle cx="15" cy="8" r="1" fill="currentColor" opacity="0.6" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="9" cy="15" r="1" fill="currentColor" opacity="0.6" />
          <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.6" />
        </svg>
      </div>

      {/* Sound wave animation */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3, 2, 1].map((height, index) => (
            <div
              key={index}
              className="w-0.5 bg-blue-500 rounded-full animate-pulse absolute"
              style={{
                height: `${height * 3}px`,
                left: `${50 + (index - 2) * 3}%`,
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
