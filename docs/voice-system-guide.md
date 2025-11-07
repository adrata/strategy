# Voice System Guide

## Overview

Adrata uses a world-class voice recognition system powered by Deepgram Nova-2, with automatic fallback to Web Speech API. The system is designed to handle:

- Background noise and unclear speech
- Multiple accents and dialects
- Rapid speech and mumbling
- All browsers including Safari/iOS

## Architecture

### Components

1. **Deepgram Recognition Service** (`src/platform/services/deepgram-recognition.ts`)
   - Primary speech recognition engine
   - Uses Deepgram Nova-2 model (best-in-class accuracy)
   - Real-time WebSocket streaming
   - Custom vocabulary for Adrata domain terms
   - Advanced audio preprocessing and noise handling

2. **Voice Mode Modal** (`src/platform/ui/components/chat/VoiceModeModal.tsx`)
   - User interface for voice interactions
   - Handles microphone permissions
   - Displays real-time transcription
   - Shows audio quality indicators

3. **Voice Monitoring Service** (`src/platform/services/voice-monitoring.ts`)
   - Tracks recognition accuracy
   - Measures latency (p50, p95, p99)
   - Monitors audio quality
   - Records error rates
   - Provides production analytics

4. **ElevenLabs Voice Service** (`src/platform/services/elevenlabs-voice.ts`)
   - Text-to-speech output
   - French and Irish voices
   - Fallback to native browser TTS

### Architecture Diagram

```
User Speech
    ↓
Microphone (with noise suppression, AGC, echo cancellation)
    ↓
Audio Monitoring (SNR, quality detection)
    ↓
Deepgram Nova-2 (WebSocket streaming)
    ↓
Custom Vocabulary Processing
    ↓
Confidence Filtering
    ↓
Transcript Display
    ↓
AI Processing
    ↓
ElevenLabs TTS Response
```

## Setup

### 1. API Key Configuration

#### Development

Add to `.env.local`:

```bash
# Deepgram API Key (required for voice recognition)
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key_here

# ElevenLabs API Key (optional, for TTS)
NEXT_PUBLIC_ELEVEN_LABS_API_KEY=your_elevenlabs_api_key_here
```

#### Production

Add environment variables in your deployment platform (Vercel, AWS, etc.):

```bash
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_production_deepgram_key
NEXT_PUBLIC_ELEVEN_LABS_API_KEY=your_production_elevenlabs_key
```

### 2. Get API Keys

**Deepgram:**
1. Sign up at [deepgram.com](https://deepgram.com)
2. Get $200 free credit
3. Create an API key from the dashboard
4. Pay-as-you-go: $0.0043/minute

**ElevenLabs (optional):**
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Create an API key
3. Free tier includes 10,000 characters/month

## Features

### Advanced Noise Handling

- **Automatic Gain Control (AGC)**: Normalizes input volume
- **Echo Cancellation**: Removes echo from speakers
- **Noise Suppression**: Filters background noise
- **SNR Calculation**: Real-time signal-to-noise ratio monitoring
- **Adaptive Confidence Thresholds**: Adjusts based on audio quality

### Custom Vocabulary

Pre-configured keywords with priority weighting:

- `Adrata` (3x priority)
- `buyer group` (2x priority)
- `pipeline`, `outreach`, `speedrun` (2x priority)
- Industry terms: `CRM`, `executive`, `intelligence`, etc.

### Fallback Strategy

1. **Primary**: Deepgram Nova-2 (all browsers)
2. **Fallback**: Web Speech API (Chrome/Edge only)
3. **Error Handling**: Graceful degradation with user feedback

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Deepgram + fallback |
| Safari | ✅ Full | Deepgram (Web Speech not available) |
| iOS Safari | ✅ Full | Deepgram with MediaRecorder |
| Firefox | ✅ Full | Deepgram |
| Edge | ✅ Full | Deepgram + fallback |

## Usage

### For Users

1. Click the **Voice** button in the right panel
2. Click **Start Speaking** when the modal opens
3. Grant microphone permissions if prompted
4. Speak naturally - the system handles:
   - Background noise
   - Mumbling
   - Accents
   - Rapid speech
5. View real-time transcription
6. Transcript is automatically processed when you pause

### For Developers

#### Basic Usage

```typescript
import { getDeepgramService } from '@/platform/services/deepgram-recognition';

const service = getDeepgramService();

await service.startListening(
  // On transcript
  (result) => {
    console.log('Transcript:', result.transcript);
    console.log('Confidence:', result.confidence);
    console.log('Is final:', result.isFinal);
  },
  // On error
  (error) => {
    console.error('Recognition error:', error);
  },
  // On audio quality
  (quality) => {
    console.log('Audio quality:', quality.level);
    console.log('SNR:', quality.snr);
  }
);

// Stop listening
await service.stopListening();
```

#### With Monitoring

```typescript
import { voiceMonitoring } from '@/platform/services/voice-monitoring';

// Start session
const sessionId = voiceMonitoring.startSession(userId, 'deepgram');

// Track metrics
voiceMonitoring.trackRecognition(0.95, { engine: 'deepgram' });
voiceMonitoring.trackLatency(450, { engine: 'deepgram' });
voiceMonitoring.trackAudioQuality(0.85, { snr: 4.2 });

// End session
const stats = voiceMonitoring.endSession();
console.log('Session stats:', stats);
```

## Performance Targets

### Accuracy
- **Quiet environment**: >90% accuracy
- **Moderate noise**: >75% accuracy
- **High noise**: >60% accuracy

### Latency
- **Interim results**: <500ms (P95)
- **Final results**: <1500ms (P95)

### Audio Quality Thresholds
- **Excellent**: SNR > 4.0
- **Good**: SNR > 3.0
- **Fair**: SNR > 1.5
- **Poor**: SNR ≤ 1.5

## Monitoring & Analytics

### Production Metrics

The system automatically tracks:

1. **Recognition Accuracy**
   - Confidence scores per transcript
   - Aggregated by audio quality
   - Tracked per session

2. **Latency**
   - Time from speech start to final transcript
   - P50, P95, P99 percentiles
   - Broken down by engine

3. **Audio Quality**
   - SNR (Signal-to-Noise Ratio)
   - Audio level
   - Quality distribution

4. **Error Rates**
   - Error type classification
   - Error frequency
   - Fallback activation rate

5. **User Corrections**
   - Edit distance tracking
   - Implicit feedback

### Viewing Metrics

#### Development

```typescript
import { voiceMonitoring } from '@/platform/services/voice-monitoring';

// Get stored metrics
const metrics = voiceMonitoring.getStoredMetrics();
const sessions = voiceMonitoring.getStoredSessions();

console.log('Recent sessions:', sessions);
```

#### Production

Metrics are sent to configured endpoint or stored in localStorage. Set up endpoint:

```typescript
voiceMonitoring.configure({
  endpoint: 'https://your-api.com/voice-metrics',
  sampleRate: 0.1, // 10% sampling in production
  batchSize: 100,
  flushInterval: 60000 // 1 minute
});
```

## Testing

### Unit Tests

```bash
npm run test tests/voice/recognition-accuracy.test.ts
npm run test tests/voice/noise-handling.test.ts
```

### E2E Tests

```bash
# Run all voice tests
npm run test:voice

# Run with UI
npm run test:voice:ui

# Debug mode
npm run test:voice:debug
```

### Manual Testing

#### Safari/iOS Testing

1. Deploy to staging environment
2. Open on iOS device
3. Test microphone permissions
4. Test in various noise conditions:
   - Quiet room
   - Background music
   - Outdoor/traffic noise
   - Multiple speakers
5. Test rapid speech
6. Test mumbling/unclear speech
7. Verify transcript accuracy
8. Check latency (should feel responsive)

#### Test Scenarios

Create test cases for:

- [ ] Clear speech in quiet environment
- [ ] Speech with background music
- [ ] Speech with background conversation
- [ ] Outdoor speech (traffic, wind)
- [ ] Rapid speech
- [ ] Slow, deliberate speech
- [ ] Mumbled/unclear speech
- [ ] Different accents
- [ ] Technical terminology
- [ ] Domain-specific terms (Adrata, buyer group, etc.)

## Troubleshooting

### Issue: Voice button not appearing

**Solution**: Voice button only appears for specific users/workspaces. Check:
```typescript
// In ChatInput.tsx
const isVoiceModeAllowed = workspaceId === 'adrata-workspace-id' || userId === 'ross-user-id';
```

### Issue: Microphone permission denied

**Solution**: 
1. Check browser permissions
2. Must be HTTPS (not HTTP)
3. User must grant permission on first use

### Issue: Poor recognition accuracy

**Check**:
1. Audio quality indicator (should be green/yellow, not red)
2. Check SNR value (should be >1.5)
3. Verify microphone quality
4. Check Deepgram API key is valid
5. Review monitoring metrics

### Issue: High latency

**Check**:
1. Network connection
2. WebSocket connectivity
3. Deepgram service status
4. Check monitoring latency metrics
5. Consider reducing audio quality if needed

### Issue: Fallback mode activated

**Causes**:
1. Deepgram API key missing/invalid
2. Network connectivity issues
3. Deepgram service outage
4. Browser not supported

**Solution**: Fix Deepgram setup or continue with Web Speech API fallback

## Best Practices

### For Optimal Performance

1. **Use headphones** to reduce echo
2. **Position microphone properly** (6-12 inches from mouth)
3. **Minimize background noise** when possible
4. **Speak clearly** but naturally
5. **Pause briefly** between thoughts (1-2 seconds)

### For Development

1. Always test with different audio quality levels
2. Monitor metrics in development
3. Test fallback scenarios
4. Test on multiple browsers
5. Test on mobile devices (especially iOS)
6. Profile WebSocket performance
7. Monitor memory usage for leaks

### For Production

1. Set appropriate sampling rate (5-10%)
2. Monitor error rates
3. Set up alerting for high error rates
4. Monitor P95/P99 latency
5. Track user feedback/corrections
6. A/B test improvements
7. Keep Deepgram API key secure

## Cost Optimization

### Deepgram Pricing

- **Pay-as-you-go**: $0.0043/minute
- **Committed**: Discounts at volume

### Cost Estimation

```
Usage:
- 1,000 minutes/month = $4.30
- 10,000 minutes/month = $43.00
- 100,000 minutes/month = $430.00

Per user (assuming 10 min/day):
- $1.29/user/month
```

### Optimization Tips

1. Use interim results smartly (they're free)
2. Stop listening during silence
3. Consider sampling rate for monitoring
4. Cache common phrases if applicable
5. Use confidence thresholds to reduce processing

## Security

### Best Practices

1. **API Keys**: Never commit to version control
2. **HTTPS Required**: Microphone only works on HTTPS
3. **User Consent**: Always request explicit permission
4. **Data Privacy**: Audio is not stored by default
5. **Monitoring Data**: Anonymize user identifiers

### Compliance

- **GDPR**: Audio processing happens in real-time, not stored
- **CCPA**: Users can opt-out of voice features
- **HIPAA**: Not currently HIPAA-compliant (if needed, contact Deepgram)

## Future Enhancements

### Planned Features

1. **Speaker Diarization**: Identify different speakers
2. **Sentiment Analysis**: Detect emotional tone
3. **Intent Detection**: Classify user intent
4. **Multi-language Support**: Beyond English
5. **Custom Model Training**: Fine-tune for specific use cases
6. **Voice Commands**: Hands-free navigation
7. **Continuous Learning**: Improve from corrections

### Research Areas

1. Whisper integration (if OpenAI policy changes)
2. On-device processing (privacy)
3. Noise reduction ML models
4. Speaker verification
5. Accent adaptation

## Support

### Documentation

- [Deepgram Docs](https://developers.deepgram.com/)
- [ElevenLabs Docs](https://docs.elevenlabs.io/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Contact

For issues or questions:
1. Check this documentation
2. Review monitoring metrics
3. Check console logs (development mode)
4. Contact Deepgram support for API issues
5. Create internal ticket for Adrata-specific issues

