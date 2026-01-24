"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReadingPage() {
  const [count, setCount] = useState(3);
  const router = useRouter();

  useEffect(() => {
    // when it hits 0, show "Go!" briefly, then navigate
    if (count === 0) {
      const goId = setTimeout(() => router.push("/prompter"), 700);
      return () => clearTimeout(goId);
    }

    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black text-white">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 rounded-full border border-white/20 bg-white/5 px-4 py-2
                   text-white/80 hover:bg-white/10 hover:text-white transition"
      >
        ← Back
      </button>

      <div className="text-center">
        {count > 0 ? (
          <>
            <p className="text-lg mb-4 opacity-80">Starting in</p>
            <div className="text-7xl font-bold">{count}</div>
          </>
        ) : (
          <div className="text-5xl font-bold text-yellow-400">Go!</div>
        )}
      </div>
    </main>
  );
}
