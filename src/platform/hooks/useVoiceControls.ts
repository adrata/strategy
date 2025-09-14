"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { elevenLabsVoice, ElevenLabsVoice } from '@/platform/services/elevenlabs-voice';

export interface VoiceControlsState {
  isVoiceActive: boolean;
  isListening: boolean;
  isMuted: boolean;
  volume: number;
  selectedVoice: ElevenLabsVoice;
  isRecognitionSupported: boolean;
}

export interface VoiceControlsActions {
  toggleVoiceActive: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleMute: () => void;
  increaseVolume: () => void;
  decreaseVolume: () => void;
  setSelectedVoice: (voice: ElevenLabsVoice) => void;
  speak: (text: string) => Promise<void>;
  onSpeechResult: (callback: (transcript: string) => void) => void;
}

export interface UseVoiceControlsReturn extends VoiceControlsState, VoiceControlsActions {}

export function useVoiceControls(): UseVoiceControlsReturn {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice>(elevenLabsVoice.getDefaultVoice());
  
  const recognitionRef = useRef<any>(null);
  const speechResultCallbackRef = useRef<((transcript: string) => void) | null>(null);
  
  // Check if speech recognition is supported
  const isRecognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  useEffect(() => {
    if (!isRecognitionSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition['continuous'] = true;
    recognition['interimResults'] = true;
    recognition['lang'] = 'en-US';
    
    recognition['onstart'] = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
    };
    
    recognition['onend'] = () => {
      console.log('🎤 Voice recognition ended');
      setIsListening(false);
    };
    
    recognition['onerror'] = (event: any) => {
      console.error('🎤 Voice recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition['onresult'] = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event['results'][i].transcript;
        if (event['results'][i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript && speechResultCallbackRef.current) {
        console.log('🎤 Speech recognized:', finalTranscript);
        speechResultCallbackRef.current(finalTranscript.trim());
      }
    };
    
    recognitionRef['current'] = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecognitionSupported]);

  const toggleVoiceActive = useCallback(() => {
    const newState = !isVoiceActive;
    setIsVoiceActive(newState);
    
    if (!newState && recognitionRef['current'] && isListening) {
      recognitionRef.current.stop();
      console.log('🎤 Stopping voice recognition from toggle...');
    }
    
    console.log('🎤 Voice active:', newState);
  }, [isVoiceActive, isListening]);

  const startListening = useCallback(async () => {
    if (!isRecognitionSupported || !recognitionRef.current) {
      return;
    }

    // Check current listening state to avoid duplicate starts
    if (isListening) {
      console.log('🎤 Already listening, skipping start...');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognitionRef.current.start();
      console.log('🎤 Starting voice recognition...');
    } catch (error) {
      console.error('🎤 Failed to start voice recognition:', error);
    }
  }, [isRecognitionSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log('🎤 Stopping voice recognition...');
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    console.log('🔇 Mute toggled:', !isMuted);
  }, [isMuted]);

  const increaseVolume = useCallback(() => {
    setVolume(prev => Math.min(100, prev + 10));
  }, []);

  const decreaseVolume = useCallback(() => {
    setVolume(prev => Math.max(0, prev - 10));
  }, []);

  const speak = useCallback(async (text: string) => {
    if (isMuted) {
      console.log('🔇 Speech muted');
      return;
    }

    try {
      await elevenLabsVoice.speak(text, selectedVoice.voice_id);
    } catch (error) {
      console.error('🔊 Failed to speak:', error);
    }
  }, [isMuted, selectedVoice]);

  const onSpeechResult = useCallback((callback: (transcript: string) => void) => {
    speechResultCallbackRef['current'] = callback;
  }, []);

  return {
    // State
    isVoiceActive,
    isListening,
    isMuted,
    volume,
    selectedVoice,
    isRecognitionSupported,
    
    // Actions
    toggleVoiceActive,
    startListening,
    stopListening,
    toggleMute,
    increaseVolume,
    decreaseVolume,
    setSelectedVoice,
    speak,
    onSpeechResult
  };
}
