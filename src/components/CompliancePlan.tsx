import React, { useState, useEffect } from "react";
import { Booklet } from "../types";
import LucideIcon from "./LucideIcon";
import { jsPDF } from "jspdf";

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

  // Export Safety Plan as a clean, styled PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const primaryColor = [22, 22, 26]; // Dark slate background (#16161A)
    const accentColor = [245, 158, 11]; // Amber gold (#F59E0B)
    const darkText = [30, 41, 59]; // Slate 800

    let curPageNum = 1;

    // Helper to draw common page structures
    const drawPageBordersAndFooter = (pageNum: number) => {
      // Draw a sleek frame or border
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.rect(8, 8, 194, 281);

      // Draw footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("SafetyAware WHS Compliance Portal • Personal Workplace Roadmap", 15, 284);
      doc.text(`Page ${pageNum}`, 195, 284, { align: "right" });
    };

    // Draw First Page Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(12, 12, 186, 36, "F");

    // Accent line at the bottom of the banner
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(12, 47, 186, 1.5, "F");

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("SAFETYAWARE WHS PLANNER", 18, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("Official Australian WHS Roadmap & Compliance Guidelines", 18, 30);

    // Header Metadata on Right Side
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const sectorName = sectors.find(s => s.value === selectedSector)?.name || selectedSector;
    doc.text(sectorName.toUpperCase(), 186, 24, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-AU")}`, 186, 30, { align: "right" });
    doc.text(`Progress: ${progressPercent}% (${completedCount}/${tasks.length} Done)`, 186, 35, { align: "right" });

    drawPageBordersAndFooter(curPageNum);

    let y = 56;

    // SECTION 1: EXECUTIVE SUMMARY
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text("1. EXECUTIVE COMPLIANCE SUMMARY", 15, y);
    
    // Draw section accent line
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 80, y + 2);

    y += 8;

    // Dynamic executive summary text
    let summaryText = "";
    if (selectedSector === "Hospitality") {
      summaryText = "This compliance roadmap outline is tailored to Hospitality & Food services under current Australian legislation (Work Health and Safety Act 2011). Persons Conducting a Business or Undertaking (PCBUs) hold strict primary duty-of-care obligations to eliminate or minimize risks surrounding hot oil preparation, kitchen hand fatigue, heavy loads, wet slip hazards, and toxic/bullying physical workspaces. Workplaces must display active safety guides, run quarterly safety inductions, and actively audit safe systems of work.";
    } else if (selectedSector === "Construction") {
      summaryText = "This compliance roadmap outline is tailored to Building & Construction environments under current Australian model WHS regulations. Key priorities focus on verifying White Cards, scaffold structural safety, heights risk mitigation plans, falling object control, and certified industrial-grade PPE standards. Employers must conduct regular toolbox talks, monitor high-risk equipment licenses, and document all safety audits.";
    } else if (selectedSector === "AgedCare") {
      summaryText = "This compliance roadmap outline is tailored to Aged Care & Health Support services. Key legislative requirements focus on patient manual lifting codes, workplace hygiene standards, sharps risk management, and chemical disinfectant storage protocols. Care facilities must train staff continuously on hydraulic lifter operation, verify infection controls, and ensure emergency response lines are active.";
    } else if (selectedSector === "Office") {
      summaryText = "This compliance roadmap outline is tailored to General Office Admin environments. In modern Australian workplaces, psychological safety is legislatively treated with the same importance as physical safety under modern Psychosocial Hazard regulations. Employers must manage risks surrounding workplace stressors, bullying, cyber-harassment, fatigue, and promote respectful interpersonal communication alongside ergonomic assessments.";
    } else if (selectedSector === "Retail") {
      summaryText = "This compliance roadmap outline is tailored to Retail Operations. Key safety priorities center on safe vertical shelf stacking, emergency evacuation clearance, cash-safety measures, heavy manual stock handling, and wet or slippery surfaces. Frontline retail staff must be inducted on hazard notification protocols, proper lifting ergonomics, and basic incident response procedures.";
    } else { // Remote
      summaryText = "This compliance roadmap outline is tailored to Indigenous & Remote Projects. Remote sites require rigorous planning for extreme climates, satellite communication links, specific medical evacuation plans, and field first-aid training. Under current guidelines, the incorporation of cultural safety, respectful community co-design of safety guidelines, and mental health peer networks are vital components of compliant workspaces.";
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(summaryText, 180);
    doc.text(summaryLines, 15, y);
    y += (summaryLines.length * 4.8) + 6;

    // SECTION 2: CHECKLIST MILESTONES
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text("2. COMPLIANCE CHECKLIST MILESTONES", 15, y);
    
    // Draw section accent line
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 80, y + 2);

    y += 8;

    tasks.forEach((task) => {
      const taskLines = doc.splitTextToSize(task.title, 148);
      const cardHeight = Math.max(18, 12 + (taskLines.length * 4.5));

      // Check for page overflow
      if (y + cardHeight > 270) {
        doc.addPage();
        curPageNum++;
        drawPageBordersAndFooter(curPageNum);
        y = 20; // Reset Y on new page
      }

      // Draw a subtle background container for each task
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, cardHeight, "F");
      
      // Draw status box on the left, vertically centered
      const boxY = y + (cardHeight - 12) / 2;
      if (task.completed) {
        doc.setFillColor(16, 185, 129); // Emerald-500
        doc.rect(18, boxY, 12, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("OK", 24, boxY + 8.5, { align: "center" });
      } else {
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.setFillColor(255, 255, 255);
        doc.rect(18, boxY, 12, 12, "FD");
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.text("PEND", 24, boxY + 7.5, { align: "center" });
      }

      // Draw category badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      let catBg = [239, 246, 255]; // Light blue
      let catText = [29, 78, 216]; // Dark blue
      
      if (task.category === "Training") {
        catBg = [254, 243, 199];
        catText = [180, 83, 9];
      } else if (task.category === "Materials") {
        catBg = [243, 232, 255];
        catText = [109, 40, 217];
      } else if (task.category === "Audits") {
        catBg = [254, 226, 226];
        catText = [185, 28, 28];
      }
      
      // Badge background
      doc.setFillColor(catBg[0], catBg[1], catBg[2]);
      doc.rect(34, y + 2.5, 22, 5, "F");
      
      // Badge text
      doc.setTextColor(catText[0], catText[1], catText[2]);
      doc.setFontSize(6.5);
      doc.text(task.category.toUpperCase(), 45, y + 6, { align: "center" });

      // Draw task description wrapping
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.setFont("helvetica", task.completed ? "normal" : "bold");
      doc.setFontSize(8.5);
      doc.text(taskLines, 34, y + 12);

      y += cardHeight + 3; // add small gap between cards
    });

    // SECTION 3: RECOMMENDED MATERIAL
    if (y > 230) {
      doc.addPage();
      curPageNum++;
      drawPageBordersAndFooter(curPageNum);
      y = 20;
    } else {
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text("3. MANDATORY WHS DIGITAL COMPREHENSION MATERIAL", 15, y);
    
    // Draw section accent line
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 110, y + 2);

    y += 8;

    relevantBooklets.forEach((b) => {
      const bookletTitleLines = doc.splitTextToSize(b.title, 170);
      const bHeight = 12 + (bookletTitleLines.length * 4.5);

      if (y + bHeight > 270) {
        doc.addPage();
        curPageNum++;
        drawPageBordersAndFooter(curPageNum);
        y = 20;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, 180, bHeight, "FD");

      // Draw a gold accent strip on the left of each booklet reference
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(15, y, 2.5, bHeight, "F");

      // Booklet Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(bookletTitleLines, 21, y + 6.5);

      // Booklet info line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Group: ${b.group}   |   Audience: ${b.audience}   |   Ref Path: ${b.path}`, 21, y + bHeight - 4.5);

      y += bHeight + 3;
    });

    // Save File
    const sanitizedSector = sectorName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    doc.save(`SafetyAware_WHS_Roadmap_${sanitizedSector}.pdf`);
  };

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

          {/* Export action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleExportPDF}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0F0F12] font-sans font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center space-x-2 cursor-pointer transition-all outline-none"
            >
              <LucideIcon name="FileDown" size={13} className="text-[#0F0F12]" />
              <span>Export Roadmap as PDF</span>
            </button>
            <button
              onClick={handleExport}
              className="w-full py-2 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 font-sans font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all outline-none"
            >
              <LucideIcon name="Copy" size={13} className="text-slate-400" />
              <span>Copy as Plain Text</span>
            </button>
          </div>
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
