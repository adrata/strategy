export interface VoiceConfig {
  name: string;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

// Best female voices based on research and quality
const PREFERRED_FEMALE_VOICES = [
  // Microsoft natural voices (highest quality)
  "Microsoft Emma Multilingual Online (Natural) - English (United States)",
  "Microsoft Emma Online (Natural) - English (United States)",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Sonia Online (Natural) - English (United Kingdom)",

  // Google voices (good quality, widely available)
  "Google UK English Female",
  "Google US English Female",
  "Google英語（アメリカ）",

  // Apple voices (high quality when available)
  "Samantha",
  "Samantha (Enhanced)",
  "Ava",
  "Ava (Enhanced)",
  "Karen",
  "Fiona",

  // Fallback options
  "Microsoft Zira Desktop - English (United States)",
  "Microsoft Hazel Desktop - English (Great Britain)",
  "female",
  "Female",
];

export function getBestFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  // First try to find preferred voices in order
  for (const preferredName of PREFERRED_FEMALE_VOICES) {
    const voice = voices.find(
      (v) =>
        v.name.includes(preferredName) ||
        v['name'] === preferredName ||
        v['voiceURI'] === preferredName,
    );
    if (voice) {
      return voice;
    }
  }

  // Fallback: find any female voice in English
  const femaleVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("woman") ||
        v.name.toLowerCase().includes("girl")),
  );

  if (femaleVoice) {
    return femaleVoice;
  }

  // Last resort: use default voice
  return voices.find((v) => v.default) || voices[0] || null;
}

export function speakText(text: string, config?: Partial<VoiceConfig>): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getBestFemaleVoice();

  if (voice) {
    utterance['voice'] = voice;
  }

  // Apply configuration with optimal defaults for natural speech
  utterance['rate'] = config?.rate ?? 0.9; // Slightly slower for clarity
  utterance['pitch'] = config?.pitch ?? 1.0; // Natural pitch
  utterance['volume'] = config?.volume ?? 0.8; // Comfortable volume
  utterance['lang'] = config?.lang ?? "en-US";

  // Add error handling
  utterance['onerror'] = (event) => {
    console.warn("Speech synthesis error:", event);
  };

  window.speechSynthesis.speak(utterance);
}

// Initialize voices (needed for some browsers)
export function initializeVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }

    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        onVoicesChanged,
      );
      resolve();
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    // Timeout after 3 seconds
    setTimeout(() => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        onVoicesChanged,
      );
      resolve();
    }, 3000);
  });
}

// Debug function to list available voices
export function listAvailableVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.log("Speech synthesis not available");
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  console.log(
    "Available voices:",
    voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      localService: v.localService,
    })),
  );

  const bestVoice = getBestFemaleVoice();
  console.log("Selected best female voice:", bestVoice?.name);
}
