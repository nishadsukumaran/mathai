export { dispatchScene, isSceneEligible } from "./dispatcher";
export { validateScenePlan }              from "./validator";
export { resolveAnimation, PALETTES, paletteColor } from "./presets";
export { evaluateVisualReliability, getVisualCTALabel, getStepsFallbackMessage } from "./reliabilityGate";
export { visualTelemetry }                from "./visualTelemetry";
export type { ScenePlan, SceneStep, SceneElement, SceneAnimation } from "./types";
export type { GateResult, ReliabilityLevel, VisualSource, VisualMode } from "./reliabilityGate";
export { ScenePlanSchema } from "./types";
