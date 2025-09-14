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
      const testMessage = `Hello! This is the ${voice.name} speaking. I'm ready to help you with your tasks.`;
      await elevenLabsVoice.speak(testMessage, voice.voice_id);
    } catch (error) {
      console.error('Failed to test voice:', error);
    } finally {
      setTimeout(() => setIsTestingVoice(null), 2000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-2">
        <SpeakerWaveIcon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Voice Settings</h3>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">
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
          <span className="text-sm text-gray-600">
            {apiKey ? 'API Key Configured' : 'API Key Required'}
          </span>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Select Voice
        </label>
        
        <div className="space-y-2">
          {ADRATA_VOICES.map((voice) => (
            <div
              key={voice.voice_id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedVoice['voice_id'] === voice.voice_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleVoiceChange(voice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{voice.name}</h4>
                    {voice['is_default'] && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        Default
                      </span>
                    )}
                    {selectedVoice['voice_id'] === voice['voice_id'] && (
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{voice.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Language: {voice.language}</p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    testVoice(voice);
                  }}
                  disabled={!apiKey || isTestingVoice === voice.voice_id}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    !apiKey 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isTestingVoice === voice.voice_id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isTestingVoice === voice.voice_id ? 'Playing...' : 'Test'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Status */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Cog6ToothIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Current Configuration</span>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          <div>Selected Voice: <span className="font-medium">{selectedVoice.name}</span></div>
          <div>Language: <span className="font-medium">{selectedVoice.language}</span></div>
          <div>Status: <span className={`font-medium ${apiKey ? 'text-green-600' : 'text-red-600'}`}>
            {apiKey ? 'Ready' : 'Needs Configuration'}
          </span></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to Use Voice Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click the power button (⚡) next to the chat input to activate voice</li>
          <li>• When active, Adrata will speak responses and listen for your voice</li>
          <li>• Use the volume controls (+/-) to adjust speech volume</li>
          <li>• Click the mute button to disable speech output</li>
          <li>• Speak clearly after Adrata finishes speaking</li>
        </ul>
      </div>
    </div>
  );
}