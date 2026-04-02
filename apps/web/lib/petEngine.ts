/**
 * @module lib/petEngine
 *
 * Centralized Pet Engine — controls all pet behavior, reactions, and messaging.
 *
 * Architecture:
 *   Event → Engine → Reaction (mood + animation + message)
 *                  → UI component receives reaction, renders only
 *
 * No UI logic here. No React. Pure functions + types.
 *
 * ─── DESIGN ─────────────────────────────────────────────────────────────────
 *
 *   1. Typed event system (no arbitrary strings)
 *   2. Mood + animation mapping per event
 *   3. Message library with anti-repeat
 *   4. Personality modifier (adjusts tone + intensity)
 *   5. Single entry point: getReaction(event, personality?)
 */

// ─── Events (exhaustive — no arbitrary strings) ──────────────────────────────

export type PetEvent =
  | "correct_answer"
  | "wrong_answer"
  | "retry_success"
  | "hint_requested"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "session_complete"
  | "level_up"
  | "badge_earned"
  | "idle";

// ─── Moods ───────────────────────────────────────────────────────────────────

export type PetMood = "idle" | "happy" | "cheering" | "thinking" | "proud" | "excited";

// ─── Animations ──────────────────────────────────────────────────────────────

export type PetAnimation = "bob" | "bounce" | "pulse" | "wiggle" | "glow" | "none";

// ─── Personality types ───────────────────────────────────────────────────────

export type PetPersonalityStyle = "playful" | "calm" | "motivator";

// ─── Reaction output ─────────────────────────────────────────────────────────

export interface PetReaction {
  mood:       PetMood;
  animation:  PetAnimation;
  message?:   string;
  /** Duration in ms before returning to idle */
  duration:   number;
}

// ─── Message library ─────────────────────────────────────────────────────────

interface MessagePool {
  playful:   string[];
  calm:      string[];
  motivator: string[];
}

const MESSAGES: Record<PetEvent, MessagePool> = {
  correct_answer: {
    playful:   ["Woohoo!", "Nailed it!", "Yes yes yes!", "High five!"],
    calm:      ["Well done.", "That's right.", "Nice work.", "Correct!"],
    motivator: ["You got this!", "Brilliant!", "Keep it up!", "Amazing!"],
  },
  wrong_answer: {
    playful:   ["Oops!", "Almost!", "Try again!", "So close!"],
    calm:      ["Not quite.", "Let's try again.", "Think carefully.", "One more go."],
    motivator: ["You'll get it!", "Don't give up!", "Learning moment!", "Keep trying!"],
  },
  retry_success: {
    playful:   ["You did it!", "See? Easy!", "Boom!", "Told ya!"],
    calm:      ["Well recovered.", "Persistence pays.", "Good effort.", "There you go."],
    motivator: ["Never give up!", "That's the spirit!", "Unstoppable!", "Real learning!"],
  },
  hint_requested: {
    playful:   ["Good idea!", "Smart move!", "Let's peek!", "Teamwork!"],
    calm:      ["Take your time.", "Think it through.", "No rush.", "Hints help."],
    motivator: ["Great strategy!", "Wise choice!", "Use every tool!", "Smart learner!"],
  },
  streak_3: {
    playful:   ["3 days! Fire!", "Hat trick!", "On a roll!"],
    calm:      ["3-day streak.", "Consistent.", "Well done."],
    motivator: ["3 days strong!", "Building habits!", "Streak power!"],
  },
  streak_7: {
    playful:   ["A WHOLE WEEK!", "Legend!", "Unstoppable!"],
    calm:      ["One full week.", "Impressive.", "Dedicated."],
    motivator: ["7-day warrior!", "Incredible!", "Champion!"],
  },
  streak_14: {
    playful:   ["TWO WEEKS?!", "Absolute unit!", "Hero status!"],
    calm:      ["Two weeks.", "Remarkable.", "Outstanding."],
    motivator: ["14-day legend!", "Mega streak!", "Phenomenal!"],
  },
  session_complete: {
    playful:   ["Session done!", "We did it!", "Party time!"],
    calm:      ["Session complete.", "Good work.", "Well practised."],
    motivator: ["Great session!", "You crushed it!", "Progress made!"],
  },
  level_up: {
    playful:   ["LEVEL UP!!", "New powers!", "Let's gooo!"],
    calm:      ["Level up.", "New level.", "Growing stronger."],
    motivator: ["You levelled up!", "New heights!", "So proud!"],
  },
  badge_earned: {
    playful:   ["Shiny badge!", "Collected!", "New bling!"],
    calm:      ["Badge earned.", "Achievement.", "Well deserved."],
    motivator: ["You earned it!", "Trophy time!", "So deserved!"],
  },
  idle: {
    playful:   ["Let's play!", "Bored yet? 😄", "Math time!"],
    calm:      ["I'm here.", "Ready.", "Take your time."],
    motivator: ["Let's learn!", "Ready for more?", "You got this!"],
  },
};

// ─── Event → Mood + Animation mapping ────────────────────────────────────────

interface ReactionTemplate {
  mood:      PetMood;
  animation: PetAnimation;
  duration:  number;
}

const EVENT_MAP: Record<PetEvent, ReactionTemplate> = {
  correct_answer:   { mood: "happy",    animation: "bounce",  duration: 2000 },
  wrong_answer:     { mood: "thinking", animation: "wiggle",  duration: 2000 },
  retry_success:    { mood: "proud",    animation: "glow",    duration: 2500 },
  hint_requested:   { mood: "thinking", animation: "wiggle",  duration: 2000 },
  streak_3:         { mood: "cheering", animation: "pulse",   duration: 3000 },
  streak_7:         { mood: "cheering", animation: "bounce",  duration: 3000 },
  streak_14:        { mood: "excited",  animation: "bounce",  duration: 4000 },
  session_complete: { mood: "cheering", animation: "pulse",   duration: 3000 },
  level_up:         { mood: "excited",  animation: "bounce",  duration: 4000 },
  badge_earned:     { mood: "happy",    animation: "glow",    duration: 3000 },
  idle:             { mood: "idle",     animation: "bob",     duration: 0    },
};

// ─── Personality modifiers ───────────────────────────────────────────────────

/**
 * Map PetPersonality (from the backend) to a PersonalityStyle for message tone.
 * Groups the 12 backend personalities into 3 tone categories.
 */
export function personalityToStyle(personality?: string): PetPersonalityStyle {
  if (!personality) return "motivator";

  // Playful: fast thinkers, streak champions, lightning/legendary types
  if (["fast_thinker", "lightning_thinker", "streak_champion", "legendary_streak"].includes(personality)) {
    return "playful";
  }
  // Calm: careful learners, zen learners
  if (["careful_learner", "zen_learner"].includes(personality)) {
    return "calm";
  }
  // Motivator: everything else (problem_solver, persistent_explorer, math_wizard, evolved forms)
  return "motivator";
}

// ─── Anti-repeat logic ───────────────────────────────────────────────────────

let lastMessage = "";

function pickMessage(pool: string[]): string {
  // Filter out the last message to avoid repeats
  const filtered = pool.filter((m) => m !== lastMessage);
  const source = filtered.length > 0 ? filtered : pool;
  const msg = source[Math.floor(Math.random() * source.length)]!;
  lastMessage = msg;
  return msg;
}

// ─── Main engine function ────────────────────────────────────────────────────

/**
 * Get the pet's reaction to a learning event.
 *
 * @param event       - The learning event that occurred
 * @param personality - The pet's backend personality string (optional)
 * @returns PetReaction with mood, animation, optional message, and duration
 *
 * Usage:
 *   const reaction = getReaction("correct_answer", pet?.personality);
 *   setPetMood(reaction.mood);
 *   // after reaction.duration ms, return to idle
 */
export function getReaction(
  event: PetEvent,
  personality?: string,
): PetReaction {
  const template = EVENT_MAP[event];
  const style    = personalityToStyle(personality);
  const pool     = MESSAGES[event][style];

  return {
    mood:      template.mood,
    animation: template.animation,
    message:   event !== "idle" ? pickMessage(pool) : undefined,
    duration:  template.duration,
  };
}
