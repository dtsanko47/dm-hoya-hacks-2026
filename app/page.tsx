"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MAX_TTS_CHARS } from "@/lib/limits";

export default function Home() {
  const [script, setScript] = useState("");
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.5);
  const [speed, setSpeed] = useState(0.5);
  const [styleExaggeration, setStyleExaggeration] = useState(0.5);
  const [voiceId, setVoiceId] = useState("hpp4J3VqNfWAUOO0d1Us"); // Default to Bella
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();
  const overCharLimit = script.length >= MAX_TTS_CHARS;
  const [showHelp, setShowHelp] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light") {
        setIsDarkMode(false);
      }
    }
  }, []);

  // Keep <html> in sync so the page background matches the toggle
  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  // Save theme to localStorage when it changes
  const handleThemeChange = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const playPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: script,
          stability,
          similarity,
          speed,
          styleExaggeration,
          voiceId,
        }),
      });

      if (!response.ok) {
        // Pull the real reason out of the JSON error body.
        let reason = response.statusText;
        try {
          const err = await response.json();
          reason = err.details || err.error || reason;
        } catch {
          // Non-JSON error body - fall back to the status text.
        }
        throw new Error(reason);
      }

      const blob = new Blob([await response.arrayBuffer()], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      console.error("Audio playback error:", e);
      alert(`Failed to play audio: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const start = () => {
    localStorage.setItem("teleprompterScript", script);
    router.push("/reading");
  };

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-12 transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* THEME TOGGLE */}
      <div className="fixed top-6 right-20 z-50 flex flex-col items-center gap-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
          Theme
        </p>
        <button
          onClick={handleThemeChange}
          className={`rounded-full border px-4 py-2 font-bold transition ${
            isDarkMode 
              ? 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white' 
              : 'border-black/20 bg-black/5 text-black/80 hover:bg-black/10 hover:text-black'
          }`}
        >
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
      </div>

      <h1 className={`text-5xl font-bold mb-8 ${
        isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
      }`}>ProPodium AI</h1>
      
      <textarea 
        value={script}
        onChange={(e) => setScript(e.target.value)}
        className={`w-full max-w-2xl h-64 p-4 rounded-xl border-2 outline-none mb-6 transition-colors ${
          isDarkMode
            ? 'bg-zinc-900 text-white border-zinc-700 focus:border-yellow-400 placeholder:text-white/40'
            : 'bg-gray-100 text-black border-gray-300 focus:border-yellow-400 placeholder:text-black/50'
        }`}
        placeholder="Paste your script here..."
        maxLength={MAX_TTS_CHARS}
      />

      {/* A credit per character - show the cost before the click */}
      <div
        className={`w-full max-w-2xl -mt-4 mb-6 flex justify-between text-xs ${
          isDarkMode ? 'text-white/40' : 'text-black/40'
        }`}
      >
        <span>
          {script.length.toLocaleString()} / {MAX_TTS_CHARS.toLocaleString()} characters
        </span>
        <span className={overCharLimit ? 'text-yellow-400 font-bold' : undefined}>
          {overCharLimit
            ? 'Character limit reached'
            : `Preview uses about ${script.length.toLocaleString()} credits`}
        </span>
      </div>

      <div className={`flex flex-col gap-6 w-full max-w-2xl p-8 rounded-2xl border mb-8 transition-colors ${
        isDarkMode 
          ? 'bg-zinc-900 border-white/10' 
          : 'bg-gray-100 border-black/10'
      }`}>
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col gap-2">
            <label className={`text-xs uppercase font-bold ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Stability: {stability}</label>
            <input type="range" min="0" max="1" step="0.1" value={stability} onChange={(e) => setStability(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className={`text-xs uppercase font-bold ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Similarity: {similarity}</label>
            <input type="range" min="0" max="1" step="0.1" value={similarity} onChange={(e) => setSimilarity(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className={`text-xs uppercase font-bold ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Speed: {speed}</label>
            <input type="range" min="0" max="1" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
          <div className="flex flex-col gap-2 -mt-4">
            <label className={`text-xs uppercase font-bold ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Style Exaggeration: {styleExaggeration}</label>
            <input type="range" min="0" max="1" step="0.1" value={styleExaggeration} onChange={(e) => setStyleExaggeration(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={`text-xs uppercase font-bold ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>Select Voice</label>
          <select 
            value={voiceId} 
            onChange={(e) => setVoiceId(e.target.value)}
            className={`p-3 rounded-lg border outline-none focus:border-yellow-400 transition-colors ${
              isDarkMode
                ? 'bg-black text-white border-white/20'
                : 'bg-white text-black border-black/20'
            }`}
          >
            {/* These are standard Pre-made voices that should always work */}
          <option value="hpp4J3VqNfWAUOO0d1Us">Bella (Female - Warm, Professional)</option>
          <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Female - Mature, Confident)</option>
          <option value="SAz9YHcvj6GT2YYXdXww">River (Female - Relaxed, Neutral)</option>
          <option value="TX3LPaxmHKxFdv7VOQHJ">Liam (Male - Energetic, Welcoming)</option>
          <option value="bIHbv24MWmeRgasZH58o">Will (Male - Relaxed Optimist)</option>
          <option value="iP95p4xoKVk53GoZ742B">Chris (Male - Charming, Down-to-Earth)</option>
          <option value="pNInz6obpgDQGcFmaJgB">Adam (Male - Dominant, Firm)</option>
          </select>
        </div>

        <button 
          onClick={playPreview} 
          disabled={loading || !script}
          className="bg-purple-600 text-white py-3 rounded-full font-bold hover:bg-purple-500 disabled:bg-purple-900 disabled:text-white/50 transition"
        >
          {loading ? "Generating Audio..." : "🔊 Hear AI Coach"}
        </button>
      </div>

      <button onClick={start} className="bg-yellow-400 text-black px-12 py-4 rounded-full font-bold hover:bg-yellow-300 transition text-xl">
        Start Teleprompter →
      </button>

      <button
        onClick={() => setShowHelp(true)}
        className={`absolute top-6 right-6 h-10 w-10 rounded-full border transition flex items-center justify-center
          ${isDarkMode 
            ? 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white' 
            : 'border-black/10 bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
          }`}
        aria-label="Instructions"
        title="Instructions"
    >
      ?
    </button>

      {/* This is what actually shows the instructions */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/0 p-6"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-white">Instructions</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white/60 hover:text-white text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <ol className="mt-4 space-y-2 text-white/80 list-decimal list-inside">
              <li>Paste your script into the box.</li>
              <li>Click <span className="text-yellow-400 font-semibold">Start Reading</span>.</li>
              <li>Watch the 3-second countdown.</li>
              <li>Start reading on the next screen.</li>
            </ol>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-full bg-yellow-400 px-5 py-2 font-bold text-black hover:bg-yellow-300"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POWERED BY FOOTER */}
      <div className="fixed bottom-6 left-6 px-4 py-2 bg-zinc-900/80 border border-white/10 rounded-lg">
        <p className="text-xs text-zinc-400">Powered by <span className="text-white font-semibold">ElevenLabs</span> & <span className="text-white font-semibold">Google Gemini</span></p>
      </div>

    </main>
  );
}