# Safari/iOS Voice Testing Guide

## Overview

The Adrata voice system is designed to work seamlessly on Safari and iOS devices using Deepgram's API-based recognition. Unlike the Web Speech API (which doesn't work on Safari), Deepgram works on all browsers.

## Why Safari/iOS is Supported

**Web Speech API Limitations:**
- ❌ Not available on Safari desktop
- ❌ Not available on iOS Safari
- ❌ Not available on any iOS browsers (Chrome, Firefox on iOS)

**Deepgram Advantages:**
- ✅ Works on Safari desktop
- ✅ Works on iOS Safari
- ✅ Works on all iOS browsers
- ✅ Uses MediaRecorder API (universally supported)
- ✅ Better accuracy than Web Speech API

## Testing Checklist

### Prerequisites

- [ ] HTTPS deployment (required for microphone access)
- [ ] Deepgram API key configured
- [ ] iOS device (iPhone or iPad) running iOS 14.3+
- [ ] Safari 14.1+ on macOS (for desktop testing)

### Desktop Safari Testing

#### 1. Basic Functionality

```bash
# Test URL
https://your-app.adrata.com
```

- [ ] Open Safari (not Chrome)
- [ ] Navigate to the application
- [ ] Log in
- [ ] Click the "Voice" button in right panel
- [ ] Grant microphone permission when prompted
- [ ] Click "Start Speaking"
- [ ] Speak clearly: "Hey Adrata, show me buyer groups"
- [ ] Verify transcript appears in real-time
- [ ] Verify interim results show (lighter text)
- [ ] Verify final results are accurate
- [ ] Check audio quality indicator (should be green)

#### 2. Audio Quality Scenarios

**Quiet Environment:**
- [ ] Speak in quiet room
- [ ] Audio quality should show "Clear audio" or "Excellent"
- [ ] Confidence should be >0.8

**With Background Music:**
- [ ] Play music at moderate volume
- [ ] Speak over music
- [ ] Audio quality should show "Some noise detected"
- [ ] Transcription should still work (may be slower)

**Multiple Speakers:**
- [ ] Have conversation in background
- [ ] Speak your commands
- [ ] System should focus on primary speaker
- [ ] May show "Noisy environment" but still work

#### 3. Edge Cases

- [ ] Very quiet speech (whisper)
- [ ] Very loud speech (shouting)
- [ ] Rapid speech
- [ ] Slow deliberate speech
- [ ] Speech with pauses
- [ ] Long continuous speech (>30 seconds)
- [ ] Mumbled/unclear speech

### iOS Safari Testing

#### 1. Setup

```bash
# Ensure you're on HTTPS
# HTTP will not allow microphone access
```

1. Open Safari on iPhone/iPad
2. Navigate to application
3. Important: Must be direct Safari app (not Chrome/Firefox on iOS - they use Safari engine)

#### 2. Microphone Permission

First time:
- [ ] Tap "Voice" button
- [ ] System prompt appears: "Allow microphone?"
- [ ] Tap "Allow"
- [ ] Permission is saved

Denied permission:
- [ ] Go to iOS Settings > Safari > Website Settings
- [ ] Find your domain
- [ ] Set Microphone to "Allow"
- [ ] Return to app and try again

#### 3. Basic Functionality

- [ ] Tap "Voice" button
- [ ] Modal opens with "What can I help with?"
- [ ] Tap "Start Speaking"
- [ ] Orange microphone indicator appears in iOS status bar
- [ ] Speak: "Hey Adrata, create a new buyer group"
- [ ] Real-time transcript appears
- [ ] Audio visualization shows (blue bars)
- [ ] Final transcript processes correctly

#### 4. iOS-Specific Tests

**Interruption Handling:**
- [ ] Start voice recognition
- [ ] Receive phone call → Should pause gracefully
- [ ] Return to app → Should resume or allow restart
- [ ] Notification arrives → Should continue working

**App Backgrounding:**
- [ ] Start voice recognition
- [ ] Switch to another app
- [ ] Return to app
- [ ] Voice recognition should have stopped cleanly
- [ ] Can restart without issues

**Screen Lock:**
- [ ] Start voice recognition
- [ ] Lock screen
- [ ] Unlock screen
- [ ] Recognition should resume or allow restart

**Rotation:**
- [ ] Start voice recognition in portrait
- [ ] Rotate to landscape
- [ ] UI should adapt
- [ ] Recognition continues working

**Low Battery Mode:**
- [ ] Enable Low Battery Mode
- [ ] Test voice recognition
- [ ] Should work (may be slightly slower)

### Performance Testing

#### Latency Measurement

```typescript
// In development mode, check console for latency
// Target: <500ms for interim results
// Target: <1500ms for final results
```

**Test Steps:**
1. Open browser developer console
2. Start voice recognition
3. Speak a sentence
4. Note timestamps in console:
   - "Deepgram transcript" logs
   - Time from speaking to seeing text

**Expected Results:**
- Interim results: <500ms
- Final results: <1500ms
- No dropped audio chunks

#### Memory Testing

```bash
# Safari Web Inspector > Timelines > Memory
```

1. Start voice recognition
2. Speak for 2-3 minutes
3. Stop voice recognition
4. Check memory usage
5. Start again
6. Check for memory leaks (should return to baseline)

### Network Conditions Testing

#### Good Connection (WiFi)

- [ ] Fast initial connection
- [ ] Smooth real-time updates
- [ ] No delays or stuttering

#### Poor Connection (3G)

- [ ] Slower initial connection (expected)
- [ ] May have delayed updates
- [ ] Should still work, just slower
- [ ] Error handling should be graceful

#### Offline

- [ ] Should show error: "Network error"
- [ ] Should not crash
- [ ] Should allow retry when online

#### Connection Loss During Recognition

- [ ] Start recognition on WiFi
- [ ] Turn off WiFi mid-recognition
- [ ] Should show error
- [ ] Should allow retry when reconnected

### Browser Compatibility Matrix

| Device | OS | Browser | Expected Result |
|--------|--------|---------|----------------|
| iPhone 12+ | iOS 15+ | Safari | ✅ Full support |
| iPhone 12+ | iOS 15+ | Chrome | ✅ Full support (uses Safari engine) |
| iPhone 12+ | iOS 15+ | Firefox | ✅ Full support (uses Safari engine) |
| iPad Pro | iPadOS 15+ | Safari | ✅ Full support |
| MacBook | macOS 12+ | Safari | ✅ Full support |
| MacBook | macOS 12+ | Chrome | ✅ Full support |

### Common Issues & Solutions

#### Issue: Microphone permission denied

**Symptoms:**
- Error message: "Microphone access denied"
- Cannot start recording

**Solutions:**
1. iOS Settings > Safari > Website Settings > Microphone > Allow
2. Clear Safari cache and try again
3. Ensure HTTPS (not HTTP)

#### Issue: No audio detected

**Symptoms:**
- Audio quality shows "poor" or red indicator
- No transcript appears
- Audio level bars not moving

**Solutions:**
1. Check physical microphone not blocked
2. Test mic with Voice Memos app
3. Restart Safari
4. Check iOS mic permissions in Settings > Privacy

#### Issue: Choppy/delayed transcription

**Symptoms:**
- Long delays between speech and text
- Missing words
- Interrupted transcription

**Solutions:**
1. Check network connection
2. Close other apps/tabs
3. Clear Safari cache
4. Restart device if issue persists

#### Issue: "Voice recognition not supported"

**Symptoms:**
- Yellow warning message in modal
- Cannot start voice recognition

**Solutions:**
1. This should NOT appear on Safari/iOS with Deepgram
2. If it does, check:
   - Deepgram API key is configured
   - Network connectivity
   - Browser console for errors

### Regression Testing

After any voice system updates, test:

- [ ] Basic recognition still works
- [ ] No performance degradation
- [ ] No new browser console errors
- [ ] Memory usage stable
- [ ] All audio quality levels work
- [ ] Fallback system works (if Deepgram fails)
- [ ] Monitoring still tracks metrics

### User Experience Validation

**Subjective Tests:**

Rate 1-5 (5 = excellent):
- [ ] Ease of use: __/5
- [ ] Responsiveness: __/5
- [ ] Accuracy: __/5
- [ ] Audio quality detection: __/5
- [ ] Error handling: __/5
- [ ] Overall experience: __/5

**Target Scores:**
- All categories should be 4+ 
- Overall should be 4.5+

### Automated E2E Tests

Run Playwright tests on WebKit:

```bash
# Test on Safari/WebKit
npm run test:e2e -- --project=webkit

# Specific voice tests
npm run test:e2e tests/e2e/voice-integration.spec.ts -- --project=webkit
```

Tests cover:
- [ ] Modal opens
- [ ] Microphone permissions
- [ ] Start/stop recognition
- [ ] Audio quality indicators
- [ ] Error handling
- [ ] Browser compatibility

### Production Monitoring

After deployment, monitor:

```typescript
// Check metrics
const sessions = voiceMonitoring.getStoredSessions();

// Filter Safari/iOS sessions
const safariSessions = sessions.filter(s => 
  s.metadata?.userAgent?.includes('Safari')
);

// Check metrics
const avgConfidence = safariSessions.reduce((sum, s) => 
  sum + s.confidenceAvg, 0
) / safariSessions.length;

const avgLatency = safariSessions.reduce((sum, s) => 
  sum + s.latencyP95, 0
) / safariSessions.length;
```

**Target Metrics for Safari/iOS:**
- Average confidence: >0.75
- P95 latency: <2000ms
- Error rate: <5%

### Feedback Collection

Create feedback form for Safari/iOS users:

1. Did voice recognition work on first try? (Yes/No)
2. How accurate was the transcription? (1-5)
3. Any noticeable delays? (Yes/No)
4. Any errors encountered? (Free text)
5. Overall satisfaction? (1-5)

### Sign-off Checklist

Before releasing voice features:

- [ ] All basic functionality tests pass
- [ ] All audio quality scenarios tested
- [ ] All iOS-specific tests pass
- [ ] Performance targets met
- [ ] No memory leaks detected
- [ ] All common issues documented
- [ ] E2E tests pass on WebKit
- [ ] Production monitoring configured
- [ ] User feedback mechanism in place
- [ ] Documentation updated

## Best Practices for Safari/iOS

1. **Always use HTTPS** - Microphone requires secure context
2. **Request permissions early** - Ask for mic access upfront
3. **Provide clear feedback** - Show audio quality indicators
4. **Handle interruptions** - Phone calls, notifications, etc.
5. **Optimize for mobile** - Touch-friendly UI, responsive design
6. **Test on real devices** - Simulators don't have real audio
7. **Monitor metrics** - Track Safari-specific performance
8. **Graceful degradation** - Handle failures elegantly

## Resources

- [Safari Web Audio API](https://developer.apple.com/documentation/webkit/safari_tools_and_features)
- [iOS Safari Features](https://webkit.org/status/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Deepgram Browser SDK](https://developers.deepgram.com/docs/js-sdk)
- [iOS Testing Guide](https://developer.apple.com/safari/tools/)

