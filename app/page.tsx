"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [script, setScript] = useState("");
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.5);
  const [speed, setSpeed] = useState(0.5);
  const [styleExaggeration, setStyleExaggeration] = useState(0.5);
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM"); // Default to Rachel
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const playPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({ text: script, stability, similarity, voiceId }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const blob = new Blob([await response.arrayBuffer()], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      console.error("Audio playback error:", e);
      alert("Failed to play audio. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const start = () => {
    localStorage.setItem("teleprompterScript", script);
    router.push("/reading");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-black text-white">
      <h1 className="text-5xl font-bold mb-8 text-yellow-400">Smart Teleprompter</h1>
      
      <textarea 
        value={script}
        onChange={(e) => setScript(e.target.value)}
        className="w-full max-w-2xl h-64 p-4 bg-zinc-900 text-white rounded-xl border-2 border-zinc-700 focus:border-yellow-400 outline-none mb-6"
        placeholder="Paste your script here..."
      />

      <div className="flex flex-col gap-6 w-full max-w-2xl bg-zinc-900 p-8 rounded-2xl border border-white/10 mb-8">
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase font-bold">Stability: {stability}</label>
            <input type="range" min="0" max="1" step="0.1" value={stability} onChange={(e) => setStability(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase font-bold">Similarity: {similarity}</label>
            <input type="range" min="0" max="1" step="0.1" value={similarity} onChange={(e) => setSimilarity(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase font-bold">Speed: {speed}</label>
            <input type="range" min="0" max="1" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
          <div className="flex flex-col gap-2 -mt-4">
            <label className="text-xs text-white/50 uppercase font-bold">Style Exaggeration: {styleExaggeration}</label>
            <input type="range" min="0" max="1" step="0.1" value={styleExaggeration} onChange={(e) => setStyleExaggeration(parseFloat(e.target.value))} className="accent-yellow-400" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/50 uppercase font-bold">Select Voice</label>
          <select 
            value={voiceId} 
            onChange={(e) => setVoiceId(e.target.value)}
            className="bg-black p-3 rounded-lg border border-white/20 outline-none focus:border-yellow-400"
          >
            {/* These are standard Pre-made voices that should always work */}
          <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female - Soft, Casual)</option>
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
          className="bg-purple-600 py-3 rounded-full font-bold hover:bg-purple-500 disabled:opacity-50 transition"
        >
          {loading ? "Generating Audio..." : "🔊 Hear AI Coach"}
        </button>
      </div>

      <button onClick={start} className="bg-yellow-400 text-black px-12 py-4 rounded-full font-bold hover:bg-yellow-300 transition text-xl">
        Start Teleprompter →
      </button>

      <button
        onClick={() => setShowHelp(true)}
        className="absolute top-6 right-6 h-10 w-10 rounded-full border border-white/20 bg-white/5
                   text-white/80 hover:bg-white/10 hover:text-white transition"
        aria-label="Instructions"
        title="Instructions"
      >
        ?
      </button>

      {/* ✅ This is what actually shows the instructions */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">Instructions</h2>
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

  
    </main>
  );
}