/**
 * @module components/explanations
 *
 * Public API for the Visual Explanation Engine.
 *
 * Consumers should only import from this file:
 *
 *   import { VisualExplanationPlayer, dispatchExplanation } from "@/components/explanations";
 *
 *   const scene = dispatchExplanation({ text: "27 + 15" });
 *   if (scene) return <VisualExplanationPlayer scene={scene} />;
 *   else       return <TextExplanation ... />;
 */

export { VisualExplanationPlayer } from "./player/VisualExplanationPlayer";
export { dispatchExplanation, SUPPORTED_TYPES } from "./dispatch";
export type { SupportedExplanationType, ProblemSpec } from "./dispatch";

// Direct renderer access (for tests, demos, explicit routing)
export { buildAdditionRegroupingScene } from "./renderers/arithmetic/additionRegrouping";
export { buildFractionComparisonScene } from "./renderers/fractions/fractionComparison";
export { buildSimpleEquationScene }     from "./renderers/algebra/simpleEquation";

// Types
export type {
  ExplanationScene, ExplanationStep,
  VisualElement, VisualAction,
  RevealAction, FocusAction, DrawAction, MoveAction, ReplaceAction, DimAction, WaitAction,
  ScenePalette,
} from "./engine/scene-types";
