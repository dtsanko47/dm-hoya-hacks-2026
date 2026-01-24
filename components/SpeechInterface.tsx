"use client";
import { useState, useRef, useEffect, useMemo } from "react";

export default function SpeechHandler({ scriptText }: { scriptText: string }) {
  const originalWords = scriptText.split(/\s+/).filter(word => word.length > 0);
  const wordsPerLine = 4;
  
  // Group words into lines with useMemo to prevent recalculation on every render
  const lines = useMemo(() => {
    const newLines = [];
    for (let i = 0; i < originalWords.length; i += wordsPerLine) {
      newLines.push(originalWords.slice(i, i + wordsPerLine));
    }
    return newLines;
  }, [originalWords, wordsPerLine]);
  
  const [wordIndex, setWordIndex] = useState(0);
  const wordIndexRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastMatchedIndexRef = useRef(-1); // Track the last matched word to prevent duplicates

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Chrome or Edge.");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Set to true for faster response

    recognition.onresult = (event: any) => {
      // Get the latest transcript string
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      
      // Get the target word (current word in the full word list)
      const targetWord = originalWords[wordIndexRef.current]
        ?.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .toLowerCase();

      if (!targetWord) return; // Script is complete

      console.log("Heard:", transcript, "Looking for:", targetWord);

      // Prevent duplicate matches for the same index
      if (lastMatchedIndexRef.current === wordIndexRef.current) return;

      // Match if:
      // 1. The full word is in the transcript, OR
      // 2. The transcript's first spoken chunk matches the start of the target word (partial match)
      // Increase responsiveness by allowing shorter partial matches (tweak `minPartialChars` below)
      const firstWord = transcript.trim().split(/\s+/)[0] || "";
      const minPartialChars = 1; // set to 1 for fastest response, raise to 2 to reduce false positives
      const fullMatch = transcript.includes(targetWord);
      const partialMatch = firstWord.length >= minPartialChars && targetWord.startsWith(firstWord);

      if (fullMatch || partialMatch) {
        console.log("✅ Match! Moving to next word");
        // mark this index as matched to avoid re-matching before state updates
        lastMatchedIndexRef.current = wordIndexRef.current;
        const nextWordIndex = wordIndexRef.current + 1;
        wordIndexRef.current = nextWordIndex;
        setWordIndex(nextWordIndex);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Keep the mic alive if the user hasn't manually stopped it
      if (isListening && wordIndexRef.current < originalWords.length) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Recognition restart failed", e);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      startListening();
    }
  };

  const skipWord = () => {
    const nextWordIndex = wordIndexRef.current + 1;
    wordIndexRef.current = nextWordIndex;
    setWordIndex(nextWordIndex);
  };

  const skipLine = () => {
    // Calculate which line we're currently on
    const currentLineIdx = Math.floor(wordIndexRef.current / wordsPerLine);
    // Move to the first word of the next line
    const nextLineFirstWordIdx = (currentLineIdx + 1) * wordsPerLine;
    wordIndexRef.current = nextLineFirstWordIdx;
    setWordIndex(nextLineFirstWordIdx);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mt-20 text-center pb-40">
      
      {/* BUTTON CONTROLS */}
      <div className="mb-16 flex items-center justify-center gap-4">
        {/* Skip Word Button */}
        <button
          onClick={skipWord}
          className="px-6 py-4 rounded-full text-lg font-bold shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
        >
          ⏭️ Skip Word
        </button>

        {/* Start/Stop Listening Button */}
        <button 
          onClick={toggleListening} 
          className={`px-10 py-4 rounded-full text-xl font-bold shadow-xl transition-all duration-300 ${
            isListening 
              ? "bg-red-600 hover:bg-red-500 animate-pulse" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isListening ? "🛑 Stop Listening" : "🎤 Start Listening"}
        </button>

        {/* Skip Line Button */}
        <button
          onClick={skipLine}
          className="px-6 py-4 rounded-full text-lg font-bold shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
        >
          ⏭️ Skip Line
        </button>
      </div>

      {/* 2. THE TELEPROMPTER LINES */}
      <div className="text-6xl leading-relaxed font-bold">
        {wordIndex < originalWords.length ? (
          lines.map((line, lineIdx) => {
            // Hide lines where ALL words have been completed
            const lineStartWordIdx = lineIdx * wordsPerLine;
            const lineEndWordIdx = lineStartWordIdx + line.length;
            
            if (wordIndex >= lineEndWordIdx) return null; // Hide completed lines

            return (
              <div 
                key={lineIdx} 
                className={`flex flex-wrap justify-center gap-x-6 gap-y-4 mb-12 transition-all duration-500 ${
                  wordIndex >= lineStartWordIdx && wordIndex < lineEndWordIdx
                    ? "opacity-100 scale-105" 
                    : "opacity-30 scale-95"
                }`}
              >
                {line.map((word, wordIdx) => {
                  const globalWordIdx = lineStartWordIdx + wordIdx;
                  const isCurrent = globalWordIdx === wordIndex;
                  
                  return (
                    <span 
                      key={wordIdx} 
                      className={isCurrent
                        ? "text-yellow-400 underline underline-offset-[12px] decoration-4" 
                        : "text-white"
                      }
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="text-green-400 animate-bounce mt-20">
            🎉 Script Completed!
          </div>
        )}
      </div>
    </div>
  );
}