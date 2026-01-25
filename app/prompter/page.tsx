"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpeechHandler from "@/components/SpeechInterface";

export default function PrompterPage() {
  const router = useRouter();
  
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
    <main className="relative min-h-screen bg-black text-white p-10">
      <button
        onClick={() => router.push("/")}
        className="fixed top-6 left-6 z-50 rounded-full border border-white/20 bg-white/5 px-4 py-2
                   text-white/80 hover:bg-white/10 hover:text-white transition"
      >
        ← Back
      </button>

      <button
        onClick={handleRestart}
        className="fixed top-6 right-6 z-50 rounded-full border border-white/20 bg-red-600/20 px-4 py-2
                   text-red-300 hover:bg-red-600/30 hover:text-red-100 transition"
      >
        🔄 Restart
      </button>

      <h2 className="fixed top-6 left-1/2 -translate-x-1/2 text-xl text-white/70">
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
    </main>
  );
}