/**
 * @module app/api/voice/tts/route
 *
 * AI TTS proxy endpoint. Accepts text + voice config, calls ElevenLabs,
 * returns audio as a streaming response.
 *
 * The client never talks to ElevenLabs directly — this route:
 *   1. Validates the request
 *   2. Resolves the voice ID from the style config
 *   3. Calls ElevenLabs text-to-speech API
 *   4. Streams the audio back as audio/mpeg
 *
 * Env var: ELEVENLABS_API_KEY (server-only, not NEXT_PUBLIC_)
 *
 * If the key is missing or the request fails, returns a JSON error.
 * The client falls back to browser TTS on any non-audio response.
 */

import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Default voice IDs matching our style presets
const VOICE_IDS: Record<string, string> = {
  teacher:  "EXAVITQu4vr4xnSDxMaL",   // Sarah
  friendly: "jBpfAFnaylXJzIIjcRWl",   // Aria
  fun:      "onwK4e9ZLuTAKqWW03F9",   // Daniel
};

export async function POST(req: NextRequest) {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI voice is not configured. Using browser voice." },
      { status: 503 },
    );
  }

  let body: { text?: string; style?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Text must be 1-2000 characters." },
      { status: 400 },
    );
  }

  // Resolve voice: explicit voiceId > style mapping > default teacher
  const voiceId =
    body.voiceId ||
    VOICE_IDS[body.style ?? "teacher"] ||
    VOICE_IDS["teacher"]!;

  try {
    const response = await fetch(
      `${ELEVENLABS_BASE}/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.error("[voice/tts] ElevenLabs error:", response.status, errText);
      return NextResponse.json(
        { error: "AI voice failed. Using browser voice." },
        { status: 502 },
      );
    }

    // Stream the audio directly to the client
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[voice/tts] fetch failed:", err);
    return NextResponse.json(
      { error: "AI voice unavailable." },
      { status: 502 },
    );
  }
}
