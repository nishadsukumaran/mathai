/**
 * @module lib/voice
 *
 * Public API for the MathAI voice layer.
 */

export { useTTS, teacherPhrase } from "./useTTS";
export type { TTSState, UseTTSReturn, UseTTSOptions } from "./useTTS";

export { useSTT } from "./useSTT";
export type { STTState, UseSTTReturn } from "./useSTT";

export { normalizeMath } from "./math-normalize";

export {
  isTTSAvailable,
  isSTTAvailable,
  speak,
  stopSpeaking,
  startListening,
  selectBestVoice,
} from "./provider";

export {
  loadVoiceConfig,
  saveVoiceConfigOverride,
  resolveEngine,
  getCharUsage,
  DEFAULT_VOICE_CONFIG,
  STYLE_VOICE_MAP,
} from "./voice-config";
export type { VoiceConfig, VoiceEngine, VoiceStyle, VoiceScope } from "./voice-config";
