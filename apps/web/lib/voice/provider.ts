/**
 * @module lib/voice/provider
 *
 * Voice provider abstraction layer.
 *
 * Phase 1 uses the browser's Web Speech API:
 *   - SpeechSynthesis (TTS) — zero latency, works offline, good child voices
 *   - SpeechRecognition (STT) — Chrome/Edge use server-side recognition
 *
 * The abstraction exists so Phase 2 can swap in cloud providers (Whisper,
 * ElevenLabs, OpenAI TTS) without changing any UI code.
 *
 * ─── Voice persona direction ─────────────────────────────────────────────
 * The voice should sound like a patient primary-school math teacher:
 *   - warm, clear, calm
 *   - slightly slower than default speech rate
 *   - never robotic, corporate, or overly excited
 *   - English female voice preferred (research shows children respond well
 *     to clear female voices in educational contexts)
 *
 * The selectBestVoice() function ranks available browser voices by name
 * keywords that indicate child-friendly quality (e.g. "Google UK English
 * Female", "Samantha", "Karen"). This heuristic works across Chrome, Edge,
 * Safari, and Firefox.
 */

// ─── TTS (Text-to-Speech) ───────────────────────────────────────────────────

export interface TTSOptions {
  text:   string;
  rate?:  number;   // 0.1–10, default 0.88 (slightly slow for kids)
  pitch?: number;   // 0–2, default 1.05 (slightly warm)
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/** Check if TTS is available in this browser. */
export function isTTSAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Rank available voices and return the best one for a child-friendly
 * teaching experience. Prefers:
 *   1. Google UK English Female (Chrome — natural, clear)
 *   2. Google US English (Chrome — clear, common)
 *   3. Samantha (Safari/macOS — warm, very natural)
 *   4. Microsoft Aria (Edge — designed for education)
 *   5. Any English female voice
 *   6. First English voice available
 *   7. Default voice
 */
export function selectBestVoice(): SpeechSynthesisVoice | null {
  if (!isTTSAvailable()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter((v) =>
    v.lang.startsWith("en"),
  );

  // Priority keywords — ordered from most to least preferred
  const preferred = [
    "google uk english female",
    "google us english",
    "samantha",
    "aria",
    "zira",
    "karen",
    "moira",
    "fiona",
    "google uk english",
  ];

  for (const keyword of preferred) {
    const match = englishVoices.find((v) =>
      v.name.toLowerCase().includes(keyword),
    );
    if (match) return match;
  }

  // Fallback: any English female-sounding voice
  const femaleVoice = englishVoices.find((v) =>
    /female|woman/i.test(v.name),
  );
  if (femaleVoice) return femaleVoice;

  // Fallback: first English voice
  if (englishVoices.length > 0) return englishVoices[0]!;

  // Absolute fallback: default voice
  return voices[0] ?? null;
}

/**
 * Speak text aloud using the browser's SpeechSynthesis API.
 * Returns a cancel function.
 */
export function speak(options: TTSOptions): () => void {
  if (!isTTSAvailable()) {
    options.onError?.("Speech is not available in this browser.");
    return () => {};
  }

  // Cancel any current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);

  const voice = selectBestVoice();
  if (voice) utterance.voice = voice;

  utterance.rate  = options.rate  ?? 0.88;   // slightly slow for kids
  utterance.pitch = options.pitch ?? 1.05;   // slightly warm
  utterance.volume = 1;

  utterance.onend   = () => options.onEnd?.();
  utterance.onerror = (e) => options.onError?.(e.error ?? "Speech failed");

  window.speechSynthesis.speak(utterance);

  return () => window.speechSynthesis.cancel();
}

/** Stop any current TTS playback. */
export function stopSpeaking(): void {
  if (isTTSAvailable()) {
    window.speechSynthesis.cancel();
  }
}

// ─── STT (Speech-to-Text) ───────────────────────────────────────────────────

export interface STTOptions {
  /** Language code (default "en-US"). */
  lang?: string;
  /** Max recording duration in seconds (default 15). */
  maxDuration?: number;
  onResult:  (transcript: string) => void;
  onError:   (error: string) => void;
  onStart?:  () => void;
  onEnd?:    () => void;
}

/** Check if STT is available in this browser. */
export function isSTTAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Start speech recognition. Returns a stop function.
 * Recognition automatically stops after maxDuration seconds or on silence.
 */
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
      options.onError("I couldn't hear anything. Try speaking a bit louder.");
    }
    options.onEnd?.();
  };

  const maxMs = (options.maxDuration ?? 15) * 1000;
  const timer = setTimeout(() => {
    recognition.stop();
  }, maxMs);

  recognition.start();

  return () => {
    clearTimeout(timer);
    recognition.stop();
  };
}

/** Map browser STT error codes to child-friendly messages. */
function friendlySTTError(error: string): string {
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "I need permission to use the microphone. Please allow it and try again.";
    case "no-speech":
      return "I didn't hear anything. Try speaking a bit louder.";
    case "audio-capture":
      return "I can't find a microphone. Is one connected?";
    case "network":
      return "I need the internet to listen. Check your connection and try again.";
    case "aborted":
      return ""; // user cancelled — no error to show
    default:
      return "Something went wrong. Let's try again.";
  }
}
