# 🎙️ ProPodium AI: Smart Speech Coach and Teleprompter

**ProPodium AI** is an intelligent, real-time speech coaching application built for the 2026 Hoya Hacks. It leverages **Next.js 15** and **Google Gemini 2.5 Flash** to analyze spoken practice against a written script, providing instant, actionable feedback on accuracy, pacing, and tone.

---

## ✨ Features

- **Multimodal Audio Analysis:** Processes raw voice recordings directly
- **Script Comparison:** Detects missed words, fillers, and deviations from your provided text.
- **Pacing & Tone Insights:** Analyzes your delivery speed and emotional resonance.
- **Compact UI:** Clean, dark-mode interface with optimized typography for easy reading of "Coach's Notes."

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS
- **AI Engine:** Google Gemini 2.5 Flash (Multimodal)
- **API Handler:** Edge-compatible Route Handlers with extended 60s timeout
- **Audio Capture:** MediaRecorder API (WebM)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- A Google AI Studio API Key. [Get one here](https://aistudio.google.com/).
- An Eleven Labs API Key. [Get one here](https://elevenlabs.io/).

### 2. Installation
```bash
git clone [https://github.com/your-username/echosync-ai.git](https://github.com/your-username/echosync-ai.git)
cd echosync-ai
npm install
