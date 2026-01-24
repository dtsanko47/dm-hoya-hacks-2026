"use client";

import { useEffect, useState } from "react";

export default function ReadingPage() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) return;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        {count > 0 ? (
          <>
            <p className="text-lg mb-4 opacity-80">Starting in</p>
            <div className="text-7xl font-bold">{count}</div>
          </>
        ) : (
          <div className="text-4xl font-bold">Go!</div>
        )}
      </div>
    </main>
  );
}
