/**
 * @module lib/voice/provider
 *
 * Dual voice engine — dispatches TTS requests to browser or AI backend.
 *
 * ─── Architecture ──────────────────────────────────────────────────────────
 *
 * speak() is the single entry point. It reads VoiceConfig to decide:
 *   "browser" → SpeechSynthesis API (free, instant, offline)
 *   "ai"      → POST /api/voice/tts → ElevenLabs → Audio element playback
 *   "hybrid"  → AI for scope-matched content, browser for the rest
 *
 * AI audio is cached in IndexedDB (via audio-cache.ts). The same text+voice
 * combination never generates a second API call. On cache hit, the blob is
 * replayed directly — faster than both browser TTS and a new API call.
 *
 * If AI TTS fails for any reason (network, API key missing, budget exhausted),
 * it falls back to browser TTS silently. The student never sees a broken state.
 *
 * STT (Speech-to-Text) is unchanged — still browser-only via SpeechRecognition.
 */

import {
  loadVoiceConfig, resolveEngine, trackCharUsage,
  STYLE_VOICE_MAP,
  type VoiceConfig,
} from "./voice-config";
import {
  audioCacheKey, getCachedAudio, setCachedAudio, hasCachedAudio,
} from "./audio-cache";

// ─── TTS types ──────────────────────────────────────────────────────────────

export interface TTSOptions {
  text:    string;
  /** Which content type this is — controls hybrid routing. */
  context?: "question" | "explanation" | "raw";
  rate?:   number;
  pitch?:  number;
  onEnd?:  () => void;
  onError?: (error: string) => void;
}

// ─── Availability checks ────────────────────────────────────────────────────

export function isTTSAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSTTAvailable(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

// ─── Main TTS dispatcher ────────────────────────────────────────────────────

/**
 * Speak text using the configured engine. Returns a cancel function.
 *
 * Routing:
 *   1. Load config → resolveEngine()
 *   2. If "ai" → check cache → call API or replay blob → fallback to browser
 *   3. If "browser" → SpeechSynthesis directly
 */
export function speak(options: TTSOptions): () => void {
  const config = loadVoiceConfig();
  const context = options.context ?? "raw";
  const engine = resolveEngine(config, context, options.text.length);

  if (engine === "ai") {
    return speakAI(options, config);
  }

  return speakBrowser(options);
}

/** Stop any current playback (both browser and AI audio). */
export function stopSpeaking(): void {
  // Stop browser TTS
  if (isTTSAvailable()) {
    window.speechSynthesis.cancel();
  }
  // Stop AI audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

// ─── Browser TTS ────────────────────────────────────────────────────────────

export function selectBestVoice(): SpeechSynthesisVoice | null {
  if (!isTTSAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const preferred = [
    "google uk english female", "google us english", "samantha",
    "aria", "zira", "karen", "moira", "fiona", "google uk english",
  ];

  for (const keyword of preferred) {
    const match = englishVoices.find((v) => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  const femaleVoice = englishVoices.find((v) => /female|woman/i.test(v.name));
  if (femaleVoice) return femaleVoice;
  if (englishVoices.length > 0) return englishVoices[0]!;
  return voices[0] ?? null;
}

function speakBrowser(options: TTSOptions): () => void {
  if (!isTTSAvailable()) {
    options.onError?.("Speech is not available in this browser.");
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);
  const voice = selectBestVoice();
  if (voice) utterance.voice = voice;

  utterance.rate   = options.rate  ?? 0.88;
  utterance.pitch  = options.pitch ?? 1.05;
  utterance.volume = 1;

  utterance.onend   = () => options.onEnd?.();
  utterance.onerror = (e) => options.onError?.(e.error ?? "Speech failed");

  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}

// ─── AI TTS (ElevenLabs via /api/voice/tts) ─────────────────────────────────

let currentAudio: HTMLAudioElement | null = null;

function speakAI(options: TTSOptions, config: VoiceConfig): () => void {
  const voiceId = config.aiVoiceId || STYLE_VOICE_MAP[config.style]?.voiceId || STYLE_VOICE_MAP.teacher.voiceId;
  const cacheKey = audioCacheKey(options.text, voiceId);

  let cancelled = false;

  // Fire-and-forget async
  void (async () => {
    try {
      // 1. Check cache first
      const cached = await getCachedAudio(cacheKey);
      if (cached && !cancelled) {
        playBlob(cached, options);
        return;
      }

      // 2. Call the API
      const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: options.text,
          style: config.style,
          voiceId: config.aiVoiceId || undefined,
        }),
      });

      if (cancelled) return;

      if (!response.ok || !response.body) {
        // Fallback to browser TTS
        speakBrowser(options);
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("audio")) {
        // API returned JSON error — fallback
        speakBrowser(options);
        return;
      }

      // 3. Read the audio blob
      const blob = await response.blob();
      if (cancelled) return;

      // 4. Cache it
      trackCharUsage(options.text.length);
      void setCachedAudio(cacheKey, blob);

      // 5. Play it
      playBlob(blob, options);
    } catch {
      // Any failure → silent fallback to browser
      if (!cancelled) speakBrowser(options);
    }
  })();

  return () => {
    cancelled = true;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      currentAudio = null;
    }
  };
}

function playBlob(blob: Blob, options: TTSOptions): void {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    options.onEnd?.();
  };

  audio.onerror = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    // Fallback to browser on playback error
    speakBrowser(options);
  };

  audio.play().catch(() => {
    // Autoplay blocked — fallback
    speakBrowser(options);
  });
}

// ─── STT (unchanged from Phase 1) ──────────────────────────────────────────

export interface STTOptions {
  lang?: string;
  maxDuration?: number;
  onResult:  (transcript: string) => void;
  onError:   (error: string) => void;
  onStart?:  () => void;
  onEnd?:    () => void;
}

export function startListening(options: STTOptions): () => void {
  if (!isSTTAvailable()) {
    options.onError("Speech recognition is not available in this browser.");
    return () => {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  if (!SR) {
    options.onError("Speech recognition is not available.");
    return () => {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new SR() as any;
  recognition.lang = options.lang ?? "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  let settled = false;

  recognition.onstart = () => options.onStart?.();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    settled = true;
    const result: string = event.results?.[0]?.[0]?.transcript ?? "";
    options.onResult(result.trim());
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    settled = true;
    const msg = friendlySTTError(event.error ?? "unknown");
    options.onError(msg);
  };

  recognition.onend = () => {
    if (!settled) {
      options.onError("I couldn't hear anything. Try speaking a bit closer to the microphone.");
    }
    options.onEnd?.();
  };

  const maxMs = (options.maxDuration ?? 15) * 1000;
  const timer = setTimeout(() => recognition.stop(), maxMs);

  recognition.start();

  return () => {
    clearTimeout(timer);
    recognition.stop();
  };
}

function friendlySTTError(error: string): string {
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "I need permission to use the microphone. Please allow it and try again.";
    case "no-speech":
      return "I didn't hear anything. Try speaking a bit closer to the microphone.";
    case "audio-capture":
      return "I can't find a microphone. Is one connected?";
    case "network":
      return "I need the internet to listen. Check your connection and try again.";
    case "aborted":
      return "";
    case "service-not-allowed":
      return "Voice input isn't working right now. You can type your answer instead.";
    case "language-not-supported":
      return "I can only understand English right now. Try typing your answer.";
    default:
      return "I didn't quite catch that. Let's try again — speak slowly and clearly.";
  }
}
