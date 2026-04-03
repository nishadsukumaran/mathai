/**
 * @module lib/security/honeypot
 *
 * Hidden honeypot field validation for bot detection.
 *
 * A hidden form field with a plausible name (e.g., "website") is included
 * in the signup form. Real users never see or fill it. Bots that auto-fill
 * all fields will populate it, revealing themselves.
 *
 * If the field contains any value, the request is silently rejected
 * with a generic error to avoid tipping off the bot.
 */

/** The honeypot field name — must match the hidden input in the signup form */
export const HONEYPOT_FIELD = "website";

/**
 * Check if the honeypot field was filled (indicating bot).
 *
 * @param value - The value of the honeypot field from the request body
 * @returns true if the request is from a bot (honeypot filled)
 */
export function isHoneypotTriggered(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  // Any non-empty value = bot
  return true;
}
