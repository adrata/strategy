"use client";

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import { AIBrainIcon } from './PulseIcon';

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
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioQuality, setAudioQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [snr, setSNR] = useState<number>(0); // Signal-to-Noise Ratio
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const isSupported = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // Enhanced audio monitoring with SNR calculation
  useEffect(() => {
    if (!isListening || !isOpen) return;

    const setupAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Advanced constraints for better quality
            sampleRate: 48000,
            channelCount: 1
          } 
        });

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        
        // Increase FFT size for better frequency resolution
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.8;
        
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const monitorAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate speech frequency range (300Hz - 3400Hz)
          const speechStart = Math.floor(300 * analyser.fftSize / audioContext.sampleRate);
          const speechEnd = Math.floor(3400 * analyser.fftSize / audioContext.sampleRate);
          
          // Calculate noise frequency range (outside speech)
          const noiseStart = Math.floor(50 * analyser.fftSize / audioContext.sampleRate);
          const noiseEnd = Math.floor(8000 * analyser.fftSize / audioContext.sampleRate);
          
          // Calculate average levels
          let speechLevel = 0;
          let noiseLevel = 0;
          
          for (let i = speechStart; i < speechEnd; i++) {
            speechLevel += dataArray[i];
          }
          speechLevel /= (speechEnd - speechStart);
          
          for (let i = noiseStart; i < noiseEnd; i++) {
            if (i < speechStart || i > speechEnd) {
              noiseLevel += dataArray[i];
            }
          }
          noiseLevel /= (noiseEnd - noiseStart - (speechEnd - speechStart));
          
          // Calculate SNR (Signal-to-Noise Ratio)
          const calculatedSNR = speechLevel / (noiseLevel + 1);
          setSNR(calculatedSNR);
          
          // Determine audio quality
          if (calculatedSNR > 3) {
            setAudioQuality('good');
          } else if (calculatedSNR > 1.5) {
            setAudioQuality('fair');
          } else {
            setAudioQuality('poor');
          }
          
          // Update audio level for visualization
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          
          animationRef.current = requestAnimationFrame(monitorAudio);
        };

        monitorAudio();
        audioContextRef.current = audioContext;
        streamRef.current = stream;

      } catch (error) {
        console.error('Error setting up audio monitoring:', error);
      }
    };

    setupAudioMonitoring();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isListening, isOpen]);

  // Advanced speech recognition setup
  useEffect(() => {
    if (!isSupported || !isOpen) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    let finalTranscriptAccumulator = '';
    let restartTimeout: NodeJS.Timeout | null = null;
    
    // Advanced configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'en-US';

    // Create speech grammar list for custom vocabulary
    if ('SpeechGrammarList' in window) {
      const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
      const grammarList = new SpeechGrammarList();
      
      // Define custom vocabulary with high weight
      const grammar = '#JSGF V1.0; grammar adrata; public <phrase> = Adrata | Hey Adrata | Hi Adrata ;';
      grammarList.addFromString(grammar, 1.0); // Weight of 1.0 (highest priority)
      
      recognition.grammars = grammarList;
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      if (onListeningChange) onListeningChange(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = Array.from(result);
        
        // Enhanced alternative selection with context awareness
        const scoredAlternatives = alternatives.map(alt => {
          let score = alt.confidence;
          const text = alt.transcript.toLowerCase();
          
          // Boost score if it contains expected phrases
          if (text.includes('hey') || text.includes('hi') || text.includes('hello')) {
            score *= 1.3; // 30% boost for greetings
          }
          
          // Boost score for "adrata" variations (even if misspelled)
          const adrataVariations = ['adrata', 'edrata', 'adra', 'edra', 'a drata', 'ah drata'];
          if (adrataVariations.some(v => text.includes(v))) {
            score *= 1.5; // 50% boost for Adrata mentions
          }
          
          // Penalize if audio quality is poor but confidence is suspiciously high
          if (audioQuality === 'poor' && alt.confidence > 0.9) {
            score *= 0.8; // Reduce overconfident results in poor audio
          }
          
          // Boost if SNR is good
          if (snr > 3) {
            score *= 1.1;
          }
          
          return { ...alt, adjustedScore: score };
        });
        
        // Sort by adjusted score
        const bestAlternative = scoredAlternatives.reduce((best, current) => 
          current.adjustedScore > best.adjustedScore ? current : best
        );
        
        console.log('🎯 Speech alternatives with context scoring:', scoredAlternatives.map(alt => ({
          text: alt.transcript,
          originalConfidence: alt.confidence,
          adjustedScore: alt.adjustedScore,
          selected: alt === bestAlternative
        })));
        
        if (result.isFinal) {
          finalTranscript += bestAlternative.transcript;
          bestConfidence = Math.max(bestConfidence, bestAlternative.confidence);
          
          // Dynamic confidence threshold based on audio quality
          const confidenceThreshold = audioQuality === 'good' ? 0.7 : 
                                       audioQuality === 'fair' ? 0.6 : 0.5;
          
          if (bestConfidence > confidenceThreshold) {
            finalTranscriptAccumulator += finalTranscript + ' ';
          } else {
            console.warn(`⚠️ Low confidence result (${bestConfidence.toFixed(2)}) in ${audioQuality} audio - ignored`);
          }
        } else {
          interimTranscript += bestAlternative.transcript;
        }
      }

      // Enhanced fixAdrata with phonetic matching
      const fixAdrata = (text: string) => {
        return text
          // Exact matches
          .replace(/\bedrada\b/gi, 'Adrata')
          .replace(/\badrata\b/gi, 'Adrata')
          // Phonetic variations
          .replace(/\bed\s*ra\s*ta\b/gi, 'Adrata')
          .replace(/\bad\s*ra\s*ta\b/gi, 'Adrata')
          .replace(/\bedra\b/gi, 'Adrata')
          .replace(/\badra\b/gi, 'Adrata')
          .replace(/\ba\s*drata\b/gi, 'Adrata')
          .replace(/\bah\s*drata\b/gi, 'Adrata')
          .replace(/\behdrata\b/gi, 'Adrata')
          .replace(/\bahdrata\b/gi, 'Adrata')
          // Greeting variations with proper capitalization
          .replace(/\bhey,?\s+adrata\b/gi, 'Hey, Adrata')
          .replace(/\bhey,?\s+edrada\b/gi, 'Hey, Adrata')
          .replace(/\bhey,?\s+edra\b/gi, 'Hey, Adrata')
          .replace(/\bhey,?\s+adra\b/gi, 'Hey, Adrata')
          .replace(/\bhi,?\s+adrata\b/gi, 'Hi, Adrata')
          .replace(/\bhello,?\s+adrata\b/gi, 'Hello, Adrata');
      };

      // Update display with accumulated + current (with corrections)
      const fullTranscript = fixAdrata((finalTranscriptAccumulator + interimTranscript).trim());
      setTranscript(fullTranscript);
      setInterimTranscript(fixAdrata(interimTranscript));
      
      // Keep confidence for internal use
      setConfidence(bestConfidence);
      
      // Clear any existing restart timeout
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      
      // Adaptive timeout based on audio quality
      const silenceTimeout = audioQuality === 'good' ? 2000 : 
                            audioQuality === 'fair' ? 2500 : 3000;
      
      restartTimeout = setTimeout(() => {
        if (finalTranscriptAccumulator.trim()) {
          recognition.stop();
          handleVoiceInput(fixAdrata(finalTranscriptAccumulator.trim()));
          finalTranscriptAccumulator = '';
        }
      }, silenceTimeout);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
      
      // Don't automatically restart - let the timeout handle it
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
      
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access and try again.');
          break;
        case 'no-speech':
          // Don't show error for no-speech, just keep waiting
          if (recognition && isOpen) {
            setTimeout(() => recognition.start(), 100);
          }
          break;
        case 'audio-capture':
          setError('Microphone not found. Please check your microphone connection.');
          break;
        case 'network':
          setError('Network error. Please check your internet connection.');
          break;
        default:
          setError('Speech recognition error. Please try again.');
      }
    };

    if (isOpen) {
      recognition.start();
    }

    return () => {
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isSupported, isOpen, onListeningChange]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      setAiResponse('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
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

  const handleSendToChat = () => {
    if (conversation.length > 0) {
      onLogToChat(conversation);
    }
    onClose();
    resetState();
  };

  const resetState = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsListening(false);
    setIsProcessing(false);
    setIsSending(false);
    setAiResponse('');
    setConversation([]);
    setConfidence(0);
    setAudioLevel(0);
  };

  const handleClose = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
                audioQuality === 'good' ? 'bg-green-500' : 
                audioQuality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span>
                {audioQuality === 'good' ? 'Clear audio' : 
                 audioQuality === 'fair' ? 'Some noise detected' : 'Noisy environment'}
              </span>
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
