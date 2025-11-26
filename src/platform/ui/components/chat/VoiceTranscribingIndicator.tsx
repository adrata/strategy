"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RiVoiceAiFill } from "react-icons/ri";
import { useRouter } from 'next/navigation';
import { 
  DeepgramRecognitionService, 
  getDeepgramService, 
  type TranscriptionResult,
  type AudioQuality 
} from '@/platform/services/deepgram-recognition';
import { voiceMonitoring } from '@/platform/services/voice-monitoring';
import { voiceInterruptionHandler } from '@/platform/services/voice-interruption-handler';
import { voiceCommandProcessor } from '@/platform/services/voice-command-processor';
import { elevenLabsVoice } from '@/platform/services/elevenlabs-voice';

interface VoiceTranscribingIndicatorProps {
  onTranscriptComplete: (transcript: string, isVoiceInput: boolean) => void;
  onLiveTranscript?: (transcript: string) => void; // Stream partial transcripts to chat area
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
}

export function VoiceTranscribingIndicator({ 
  onTranscriptComplete, 
  onLiveTranscript,
  onListeningChange,
  className = ''
}: VoiceTranscribingIndicatorProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [useWebSpeechFallback, setUseWebSpeechFallback] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  
  // Initialize command processor with router
  useEffect(() => {
    voiceCommandProcessor.setRouter(router);
  }, [router]);
  
  // Stream live transcript to chat area
  useEffect(() => {
    const currentTranscript = transcript || interimTranscript;
    if (onLiveTranscript && currentTranscript) {
      onLiveTranscript(currentTranscript);
    }
  }, [transcript, interimTranscript, onLiveTranscript]);
  
  const deepgramServiceRef = useRef<DeepgramRecognitionService | null>(null);
  const webSpeechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptStartTimeRef = useRef<number>(0);
  
  const isSupported = typeof window !== 'undefined' && DeepgramRecognitionService.isSupported();
  const webSpeechSupported = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // Web Speech API types
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  // Handle voice input completion
  const handleVoiceInput = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;
    
    // First, try to process as a direct command (navigation, actions)
    const commandResult = voiceCommandProcessor.processAndExecute(userInput.trim());
    
    if (commandResult.handled) {
      // Command was handled directly
      if (process.env.NODE_ENV === 'development') {
        console.log('🎤 Voice command handled:', commandResult);
      }
      
      // Show feedback
      if (commandResult.feedback) {
        setCommandFeedback(commandResult.feedback);
        
        // Speak feedback if available
        try {
          elevenLabsVoice.speak(commandResult.feedback);
        } catch (e) {
          // Silently fail - audio feedback is optional
        }
        
        // Clear feedback after delay
        setTimeout(() => setCommandFeedback(null), 2000);
      }
    } else {
      // Not a direct command - send to AI for processing
      onTranscriptComplete(userInput.trim(), true);
    }
    
    // Reset state
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, [onTranscriptComplete]);

  // Start listening with Deepgram (with Web Speech fallback)
  const startListening = useCallback(async () => {
    if (isListening) return;

    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
    setIsExpanded(true);

    // Start monitoring session
    const engine = useWebSpeechFallback ? 'web-speech' : 'deepgram';
    sessionIdRef.current = voiceMonitoring.startSession(undefined, engine);

    // Set up interruption handling for mobile
    voiceInterruptionHandler.startMonitoring(
      () => {
        console.log('📱 Interruption detected - pausing voice');
        if (isListening) {
          stopListening();
        }
      },
      () => {
        console.log('📱 Resuming after interruption');
      }
    );

    try {
      // Try Deepgram first
      if (!useWebSpeechFallback) {
        try {
          const service = getDeepgramService();
          deepgramServiceRef.current = service;

          await service.startListening(
            // onTranscript
            (result: TranscriptionResult) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🎤 Deepgram transcript:', {
                  text: result.transcript,
                  confidence: result.confidence,
                  isFinal: result.isFinal
                });
              }

              if (result.isFinal) {
                // Track recognition accuracy
                voiceMonitoring.trackRecognition(result.confidence, {
                  engine: 'deepgram',
                  transcriptLength: result.transcript.length
                });

                // Track latency
                if (transcriptStartTimeRef.current > 0) {
                  const latency = Date.now() - transcriptStartTimeRef.current;
                  voiceMonitoring.trackLatency(latency, { engine: 'deepgram' });
                }

                // Accumulate final transcript
                finalTranscriptRef.current += result.transcript + ' ';
                setTranscript(finalTranscriptRef.current.trim());
                setInterimTranscript('');

                // Reset silence timeout
                if (silenceTimeoutRef.current) {
                  clearTimeout(silenceTimeoutRef.current);
                }

                // Set new silence timeout to process accumulated transcript
                silenceTimeoutRef.current = setTimeout(() => {
                  if (finalTranscriptRef.current.trim()) {
                    handleVoiceInput(finalTranscriptRef.current.trim());
                    stopListening();
                  }
                }, 1500);

              } else {
                // Show interim results
                setInterimTranscript(result.transcript);
                transcriptStartTimeRef.current = Date.now();
              }
            },
            // onError
            (error: Error) => {
              console.error('Deepgram error:', error);
              
              voiceMonitoring.trackError('deepgram_error', {
                message: error.message,
                engine: 'deepgram'
              });
              
              // Try Web Speech API fallback if available
              if (webSpeechSupported && !useWebSpeechFallback) {
                console.log('🔄 Falling back to Web Speech API');
                setUseWebSpeechFallback(true);
                setError('Using fallback recognition mode...');
                setTimeout(() => startWithWebSpeech(), 500);
              } else {
                setError('Voice recognition error. Please try again.');
                setIsListening(false);
                setIsExpanded(false);
                if (onListeningChange) onListeningChange(false);
              }
            },
            // onAudioQuality
            (quality: AudioQuality) => {
              setAudioLevel(quality.audioLevel);
            }
          );

          setIsListening(true);
          if (onListeningChange) onListeningChange(true);
          console.log('✅ Deepgram listening started (Nova-2 model)');

        } catch (deepgramError) {
          console.error('Failed to initialize Deepgram:', deepgramError);
          
          if (webSpeechSupported) {
            console.log('🔄 Deepgram unavailable, using Web Speech API');
            setUseWebSpeechFallback(true);
            startWithWebSpeech();
          } else {
            throw new Error('Voice recognition not available.');
          }
        }
      } else {
        startWithWebSpeech();
      }

    } catch (error) {
      console.error('Failed to start listening:', error);
      setError(error instanceof Error ? error.message : 'Failed to start voice recognition');
      setIsListening(false);
      setIsExpanded(false);
      if (onListeningChange) onListeningChange(false);
    }
  }, [isListening, useWebSpeechFallback, webSpeechSupported, onListeningChange, handleVoiceInput]);

  // Web Speech API fallback
  const startWithWebSpeech = useCallback(() => {
    if (!webSpeechSupported) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognitionAPI = (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition || 
                                   (window as unknown as { SpeechRecognition: new () => SpeechRecognition }).SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      webSpeechRecognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        if (onListeningChange) onListeningChange(true);
        console.log('✅ Web Speech API listening started');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result) {
            const transcriptText = result[0]?.transcript || '';
            if (result.isFinal) {
              final += transcriptText + ' ';
            } else {
              interim += transcriptText;
            }
          }
        }

        if (final) {
          finalTranscriptRef.current += final;
          setTranscript(finalTranscriptRef.current.trim());
          setInterimTranscript('');

          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          silenceTimeoutRef.current = setTimeout(() => {
            if (finalTranscriptRef.current.trim()) {
              handleVoiceInput(finalTranscriptRef.current.trim());
              stopListening();
            }
          }, 2000);
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as Event & { error?: string };
        console.error('Web Speech error:', errorEvent.error);
        if (errorEvent.error !== 'no-speech') {
          setError('Voice recognition error. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (onListeningChange) onListeningChange(false);
      };

      recognition.start();

    } catch (error) {
      console.error('Web Speech API error:', error);
      setError('Failed to start voice recognition.');
      setIsListening(false);
      setIsExpanded(false);
      if (onListeningChange) onListeningChange(false);
    }
  }, [webSpeechSupported, onListeningChange, handleVoiceInput]);

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Stop Deepgram
      if (deepgramServiceRef.current) {
        await deepgramServiceRef.current.stopListening();
        deepgramServiceRef.current = null;
      }

      // Stop Web Speech
      if (webSpeechRecognitionRef.current) {
        webSpeechRecognitionRef.current.stop();
        webSpeechRecognitionRef.current = null;
      }

      // End monitoring session
      if (sessionIdRef.current) {
        voiceMonitoring.endSession();
        sessionIdRef.current = null;
      }

      // Stop interruption monitoring
      voiceInterruptionHandler.stopMonitoring();

      setIsListening(false);
      setIsExpanded(false);
      if (onListeningChange) onListeningChange(false);
      console.log('🛑 Listening stopped');

    } catch (error) {
      console.error('Error stopping listening:', error);
    }
  }, [onListeningChange]);

  // Toggle listening on click
  const handleClick = useCallback(() => {
    if (isListening) {
      // If there's a transcript, send it before stopping
      if (finalTranscriptRef.current.trim()) {
        handleVoiceInput(finalTranscriptRef.current.trim());
      }
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, handleVoiceInput]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (deepgramServiceRef.current) {
        deepgramServiceRef.current.stopListening();
      }
      if (webSpeechRecognitionRef.current) {
        webSpeechRecognitionRef.current.stop();
      }
      voiceInterruptionHandler.stopMonitoring();
    };
  }, []);

  // Check browser support
  if (!isSupported && !webSpeechSupported) {
    return null;
  }

  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={handleClick}
        className={`
          relative flex items-center justify-center rounded-lg text-sm border transition-all duration-300 ease-out cursor-pointer overflow-hidden
          ${isExpanded 
            ? 'bg-muted/60 text-muted-foreground border-border px-3 py-2 gap-2 min-w-[160px]' 
            : 'p-2 border-border hover:border-border hover:bg-hover text-foreground'
          }
          ${!isExpanded && 'bg-[var(--panel-background)]'}
        `}
        style={{ 
          filter: !isExpanded ? 'brightness(1.05)' : undefined,
        }}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {/* Voice icon with subtle opacity pulse when listening */}
        <div className="relative flex items-center justify-center">
          <RiVoiceAiFill 
            className={`w-4 h-4 transition-opacity ${isListening ? 'text-blue-500' : ''}`}
            style={{ opacity: isListening ? 0.7 + audioLevel * 0.3 : 1 }}
          />
        </div>
        
        {/* Expanded text - subtle styling */}
        {isExpanded && (
          <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
            Transcribing
          </span>
        )}
      </button>
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full mt-1 right-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1 text-xs text-red-700 dark:text-red-300 whitespace-nowrap z-50">
          {error}
        </div>
      )}
      
      {/* Command feedback (shown briefly after command execution) */}
      {commandFeedback && (
        <div className="absolute top-full mt-2 right-0 bg-muted text-foreground rounded-lg px-3 py-2 text-sm font-medium max-w-[300px] shadow-lg z-50 animate-fade-in border border-border">
          {commandFeedback}
        </div>
      )}
      
      {/* Note: Live transcript is now shown in chat area via onLiveTranscript callback */}
    </div>
  );
}

