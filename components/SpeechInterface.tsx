"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export default function SpeechHandler({ scriptText }: { scriptText: string }) {
  const originalWords = useMemo(() => 
    scriptText.split(/\s+/).filter(word => word.length > 0), 
    [scriptText]
  );
  
  const wordsPerLine = 4;
  const lines = useMemo(() => {
    const newLines = [];
    for (let i = 0; i < originalWords.length; i += wordsPerLine) {
      newLines.push(originalWords.slice(i, i + wordsPerLine));
    }
    return newLines;
  }, [originalWords]);

  const [wordIndex, setWordIndex] = useState(0);
  const wordIndexRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [currentWPM, setCurrentWPM] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const wordTimestampsRef = useRef<number[]>([]);

  // AUTO-SCROLL
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [wordIndex]);

  // WPM CALCULATION
  const calculateLiveWPM = useCallback(() => {
    const timestamps = wordTimestampsRef.current;
    if (timestamps.length < 2) return 0;
    const now = Date.now();
    const recent = timestamps.slice(-10);
    const timeSpan = (now - recent[0]) / 1000 / 60;
    return timeSpan <= 0 ? 0 : Math.round(recent.length / timeSpan);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isListening) interval = setInterval(() => setCurrentWPM(calculateLiveWPM()), 100);
    return () => clearInterval(interval);
  }, [isListening, calculateLiveWPM]);

  // SPEECH ENGINE WITH 5-WORD LOOK-AHEAD
  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Chrome or Edge.");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      const transcriptWords = transcript.split(/\s+/);
      const lastSpokenWord = transcriptWords[transcriptWords.length - 1];

      // LOOK-AHEAD CONFIG
      const lookAheadAmount = 3; 
      const currentIndex = wordIndexRef.current;

      // Check the next 5 words in the script
      for (let i = 0; i < lookAheadAmount; i++) {
        const checkIndex = currentIndex + i;
        if (checkIndex >= originalWords.length) break;

        const targetWord = originalWords[checkIndex]
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
          .toLowerCase();

        // If the transcript contains the word, or the last spoken word is a partial match
        if (transcript.includes(targetWord) || (lastSpokenWord.length >= 3 && targetWord.startsWith(lastSpokenWord))) {
          // Record timing for WPM
          wordTimestampsRef.current.push(Date.now());
          
          // Jump to this word + 1
          const newIndex = checkIndex + 1;
          wordIndexRef.current = newIndex;
          setWordIndex(newIndex);
          break; // Stop searching once we find a match in the window
        }
      }
    };

    recognition.onend = () => {
      if (isListening && wordIndexRef.current < originalWords.length) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      wordTimestampsRef.current = [];
      startListening();
    }
  };

  const skipWord = () => {
    wordIndexRef.current++;
    setWordIndex(wordIndexRef.current);
  };

  const skipLine = () => {
    const nextLineStart = (Math.floor(wordIndexRef.current / wordsPerLine) + 1) * wordsPerLine;
    wordIndexRef.current = nextLineStart;
    setWordIndex(nextLineStart);
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center pb-[60vh] relative">
      
      {/* PACE DISPLAY */}
      <div className={`fixed top-8 right-8 px-8 py-6 rounded-2xl shadow-2xl transition-all duration-500 z-50 ${
        isListening ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
      } ${currentWPM > 225 ? 'bg-red-600 animate-pulse' : 'bg-zinc-900 border border-white/10'}`}>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pace</div>
        <div className="text-6xl font-black text-white leading-none my-1">{currentWPM}</div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">WPM</div>
      </div>

      {/* STICKY CONTROLS */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl py-10 mb-20 border-b border-white/10">
        <div className="flex items-center justify-center gap-6">
          {!isListening ? (
            <button onClick={toggleListening} className="px-12 py-5 rounded-full text-2xl font-black shadow-2xl bg-green-600 hover:bg-green-500 hover:scale-105 transition-all text-white">
              🎤 Start Reading
            </button>
          ) : (
            <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-300">
              <button onClick={skipWord} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-white/10 transition">Skip Word ⏭️</button>
              <button onClick={toggleListening} className="px-8 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition shadow-lg">🛑 Stop</button>
              <button onClick={skipLine} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-white/10 transition">Skip Line ⏩</button>
            </div>
          )}
        </div>
      </div>

      {/* SCRIPT TEXT */}
      <div className="text-6xl leading-[1.8] font-bold px-4">
        {wordIndex < originalWords.length ? (
          lines.map((line, lineIdx) => {
            const lineStartIdx = lineIdx * wordsPerLine;
            return (
              <div key={lineIdx} className="mb-20 flex flex-wrap justify-center gap-x-8">
                {line.map((word, wordIdx) => {
                  const globalIdx = lineStartIdx + wordIdx;
                  const isPast = globalIdx < wordIndex;
                  const isCurrent = globalIdx === wordIndex;
                  return (
                    <span 
                      key={wordIdx} 
                      ref={isCurrent ? activeWordRef : null}
                      className={`transition-all duration-500 ${
                        isCurrent ? "text-yellow-400 underline underline-offset-[16px] decoration-4 scale-110" 
                        : isPast ? "text-zinc-800 opacity-40" : "text-white"
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="text-green-400 text-4xl animate-bounce py-20">🎉 Session Complete!</div>
        )}
      </div>
    </div>
  );
}