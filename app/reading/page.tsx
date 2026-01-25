"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to prompter page
    router.push("/prompter");
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <p className="text-lg opacity-80">Loading...</p>
      </div>
    </main>
  );
}
