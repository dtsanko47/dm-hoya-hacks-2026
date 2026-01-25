import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, stability, similarity, voiceId } = await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY is not set" }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
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
          stability: stability,
          similarity_boost: similarity,
          use_speaker_boost: true
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ElevenLabs API Error:", response.status, errorData);
      return NextResponse.json({ 
        error: `ElevenLabs API Error: ${response.status}`,
        details: errorData
      }, { status: 500 });
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
