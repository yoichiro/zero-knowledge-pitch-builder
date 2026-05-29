# Zero-Knowledge Pitch Builder 🌟 (Chrome Built-in AI Powered)

A 100% private, client-side, zero-knowledge AI pitch generator that turns raw brainstorming ideas into beautifully structured startup pitches, elevator summaries, and Virtual Persona reviews.

**Everything runs entirely inside your browser using Chrome's Built-in AI (Gemini Nano). No APIs, no servers, and zero data leakage.**

---

## ✨ Features

- **🔒 100% Client-Side Privacy (Zero-Knowledge)**
  Since all text processing, summarization, and translation happen locally inside your browser, you can safely paste confidential business plans and unreleased IP without worrying about data leakage.
  
- **📝 6-Step Structuring Sequence**
  Automatically translates a raw "brain dump" into a highly-persuasive 6-step sequential pitch deck structure:
  1. **Hook**: Grab attention instantly.
  2. **Problem**: Define the pain point clearly.
  3. **Solution**: Explain your product value.
  4. **Value Proposition**: Detail the key benefits.
  5. **Competitors**: Address who else is in the space.
  6. **Differentiators**: Show why you win.

- **💬 Virtual Persona Critiques**
  Get immediate feedback from three distinct virtual personas simulated by local AI:
  - **VC Investor**: Critiques market size, scalability, and financial feasibility.
  - **Executive**: Evaluates strategic fit, operational efficiency, and ROI.
  - **General Consumer**: Assesses usability, immediate interest, and daily-life value.

- **⏱️ Variable-Length Pitch Synthesizer**
  Generates custom elevator pitches tailored to specific time limits:
  - **15-second pitch** (Quick hook & one-sentence concept)
  - **30-second pitch** (Core problem, solution, and differentiator)
  - **60-second pitch** (Detailed 6-step summary with Call-to-Action)

- **🎨 Premium & Highly Responsive UI**
  Built with a modern dark-themed glassmorphism layout, scrollable critique widgets, real-time parallel progress loader, and dynamic language detection badge (supporting Japanese and English).

---

## 🛠️ Prerequisites & Chrome Setup

To run this application, you need to use a browser that supports Chrome's experimental **Built-in AI** features (e.g., Chrome Dev or Chrome Canary, version 127+).

1. **Enable Prompt API:**
   - Open Chrome and navigate to `chrome://flags/#optimization-guide-on-device-model`.
   - Set it to **Enabled BypassPrefRequirement**.
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano`.
   - Set it to **Enabled**.

2. **Enable Summarizer API:**
   - Navigate to `chrome://flags/#summarization-api-writer-and-rewriter-apis`.
   - Set it to **Enabled**.

3. **Restart Browser:**
   - Relaunch Chrome and check your settings under `chrome://components` to ensure the **Optimization Guide On Device Model** is fully downloaded.

---

## 🚀 Getting Started

1. **Clone and Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open the App:**
   - Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).
   - Enter your raw ideas into the brainstorming "Brain Dump" textarea and watch local AI construct your pitch in real-time!

---

## 🏗️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript (100% strict type safety)
- **Styling**: Tailwind CSS (Premium glassmorphism, responsive grid layout)
- **Local AI Engines**: Chrome Built-in AI (Prompt API, Summarizer API, Translator API, LanguageDetector API)

---

## 📂 Project Structure ✨

The project features a highly modular, clean components architecture partitioned by core UI layout areas:

```text
src/
├── assets/          # Static assets (images, icons)
├── components/      # Modular React Components (Refactored ✨)
│   ├── AILoadingScreen.tsx   # Phase 1: Security initialization loader
│   ├── AISetupScreen.tsx     # Phase 2: Chrome built-in models installer
│   ├── Header.tsx            # App-wide full local security status header
│   ├── BrainDumpSection.tsx  # Left: Input dump & Virtual Persona critique widgets
│   ├── WorkspaceSection.tsx  # Middle: 6-component structural matrix layouts
│   ├── PitchCard.tsx         # Atomic editing card element inside workspace
│   └── OutputSection.tsx     # Right: Elevator summaries, translator & JSON exporter
├── utils/
│   └── chromeAI.ts  # Type-safe singleton wrapper for Chrome Experimental AI APIs
├── types.ts         # Centralized application types
├── App.tsx          # Clean main page state coordinator & AI flow controller
└── main.tsx         # App entry point
```
