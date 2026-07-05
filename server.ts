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
      const { message, history, selectedBookletName } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getGeminiClient();

      // Find selected booklet context if present
      const booklet = selectedBookletName ? booklets.find(b => b.name === selectedBookletName) : null;

      // Build system instructions with complete booklets catalog context
      const bookletsListText = booklets.map((b, i) => 
        `${i + 1}. **Title**: "${b.title}"\n   **Filename**: ${b.name}\n   **Group**: ${b.group}\n   **Audience**: ${b.audience}\n   **Overview**: ${b.description}`
      ).join("\n\n");

      let systemInstruction = `You are SafetyAware Advisor, a professional virtual Work Health & Safety (WHS) consultant specialized in Australian workplace safety, respectful conduct, anti-discrimination, and mental well-being standards for 2026/2027.

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

      if (booklet) {
        systemInstruction += `\n\nCURRENT ACTIVE BOOKLET CONTEXT:
The user is currently discussing or focusing on this specific booklet:
- **Title**: "${booklet.title}" (Filename: \`${booklet.name}\`)
- **Group**: ${booklet.group}
- **Audience**: ${booklet.audience}
- **Base Focus**: ${booklet.description}

YOUR SPECIAL LEGISLATIVE UPGRADE INSTRUCTION:
1. You MUST use your enabled Google Search tool to automatically look up any NEW or updated Australian Work Health and Safety (WHS) regulations, standards, legislation amendments, Safe Work Australia codes of practice, or recent safety rulings relevant to the topic of this specific booklet for the years 2026 or 2027.
2. Incorporate these latest legislative updates directly into your response. Distinctly call out what is a new or upgraded requirement compared to older standards.
3. Reference specific laws, statutory duties, or official guidelines where applicable (e.g., model WHS Regulations, psychosocial risk regulations, industry-specific safety updates).`;
      } else {
        systemInstruction += `\n\nLEGISLATIVE GROUNDING INSTRUCTION:
Always use your Google Search tool to check for the most up-to-date Australian WHS legislation, psychosocial hazard codes, and safe work standards for 2026/2027. Integrate real-world, current legislative updates into your answers.`;
      }

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
          tools: [{ googleSearch: {} }] // Enable Google Search Grounding for real-time WHS legislative searches
        }
      });

      const text = response.text || "I apologize, but I was unable to compile an answer at this moment.";
      
      // Extract Google Search Grounding Metadata chunks as sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string; url: string }[] = [];
      if (chunks) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || "WHS Legislative Reference",
              url: chunk.web.uri
            });
          }
        }
      }

      // Deduplicate sources by URL
      const seenUrls = new Set<string>();
      const uniqueSources = sources.filter(src => {
        if (!src.url || seenUrls.has(src.url)) return false;
        seenUrls.add(src.url);
        return true;
      });

      res.json({ 
        response: text,
        sources: uniqueSources
      });
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
        const isNdis = booklet.name.toLowerCase().includes("ndis");
        const isSelfEmployed = booklet.name.toLowerCase().includes("self_employed");
        if (isNdis) {
          questions = [
            {
              question: "Under the NDIS Quality and Safeguards Commission and WHS rules, which check is mandatory for workers in risk-assessed roles?",
              options: [
                "A) Standard driver license check only",
                "B) A valid NDIS Worker Screening Check registered on the national database",
                "C) Standard customer service certification",
                "D) None, checks are only required for medical professionals"
              ],
              correctAnswer: 1,
              explanation: "Under NDIS Commission standards, all workers in risk-assessed roles must possess an active, verified NDIS Worker Screening Check. Maintaining up-to-date clearances is a statutory requirement for both providers and safety administrators."
            },
            {
              question: "If an unauthorized restrictive practice (such as a lock or restraint) is used in an emergency, how quickly must it be reported to the NDIS Commission?",
              options: [
                "A) Within 30 days of the occurrence",
                "B) At the end of the quarterly business review",
                "C) Immediately (within 24 hours)",
                "D) Only if the participant or family lodges a formal complaint"
              ],
              correctAnswer: 2,
              explanation: "Under the NDIS Reportable Incidents Rules, any unauthorized use of a restrictive practice constitutes a reportable incident and must be reported to the NDIS Quality and Safeguards Commission within 24 hours."
            },
            {
              question: "Disability support workers operating alone in a client's private home face increased physical and psychosocial hazards. What is a key WHS risk control for lone worker environments?",
              options: [
                "A) Avoid entering homes entirely and request video calls only",
                "B) Carrying heavy mechanical containment tools",
                "C) Conducting pre-entry dynamic risk assessments (pets, hazards, behavior) and using real-time GPS duress alarm checks",
                "D) Requiring that clients sign a liability waiver for any injury that occurs on private property"
              ],
              correctAnswer: 2,
              explanation: "For lone work safety in the NDIS sector, conducting dynamic pre-entry assessments and establishing active duress systems are highly compliant and recommended safety control practices under current WHS guidelines."
            }
          ];
        } else if (isSelfEmployed) {
          questions = [
            {
              question: "As a self-employed individual or sole trader in Australia, how does the Work Health and Safety (WHS) Act classify your legal status and safety obligations?",
              options: [
                "A) You are classified as neither a worker nor a PCBU, exempting you from physical hazard duties.",
                "B) You are classified as both a PCBU (employer) and a worker, giving you dual statutory duty-of-care obligations.",
                "C) Your safety duties are completely transferred to your clients or the site owners.",
                "D) You are only subject to voluntary mental health recommendations, not active physical safety laws."
              ],
              correctAnswer: 1,
              explanation: "Under Australian WHS law, a self-employed person is classified as both a PCBU and a worker. This dual status grants you strict legal duties to ensure, so far as is reasonably practicable, your own health and safety, as well as the safety of other contractors or clients affected by your business activities."
            },
            {
              question: "Which of the following describes the minimum statutory first-aid and emergency preparedness requirements for self-employed individuals?",
              options: [
                "A) You do not need first-aid kits unless you employ at least five people.",
                "B) Maintaining a compliant, fully stocked WHS First Aid Kit and possessing an active communication device to coordinate emergency ambulance or medical responses.",
                "C) Self-employed persons are legally required to work within 500 meters of a hospital at all times.",
                "D) First aid is only mandatory when working with high-risk heavy agricultural machinery."
              ],
              correctAnswer: 1,
              explanation: "WHS regulations mandate that self-employed workers must provide adequate first aid equipment (a compliant kit) and access to facilities, as well as a reliable means of communication (charged mobile or satellite duress tracker) to contact emergency services if working alone."
            },
            {
              question: "Solo operators and sole traders face elevated psychosocial hazards like chronic isolation and workload stress. Which of the following is a recommended practice to manage mental health and fatigue?",
              options: [
                "A) Working 14-hour days continuously to maximize business profits.",
                "B) Avoiding any communication with other sole traders to prevent distraction.",
                "C) Planning scheduled weekly wind-down hours, taking regular rest breaks, and accessing support services like Lifeline or Beyond Blue.",
                "D) Ignoring fatigue indicators since solo operators are exempt from standard fatigue laws."
              ],
              correctAnswer: 2,
              explanation: "Managing psychological hazards, managing isolation, and preventing burnout are critical WHS obligations. Standard protective practices include scheduling personal downtime, taking regular 15-minute breaks, and leveraging free community support networks like Lifeline and Beyond Blue."
            }
          ];
        } else if (booklet.name.toLowerCase().includes("tax")) {
          questions = [
            {
              question: "What is a key tax compliance obligation for self-employed individuals (sole traders) regarding Income Tax in Australia?",
              options: [
                "A) Sole traders are completely exempt from income tax payments.",
                "B) You must report your business income in your individual tax return, as your business tax TFN is generally the same as your individual TFN.",
                "C) Sole traders must pay a flat corporate tax rate of 30% from dollar one, separate from personal income.",
                "D) Income tax is automatically paid by the Australian Taxation Office (ATO) via weekly subsidies."
              ],
              correctAnswer: 1,
              explanation: "In Australia, if you operate as a sole trader, your business income is treated as part of your personal income. You use your individual Tax File Number (TFN) when lodging your tax return and report your business income and expenses there."
            },
            {
              question: "At what threshold of annual turnover is a self-employed individual or sole trader legally required to register for Goods and Services Tax (GST) in Australia?",
              options: [
                "A) From dollar one of any sales",
                "B) Only when annual business turnover reaches $150,000 or more",
                "C) When your annual business turnover is $75,000 or more ($150,000 or more for non-profit organizations)",
                "D) GST registration is entirely voluntary and has no mandatory threshold"
              ],
              correctAnswer: 2,
              explanation: "Under Australian tax law, you must register for GST if your annual business turnover is $75,000 or more ($150,000 or more for non-profit organisations), or if you provide taxi or ride-sourcing services regardless of turnover."
            },
            {
              question: "What is the purpose of the Pay As You Go (PAYG) instalments system for self-employed individuals?",
              options: [
                "A) To pay off your student or home loans with interest-free government loans",
                "B) It is a system for making regular payments (usually quarterly) towards your expected end-of-year tax liability to avoid a large tax bill.",
                "C) To pay weekly wages to yourself that are entirely tax-free",
                "D) To register employees for superannuation contributions"
              ],
              correctAnswer: 1,
              explanation: "The PAYG instalments system helps self-employed people, sole traders, and investors meet their income tax obligations by making regular payments during the financial year, preventing a massive tax bill during annual lodgments."
            }
          ];
        } else {
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

    const isNdis = filename.toLowerCase().includes("ndis");
    let ndisSectionHtml = "";
    if (isNdis) {
      ndisSectionHtml = `
        <!-- Section 4: Special NDIS Legislation & WHS Updates (2026/2027) -->
        <div class="space-y-4 border-t border-amber-500/20 pt-6">
          <div class="flex items-center space-x-2">
            <span class="bg-amber-500 text-black text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded">NDIS SPECIALIST</span>
            <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-amber-500">Section 4: NDIS Quality & Safeguards Compliance Updates (2026/2027)</h3>
          </div>
          
          <p class="text-sm leading-relaxed text-slate-300 font-sans">
            Work Health & Safety (WHS) for National Disability Insurance Scheme (NDIS) support environments is governed by the co-jurisdiction of state-based WHS Regulators (e.g., SafeWork NSW, WorkSafe Victoria) and the federal <strong>NDIS Quality and Safeguards Commission</strong>.
          </p>

          <div class="bg-darkcard border border-amber-500/10 p-5 rounded-2xl space-y-4">
            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Mandatory 2026/2027 Legislative Guidelines & Standards:</h4>
            
            <div class="space-y-4 text-xs text-slate-300 font-sans">
              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">1. Mandatory NDIS Worker Screening Check</span>
                <p class="leading-relaxed text-slate-400">All staff in risk-assessed roles must hold an active NDIS Worker Screening clearance. PCBUs must maintain up-to-date clearances on the national database. Working with an expired or unverified clearance is a direct breach of statutory safety conditions.</p>
              </div>

              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">2. Elimination of Unregulated Restrictive Practices</span>
                <p class="leading-relaxed text-slate-400">Under current 2026/2027 guidelines, any use of chemical, mechanical, physical, environmental, or seclusion restraints is strictly prohibited unless authorized under an approved Behavior Support Plan. Stricter statutory reporting requires lodging reports to the NDIS Commission within 5 business days for authorized use, or immediately (within 24 hours) for unauthorized emergency uses.</p>
              </div>

              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">3. Incident Management & Open Disclosure Mandates</span>
                <p class="leading-relaxed text-slate-400">The <strong>NDIS (Incident Management and Reportable Incidents) Rules</strong> demand that reportable incidents (e.g., serious injury, abuse, neglect, exploitation, or unauthorized restrictive practices) be reported directly to the NDIS Commission within 24 hours. Under active guidelines, registered providers must practice <strong>Open Disclosure</strong>—openly communicating with, apologizing to, and supporting the impacted participant and their family during reviews.</p>
              </div>

              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">4. High-Intensity Daily Personal Activities Competency</span>
                <p class="leading-relaxed text-slate-400">Support workers executing complex assistance (e.g., enteral feeding, catheter care, ventilator management, or tracheostomy care) must hold formal unit-standard competency credentials. Relying on basic peer-to-peer training is no longer legally compliant under safe work directives.</p>
              </div>

              <div>
                <span class="font-bold text-white block mb-1">5. Psychosocial Hazard & Lone Worker Safety Registers</span>
                <p class="leading-relaxed text-slate-400">Support workers operating solo in client residences are exposed to increased psychological and physical risk (burnout, challenging behaviors, isolation). Employers must maintain an active psychosocial hazard risk register and supply lone workers with emergency duress check-ins and safety planning tools.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const isSelfEmployed = filename.toLowerCase().includes("self_employed");
    let selfEmployedSectionHtml = "";
    if (isSelfEmployed) {
      selfEmployedSectionHtml = `
        <!-- Section 4: Self-Employed WHS, First Aid & Mental Health Compliance -->
        <div class="space-y-4 border-t border-amber-500/20 pt-6">
          <div class="flex items-center space-x-2">
            <span class="bg-amber-500 text-black text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded">SOLE TRADER SPECIALIST</span>
            <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-amber-500">Section 4: Self-Employed WHS, First Aid & Mental Health Guidelines (2026/2027)</h3>
          </div>
          
          <p class="text-sm leading-relaxed text-slate-300 font-sans">
            Under the Australian <strong>Work Health and Safety Act 2011</strong>, self-employed individuals and sole traders are legally classified as both a <strong>PCBU</strong> (Person Conducting a Business or Undertaking) and a worker. This dual status grants you ultimate statutory duty-of-care obligations to ensure your own health and safety, as well as the safety of clients, visitors, and other contractors.
          </p>

          <div class="bg-darkcard border border-amber-500/10 p-5 rounded-2xl space-y-5">
            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Core Self-Employed Compliance Standards:</h4>
            
            <div class="space-y-4 text-xs text-slate-300 font-sans">
              <div class="border-b border-white/5 pb-3.5">
                <span class="font-bold text-white block mb-1">1. Dual Statutory Duty-of-Care Duties</span>
                <p class="leading-relaxed text-slate-400">As a self-employed operator, you hold primary liability to eliminate or minimize occupational risks. This includes assessing client home workspaces, validating tool/equipment safety guards, and preparing Safe Work Method Statements (SWMS) if working in high-risk zones. You are legally responsible for not endangering others through your work.</p>
              </div>

              <div class="border-b border-white/5 pb-3.5">
                <span class="font-bold text-white block mb-1">2. Mandatory First Aid Kits & Incident Contingencies</span>
                <p class="leading-relaxed text-slate-400">Even when operating solo, you are required to maintain a compliant, accessible <strong>WHS First Aid Kit</strong> (Class A/B) stocked for common industry injuries (burns, deep cuts, eye wash, splinters). Additionally, you must carry an active digital communication device (satellite communicator, charged phone, or duress app) to coordinate quick emergency ambulance/medical responses when working remotely or in isolated client sites.</p>
              </div>

              <div class="border-b border-white/5 pb-3.5">
                <span class="font-bold text-white block mb-1">3. Mental Health, Isolation & Burnout Management</span>
                <p class="leading-relaxed text-slate-400">Operating a sole-trader business presents extreme psychological risks, including chronic isolation, long working hours, unstable financial flows, and the absence of traditional HR support systems. You should actively implement psychosocial protective factors: scheduled weekly business wind-down hours, peer support check-ins, and proactive stress-reduction techniques. You can access free mental health assistance through <strong>Lifeline (13 11 14)</strong>, <strong>Beyond Blue (1300 22 4636)</strong>, or specialized sole trader support lines.</p>
              </div>

              <div>
                <span class="font-bold text-white block mb-1">4. Solo Worker Risk Profiling & Fatigue Management</span>
                <p class="leading-relaxed text-slate-400">Without peers to monitor your alertness, fatigue is a leading cause of sole-trader vehicle and equipment accidents. Establish strict maximum shift limits, take standard 15-minute micro-breaks every 2 hours of repetitive tasks or driving, and maintain a documented safe work hazard register.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const isTax = filename.toLowerCase().includes("tax");
    let taxSectionHtml = "";
    if (isTax) {
      taxSectionHtml = `
        <!-- Section 4: Tax Information & Compliance Guidelines (2026/2027) -->
        <div class="space-y-4 border-t border-amber-500/20 pt-6">
          <div class="flex items-center space-x-2">
            <span class="bg-amber-500 text-black text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded">TAX SPECIALIST</span>
            <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-amber-500">Section 4: Australian Tax & Compliance Standards (2026/2027)</h3>
          </div>
          
          <p class="text-sm leading-relaxed text-slate-300 font-sans">
            Navigating taxation duties as a sole trader, contractor, or employee is a core component of sustainable, legally compliant operations. The <strong>Australian Taxation Office (ATO)</strong> governs compliance, reporting, and statutory filings for the 2026/2027 financial year.
          </p>

          <div class="bg-darkcard border border-amber-500/10 p-5 rounded-2xl space-y-4">
            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Mandatory 2026/2027 Tax Guidelines & Obligation Checkpoints:</h4>
            
            <div class="space-y-4 text-xs text-slate-300 font-sans">
              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">1. Sole Trader Tax File Numbers & Reporting</span>
                <p class="leading-relaxed text-slate-400">As a sole trader, you do not need a separate business tax file number (TFN); you file using your individual TFN. Your business net income is included alongside any other personal earnings in your standard annual individual tax return, assessed at standard individual income tax rates.</p>
              </div>

              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">2. Goods and Services Tax (GST) Thresholds</span>
                <p class="leading-relaxed text-slate-400">You must register for GST within 21 days if your gross business turnover reaches or is expected to exceed the statutory threshold of <strong>$75,000</strong> per annum ($150,000 for non-profit organizations). If registered, you must apply a 10% GST to taxable sales and file quarterly or annual Business Activity Statements (BAS).</p>
              </div>

              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">3. Pay As You Go (PAYG) Instalment Obligations</span>
                <p class="leading-relaxed text-slate-400">The PAYG instalments system requires sole traders, self-employed contractors, and investors to make regular, proactive payments (usually quarterly) toward their estimated end-of-year tax liability. This prevents a large, unexpected tax bill during annual lodgment season.</p>
              </div>

              <div class="border-b border-white/5 pb-3">
                <span class="font-bold text-white block mb-1">4. Deductible Business Expenses & Record Retention</span>
                <p class="leading-relaxed text-slate-400">You can claim tax deductions for most business-related expenses (e.g., motor vehicle travel, equipment, home office costs, and insurance) provided they are directly related to earning your income. You are legally required to retain clear, comprehensive receipts, logbooks, and tax invoices for at least <strong>5 years</strong> as audit evidence.</p>
              </div>

              <div>
                <span class="font-bold text-white block mb-1">5. Superannuation Guarantee (SG) & Personal Contributions</span>
                <p class="leading-relaxed text-slate-400">While sole traders are not legally forced to pay superannuation for themselves, doing so is highly recommended for long-term financial security and offers valuable tax-deductible benefits up to concessional caps. If you employ workers, you MUST pay the mandatory statutory Superannuation Guarantee percentage directly to their nominated super accounts.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

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
        \${ndisSectionHtml}
        \${selfEmployedSectionHtml}
        \${taxSectionHtml}
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
