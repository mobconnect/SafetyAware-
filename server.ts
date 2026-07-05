import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
