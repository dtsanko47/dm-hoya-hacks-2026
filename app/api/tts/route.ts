
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, stability, similarity, voiceId } = await req.json();
  const apiKey = process.env.ELEVENLABS_API_KEY;

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

  if (!response.ok) return NextResponse.json({ error: "API Error" }, { status: 500 });

  const audioBuffer = await response.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}
