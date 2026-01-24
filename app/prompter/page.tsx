"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrompterPage() {
  const router = useRouter();

  const [script] = useState<string>(() => {
    return window.localStorage.getItem("teleprompterScript") ?? "";
  });

  return (
    <main className="relative min-h-screen bg-black text-white p-10">
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 rounded-full border border-white/20 bg-white/5 px-4 py-2
                   text-white/80 hover:bg-white/10 hover:text-white transition"
      >
        ← Back
      </button>

      <h2 className="fixed top-6 left-1/2 -translate-x-1/2 text-xl text-white/70">
        Teleprompter
        </h2>

      <div className="mx-auto max-w-3xl text-4xl leading-relaxed font-semibold whitespace-pre-wrap">
        {script || "No script found. Go back and paste your script."}
      </div>
    </main>
  );
}
