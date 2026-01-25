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
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const wordTimestampsRef = useRef<number[]>([]);

  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleListening = async () => {
  if (isListening) {
    setIsListening(false);
    recognitionRef.current?.stop();
    // Stop the audio recorder if it's running
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  } else {
    // Start the countdown
    setCountdown(3);
  }
};



  // AUTO-SCROLL
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [wordIndex]);

  // COUNTDOWN TIMER
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      // Start listening after "Go!"
      const startId = setTimeout(async () => {
        setCountdown(null);
        setIsListening(true);
        
        // Start listening with speech recognition
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) return alert("Please use Chrome or Edge.");

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
          const transcriptWords = transcript.split(/\s+/);
          const lastSpokenWord = transcriptWords[transcriptWords.length - 1];

          const lookAheadAmount = 3; 
          const currentIndex = wordIndexRef.current;

          for (let i = 0; i < lookAheadAmount; i++) {
            const checkIndex = currentIndex + i;
            if (checkIndex >= originalWords.length) break;

            const targetWord = originalWords[checkIndex]
              .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
              .toLowerCase();

            if (transcript.includes(targetWord) || (lastSpokenWord.length >= 3 && targetWord.startsWith(lastSpokenWord))) {
              wordTimestampsRef.current.push(Date.now());
              const newIndex = checkIndex + 1;
              wordIndexRef.current = newIndex;
              setWordIndex(newIndex);
              break;
            }
          }
        };

        recognition.onend = () => {
          if (wordIndexRef.current < originalWords.length) {
            try { recognition.start(); } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();

        // Start Audio Recording ONLY if enabled
        if (isRecordingEnabled) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          chunksRef.current = [];
          
          recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "audio/mp3" });
            setAudioBlob(blob);
          };
          
          mediaRecorderRef.current = recorder;
          recorder.start();
        }
      }, 700);
      return () => clearTimeout(startId);
    }

    const id = setTimeout(() => setCountdown((c) => c! - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, isRecordingEnabled, originalWords]);

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




  const generateAISummary = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("script", scriptText);
    try {
      const response = await fetch("/api/review", { method: "POST", body: formData });
      const data = await response.json();
      setAiSummary(data.feedback);
    } catch (error) {
      setAiSummary("Failed to generate AI analysis.");
    } finally {
      setIsAnalyzing(false);
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

  const handleRestart = () => {
    // Reset all state to initial values
    setWordIndex(0);
    wordIndexRef.current = 0;
    setIsListening(false);
    setCurrentWPM(0);
    wordTimestampsRef.current = [];
    setAudioBlob(null);
    setAiSummary(null);
    setIsAnalyzing(false);
    chunksRef.current = [];
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // AUTO-STOP when last word is reached
  useEffect(() => {
    if (wordIndex >= originalWords.length && isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
  }, [wordIndex, originalWords.length, isListening]);

  return (
    <div className="w-full max-w-4xl mx-auto text-center pb-[60vh] relative">
      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="text-center">
            {countdown > 0 ? (
              <>
                <p className="text-lg mb-4 opacity-80">Starting in</p>
                <div className="text-7xl font-bold text-yellow-400">{countdown}</div>
              </>
            ) : (
              <div className="text-5xl font-bold text-yellow-400">Go!</div>
            )}
          </div>
        </div>
      )}

      {/* RESTART BUTTON */}
      <button
        onClick={handleRestart}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-white/20 bg-yellow-600/20 px-4 py-2
                   text-yellow-300 hover:bg-yellow-600/30 hover:text-yellow-100 transition"
      >
        🔄 Restart
      </button>
      
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
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-6">
            {!isListening && wordIndex < originalWords.length ? (
              <button onClick={toggleListening} className="px-12 py-5 rounded-full text-2xl font-black shadow-2xl bg-green-600 hover:bg-green-500 hover:scale-105 transition-all text-white">
                🎤 Start Reading
              </button>
            ) : wordIndex >= originalWords.length ? (
              isRecordingEnabled && audioBlob && !aiSummary ? (
                <button 
                  onClick={generateAISummary}
                  disabled={isAnalyzing}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl transition-all"
                >
                  {isAnalyzing ? "Gemini is listening..." : "✨ Generate AI Review"}
                </button>
              ) : null
            ) : (
              <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                <button onClick={skipWord} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-white/10 transition">Skip Word ⏭️</button>
                <button onClick={toggleListening} className="px-8 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition shadow-lg">🛑 Stop</button>
                <button onClick={skipLine} className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 border border-white/10 transition">Skip Line ⏩</button>
              </div>
            )}
          </div>
          
          {/* ENABLE RECORDING TOGGLE */}
          {!isListening && wordIndex === 0 && (
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="aiRecord" 
                checked={isRecordingEnabled} 
                onChange={() => setIsRecordingEnabled(!isRecordingEnabled)}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="aiRecord" className="text-zinc-400 text-sm font-bold cursor-pointer">Enable Recording for AI Summary</label>
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
          <div className="mt-20 p-10 bg-zinc-900/50 rounded-3xl border border-white/10 animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-green-400 text-4xl font-black mb-6">🎉 Session Complete!</h2>
            
            {isRecordingEnabled && audioBlob ? (
              <div className="space-y-6">
                <p className="text-zinc-400">Audio captured. Ready for coaching feedback?</p>
                {!aiSummary ? (
                  <button 
                    onClick={generateAISummary}
                    disabled={isAnalyzing}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl transition-all"
                  >
                    {isAnalyzing ? "Gemini is listening..." : "✨ Generate AI Review"}
                  </button>
                ) : (
                  <div className="text-left bg-black/40 p-6 rounded-2xl border border-blue-500/30 prose prose-invert max-w-none">
                    <h3 className="text-blue-400 font-bold mb-2">Coach Gemini's Notes:</h3>
                    <div className="whitespace-pre-wrap text-zinc-200 text-base leading-relaxed">{aiSummary}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-500 italic">Recording was disabled.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}