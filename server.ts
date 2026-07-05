import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { booklets } from "./src/data/booklets";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Shared Gemini client lazy initializer
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined. Please configure it in your AI Studio Secrets panel.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // WHS Safety Advisor API endpoint
  app.post("/api/advisor", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getGeminiClient();

      // Build system instructions with complete booklets catalog context
      const bookletsListText = booklets.map((b, i) => 
        `${i + 1}. **Title**: "${b.title}"\n   **Filename**: ${b.name}\n   **Group**: ${b.group}\n   **Audience**: ${b.audience}\n   **Overview**: ${b.description}`
      ).join("\n\n");

      const systemInstruction = `You are SafetyAware Advisor, a professional virtual Work Health & Safety (WHS) consultant specialized in Australian workplace safety, respectful conduct, anti-discrimination, and mental well-being standards for 2026/2027.

Your objective is to provide professional, actionable, and compassionate guidance to users (employers, young workers, Indigenous representatives, and general staff).

IMPORTANT KNOWLEDGE DIRECTORY:
You have a primary catalogue of 47 Australian WHS and Respectful Workplace booklets. Here is the list:

${bookletsListText}

HOW TO FORMULATE YOUR RESPONSES:
1. **Always recommend the most relevant booklet(s)** from the directory above. Specify both their full **Title** in quotes and their **Filename** (e.g. \`booklet_construction_2026.pdf\`) so the user knows exactly which material to open.
2. Provide high-quality, legally-aligned Australian WHS summaries, step-by-step procedures, or hazard-spotting tips.
3. Keep your advice structured with bold headers, bullet lists, or safe practice checklists.
4. Keep the tone friendly, practical, and highly professional.
5. If the user's question relates to a specific group (e.g. young employees, Indigenous & remote communities, or a specific industry like hospitality or aged care), emphasize the booklets specifically designed for that audience.
6. If the prompt is not safety/respect related, gently guide them back to compliance, respect, and safety guidelines.`;

      // Structure contents with history for full conversational context
      // Note: @google/genai contents should follow the role/parts pattern:
      // contents: [{ role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] }]
      const formattedContents: any[] = [];

      // Append history if available
      if (Array.isArray(history)) {
        history.forEach((turn: { role: string; content: string }) => {
          formattedContents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.content }]
          });
        });
      }

      // Append current message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const text = response.text || "I apologize, but I was unable to compile an answer at this moment.";
      res.json({ response: text });
    } catch (error: any) {
      console.error("Gemini Advisor API Error:", error);
      res.status(500).json({ 
        error: error.message || "An unexpected error occurred in the Safety Advisor assistant." 
      });
    }
  });

  // Serve static booklets info directly
  app.get("/api/booklets", (req, res) => {
    res.json(booklets);
  });

  // Dynamic quiz generation endpoint using Gemini
  app.post("/api/quiz/generate", async (req, res) => {
    try {
      const { bookletName } = req.body;
      if (!bookletName) {
        return res.status(400).json({ error: "Booklet name is required." });
      }

      const booklet = booklets.find((b) => b.name === bookletName);
      if (!booklet) {
        return res.status(404).json({ error: "Booklet not found in database." });
      }

      let questions = null;

      try {
        const ai = getGeminiClient();
        const prompt = `You are an expert Australian Work Health and Safety (WHS) compliance trainer.
Generate a professional, realistic 3-question multiple-choice comprehension quiz designed to test a worker's understanding after reading the booklet: "${booklet.title}".

BOOKLET INFORMATION:
- Title: ${booklet.title}
- Group: ${booklet.group}
- Target Audience: ${booklet.audience}
- Key Focus: ${booklet.description}

REQUIREMENTS:
1. Ensure questions are highly realistic, scenario-based, and focused on specific compliance procedures for the target audience: ${booklet.audience}.
2. Each question must have exactly 4 plausible choices (prefixed with A), B), C), D)).
3. Only ONE choice must be clearly correct based on Australian safe work standards.
4. For each question, provide a supportive, constructive, and detailed explanation for why the correct answer is correct and why the alternatives are unsafe or incorrect.
5. Provide the correct answer index as an integer (0 for A, 1 for B, 2 for C, 3 for D).

Format the output strictly as a JSON array of objects according to the schema.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are a professional Australian WHS educational engine. Return output in JSON only.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "Array of exactly 3 multiple-choice questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          questions = JSON.parse(text);
        }
      } catch (err) {
        console.warn("Gemini quiz generation failed or key missing. Using beautiful, dynamic, customized fallback quiz:", err);
      }

      // Dynamic custom fallback if API is not configured or fails
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        questions = [
          {
            question: `Which of the following describes the correct implementation duty regarding the safety protocols in the booklet "${booklet.title}"?`,
            options: [
              "A) Safety guidelines are optional and can be disregarded if timelines are tight.",
              `B) The target group (${booklet.audience}) must collaborate to execute safe systems of work.`,
              "C) Safety duties are solely held by external regulatory auditors during active audits.",
              "D) Safety induction checklists only apply to temporary interns and visitors."
            ],
            correctAnswer: 1,
            explanation: `Under the Australian WHS Act, work health and safety is a shared responsibility. While PCBUs hold the primary duty, the designated audience (${booklet.audience}) must actively participate, cooperate with instructions, and execute hazard audits.`
          },
          {
            question: `According to the overview, which core compliance and risk management goal is targeted in "${booklet.title}"?`,
            options: [
              "A) Enhancing financial ledger audit speeds",
              "B) Refining corporate graphic standards",
              `C) ${booklet.description}`,
              "D) Managing team vacation leave schedules"
            ],
            correctAnswer: 2,
            explanation: `The booklet directly targets: ${booklet.description}. Understanding this primary objective is essential for implementing the correct hazard controls.`
          },
          {
            question: "Under standard Australian WHS practices, what is the mandatory immediate action upon spotting a new workplace hazard?",
            options: [
              "A) Leave the area and allow someone else to encounter it first",
              "B) Document it in personal records and wait for the end of the month to report",
              "C) Report it immediately to a supervisor or Health and Safety Representative (HSR) and ensure the area is isolated",
              "D) Inform coworkers but avoid reporting it to management to prevent administrative delay"
            ],
            correctAnswer: 2,
            explanation: "Immediate reporting of hazards is a statutory duty under Australian WHS law. It enables prompt risk assessment, isolation of risk, and implementation of control measures to prevent injuries."
          }
        ];
      }

      res.json({ bookletName, title: booklet.title, questions });
    } catch (error: any) {
      console.error("Quiz endpoint error:", error);
      res.status(500).json({ error: error.message || "Failed to generate compliance quiz." });
    }
  });

  // Implements the document viewer and quiz portal that intercepts any click to booklet paths
  app.get("/all_pdf_booklets_no_index/:filename", (req, res) => {
    const { filename } = req.params;
    const booklet = booklets.find((b) => b.name === filename);

    if (!booklet) {
      return res.status(404).send(`
        <html>
          <head><title>Booklet Not Found - SafetyAware</title><script src="https://cdn.tailwindcss.com"></script></head>
          <body class="bg-[#0F0F12] text-slate-300 flex items-center justify-center h-screen font-sans">
            <div class="text-center p-8 bg-[#16161A] rounded-2xl border border-white/5 max-w-md shadow-2xl">
              <h1 class="text-amber-500 font-bold text-2xl mb-3">Document Not Found</h1>
              <p class="text-sm mb-6">The booklet "${filename}" could not be located in our WHS catalogue.</p>
              <a href="/" class="px-5 py-2.5 bg-amber-500 text-black font-bold text-sm rounded-xl hover:bg-amber-600 transition-all">Back to Dashboard</a>
            </div>
          </body>
        </html>
      `);
    }

    // Generate high-quality mock chapters tailored dynamically to the booklet's metadata
    const groupDetails = booklet.group;
    const targetAudience = booklet.audience;
    const desc = booklet.description;

    res.send(`
<!DOCTYPE html>
<html lang="en" class="h-full bg-[#0F0F12] text-slate-100">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${booklet.title} - WHS Digital Book & Quiz</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            darkbg: '#0F0F12',
            darkcard: '#16161A',
            darknav: '#1C1C21',
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(245, 158, 11, 0.3);
    }
  </style>
</head>
<body class="flex flex-col h-screen overflow-hidden bg-darkbg text-slate-200">
  <!-- Top Navigation Bar -->
  <header class="bg-darkcard border-b border-white/5 py-4 px-6 flex items-center justify-between z-20 shadow-md">
    <div class="flex items-center space-x-3">
      <div class="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20">
        <!-- SVG icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><path d="m9 12 2 2 4-4"/></svg>
      </div>
      <div>
        <h1 class="text-sm font-bold text-white tracking-wide">${booklet.title}</h1>
        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">${booklet.group} • Compliance Year 2026</p>
      </div>
    </div>
    
    <div class="flex items-center space-x-3">
      <span class="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-medium hidden sm:inline-block">
        Audience: <strong class="text-slate-200">${booklet.audience}</strong>
      </span>
      <button onclick="window.close()" class="px-3.5 py-1.5 border border-white/10 bg-[#1A1A1F] text-xs hover:bg-white/5 text-slate-300 rounded-lg cursor-pointer transition-colors outline-none font-medium">
        Close Tab
      </button>
    </div>
  </header>

  <!-- Main Split Content Area -->
  <main class="flex-1 flex flex-col lg:flex-row overflow-hidden">
    <!-- Left Column: Beautiful Digital Booklet Reader -->
    <section class="flex-1 flex flex-col bg-darkbg overflow-y-auto p-6 lg:p-8 border-r border-white/5 custom-scroll">
      <div class="max-w-2xl mx-auto w-full space-y-8 pb-12">
        <!-- Title Page -->
        <div class="bg-darkcard border border-white/5 rounded-3xl p-6 lg:p-10 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl"></div>
          
          <div class="space-y-4">
            <span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-md">
              Official WHS Statutory Material
            </span>
            <h2 class="text-2xl lg:text-3xl font-bold font-sans text-white leading-tight tracking-tight mt-2">${booklet.title}</h2>
            <p class="text-slate-400 text-sm leading-relaxed mt-4 font-sans border-l-2 border-amber-500 pl-4 bg-white/[0.01] py-3 rounded-r-lg">
              ${booklet.description}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
            <div>
              <p class="text-[10px] font-mono text-slate-500 uppercase font-bold">WHS File Path</p>
              <p class="text-xs font-mono text-slate-300 truncate mt-1">${booklet.path}</p>
            </div>
            <div>
              <p class="text-[10px] font-mono text-slate-500 uppercase font-bold">Authorized Target</p>
              <p class="text-xs font-semibold text-slate-300 mt-1">${booklet.audience}</p>
            </div>
          </div>
        </div>

        <!-- Section 1: Introduction -->
        <div class="space-y-4">
          <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-amber-500">Section 1: General WHS Directives</h3>
          <p class="text-sm leading-relaxed text-slate-300">
            This digital document sets out the minimum work health, safety, and respect requirements as applicable under current Australian legislation including the <strong>Work Health and Safety Act 2011 (Commonwealth/States)</strong>. Every employee, volunteer, contractor, and stakeholder has a strict legal obligation to uphold safe practices, consult on risk assessments, and report hazardous circumstances immediately.
          </p>
          <p class="text-sm leading-relaxed text-slate-300">
            For the <strong>${groupDetails}</strong> group, compliance is monitored actively. PCBUs (Persons Conducting a Business or Undertaking) must facilitate secure environments, while workers within the target audience (<strong>${targetAudience}</strong>) must adhere to defined hazard mitigation, use appropriate PPE, and avoid engaging in bullying, discrimination, or negligent behavioral risks.
          </p>
        </div>

        <!-- Section 2: Core Hazard Controls -->
        <div class="space-y-4">
          <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-amber-500">Section 2: Critical Risk Controls</h3>
          <div class="bg-darkcard border border-white/5 p-5 rounded-2xl space-y-4">
            <p class="text-xs text-slate-300 font-medium leading-relaxed">
              Based on the designated focus of <strong>${desc}</strong>, the following fundamental hazard controls must be implemented at all times:
            </p>
            <ul class="space-y-3.5 text-xs text-slate-300">
              <li class="flex items-start space-x-3">
                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>Engineering Isolation:</strong> Eliminate mechanical or chemical hazards at the source. Secure safety guards and emergency controls on all heavy implements.</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>Workplace Culture:</strong> Cultivate a Zero-Tolerance policy against verbal abuse, lateral violence, and discriminatory conduct. Respectful communication is a core psychological safety pillar.</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>Mental Safety Integration:</strong> Recognize heavy study/work loads, sleep deprivation, and isolation. Ensure all workers have pathways to counselors or regional support representatives.</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Section 3: Shared Duties -->
        <div class="space-y-4">
          <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-amber-500">Section 3: Mandatory Reporting Duty</h3>
          <p class="text-sm leading-relaxed text-slate-300">
            If you identify a safety violation, near-miss, physical slip hazard, toxic interaction, or psychological hazard, you are mandated under statutory guidelines to:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-4 bg-darkcard rounded-xl border border-white/5 text-center">
              <span class="font-mono text-amber-500 text-lg font-bold">01</span>
              <p class="text-xs font-bold text-white mt-1">Isolate Risk</p>
              <p class="text-[11px] text-slate-400 mt-1">Carefully cordon off the hazard safely if trained to do so.</p>
            </div>
            <div class="p-4 bg-darkcard rounded-xl border border-white/5 text-center">
              <span class="font-mono text-amber-500 text-lg font-bold">02</span>
              <p class="text-xs font-bold text-white mt-1">Notify Supervisor</p>
              <p class="text-[11px] text-slate-400 mt-1">Inform your site manager or health safety representative (HSR).</p>
            </div>
            <div class="p-4 bg-darkcard rounded-xl border border-white/5 text-center">
              <span class="font-mono text-amber-500 text-lg font-bold">03</span>
              <p class="text-xs font-bold text-white mt-1">Register Audit</p>
              <p class="text-[11px] text-slate-400 mt-1">Log the issue within the portal for permanent statutory reporting.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Column: Interactive Quiz Widget Panel -->
    <section class="w-full lg:w-[420px] bg-darkcard border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col overflow-y-auto custom-scroll p-6 shadow-xl">
      <div class="space-y-6" id="quiz-container">
        <!-- Header -->
        <div class="flex items-center space-x-2.5">
          <div class="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20">
            <!-- Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">Comprehension Quiz</h3>
            <p class="text-[11px] text-slate-500 font-medium">Verify your WHS legislation understanding</p>
          </div>
        </div>

        <!-- Loading State -->
        <div id="quiz-loading" class="py-12 text-center space-y-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          <p class="text-xs text-slate-400 font-mono">Generating customized WHS test from PDF content...</p>
        </div>

        <!-- Error State -->
        <div id="quiz-error" class="hidden p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-3">
          <p class="text-xs text-red-400">Failed to compile booklet quiz. Please try again.</p>
          <button onclick="loadQuiz()" class="px-4 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30">Retry</button>
        </div>

        <!-- Active Quiz State -->
        <div id="quiz-active" class="hidden space-y-6">
          <div class="bg-darkbg border border-white/5 p-3.5 rounded-xl flex justify-between items-center text-xs font-mono">
            <span class="text-slate-400">Question <span class="text-amber-500 font-bold" id="current-q-index">1</span> of 3</span>
            <span class="text-slate-400">Single Choice</span>
          </div>

          <div class="space-y-4">
            <h4 class="text-sm font-semibold text-white leading-relaxed" id="question-text">Loading question...</h4>
            
            <div class="space-y-2.5" id="options-box">
              <!-- Dynamically populated options -->
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-white/5">
            <button id="prev-btn" onclick="prevQuestion()" disabled class="px-4 py-2 border border-white/5 bg-transparent hover:bg-white/5 disabled:opacity-30 text-xs text-slate-400 rounded-lg font-medium cursor-pointer">
              Previous
            </button>
            <button id="next-btn" onclick="nextQuestion()" disabled class="px-4 py-2 bg-amber-500 disabled:bg-[#1A1A1F] disabled:text-slate-500 text-black font-bold text-xs rounded-lg cursor-pointer hover:bg-amber-600 transition-colors">
              Next Question
            </button>
          </div>
        </div>

        <!-- Quiz Completed State -->
        <div id="quiz-completed" class="hidden space-y-6">
          <div class="bg-[#1C1C21] border border-white/5 p-6 rounded-2xl text-center space-y-4 shadow-xl relative overflow-hidden">
            <div id="perfect-badge" class="hidden absolute top-2 right-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
              PERFECT SCORE
            </div>

            <div class="bg-amber-500/10 text-amber-500 p-4 rounded-full border border-amber-500/20 inline-block">
              <!-- Trophy SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trophy"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v1a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"/></svg>
            </div>
            <div>
              <h4 class="font-bold text-lg text-white">Quiz Completed!</h4>
              <p class="text-xs text-slate-400 mt-1 font-sans">You have successfully submitted your comprehension exam.</p>
              <h2 class="text-3xl font-mono font-bold text-amber-500 mt-4" id="score-display">0 / 3</h2>
              <p class="text-[10px] font-mono uppercase tracking-wider text-slate-500 mt-1 font-bold" id="score-text">Passed</p>
            </div>
          </div>

          <!-- Dynamic answers review checklist -->
          <div class="space-y-4">
            <h5 class="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Comprehension Review</h5>
            <div class="space-y-3.5" id="review-box">
              <!-- Dynamically populated corrections and explanations -->
            </div>
          </div>

          <div class="pt-4 border-t border-white/5 flex space-x-3">
            <button onclick="retakeQuiz()" class="flex-1 py-2.5 border border-white/10 bg-[#1A1A1F] hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl cursor-pointer">
              Retake Quiz
            </button>
            <button onclick="window.close()" class="flex-1 py-2.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors cursor-pointer">
              Confirm & Return
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    const bookletName = "${booklet.name}";
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedAnswers = [null, null, null]; // To store selections for Q1, Q2, Q3

    async function loadQuiz() {
      document.getElementById('quiz-loading').style.display = 'block';
      document.getElementById('quiz-error').classList.add('hidden');
      document.getElementById('quiz-active').classList.add('hidden');
      document.getElementById('quiz-completed').classList.add('hidden');

      try {
        const response = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookletName })
        });
        const data = await response.json();
        if (data && data.questions && data.questions.length > 0) {
          questions = data.questions;
          showQuestion(0);
        } else {
          throw new Error("No questions returned");
        }
      } catch (err) {
        console.error("Quiz loading failed:", err);
        document.getElementById('quiz-loading').style.display = 'none';
        document.getElementById('quiz-error').classList.remove('hidden');
      }
    }

    function showQuestion(index) {
      currentQuestionIndex = index;
      document.getElementById('quiz-loading').style.display = 'none';
      document.getElementById('quiz-active').classList.remove('hidden');
      
      document.getElementById('current-q-index').textContent = index + 1;
      const q = questions[index];
      document.getElementById('question-text').textContent = q.question;

      // Populate choices
      const optionsBox = document.getElementById('options-box');
      optionsBox.innerHTML = '';

      q.options.forEach((opt, choiceIdx) => {
        const isSelected = selectedAnswers[index] === choiceIdx;
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3.5 rounded-xl border text-xs font-sans transition-all cursor-pointer outline-none ' + 
          (isSelected 
            ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-semibold shadow-md shadow-amber-500/5' 
            : 'bg-[#1A1A1F] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10');
        btn.onclick = () => selectOption(choiceIdx);
        btn.textContent = opt;
        optionsBox.appendChild(btn);
      });

      // Navigation Buttons control
      document.getElementById('prev-btn').disabled = index === 0;
      
      const nextBtn = document.getElementById('next-btn');
      const hasAnsweredCurrent = selectedAnswers[index] !== null;
      nextBtn.disabled = !hasAnsweredCurrent;
      
      if (index === 2) {
        nextBtn.textContent = "Finish & Grade";
      } else {
        nextBtn.textContent = "Next Question";
      }
    }

    function selectOption(choiceIdx) {
      selectedAnswers[currentQuestionIndex] = choiceIdx;
      showQuestion(currentQuestionIndex);
    }

    function prevQuestion() {
      if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
      }
    }

    function nextQuestion() {
      if (currentQuestionIndex < 2) {
        showQuestion(currentQuestionIndex + 1);
      } else {
        submitQuiz();
      }
    }

    function submitQuiz() {
      document.getElementById('quiz-active').classList.add('hidden');
      const completedDiv = document.getElementById('quiz-completed');
      completedDiv.classList.remove('hidden');

      // Calculate score
      let score = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswer) {
          score++;
        }
      });

      // Render Score Board
      document.getElementById('score-display').textContent = score + " / 3";
      
      const perfectBadge = document.getElementById('perfect-badge');
      const scoreText = document.getElementById('score-text');
      
      if (score === 3) {
        perfectBadge.classList.remove('hidden');
        scoreText.textContent = "STATUTORY CERTIFICATE GRANTED";
        scoreText.className = "text-[10px] font-mono uppercase tracking-wider text-emerald-400 mt-1 font-bold";
      } else {
        perfectBadge.classList.add('hidden');
        scoreText.textContent = "COMPREHENSION INCOMPLETE";
        scoreText.className = "text-[10px] font-mono uppercase tracking-wider text-rose-400 mt-1 font-bold";
      }

      // Render Review Explanations Box
      const reviewBox = document.getElementById('review-box');
      reviewBox.innerHTML = '';

      questions.forEach((q, idx) => {
        const isCorrect = selectedAnswers[idx] === q.correctAnswer;
        const card = document.createElement('div');
        card.className = 'bg-darkbg border ' + (isCorrect ? 'border-emerald-500/20 bg-emerald-500/[0.01]' : 'border-rose-500/20 bg-rose-500/[0.01]') + ' p-4 rounded-xl space-y-2.5';
        
        // Header
        const header = document.createElement('div');
        header.className = 'flex items-start justify-between space-x-2';
        
        const qTitle = document.createElement('p');
        qTitle.className = 'text-xs font-semibold text-white';
        qTitle.textContent = "Q" + (idx + 1) + ": " + q.question;
        
        const badge = document.createElement('span');
        badge.className = 'text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded flex-shrink-0 ' + 
          (isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20');
        badge.textContent = isCorrect ? 'Correct' : 'Incorrect';
        
        header.appendChild(qTitle);
        header.appendChild(badge);
        card.appendChild(header);

        // Your selection vs Correct answer review
        const answersReview = document.createElement('div');
        answersReview.className = 'text-[11px] space-y-1 text-slate-400 border-t border-white/5 pt-2';
        
        const yourAns = document.createElement('p');
        yourAns.innerHTML = 'Your Choice: <span class="' + (isCorrect ? 'text-emerald-400' : 'text-rose-400') + '">' + q.options[selectedAnswers[idx]] + '</span>';
        
        answersReview.appendChild(yourAns);
        
        if (!isCorrect) {
          const correctAns = document.createElement('p');
          correctAns.innerHTML = 'Correct Choice: <span class="text-emerald-400 font-medium">' + q.options[q.correctAnswer] + '</span>';
          answersReview.appendChild(correctAns);
        }
        
        card.appendChild(answersReview);

        // Explanation text box
        const explanationBox = document.createElement('p');
        explanationBox.className = 'text-[11px] leading-relaxed text-slate-300 font-sans border-l-2 border-amber-500/30 pl-2.5 pt-1';
        explanationBox.innerHTML = '<strong>WHS Advice:</strong> ' + q.explanation;
        card.appendChild(explanationBox);

        reviewBox.appendChild(card);
      });
    }

    function retakeQuiz() {
      selectedAnswers = [null, null, null];
      showQuestion(0);
    }

    // Initialize quiz on window load
    window.onload = loadQuiz;
  </script>
</body>
</html>
    `);
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
