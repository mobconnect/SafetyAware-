import { motion, AnimatePresence } from "motion/react";
import { Booklet } from "../types";
import LucideIcon from "./LucideIcon";

interface BookletModalProps {
  booklet: Booklet | null;
  onClose: () => void;
  onDiscuss: (booklet: Booklet) => void;
}

export default function BookletModal({ booklet, onClose, onDiscuss }: BookletModalProps) {
  if (!booklet) return null;

  // Generate some highly realistic action checklist based on the booklet group and title
  const getComplianceChecklist = (b: Booklet) => {
    const list = [
      "Review roles and duties under current Australian WHS legislation.",
      "Conduct a localized hazard assessment targeting risk factors mentioned in this booklet.",
      "Incorporate guidelines into staff induction workflows and quarterly toolboxes.",
      "Ensure physical copies or local digital versions are accessible to active shifts."
    ];

    if (b.group === "Young and General" || b.title.toLowerCase().includes("young")) {
      return [
        "Deliver targeted youth safety inductions addressing high-risk machinery and chemicals.",
        "Implement buddy or mentor programs for new starters and apprentices.",
        "Establish zero-tolerance policies on lateral bullying and peer-to-peer harassment.",
        "Ensure shift schedules comply with student learning limits and maximum hours."
      ];
    }

    if (b.group === "Indigenous and Remote" || b.title.toLowerCase().includes("indigenous")) {
      return [
        "Incorporate First Nations cultural safety workshops into standard onboarding plans.",
        "Deliver isolated remote safety protocols, covering extreme weather and medical evacuation.",
        "Engage with Indigenous community representatives to co-design workspace rules.",
        "Implement peer-driven mental health checking networks for FIFO personnel."
      ];
    }

    if (b.group === "Industry Booklets") {
      return [
        "Review specific machinery guards, chemical storage (SDS), or hazard reporting logs.",
        "Designate an industry-certified safety representative (HSR) on site.",
        "Perform regular slip, trip, and lifting audits aligned to our workspace layout.",
        "Provide certified PPE (Safety boots, vests, eye protection, or medical-grade filters)."
      ];
    }

    if (b.group === "Core and Support") {
      return [
        "Audit company code of conduct documents to verify alignment with respectful workplace regulations.",
        "Establish straightforward, secure reporting channels for complaints or bullying.",
        "Mandate respectful conduct training sessions for executive managers and support teams.",
        "Verify standard workplace legal representations are prominently posted on noticeboards."
      ];
    }

    return list;
  };

  const checklist = getComplianceChecklist(booklet);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-[#16161A] rounded-3xl border border-white/5 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#1C1C21] px-6 py-5 border-b border-white/5 flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl border border-amber-500/20">
                <LucideIcon name={booklet.iconName} size={22} className="text-amber-500" />
              </div>
              <div>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md">
                  {booklet.group}
                </span>
                <h2 className="font-sans font-bold text-white text-lg leading-snug mt-1">{booklet.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none"
            >
              <LucideIcon name="UserX" size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Overview Card */}
            <div>
              <h4 className="text-slate-500 text-[11px] font-mono uppercase tracking-wider mb-2 font-bold">Booklet Overview</h4>
              <p className="text-slate-300 text-sm leading-relaxed font-sans bg-white/5 p-4 rounded-xl border border-white/5">
                {booklet.description}
              </p>
            </div>

            {/* Path and Audience Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#1C1C21] border border-white/5 p-3.5 rounded-xl flex items-center space-x-3">
                <LucideIcon name="Users" size={18} className="text-slate-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Intended Audience</p>
                  <p className="text-xs font-semibold text-slate-200 truncate font-sans">{booklet.audience}</p>
                </div>
              </div>

              <div className="bg-[#1C1C21] border border-white/5 p-3.5 rounded-xl flex items-center space-x-3">
                <LucideIcon name="FileText" size={18} className="text-slate-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">WHS File Path</p>
                  <p className="text-xs font-mono text-slate-300 truncate">{booklet.path}</p>
                </div>
              </div>
            </div>

            {/* Quick Audit / Safety Action items */}
            <div>
              <div className="flex items-center space-x-1.5 mb-3">
                <LucideIcon name="ClipboardCheck" size={16} className="text-amber-500" />
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">Recommended Safety Audits</h4>
              </div>
              <ul className="space-y-2.5">
                {checklist.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3 text-slate-300 text-xs leading-relaxed font-sans">
                    <span className="flex-shrink-0 bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-amber-500/20 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Metadata Tags */}
            <div>
              <h4 className="text-slate-500 text-[10px] font-mono uppercase tracking-wider mb-2 font-bold">Associated Compliance Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {booklet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/5 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#121216] px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 bg-transparent hover:bg-white/5 text-slate-300 rounded-xl font-sans font-medium text-sm transition-colors cursor-pointer outline-none text-center"
            >
              Close
            </button>
            <button
              onClick={() => {
                onDiscuss(booklet);
                onClose();
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0F0F12] rounded-xl font-sans font-bold text-sm transition-all shadow-md shadow-amber-500/10 flex items-center justify-center space-x-2 cursor-pointer outline-none"
            >
              <LucideIcon name="Brain" size={15} />
              <span>Deep Consult with Safety AI</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
