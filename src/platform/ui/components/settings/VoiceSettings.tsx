"use client";

import React, { useState, useEffect } from 'react';
import { 
  SpeakerWaveIcon, 
  Cog6ToothIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { elevenLabsVoice, ElevenLabsVoice, ADRATA_VOICES } from '@/platform/services/elevenlabs-voice';

interface VoiceSettingsProps {
  className?: string;
}

export function VoiceSettings({ className = "" }: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice>(elevenLabsVoice.getDefaultVoice());
  const [apiKey, setApiKey] = useState<string>('');
  const [isTestingVoice, setIsTestingVoice] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVoiceId = localStorage.getItem('adrata_selected_voice');
      const savedApiKey = localStorage.getItem('eleven_labs_api_key');
      
      if (savedVoiceId) {
        const voice = elevenLabsVoice.getVoiceById(savedVoiceId);
        if (voice) {
          setSelectedVoice(voice);
        }
      }
      
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    }
  }, []);

  const handleVoiceChange = (voice: ElevenLabsVoice) => {
    setSelectedVoice(voice);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('adrata_selected_voice', voice.voice_id);
    }
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    elevenLabsVoice.setApiKey(newApiKey);
  };

  const testVoice = async (voice: ElevenLabsVoice) => {
    setIsTestingVoice(voice.voice_id);
    
    try {
      const testMessage = `Hello, I'm ${voice.name}. I'm your AI assistant ready to help you achieve more with Adrata. How can I assist you today?`;
      await elevenLabsVoice.speak(testMessage, voice.voice_id);
    } catch (error) {
      console.error('Failed to test voice:', error);
    } finally {
      setTimeout(() => setIsTestingVoice(null), 3000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-2">
        <SpeakerWaveIcon className="w-5 h-5 text-muted" />
        <h3 className="text-lg font-medium text-foreground">Voice Settings</h3>
      </div>

      {/* API Key Configuration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Eleven Labs API Key
          </label>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {apiKey ? 'Update' : 'Configure'}
          </button>
        </div>
        
        {showApiKeyInput && (
          <div className="space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Enter your Eleven Labs API key"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-muted">
              Get your API key from{' '}
              <a 
                href="https://elevenlabs.io/speech-synthesis" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Eleven Labs
              </a>
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted">
            {apiKey ? 'API Key Configured' : 'API Key Required'}
          </span>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Select Voice
        </label>
        <p className="text-xs text-muted">
          Click the voice card to select it, then click "Preview" to hear it
        </p>
        
        <div className="space-y-2">
          {ADRATA_VOICES.map((voice) => (
            <div
              key={voice.voice_id}
              className={`p-3 border rounded-lg transition-all ${
                selectedVoice['voice_id'] === voice.voice_id
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                  : 'border-border hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer'
              }`}
              onClick={() => handleVoiceChange(voice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground">{voice.name}</h4>
                    {voice['is_default'] && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        Default
                      </span>
                    )}
                    {selectedVoice['voice_id'] === voice['voice_id'] && (
                      <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1">{voice.description}</p>
                  <p className="text-xs text-muted mt-1">{voice.language}</p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testVoice(voice);
                  }}
                  disabled={!apiKey || isTestingVoice === voice.voice_id}
                  className={`ml-3 px-4 py-2 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${
                    !apiKey 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isTestingVoice === voice.voice_id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                  }`}
                >
                  {isTestingVoice === voice.voice_id ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Playing...
                    </span>
                  ) : 'Preview'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Status */}
      <div className="p-4 bg-panel-background rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Cog6ToothIcon className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-gray-700">Current Configuration</span>
        </div>
        
        <div className="space-y-1 text-sm text-muted">
          <div>Selected Voice: <span className="font-medium">{selectedVoice.name}</span></div>
          <div>Language: <span className="font-medium">{selectedVoice.language}</span></div>
          <div>Status: <span className={`font-medium ${apiKey ? 'text-green-600' : 'text-red-600'}`}>
            {apiKey ? 'Ready' : 'Needs Configuration'}
          </span></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">How to Use Voice Features</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1.5">
          <li>• Click a voice card to select it as your AI voice</li>
          <li>• Click "Preview" button to hear a sample of that voice</li>
          <li>• Selected voice will be used for all AI responses</li>
          <li>• Click the "Voice" button in the chat to start voice conversations</li>
          <li>• The AI will respond using your selected voice</li>
        </ul>
      </div>
    </div>
  );
}