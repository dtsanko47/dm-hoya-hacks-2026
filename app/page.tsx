import Link from "next/link";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">Smart Teleprompter</h1>
      
      {/* Script Input Area */}
      <textarea 
        className="w-full max-w-2xl h-64 p-4 text-white rounded-lg shadow-lg border-2 border-gray-300 focus:border-yellow-400 outline-none"
        placeholder="Paste your script here..."
      />

      <Link
        href="/reading"
        className="mt-6 px-8 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-colors"
        >
        Start Reading
      </Link>
    </main>
  )
}