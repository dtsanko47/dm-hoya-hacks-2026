"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SpeechHandler from "@/components/SpeechInterface";

export default function PrompterPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light") {
        setIsDarkMode(false);
      }
    }
  }, []);

  // Save theme to localStorage when it changes
  const handleThemeChange = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };
  
  // 1. Initialize state from localStorage
  const [script] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("teleprompterScript") || "";
    }
    return "";
  });

  const handleRestart = () => {
    localStorage.removeItem("teleprompterScript");
    router.push("/");
  };

  return (
    <main className={`relative min-h-screen p-10 transition-colors duration-300 ${
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

      <button
        onClick={() => router.push("/")}
        className={`fixed top-6 left-6 z-50 rounded-full border px-4 py-2 transition ${
          isDarkMode
            ? 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
            : 'border-black/20 bg-black/5 text-black/80 hover:bg-black/10 hover:text-black'
        }`}
      >
        ← Back
      </button>

      <h2 className={`fixed top-6 left-1/2 -translate-x-1/2 text-xl ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
        Teleprompter
      </h2>

      <div className="mt-20">
        {script ? (
          <SpeechHandler scriptText={script} />
        ) : (
          <div className="text-center text-2xl mt-40">
            No script found. Go back and paste your script.
          </div>
        )}
      </div>

      {/* POWERED BY FOOTER */}
      <div className="fixed bottom-6 left-6 px-4 py-2 bg-zinc-900/80 border border-white/10 rounded-lg">
        <p className="text-xs text-zinc-400">Powered by <span className="text-white font-semibold">ElevenLabs</span> & <span className="text-white font-semibold">Google Gemini</span></p>
      </div>
    </main>
  );
}