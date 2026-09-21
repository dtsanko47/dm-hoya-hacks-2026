import { NextResponse } from "next/server";
import {
  MAX_AUDIO_BYTES,
  MAX_SCRIPT_CHARS,
  rateLimit,
  sweepBuckets,
  clientKey,
} from "@/lib/limits";

const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
];

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob;
    const originalScript = formData.get("script") as string;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    sweepBuckets();
    const limit = rateLimit(`review:${clientKey(req)}`, 5, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    // Inlined as base64, so a big upload costs tokens and time.
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Recording is too large." },
        { status: 413 }
      );
    }

    if (typeof originalScript === "string" && originalScript.length > MAX_SCRIPT_CHARS) {
      return NextResponse.json({ error: "Script is too long." }, { status: 413 });
    }

    // MediaRecorder reports "audio/webm;codecs=opus"; Gemini wants it bare.
    const mimeType = (audioFile.type || "audio/webm").split(";")[0].trim();

    if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${mimeType}` },
        { status: 415 }
      );
    }

    const buffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString("base64");

    const modelId = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { 
              text: `You are a professional speech coach. I am practicing this script: "${originalScript}". 
              Analyze my audio recording and provide detailed feedback. 
              Break your response into these sections:
              1. Accuracy (Did I miss words?)
              2. Pacing & Tone (Was I too fast/slow?)
              3. Specific Tips for Improvement.
              Be thorough but direct.` 
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GOOGLE API ERROR:", JSON.stringify(data, null, 2));
      // Log the upstream detail, don't serve it.
      return NextResponse.json(
        {
          error: `Gemini API Error: ${response.status}`,
          ...(process.env.NODE_ENV === "production"
            ? {}
            : { details: data.error?.message }),
        },
        { status: 502 }
      );
    }

    const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback generated.";
    
    return NextResponse.json({ feedback: feedbackText });

  } catch (error: any) {
    console.error("SERVER ERROR:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}