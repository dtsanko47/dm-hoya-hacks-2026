"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export default function SpeechHandler({ scriptText }: { scriptText: string }) {
  // 1. DATA PROCESSING
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

  // 2. STATE & REFS
  const [wordIndex, setWordIndex] = useState(0);
  const wordIndexRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [currentWPM, setCurrentWPM] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const wordTimestampsRef = useRef<number[]>([]);
  const lastMatchedIndexRef = useRef(-1);

  // 3. WPM DECAY LOGIC
  const calculateLiveWPM = useCallback(() => {
    const timestamps = wordTimestampsRef.current;
    if (timestamps.length < 2) return 0;
    
    const now = Date.now();
    const recentTimestamps = timestamps.slice(-10); // Look at last 10 words
    const firstWordInWindow = recentTimestamps[0];
    
    // As time passes without a new word, timeSpanMinutes grows, making WPM drop
    const timeSpanMinutes = (now - firstWordInWindow) / 1000 / 60;
    
    if (timeSpanMinutes <= 0) return 0;

    return Math.round(recentTimestamps.length / timeSpanMinutes);
  }, []);

  // Heartbeat to update WPM even when silent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setCurrentWPM(calculateLiveWPM());
      }, 100);
    } else {
      setCurrentWPM(0);
    }
    return () => clearInterval(interval);
  }, [isListening, calculateLiveWPM]);

  // 4. AUTO-SCROLL LOGIC
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [wordIndex]);

  // 5. SPEECH RECOGNITION ENGINE
  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Chrome or Edge.");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      
      const targetWord = originalWords[wordIndexRef.current]
        ?.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .toLowerCase();

      if (!targetWord || lastMatchedIndexRef.current === wordIndexRef.current) return;

      const transcriptWords = transcript.split(/\s+/);
      const lastWord = transcriptWords[transcriptWords.length - 1];
      
      // Match logic: Full inclusion or partial start-of-word match
      if (transcript.includes(targetWord) || (lastWord.length >= 2 && targetWord.startsWith(lastWord))) {
        wordTimestampsRef.current.push(Date.now());
        lastMatchedIndexRef.current = wordIndexRef.current;
        
        const nextWordIndex = wordIndexRef.current + 1;
        wordIndexRef.current = nextWordIndex;
        setWordIndex(nextWordIndex);
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

  // 6. NAVIGATION HELPERS
  const skipWord = () => {
    const nextIdx = wordIndexRef.current + 1;
    wordIndexRef.current = nextIdx;
    setWordIndex(nextIdx);
  };

  const skipLine = () => {
    const currentLineIdx = Math.floor(wordIndexRef.current / wordsPerLine);
    const nextLineFirstWordIdx = (currentLineIdx + 1) * wordsPerLine;
    wordIndexRef.current = nextLineFirstWordIdx;
    setWordIndex(nextLineFirstWordIdx);
  };

  // Cleanup
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto text-center pb-[60vh] relative">
      
      {/* PACE DISPLAY - FIXED POSITION */}
      <div className={`fixed top-8 right-8 px-8 py-6 rounded-2xl shadow-2xl transition-all duration-500 z-50 ${
        isListening ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
      } ${currentWPM > 225 ? 'bg-red-600 animate-pulse' : 'bg-zinc-900 border border-white/10'}`}>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pace</div>
        <div className="text-6xl font-black text-white leading-none my-1">{currentWPM}</div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Words / Min</div>
      </div>

      {/* STICKY CONTROL BAR */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl py-10 mb-20 border-b border-white/10">
        <div className="flex items-center justify-center gap-6">
          {!isListening ? (
            <button 
              onClick={toggleListening} 
              className="px-12 py-5 rounded-full text-2xl font-black shadow-2xl bg-green-600 hover:bg-green-500 hover:scale-105 transition-all text-white"
            >
              🎤 Start Reading
            </button>
          ) : (
            <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-300">
              <button onClick={skipWord} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-white/10 transition">
                Skip Word ⏭️
              </button>
              <button 
                onClick={toggleListening} 
                className="px-8 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition shadow-lg"
              >
                🛑 Stop
              </button>
              <button onClick={skipLine} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-white/10 transition">
                Skip Line ⏩
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TELEPROMPTER TEXT */}
      <div className="text-6xl leading-[1.8] font-bold px-4">
        {wordIndex < originalWords.length ? (
          lines.map((line, lineIdx) => {
            const lineStartWordIdx = lineIdx * wordsPerLine;

            return (
              <div key={lineIdx} className="mb-20 flex flex-wrap justify-center gap-x-8">
                {line.map((word, wordIdx) => {
                  const globalIdx = lineStartWordIdx + wordIdx;
                  const isPast = globalIdx < wordIndex;
                  const isCurrent = globalIdx === wordIndex;
                  
                  return (
                    <span 
                      key={wordIdx} 
                      ref={isCurrent ? activeWordRef : null}
                      className={`transition-all duration-500 ${
                        isCurrent 
                          ? "text-yellow-400 underline underline-offset-[16px] decoration-4 scale-110" 
                          : isPast 
                            ? "text-zinc-800 opacity-40" 
                            : "text-white"
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
          <div className="text-green-400 text-4xl animate-bounce py-20">🎉 Performance Complete!</div>
        )}
      </div>
    </div>
  );
}