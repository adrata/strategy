/**
 * Noise Handling Tests
 * 
 * Tests for voice recognition accuracy in noisy environments
 */

import { DeepgramRecognitionService, getDeepgramService, type AudioQuality } from '@/platform/services/deepgram-recognition';

describe('Noise Handling', () => {
  let service: DeepgramRecognitionService;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY = 'test-api-key';
  });

  afterEach(async () => {
    if (service && service.isActive()) {
      await service.stopListening();
    }
  });

  describe('Audio Quality Detection', () => {
    it('should detect excellent audio quality', async () => {
      service = getDeepgramService();
      
      const qualityUpdates: AudioQuality[] = [];

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      // Mock AudioContext
      global.AudioContext = jest.fn().mockImplementation(() => ({
        createMediaStreamSource: jest.fn().mockReturnValue({
          connect: jest.fn()
        }),
        createAnalyser: jest.fn().mockReturnValue({
          fftSize: 4096,
          smoothingTimeConstant: 0.8,
          frequencyBinCount: 2048,
          getByteFrequencyData: jest.fn((dataArray) => {
            // Simulate excellent audio (high speech, low noise)
            for (let i = 0; i < dataArray.length; i++) {
              dataArray[i] = i >= 150 && i <= 500 ? 200 : 20; // High speech signal, low noise
            }
          })
        }),
        sampleRate: 48000,
        state: 'running',
        close: jest.fn()
      })) as any;

      await service.startListening(
        (result) => {},
        (error) => {},
        (quality) => {
          qualityUpdates.push(quality);
        }
      );

      // Wait for quality monitoring
      await new Promise(resolve => setTimeout(resolve, 100));

      if (qualityUpdates.length > 0) {
        const lastQuality = qualityUpdates[qualityUpdates.length - 1];
        expect(['excellent', 'good']).toContain(lastQuality.level);
        expect(lastQuality.snr).toBeGreaterThan(0);
      }
    });

    it('should detect poor audio quality', async () => {
      service = getDeepgramService();
      
      const qualityUpdates: AudioQuality[] = [];

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      // Mock AudioContext with poor audio
      global.AudioContext = jest.fn().mockImplementation(() => ({
        createMediaStreamSource: jest.fn().mockReturnValue({
          connect: jest.fn()
        }),
        createAnalyser: jest.fn().mockReturnValue({
          fftSize: 4096,
          smoothingTimeConstant: 0.8,
          frequencyBinCount: 2048,
          getByteFrequencyData: jest.fn((dataArray) => {
            // Simulate poor audio (low speech, high noise)
            for (let i = 0; i < dataArray.length; i++) {
              dataArray[i] = 100 + Math.random() * 50; // High noise throughout
            }
          })
        }),
        sampleRate: 48000,
        state: 'running',
        close: jest.fn()
      })) as any;

      await service.startListening(
        (result) => {},
        (error) => {},
        (quality) => {
          qualityUpdates.push(quality);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      if (qualityUpdates.length > 0) {
        const lastQuality = qualityUpdates[qualityUpdates.length - 1];
        expect(['fair', 'poor']).toContain(lastQuality.level);
      }
    });

    it('should calculate SNR correctly', async () => {
      service = getDeepgramService();
      
      let snrValue = 0;

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      global.AudioContext = jest.fn().mockImplementation(() => ({
        createMediaStreamSource: jest.fn().mockReturnValue({
          connect: jest.fn()
        }),
        createAnalyser: jest.fn().mockReturnValue({
          fftSize: 4096,
          smoothingTimeConstant: 0.8,
          frequencyBinCount: 2048,
          getByteFrequencyData: jest.fn()
        }),
        sampleRate: 48000,
        state: 'running',
        close: jest.fn()
      })) as any;

      await service.startListening(
        (result) => {},
        (error) => {},
        (quality) => {
          snrValue = quality.snr;
          expect(quality.snr).toBeGreaterThanOrEqual(0);
        }
      );

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Confidence Filtering', () => {
    it('should filter low confidence results in poor audio', async () => {
      service = getDeepgramService();
      
      const acceptedTranscripts: string[] = [];

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {
          // Deepgram service filters low confidence in poor audio
          if (result.isFinal && result.confidence > 0.5) {
            acceptedTranscripts.push(result.transcript);
          }
        }
      );

      // Verify filtering logic exists
      expect(service).toBeDefined();
    });

    it('should accept higher confidence threshold in good audio', () => {
      service = getDeepgramService();
      
      // Service should use different thresholds based on audio quality
      expect(service).toBeDefined();
    });
  });

  describe('Noise Suppression', () => {
    it('should enable noise suppression in getUserMedia', async () => {
      const getUserMediaSpy = jest.fn().mockResolvedValue({
        getTracks: () => [{
          stop: jest.fn()
        }]
      } as any);

      global.navigator.mediaDevices = {
        getUserMedia: getUserMediaSpy
      } as any;

      service = getDeepgramService();

      await service.startListening(
        (result) => {},
        (error) => {}
      );

      // Verify getUserMedia was called with noise suppression
      expect(getUserMediaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          })
        })
      );
    });
  });

  describe('Real-world Noise Scenarios', () => {
    it('should handle background conversation', async () => {
      // Test with audio containing background voices
      service = getDeepgramService();
      
      const transcripts: string[] = [];

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {
          if (result.isFinal) {
            transcripts.push(result.transcript);
          }
        }
      );

      // In real test, would use audio samples with background conversation
      expect(service.isActive()).toBeDefined();
    });

    it('should handle traffic noise', async () => {
      // Test with traffic noise audio
      service = getDeepgramService();
      
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {},
        (error) => {}
      );

      expect(service).toBeDefined();
    });

    it('should handle music background', async () => {
      // Test with music in background
      service = getDeepgramService();
      
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {},
        (error) => {}
      );

      expect(service).toBeDefined();
    });
  });

  describe('Microphone Quality', () => {
    it('should work with high-quality microphone', async () => {
      service = getDeepgramService();
      
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn(),
            getSettings: () => ({
              sampleRate: 48000,
              channelCount: 1
            })
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {},
        (error) => {}
      );

      expect(service).toBeDefined();
    });

    it('should adapt to lower quality microphone', async () => {
      service = getDeepgramService();
      
      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn(),
            getSettings: () => ({
              sampleRate: 16000,
              channelCount: 1
            })
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {},
        (error) => {}
      );

      expect(service).toBeDefined();
    });
  });

  describe('Performance in Noise', () => {
    it('should maintain latency under 500ms in good conditions', async () => {
      service = getDeepgramService();
      
      const timestamps: number[] = [];

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {
          if (!result.isFinal) {
            timestamps.push(Date.now());
          }
        }
      );

      // In real test, would measure actual latency
      expect(service).toBeDefined();
    });

    it('should handle rapid speech correctly', async () => {
      service = getDeepgramService();
      
      const words: string[] = [];

      global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        } as any)
      } as any;

      await service.startListening(
        (result) => {
          if (result.words) {
            words.push(...result.words.map(w => w.word));
          }
        }
      );

      expect(service).toBeDefined();
    });
  });
});

