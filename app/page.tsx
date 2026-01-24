"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);
  const [script, setScript] = useState("");
  const router = useRouter();
  const start = () => {
    localStorage.setItem("teleprompterScript", script);
    router.push("/reading");
  };

  return (
    <main className = "flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className = "text-6xl font-bold mb-18">Smart Teleprompter</h1>
      
      <textarea 
        value = {script}
        onChange = {(e) => setScript(e.target.value)}
        className = "w-full max-w-2xl h-64 p-4 text-white rounded-lg shadow-lg border-2 border-gray-300 focus:border-yellow-400 outline-none"
        placeholder = "Paste your script here..."
      />
    
      <button
        onClick={start}
        className="mt-6 px-8 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-colors"
      >
        Start Reading
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
  )
}