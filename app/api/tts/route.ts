import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, stability, similarity, style } = await req.json();

  // This pulls the key from your .env.local file safely
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // This is the "Order" we send to ElevenLabs
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/your_voice_id_here`, {
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
        style: style,
        use_speaker_boost: true
      },
    }),
  });

  const audioBuffer = await response.arrayBuffer();
  
  // This sends the audio back to your browser
  return new NextResponse(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}