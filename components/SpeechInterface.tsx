"use client";
import { useState, useRef, useEffect } from "react";


export default function SpeechHandler() {

  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [style, setStyle] = useState(0.0);
  // We'll assume 'text' comes from a prop or a state later
  const fullScriptText = "The future is bright";

  const playPreview = async (scriptText: string, stability: number, similarity: number) => {
  try {
    // 1. Send the data to your Secret Tunnel (the API route)
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: scriptText, 
        stability: stability, 
        similarity: similarity 
      }),
    });

    if (!response.ok) throw new Error("Failed to get audio");

    // 2. Turn the response into a "Blob" (a big chunk of audio data)
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // 3. Play the audio in the browser
    const audio = new Audio(url);
    audio.play();
  } catch (error) {
    console.error("ElevenLabs Error:", error);
    alert("Check your API key or permissions!");
  }
};
    
  // 1. The Script (The goal)
  const script = ["the", "future", "is", "bright"];

  // 2. The Pointer (Memory of where we are)
  const [index, setIndex] = useState(0);
  
  // 3. The "Ref" (A special trick so the mic doesn't get confused)
  // This is a "real-time" version of the index that the mic can always see.
  const indexRef = useRef(0);

  const startListening = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Hear words as you speak them

    recognition.onresult = (event: any) => {
      // Get the latest thing you said
      const transcript = event.results[event.results.length - 1][0].transcript;
      
      // Clean it: " The Future." -> "future"
      const spokenWord = transcript.trim().toLowerCase().split(" ").pop();

      // Look up what word we are LOOKING for
      const targetWord = script[indexRef.current];

      if (spokenWord === targetWord) {
        console.log("✅ Match!", spokenWord);
        
        // Move the pointer forward!
        const nextIndex = indexRef.current + 1;
        indexRef.current = nextIndex;
        setIndex(nextIndex); // This updates the UI
      }
    };

    recognition.start();
  };

  return (
    <div className="text-center p-6 border-2 border-gray-700 rounded-xl">
      <h3 className="text-lg mb-4">Target Word: 
        <span className="text-yellow-400 font-mono ml-2">
          {script[index] || "Done!"}
        </span>
      </h3>
      
      <button 
  onClick={() => playPreview(fullScriptText, stability, similarity)} 
  className="bg-purple-600 px-6 py-2 rounded-full ml-4"
>
</button>

      <div className="mt-4 flex gap-2 justify-center">
        {script.map((word, i) => (
          <span key={i} className={i === index ? "text-yellow-400 underline font-bold" : "text-gray-500"}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}