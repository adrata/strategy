"use client";

/**
 * VideoCallPanel Component
 * 
 * Displays video call interface using Daily.co
 * Embeds in the middle panel instead of opening in new window
 */

import React, { useEffect, useRef, useState } from 'react';
import { VideoCallService } from '@/platform/services/video-call-service';
import { XMarkIcon, PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface VideoCallPanelProps {
  roomId: string;
  roomName: string;
  onEndCall: () => void;
  participants?: string[];
}

export function VideoCallPanel({ 
  roomId, 
  roomName, 
  onEndCall, 
  participants = [] 
}: VideoCallPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    const initializeVideoCall = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the Daily.co room URL
        const roomUrl = await VideoCallService.joinRoom(roomId, 'current-user');
        
        if (iframeRef.current) {
          iframeRef.current.src = roomUrl;
        }

        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
          if (isLoading) {
            setError('Video call is taking longer than expected. Please try again.');
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout

        // Listen for Daily.co events
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== 'https://adrata.daily.co') return;

          const { type, data } = event.data;
          
          switch (type) {
            case 'loaded':
              clearTimeout(loadingTimeout);
              setIsLoading(false);
              break;
            case 'error':
              clearTimeout(loadingTimeout);
              setError(data?.error || 'Video call failed to load');
              setIsLoading(false);
              break;
            case 'participant-left':
              // Handle participant leaving
              break;
            case 'call-ended':
              clearTimeout(loadingTimeout);
              onEndCall();
              break;
          }
        };

        // Also listen for iframe load events as fallback
        const handleIframeLoad = () => {
          clearTimeout(loadingTimeout);
          setIsLoading(false);
        };

        if (iframeRef.current) {
          iframeRef.current.addEventListener('load', handleIframeLoad);
        }

        window.addEventListener('message', handleMessage);
        
        return () => {
          clearTimeout(loadingTimeout);
          window.removeEventListener('message', handleMessage);
          if (iframeRef.current) {
            iframeRef.current.removeEventListener('load', handleIframeLoad);
          }
        };
      } catch (err) {
        console.error('Failed to initialize video call:', err);
        setError(err instanceof Error ? err.message : 'Failed to start video call');
        setIsLoading(false);
      }
    };

    initializeVideoCall();
  }, [roomId, onEndCall, isLoading]);

  const handleMuteToggle = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { action: 'toggle-mic' },
        'https://adrata.daily.co'
      );
      setIsMuted(!isMuted);
    }
  };

  const handleVideoToggle = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { action: 'toggle-camera' },
        'https://adrata.daily.co'
      );
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleEndCall = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { action: 'leave-call' },
        'https://adrata.daily.co'
      );
    }
    onEndCall();
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-red-50">
        <div className="text-center p-6">
          <VideoCameraIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Video Call Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onEndCall}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <VideoCameraIcon className="w-6 h-6 text-foreground" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{roomName}</h2>
            <p className="text-sm text-muted">Video Call</p>
          </div>
        </div>
        <button
          onClick={onEndCall}
          className="p-2 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
          title="End Call"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Joining video call...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; display-capture"
          title={`Video call: ${roomName}`}
        />
      </div>

      {/* Controls */}
      <div className="p-4 bg-background border-t border-border">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleMuteToggle}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-error text-white' 
                : 'bg-muted text-white hover:bg-muted-light'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleVideoToggle}
            className={`p-3 rounded-full transition-colors ${
              !isVideoOn 
                ? 'bg-error text-white' 
                : 'bg-muted text-white hover:bg-muted-light'
            }`}
            title={isVideoOn ? 'Turn off video' : 'Turn on video'}
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleEndCall}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            title="End Call"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
