import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, Booklet } from "../types";
import LucideIcon from "./LucideIcon";

interface AdvisorChatProps {
  initialPrompt: string | null;
  setInitialPrompt: (prompt: string | null) => void;
  selectedBooklet: Booklet | null;
  setSelectedBooklet: (booklet: Booklet | null) => void;
}

// Simple and highly robust Regex-based Markdown and Bullet List parser
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    let trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="font-sans font-bold text-white text-sm mt-3 mb-1.5 flex items-center">
          <span className="w-1.5 h-3 bg-amber-500 rounded-full mr-2"></span>
          {parseInLine(trimmed.slice(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="font-sans font-bold text-white text-base mt-4 mb-2 flex items-center border-b border-white/5 pb-1">
          {parseInLine(trimmed.slice(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={idx} className="font-sans font-extrabold text-white text-lg mt-5 mb-2">
          {parseInLine(trimmed.slice(2))}
        </h2>
      );
    }

    // Bullet Lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={idx} className="flex items-start space-x-2.5 my-1 ml-3 font-sans text-xs leading-relaxed text-slate-300">
          <span className="text-amber-500 font-bold select-none mt-0.5">•</span>
          <span className="flex-1">{parseInLine(trimmed.slice(2))}</span>
        </div>
      );
    }

    // Number Lists (e.g. "1. ")
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start space-x-2.5 my-1.5 ml-3 font-sans text-xs leading-relaxed text-slate-300">
          <span className="text-[#0F0F12] font-mono text-[10px] font-bold bg-amber-500 px-1.5 py-0.5 rounded-md mt-0.5">
            {numMatch[1]}
          </span>
          <span className="flex-grow pt-0.5">{parseInLine(numMatch[2])}</span>
        </div>
      );
    }

    // Default line
    if (trimmed === "") {
      return <div key={idx} className="h-2.5" />;
    }

    return (
      <p key={idx} className="text-slate-300 text-xs leading-relaxed font-sans mb-1.5">
        {parseInLine(line)}
      </p>
    );
  });
}

// Inline formatting (bold, code, links)
function parseInLine(text: string): React.ReactNode {
  // Regex mapping
  // 1. Bold text: **content**
  // 2. Code backticks: `code`
  // 3. Simple email/filename markers
  let parts: React.ReactNode[] = [text];

  // Regex for Bold
  const boldRegex = /\*\*(.*?)\*\"/g; // Wait, let's keep original regex structure with a small fix
  const originalBoldRegex = /\*\*(.*?)\*\*/g;
  let hasChanges = false;

  const newParts: React.ReactNode[] = [];
  parts.forEach((part) => {
    if (typeof part !== "string") {
      newParts.push(part);
      return;
    }

    let lastIndex = 0;
    let match;
    const tempParts: React.ReactNode[] = [];

    while ((match = originalBoldRegex.exec(part)) !== null) {
      // Add plain text before
      if (match.index > lastIndex) {
        tempParts.push(part.substring(lastIndex, match.index));
      }
      // Add bold block
      tempParts.push(
        <strong key={match.index} className="font-bold text-amber-400">
          {match[1]}
        </strong>
      );
      lastIndex = originalBoldRegex.lastIndex;
      hasChanges = true;
    }

    if (lastIndex < part.length) {
      tempParts.push(part.substring(lastIndex));
    }

    newParts.push(...tempParts);
  });

  parts = newParts;

  // Regex for inline code: `something.pdf` or `code`
  const codeRegex = /`(.*?)`/g;
  const finalParts: React.ReactNode[] = [];

  parts.forEach((part, pIdx) => {
    if (typeof part !== "string") {
      finalParts.push(part);
      return;
    }

    let lastIndex = 0;
    let match;
    const tempParts: React.ReactNode[] = [];

    while ((match = codeRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        tempParts.push(part.substring(lastIndex, match.index));
      }

      const val = match[1];
      const isPdf = val.endsWith(".pdf");

      tempParts.push(
        <code
          key={`${pIdx}-${match.index}`}
          className={`font-mono text-[11px] px-1.5 py-0.5 rounded border leading-none ${
            isPdf
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 font-semibold"
              : "bg-white/5 text-slate-300 border-white/10"
          }`}
        >
          {val}
        </code>
      );
      lastIndex = codeRegex.lastIndex;
    }

    if (lastIndex < part.length) {
      tempParts.push(part.substring(lastIndex));
    }

    finalParts.push(...tempParts);
  });

  return <>{finalParts}</>;
}

export default function AdvisorChat({
  initialPrompt,
  setInitialPrompt,
  selectedBooklet,
  setSelectedBooklet
}: AdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your **SafetyAware Advisor**. I've compiled critical safety, compliance, and respect standards from all 47 Australian WHS booklets.\n\nAsk me about rights for young employees, remote work health procedures, specific industry booklets, or code of conduct protocols. How can I support your compliance today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    {
      title: "Youth Rights",
      desc: "Rights for young workers under WHS rules",
      prompt: "What are the legal rights and maximum working limits for young employees under the Australian 2026 legislations?"
    },
    {
      title: "Hospitality Risks",
      desc: "Kitchen hazard assessments",
      prompt: "I manage a small cafe. What specific WHS protocols and hazard check items are in 'booklet_hospitality_2026.pdf'?"
    },
    {
      title: "NDIS Compliance",
      desc: "Worker protective guidelines",
      prompt: "What are the core safety duties, lifting, and support regulations covered under the NDIS Support Worker Booklet?"
    },
    {
      title: "Respectful Code",
      desc: "Anti-discrimination standards",
      prompt: "How can I integrate respectful workplace and anti-discrimination standards from the 2026 general booklets into our corporate policies?"
    }
  ];

  // Handle auto-triggering when pre-filled prompt arrives from Booklet catalog clicked
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      // Clean it up immediately to avoid loops
      setInitialPrompt(null);
    }
  }, [initialPrompt, setInitialPrompt]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Map ChatMessage structure to server-side Gemini expected history
      const serverHistory = messages
        .filter(m => m.id !== "welcome") // Skip greeting
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: serverHistory
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Advisor service failed to reply.");
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **WHS Assistant Offline**: ${err.message || "Failed to reach Safety Advisor. Please check that your Gemini API key is configured in the secrets menu."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple alert or status feedback can be done inside UI
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[700px] bg-[#16161A] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Advisor Header */}
      <div className="bg-[#1C1C21] border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl flex items-center justify-center border border-amber-500/20">
            <LucideIcon name="Brain" className="text-amber-500" size={18} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-white text-sm">WHS Safety Advisor AI</h3>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Expert Agent Live</span>
            </div>
          </div>
        </div>

        {/* Selected context clear option */}
        {selectedBooklet && (
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-amber-400 font-sans font-medium text-[11px] max-w-[140px] truncate">
              Focus: {selectedBooklet.title}
            </span>
            <button
              onClick={() => setSelectedBooklet(null)}
              className="text-amber-500 hover:text-amber-400 cursor-pointer"
            >
              <LucideIcon name="UserX" size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0F0F12]/30">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-start space-x-3`}
            >
              {!isUser && (
                <div className="bg-amber-500 text-[#0F0F12] rounded-xl p-1.5 flex-shrink-0 border border-amber-400/50 shadow-sm mt-1">
                  <LucideIcon name="Shield" size={14} className="text-[#0F0F12]" />
                </div>
              )}

              <div className="flex flex-col max-w-[85%]">
                <div
                  className={`p-4 rounded-2xl border ${
                    isUser
                      ? "bg-amber-500 text-[#0F0F12] border-amber-400/50 rounded-tr-none shadow-sm font-semibold"
                      : "bg-[#1C1C21] text-slate-200 border-white/5 rounded-tl-none shadow-sm"
                  }`}
                >
                  <div className="space-y-1 text-sm leading-relaxed">
                    {isUser ? msg.content : parseMarkdown(msg.content)}
                  </div>
                </div>
                
                {/* Message footer actions */}
                <div className={`flex items-center space-x-2 mt-1 px-1 text-[10px] text-slate-500 font-sans ${isUser ? "justify-end" : "justify-start"}`}>
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => handleCopyMessage(msg.content)}
                        className="hover:text-amber-500 flex items-center space-x-1 cursor-pointer outline-none"
                        title="Copy guidelines"
                      >
                        <LucideIcon name="Printer" size={10} />
                        <span>Copy</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Generating Loader */}
        {isLoading && (
          <div className="flex justify-start items-start space-x-3">
            <div className="bg-amber-500 text-[#0F0F12] rounded-xl p-1.5 flex-shrink-0 border border-amber-400/50 shadow-sm mt-1">
              <LucideIcon name="Shield" size={14} className="text-[#0F0F12] animate-spin" />
            </div>
            <div className="bg-[#1C1C21] border border-white/5 shadow-sm p-4 rounded-2xl rounded-tl-none max-w-[120px]">
              <div className="flex space-x-1.5 justify-center items-center py-1">
                <span className="block w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="block w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="block w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starters (Only shown when there is very little history) */}
      {messages.length === 1 && !isLoading && (
        <div className="bg-[#1C1C21] border-t border-white/5 p-4">
          <p className="text-slate-500 font-sans font-semibold text-[10px] uppercase tracking-wider mb-2.5">
            Suggested Consultations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {starterPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p.prompt)}
                className="text-left bg-[#1A1A1F] hover:bg-amber-500/5 border border-white/5 hover:border-amber-500/20 p-3 rounded-xl transition-all cursor-pointer outline-none animate-fade-in"
              >
                <div className="flex items-center space-x-1.5 font-sans font-bold text-slate-200 text-xs">
                  <LucideIcon name="ChevronRight" size={12} className="text-amber-500" />
                  <span>{p.title}</span>
                </div>
                <p className="text-slate-500 text-[10px] mt-0.5 truncate font-sans">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat input footer */}
      <div className="bg-[#1C1C21] border-t border-white/5 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedBooklet 
                ? `Ask about '${selectedBooklet.title}'...` 
                : "Ask SafetyAdvisor (e.g. 'What are standard site construction limits?')..."
            }
            className="flex-1 bg-[#1A1A1F] border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-xs focus:outline-none font-sans"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? "bg-amber-500 text-[#0F0F12] shadow-md shadow-amber-500/10 cursor-pointer hover:bg-amber-600"
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            }`}
          >
            <LucideIcon name="Send" size={14} className="text-[#0F0F12]" />
          </button>
        </form>
      </div>
    </div>
  );
}
