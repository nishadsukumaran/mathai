/**
 * @module lib/voice
 *
 * Public API for the MathAI voice layer.
 */

export { useTTS } from "./useTTS";
export type { TTSState, UseTTSReturn } from "./useTTS";

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
