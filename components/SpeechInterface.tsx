"use client";
import { useState, useRef, useEffect } from "react";

//New

export default function SpeechHandler() {
    
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
      
      <button onClick={startListening} className="bg-green-600 px-6 py-2 rounded-full">
        Start Reading
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