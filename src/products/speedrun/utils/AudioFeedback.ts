/**
 * 🔊 AUDIO FEEDBACK SYSTEM FOR POWER DIALER
 * Provides realistic audio feedback during calling process
 */

export class AudioFeedback {
  private audioContext: AudioContext | null = null;
  private dialToneOscillator: OscillatorNode | null = null;
  private ringingOscillator: OscillatorNode | null = null;
  private isEnabled: boolean = true;

  constructor(enabled: boolean = true) {
    this['isEnabled'] = enabled;
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (typeof window !== "undefined" && this.isEnabled) {
      try {
        this['audioContext'] = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn("Audio feedback not available:", error);
        this['isEnabled'] = false;
      }
    }
  }

  /**
   * Play dial tone when call is being initiated
   */
  playDialTone() {
    if (!this.audioContext || !this.isEnabled) return;

    // Create dial tone (350Hz and 440Hz simultaneously)
    const gain = this.audioContext.createGain();
    gain.connect(this.audioContext.destination);
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

    // First tone (350Hz)
    const osc1 = this.audioContext.createOscillator();
    osc1.frequency.setValueAtTime(350, this.audioContext.currentTime);
    osc1.connect(gain);

    // Second tone (440Hz)
    const osc2 = this.audioContext.createOscillator();
    osc2.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc2.connect(gain);

    // Start and stop dial tone
    osc1.start(this.audioContext.currentTime);
    osc2.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 1.0);
    osc2.stop(this.audioContext.currentTime + 1.0);

    console.log("🎵 Playing dial tone...");
  }

  /**
   * Play ringing tone when call is ringing
   */
  playRingingTone() {
    if (!this.audioContext || !this.isEnabled) return;

    this.stopRinging(); // Stop any existing ringing

    const playRingCycle = () => {
      if (!this.audioContext) return;

      const gain = this.audioContext.createGain();
      gain.connect(this.audioContext.destination);
      gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);

      // Ring tone (440Hz and 480Hz)
      const osc1 = this.audioContext.createOscillator();
      osc1.frequency.setValueAtTime(440, this.audioContext.currentTime);
      osc1.connect(gain);

      const osc2 = this.audioContext.createOscillator();
      osc2.frequency.setValueAtTime(480, this.audioContext.currentTime);
      osc2.connect(gain);

      // Ring pattern: 2 seconds on, 4 seconds off
      osc1.start(this.audioContext.currentTime);
      osc2.start(this.audioContext.currentTime);
      osc1.stop(this.audioContext.currentTime + 2.0);
      osc2.stop(this.audioContext.currentTime + 2.0);

      this['ringingOscillator'] = osc1; // Keep reference for stopping
    };

    // Start ringing cycle
    playRingCycle();

    // Repeat every 6 seconds (2 second ring + 4 second pause)
    const ringInterval = setInterval(() => {
      if (this.ringingOscillator) {
        playRingCycle();
      } else {
        clearInterval(ringInterval);
      }
    }, 6000);

    console.log("📞 Playing ringing tone...");
  }

  /**
   * Stop ringing tone
   */
  stopRinging() {
    if (this.ringingOscillator) {
      try {
        this.ringingOscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
      this['ringingOscillator'] = null;
    }
  }

  /**
   * Play call connected beep
   */
  playConnectedBeep() {
    if (!this.audioContext || !this.isEnabled) return;

    const gain = this.audioContext.createGain();
    gain.connect(this.audioContext.destination);
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

    // Connected beep (800Hz, short burst)
    const osc = this.audioContext.createOscillator();
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc.connect(gain);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);

    console.log("✅ Playing connected beep...");
  }

  /**
   * Play call ended beep
   */
  playEndedBeep() {
    if (!this.audioContext || !this.isEnabled) return;

    const gain = this.audioContext.createGain();
    gain.connect(this.audioContext.destination);
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

    // End beep (400Hz, descending)
    const osc = this.audioContext.createOscillator();
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      200,
      this.audioContext.currentTime + 0.5,
    );
    osc.connect(gain);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);

    console.log("📞 Playing call ended beep...");
  }

  /**
   * Play busy signal
   */
  playBusySignal() {
    if (!this.audioContext || !this.isEnabled) return;

    const gain = this.audioContext.createGain();
    gain.connect(this.audioContext.destination);
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

    // Busy signal pattern: rapid beeps
    for (let i = 0; i < 6; i++) {
      const osc = this.audioContext.createOscillator();
      osc.frequency.setValueAtTime(480, this.audioContext.currentTime);
      osc.connect(gain);

      const startTime = this.audioContext.currentTime + i * 0.5;
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    }

    console.log("📞 Playing busy signal...");
  }

  /**
   * Clean up audio resources
   */
  cleanup() {
    this.stopRinging();

    if (this.audioContext) {
      this.audioContext.close();
      this['audioContext'] = null;
    }
  }

  /**
   * Enable/disable audio feedback
   */
  setEnabled(enabled: boolean) {
    this['isEnabled'] = enabled;
    if (!enabled) {
      this.cleanup();
    } else {
      this.initializeAudioContext();
    }
  }
}
