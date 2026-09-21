import { NextResponse } from 'next/server';
import {
  MAX_TTS_CHARS,
  isAllowedVoice,
  rateLimit,
  sweepBuckets,
  clientKey,
} from '@/lib/limits';

// Sliders are 0..1. Stability/similarity/style use that range too, but speed
// is 0.7..1.2, so 0.5 has to land on 1.0 (normal).
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const toSpeed = (slider: number) => {
  const s = clamp(slider, 0, 1);
  return s < 0.5 ? 0.7 + s * 0.6 : 1.0 + (s - 0.5) * 0.4;
};

export async function POST(req: Request) {
  try {
    const { text, stability, similarity, speed, styleExaggeration, voiceId } =
      await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY is not set" }, { status: 500 });
    }

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // A credit per character, so cap it here - maxLength is only a hint.
    if (text.length > MAX_TTS_CHARS) {
      return NextResponse.json(
        {
          error: `Script is too long: ${text.length} characters (limit ${MAX_TTS_CHARS}).`,
        },
        { status: 413 }
      );
    }

    if (!isAllowedVoice(voiceId)) {
      return NextResponse.json({ error: "Unknown voice" }, { status: 400 });
    }

    sweepBuckets();
    const limit = rateLimit(`tts:${clientKey(req)}`, 10, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey as string,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: clamp(stability ?? 0.5, 0, 1),
          similarity_boost: clamp(similarity ?? 0.5, 0, 1),
          style: clamp(styleExaggeration ?? 0.5, 0, 1),
          speed: toSpeed(speed ?? 0.5),
          use_speaker_boost: true
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API Error:", response.status, errorData);
      // Public route - keep account/request ids out of the response.
      return NextResponse.json({
        error: `ElevenLabs API Error: ${response.status}`,
        ...(process.env.NODE_ENV === "production" ? {} : { details: errorData }),
      }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
