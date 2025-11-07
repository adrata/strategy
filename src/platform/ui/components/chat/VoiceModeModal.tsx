"use client";

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import { AIBrainIcon } from './PulseIcon';
import { 
  DeepgramRecognitionService, 
  getDeepgramService, 
  type TranscriptionResult,
  type AudioQuality 
} from '@/platform/services/deepgram-recognition';
import { voiceMonitoring } from '@/platform/services/voice-monitoring';
import { voiceInterruptionHandler } from '@/platform/services/voice-interruption-handler';

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  start(): void;
  stop(): void;
}

interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogToChat: (messages: { role: 'user' | 'assistant', content: string }[]) => void;
  processMessageWithQueue: (message: string) => Promise<void>;
  onListeningChange?: (isListening: boolean) => void;
}

export function VoiceModeModal({ isOpen, onClose, onLogToChat, processMessageWithQueue, onListeningChange }: VoiceModeModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioQuality, setAudioQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [useWebSpeechFallback, setUseWebSpeechFallback] = useState(false);
  
  const deepgramServiceRef = useRef<DeepgramRecognitionService | null>(null);
  const webSpeechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptStartTimeRef = useRef<number>(0);
  
  const isSupported = typeof window !== 'undefined' && DeepgramRecognitionService.isSupported();
  const webSpeechSupported = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // Main effect: Start/stop Deepgram or Web Speech recognition
  useEffect(() => {
    if (!isOpen) return;

    // Set up interruption handling for mobile
    voiceInterruptionHandler.startMonitoring(
      // onInterruption
      () => {
        console.log('📱 Interruption detected - pausing voice');
        if (isListening) {
          stopListening();
        }
      },
      // onResume
      () => {
        console.log('📱 Resuming after interruption');
        // Don't auto-resume - let user restart manually
      }
    );

    return () => {
      stopListening();
      voiceInterruptionHandler.stopMonitoring();
    };
  }, [isOpen]);

  // Start listening with Deepgram (with Web Speech fallback)
  const startListening = async () => {
    if (isListening) return;

    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';

    // Start monitoring session
    const engine = useWebSpeechFallback ? 'web-speech' : 'deepgram';
    sessionIdRef.current = voiceMonitoring.startSession(undefined, engine);

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
                  transcriptLength: result.transcript.length,
                  audioQuality
                });

                // Track latency
                if (transcriptStartTimeRef.current > 0) {
                  const latency = Date.now() - transcriptStartTimeRef.current;
                  voiceMonitoring.trackLatency(latency, {
                    engine: 'deepgram'
                  });
                }

                // Accumulate final transcript
                finalTranscriptRef.current += result.transcript + ' ';
                setTranscript(finalTranscriptRef.current.trim());
                setInterimTranscript('');
                setConfidence(result.confidence);

                // Reset silence timeout
                if (silenceTimeoutRef.current) {
                  clearTimeout(silenceTimeoutRef.current);
                }

                // Set new silence timeout to process accumulated transcript
                silenceTimeoutRef.current = setTimeout(() => {
                  if (finalTranscriptRef.current.trim()) {
                    handleVoiceInput(finalTranscriptRef.current.trim());
                    finalTranscriptRef.current = '';
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
              
              // Track error
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
                if (onListeningChange) onListeningChange(false);
              }
            },
            // onAudioQuality
            (quality: AudioQuality) => {
              setAudioQuality(quality.level);
              setAudioLevel(quality.audioLevel);
              
              // Track audio quality (sample every 5 seconds to avoid spam)
              if (Math.random() < 0.2) { // 20% sampling
                const qualityScore = quality.level === 'excellent' ? 1.0 :
                                    quality.level === 'good' ? 0.8 :
                                    quality.level === 'fair' ? 0.5 : 0.2;
                voiceMonitoring.trackAudioQuality(qualityScore, {
                  snr: quality.snr,
                  audioLevel: quality.audioLevel
                });
              }
            }
          );

          setIsListening(true);
          if (onListeningChange) onListeningChange(true);
          console.log('✅ Deepgram listening started (Nova-2 model)');

        } catch (deepgramError) {
          console.error('Failed to initialize Deepgram:', deepgramError);
          
          // Fall back to Web Speech API if Deepgram fails to initialize
          if (webSpeechSupported) {
            console.log('🔄 Deepgram unavailable, using Web Speech API');
            setUseWebSpeechFallback(true);
            startWithWebSpeech();
          } else {
            throw new Error('Voice recognition not available. Please check your API configuration.');
          }
        }
      } else {
        // Use Web Speech API directly
        startWithWebSpeech();
      }

    } catch (error) {
      console.error('Failed to start listening:', error);
      setError(error instanceof Error ? error.message : 'Failed to start voice recognition');
      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
    }
  };

  // Web Speech API fallback
  const startWithWebSpeech = () => {
    if (!webSpeechSupported) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition() as SpeechRecognition;
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

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (final) {
          finalTranscriptRef.current += final;
          setTranscript(finalTranscriptRef.current.trim());
          setInterimTranscript('');

          // Reset silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          silenceTimeoutRef.current = setTimeout(() => {
            if (finalTranscriptRef.current.trim()) {
              handleVoiceInput(finalTranscriptRef.current.trim());
              finalTranscriptRef.current = '';
            }
          }, 2000);
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech error:', event.error);
        if (event.error !== 'no-speech') {
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
      if (onListeningChange) onListeningChange(false);
    }
  };

  // Stop listening
  const stopListening = async () => {
    if (!isListening) return;

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
        const sessionStats = voiceMonitoring.endSession();
        if (process.env.NODE_ENV === 'development' && sessionStats) {
          console.log('📊 Voice session stats:', sessionStats);
        }
        sessionIdRef.current = null;
      }

      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
      console.log('🛑 Listening stopped');

    } catch (error) {
      console.error('Error stopping listening:', error);
    }
  };

  const handleVoiceInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      await processMessageWithQueue(userInput);
      onClose();
    } catch (error) {
      console.error('Error processing voice input:', error);
      setError(error instanceof Error ? error.message : 'Failed to process voice input. Please try again.');
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsListening(false);
    setIsProcessing(false);
    setConfidence(0);
    setAudioLevel(0);
    setUseWebSpeechFallback(false);
    finalTranscriptRef.current = '';
  };

  const handleClose = async () => {
    await stopListening();
    onClose();
    resetState();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-background rounded-xl border border-border p-6 max-w-lg mx-4 w-full animate-scaleIn shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Adrata</h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-hover"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Prompt - Left aligned at top */}
          <div className="text-left">
            <p className="text-lg text-foreground font-medium">What can I help with?</p>
          </div>

          {/* Error state */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={startListening}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Browser not supported */}
          {!isSupported && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Voice recognition is not supported in this browser.</p>
            </div>
          )}

          {/* Audio quality indicator */}
          {isListening && (
            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              <div className={`w-2 h-2 rounded-full ${
                audioQuality === 'excellent' || audioQuality === 'good' ? 'bg-green-500' : 
                audioQuality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span>
                {audioQuality === 'excellent' ? 'Excellent audio quality' :
                 audioQuality === 'good' ? 'Clear audio' : 
                 audioQuality === 'fair' ? 'Some noise detected' : 'Noisy environment'}
              </span>
              {useWebSpeechFallback && (
                <span className="text-xs text-yellow-600">(Fallback mode)</span>
              )}
            </div>
          )}

          {/* Audio level visualization */}
          {isListening && !transcript && !interimTranscript && (
            <div className="flex items-center justify-center py-12 min-h-[120px] overflow-visible">
              <div className="flex space-x-1 items-center h-16">
                {[1, 2, 3, 4, 3, 2, 1].map((height, index) => (
                  <div
                    key={index}
                    className="w-1.5 bg-blue-500 rounded-full transition-all duration-150"
                    style={{
                      height: `${height * 6 + audioLevel * 30}px`,
                      opacity: audioLevel > 0.05 ? 1 : 0.4
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Real-time transcription */}
          {(transcript || interimTranscript) && (
            <div className="mb-4">
              <div className="bg-hover rounded-lg px-3 py-2 w-full">
                <span className="text-sm text-muted">Ross:</span> <span className="text-foreground">{transcript || interimTranscript}</span>
              </div>
            </div>
          )}


          {/* Processing state - iMessage style */}
          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-end gap-1">
                <span className="text-sm text-muted">Thinking</span>
                <div className="flex gap-0.5 items-end pb-0.5">
                  <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            {!transcript && !error && isSupported && !isListening ? (
              <button
                onClick={startListening}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-sm"
              >
                <MicrophoneIcon className="w-5 h-5" />
                Start Speaking
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
