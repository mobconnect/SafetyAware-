import React, { useState, useEffect } from "react";
import { Booklet } from "../types";
import LucideIcon from "./LucideIcon";

interface CompliancePlanProps {
  booklets: Booklet[];
  onOpenBooklet: (booklet: Booklet) => void;
}

interface PlannerTask {
  id: string;
  title: string;
  category: "Policy" | "Training" | "Materials" | "Audits";
  completed: boolean;
}

export default function CompliancePlan({ booklets, onOpenBooklet }: CompliancePlanProps) {
  const [selectedSector, setSelectedSector] = useState<string>("Hospitality");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);

  // Sectors list
  const sectors = [
    { name: "Hospitality & Food", value: "Hospitality", keyword: "hospitality" },
    { name: "Building & Construction", value: "Construction", keyword: "construction" },
    { name: "Aged Care & Health Support", value: "AgedCare", keyword: "aged_care" },
    { name: "General Office Admin", value: "Office", keyword: "public_admin" },
    { name: "Retail Operations", value: "Retail", keyword: "retail" },
    { name: "Indigenous & Remote Projects", value: "Remote", keyword: "remote" }
  ];

  // Load appropriate checklist tasks based on sector
  useEffect(() => {
    const defaultTasks: Record<string, PlannerTask[]> = {
      Hospitality: [
        { id: "h1", title: "Verify Responsible Service of Alcohol (RSA) safety protocols are posted.", category: "Policy", completed: false },
        { id: "h2", title: "Conduct kitchen induction toolbox on hot oil safety, knife handling, and burn treatment.", category: "Training", completed: false },
        { id: "h3", title: "Display the 'Booklet Hospitality 2026' near meal preparation stations.", category: "Materials", completed: false },
        { id: "h4", title: "Complete slip and spill prevention log check on active flooring areas.", category: "Audits", completed: false }
      ],
      Construction: [
        { id: "c1", title: "Conduct official White Card and safety induction verification for all active builders.", category: "Policy", completed: false },
        { id: "c2", title: "Deliver site-wide 'Working at Heights' risk mitigation training.", category: "Training", completed: false },
        { id: "c3", title: "Equip personnel with full certified PPE (hard hats, steel caps, high-vis vests).", category: "Materials", completed: false },
        { id: "c4", title: "Establish weekly scaffolding safety structure audits.", category: "Audits", completed: false }
      ],
      AgedCare: [
        { id: "a1", title: "Audit elder safe patient lifting procedures against manual handling codes.", category: "Policy", completed: false },
        { id: "a2", title: "Conduct full-staff infection prevention and clinical waste disposal training.", category: "Training", completed: false },
        { id: "a3", title: "Ensure 'Booklet Aged Care 2026' is accessible in medical prep and staff rooms.", category: "Materials", completed: false },
        { id: "a4", title: "Audit lifting hoist hydraulics and chemical cleanser storage logs.", category: "Audits", completed: false }
      ],
      Office: [
        { id: "o1", title: "Establish secure, confidential reporting channels for anti-bullying or harassment complaints.", category: "Policy", completed: false },
        { id: "o2", title: "Deliver employee workshop on identifying microaggressions and digital respectful workplace practices.", category: "Training", completed: false },
        { id: "o3", title: "Display Work Health and Safety rights notices prominently in breakrooms.", category: "Materials", completed: false },
        { id: "o4", title: "Perform workstation ergonomic eye-strain and posture check audits.", category: "Audits", completed: false }
      ],
      Retail: [
        { id: "r1", title: "Review shelf-stocking and overhead storage safety policies.", category: "Policy", completed: false },
        { id: "r2", title: "Train staff on checkout cash safety, incident management, and slip prevention.", category: "Training", completed: false },
        { id: "r3", title: "Provide 'Booklet Retail 2026' to all current shift assistants.", category: "Materials", completed: false },
        { id: "r4", title: "Perform slip hazard floor reviews and checkout counter posture checks.", category: "Audits", completed: false }
      ],
      Remote: [
        { id: "rem1", title: "Incorporate cultural safety and respect frameworks into standard onboarding.", category: "Policy", completed: false },
        { id: "rem2", title: "Engage local Indigenous community leads to adapt site safety rules.", category: "Training", completed: false },
        { id: "rem3", title: "Ensure 'Indigenous Remote Community Workplace 2026' is stored in regional team vehicles.", category: "Materials", completed: false },
        { id: "rem4", title: "Audit satellite communications gear, remote first aid kits, and evacuation routes.", category: "Audits", completed: false }
      ]
    };

    setTasks(defaultTasks[selectedSector] || defaultTasks.Hospitality);
  }, [selectedSector]);

  // Toggle checklist item
  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Calculations
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filter booklets relevant to selected sector
  const getRelevantBooklets = () => {
    const currentKeyword = sectors.find(s => s.value === selectedSector)?.keyword || "hospitality";
    
    // Sort so exact matches are listed first, or tags are evaluated
    return booklets.filter(b => 
      b.name.toLowerCase().includes(currentKeyword) || 
      b.tags.some(tag => tag.includes(currentKeyword) || currentKeyword.includes(tag))
    ).slice(0, 3);
  };

  const relevantBooklets = getRelevantBooklets();

  // Export Safety Plan to clipboard
  const handleExport = () => {
    const planText = `===========================================
SAFETYAWARE PORTAL - WHS COMPLIANCE CHECKLIST
===========================================
Target Sector: ${sectors.find(s => s.value === selectedSector)?.name}
Completed: ${completedCount}/${tasks.length} Milestones (${progressPercent}%)
Generated: ${new Date().toLocaleDateString()}

COMPLIANCE CHECKLIST STATUS:
${tasks.map(t => `[${t.completed ? "X" : " "}] [${t.category}] ${t.title}`).join("\n")}

RECOMMENDED BOOKLETS IN USE:
${relevantBooklets.map(b => `- ${b.title} (${b.path})`).join("\n")}

===========================================
Keep your workplace safe, inclusive, and legally compliant!
`;

    navigator.clipboard.writeText(planText);
    alert("Your WHS Compliance Plan has been successfully compiled and copied to your clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 bg-[#16161A] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20 flex items-center justify-center">
              <LucideIcon name="Settings" size={18} className="text-amber-500" />
            </div>
            <h3 className="font-sans font-bold text-white text-sm">Planner Configuration</h3>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed font-sans mb-4">
            Safety plans must fit your workspace. Select your active sector below to load custom Australian WHS checklists, audits, and suggested booklet materials.
          </p>

          {/* Sector selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Select Sector</label>
            <div className="relative">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-[#1A1A1F] border border-white/10 focus:border-amber-500/50 text-slate-200 text-xs font-semibold rounded-xl px-4 py-3 outline-none appearance-none cursor-pointer font-sans"
              >
                {sectors.map((sec) => (
                  <option key={sec.value} value={sec.value}>
                    {sec.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <LucideIcon name="ChevronRight" size={14} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic score summary */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Current Score</p>
              <h4 className="text-2xl font-sans font-bold text-white">
                {progressPercent}% <span className="text-xs text-slate-500 font-medium font-sans">Ready</span>
              </h4>
            </div>
            <span className="text-xs font-semibold text-amber-500 font-sans">
              {completedCount} of {tasks.length} Done
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#1A1A1F] border border-white/5 rounded-full h-2 overflow-hidden mb-4">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Export action */}
          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0F0F12] font-sans font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center space-x-2 cursor-pointer transition-all outline-none"
          >
            <LucideIcon name="Download" size={13} className="text-[#0F0F12]" />
            <span>Copy Completed WHS Plan</span>
          </button>
        </div>
      </div>

      {/* Checklist Panel */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        {/* Dynamic Checklist Card */}
        <div className="bg-[#16161A] border border-white/5 rounded-3xl p-6 shadow-xl flex-grow">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20 flex items-center justify-center">
                <LucideIcon name="ClipboardCheck" size={18} className="text-amber-500" />
              </div>
              <h3 className="font-sans font-bold text-white text-sm">Rollout Checklist Milestones</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#1A1A1F] px-2.5 py-1 rounded-md uppercase font-bold border border-white/5">
              {sectors.find(s => s.value === selectedSector)?.name} Active
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-start space-x-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  task.completed
                    ? "bg-amber-500/5 border-amber-500/10"
                    : "bg-[#1A1A1F] border-white/5 hover:bg-white/5"
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    task.completed
                      ? "bg-amber-500 border-amber-500 text-[#0F0F12]"
                      : "border-white/20 bg-transparent hover:border-amber-500"
                  }`}
                >
                  {task.completed && <LucideIcon name="Check" size={13} className="text-[#0F0F12] font-bold" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                      task.category === "Policy" ? "bg-blue-500/10 text-blue-400" :
                      task.category === "Training" ? "bg-amber-500/10 text-amber-400" :
                      task.category === "Materials" ? "bg-purple-500/10 text-purple-400" :
                      "bg-rose-500/10 text-rose-400"
                    }`}>
                      {task.category}
                    </span>
                  </div>
                  <p className={`text-xs mt-1.5 font-sans leading-relaxed ${task.completed ? "text-slate-500 line-through" : "text-slate-200 font-medium"}`}>
                    {task.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Booklets Bar */}
        <div className="bg-[#121216] border border-white/5 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl">
              <LucideIcon name="BookMarked" size={18} className="text-amber-500" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-white text-xs">Direct Recommended Booklets</h4>
              <p className="text-slate-500 text-[10px] font-sans">Specifically matched for your {sectors.find(s => s.value === selectedSector)?.name} sector.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {relevantBooklets.map((b) => (
              <button
                key={b.name}
                onClick={() => onOpenBooklet(b)}
                className="bg-[#1A1A1F] border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/10 px-3 py-1.5 rounded-xl text-slate-300 hover:text-amber-400 font-sans font-semibold text-[10px] flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer outline-none"
              >
                <LucideIcon name={b.iconName} size={11} className="text-slate-500 group-hover:text-amber-500" />
                <span className="truncate max-w-[120px]">{b.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
