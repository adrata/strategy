"use client";

/**
 * Eleven Labs Voice Service
 * Handles text-to-speech using Eleven Labs API with French and Irish voices
 */

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  language: string;
  description: string;
  is_default?: boolean;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface SpeechOptions {
  text: string;
  voice_id?: string;
  voice_settings?: VoiceSettings;
  model_id?: string;
}

// Predefined voices with the IDs you provided
export const ADRATA_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: "FpvROcY4IGWevepmBWO2",
    name: "French Voice",
    language: "French",
    description: "Professional French voice for Adrata AI responses",
    is_default: true
  },
  {
    voice_id: "wo6udizrrtpIxWGp2qJk", 
    name: "Irish Voice",
    language: "Irish",
    description: "Warm Irish voice for Adrata AI responses"
  }
];

export class ElevenLabsVoiceService {
  private apiKey: string | null;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  constructor() {
    // Get API key from environment or local storage
    this['apiKey'] = process['env']['NEXT_PUBLIC_ELEVEN_LABS_API_KEY'] || 
                  (typeof window !== 'undefined' ? localStorage.getItem('eleven_labs_api_key') : null);
  }

  /**
   * Set API key dynamically
   */
  setApiKey(apiKey: string): void {
    this['apiKey'] = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem('eleven_labs_api_key', apiKey);
    }
  }

  /**
   * Get default voice (French)
   */
  getDefaultVoice(): ElevenLabsVoice {
    return ADRATA_VOICES.find(v => v.is_default) || ADRATA_VOICES[0]!;
  }

  /**
   * Get voice by ID
   */
  getVoiceById(voiceId: string): ElevenLabsVoice | undefined {
    return ADRATA_VOICES.find(v => v['voice_id'] === voiceId);
  }

  /**
   * Get all available voices
   */
  getAvailableVoices(): ElevenLabsVoice[] {
    return ADRATA_VOICES;
  }

  /**
   * Convert text to speech using Eleven Labs API
   */
  async textToSpeech(options: SpeechOptions): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('Eleven Labs API key not configured');
    }

    const voiceId = options.voice_id || this.getDefaultVoice().voice_id;
    
    const requestBody = {
      text: options.text,
      model_id: options.model_id || "eleven_multilingual_v2",
      voice_settings: options.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true
      }
    };

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eleven Labs API error: ${response.status} - ${errorText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Play text using Eleven Labs TTS
   */
  async speak(text: string, voiceId?: string): Promise<void> {
    console.log('🎤 Eleven Labs speak called with:', { text, voiceId, hasApiKey: !!this.apiKey });
    
    if (!this.apiKey) {
      console.warn('🎤 No Eleven Labs API key - using fallback');
      this.fallbackToNativeSpeech(text);
      return;
    }

    try {
      const audioBuffer = await this.textToSpeech({
        text,
        voice_id: voiceId || this.getDefaultVoice().voice_id
      });

      console.log('🎤 Eleven Labs audio received, playing...');

      // Create audio context and play
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBufferSource = audioContext.createBufferSource();
      
      const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
      audioBufferSource['buffer'] = decodedBuffer;
      audioBufferSource.connect(audioContext.destination);
      audioBufferSource.start();

      console.log('🎤 Eleven Labs speech started successfully');

    } catch (error) {
      console.error('🎤 Eleven Labs failed:', error);
      
      // Fallback to browser speech synthesis
      console.log('🎤 Falling back to native speech');
      this.fallbackToNativeSpeech(text);
    }
  }

  /**
   * Fallback to native browser speech synthesis
   */
  private fallbackToNativeSpeech(text: string): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance['rate'] = 0.9;
      utterance['pitch'] = 1.0;
      utterance['volume'] = 0.8;
      
      // Try to find a French or English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('fr') || v.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance['voice'] = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Stop any current speech
   */
  stop(): void {
    // Stop any ongoing native speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate welcome message responses
   */
  getWelcomeResponses(): string[] {
    return [
      "Great, I can hear you! Let me know what you want to achieve.",
      "Perfect! I'm listening. What would you like to work on?",
      "Excellent! I'm here to help. What's your goal today?",
      "Wonderful! I can hear you clearly. How can I assist you?",
      "Fantastic! I'm ready to help. What would you like to accomplish?",
      "Great to hear from you! What can I help you with today?",
      "Perfect! I'm all ears. What's on your agenda?",
      "Excellent! Ready to assist. What's your objective?"
    ];
  }

  /**
   * Get a random welcome response
   */
  getRandomWelcomeResponse(): string {
    const responses = this.getWelcomeResponses();
    return responses[Math.floor(Math.random() * responses.length)] || "Great, I can hear you! Let me know what you want to achieve.";
  }
}

// Export singleton instance
export const elevenLabsVoice = new ElevenLabsVoiceService();
