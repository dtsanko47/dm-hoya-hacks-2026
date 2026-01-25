import { NextResponse } from "next/server";

// ✅ Tell Next.js to allow this route to run for up to 60 seconds
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
                mime_type: "audio/webm",
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5, // Lower for more consistent, structured output
        maxOutputTokens: 2048, // ✅ Increased to prevent cutting off
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
      return NextResponse.json({ error: data.error?.message }, { status: response.status });
    }

    const feedbackText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback generated.";
    
    return NextResponse.json({ feedback: feedbackText });

  } catch (error: any) {
    console.error("SERVER ERROR:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}