import { motion, AnimatePresence } from "motion/react";
import LucideIcon from "./LucideIcon";

interface LicensingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LicensingModal({ isOpen, onClose }: LicensingModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-[#16161A] rounded-3xl border border-white/5 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-[#1C1C21] px-6 py-5 border-b border-white/5 flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl border border-amber-500/20 flex-shrink-0">
                <LucideIcon name="Scale" size={22} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-white text-base md:text-lg leading-snug">
                  Licensing & Compliance Information
                </h2>
                <p className="text-slate-400 text-xs font-sans mt-0.5">
                  Legal attributions, public licenses, registry details, and software dependencies
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none flex-shrink-0"
              aria-label="Close licensing modal"
            >
              {/* Using Info as X since X might fallback, or we can just render custom X svg line to be 100% sure */}
              <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-slate-300 font-sans text-xs">
            
            {/* Regulatory Registrations & Identifiers */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                <LucideIcon name="Award" size={15} />
                <span>Regulatory Registrations</span>
              </h3>
              <div className="bg-[#1A1A22] border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Australian Business Number (ABN)</span>
                  <span className="text-slate-200 font-mono text-xs font-semibold">59 726 146 692</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active registration under the Australian Business Register.</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">D-U-N-S Number</span>
                  <span className="text-slate-200 font-mono text-xs font-semibold">74-906-8766</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verified in Dun & Bradstreet Global Database.</p>
                </div>
              </div>
            </section>

            {/* National & Aboriginal Symbols Acknowledgement */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <LucideIcon name="Globe" size={15} className="text-blue-400" />
                <span>Australian Heritage & Flag Disclosures</span>
              </h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In accordance with national protocol and respectful inclusion practices:
              </p>
              
              <div className="space-y-3 bg-[#1A1A22] border border-white/5 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg viewBox="0 0 600 300" className="w-10 h-6 rounded border border-white/10 shrink-0 mt-0.5" aria-hidden="true">
                    <rect width="600" height="300" fill="#012169" />
                    <g>
                      <line x1="0" y1="0" x2="300" y2="150" stroke="#FFFFFF" strokeWidth="30" />
                      <line x1="300" y1="0" x2="0" y2="150" stroke="#FFFFFF" strokeWidth="30" />
                      <line x1="0" y1="0" x2="300" y2="150" stroke="#C8102E" strokeWidth="10" />
                      <line x1="300" y1="0" x2="0" y2="150" stroke="#C8102E" strokeWidth="10" />
                      <rect x="120" y="0" width="60" height="150" fill="#FFFFFF" />
                      <rect x="0" y="60" width="300" height="30" fill="#FFFFFF" />
                      <rect x="130" y="0" width="40" height="150" fill="#C8102E" />
                      <rect x="0" y="70" width="300" height="10" fill="#C8102E" />
                    </g>
                    <g transform="translate(150, 225) scale(35)">
                      <polygon points="0,-1 0.22,-0.43 0.78,-0.62 0.43,-0.09 0.97,0.22 0.38,0.3 0.43,0.9 0,0.5 -0.43,0.9 -0.38,0.3 -0.97,0.22 -0.43,-0.09 -0.78,-0.62 -0.22,-0.43" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(450, 240) scale(18)">
                      <polygon points="0,-1 0.22,-0.43 0.78,-0.62 0.43,-0.09 0.97,0.22 0.38,0.3 0.43,0.9 0,0.5 -0.43,0.9 -0.38,0.3 -0.97,0.22 -0.43,-0.09 -0.78,-0.62 -0.22,-0.43" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(390, 135) scale(18)">
                      <polygon points="0,-1 0.22,-0.43 0.78,-0.62 0.43,-0.09 0.97,0.22 0.38,0.3 0.43,0.9 0,0.5 -0.43,0.9 -0.38,0.3 -0.97,0.22 -0.43,-0.09 -0.78,-0.62 -0.22,-0.43" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(450, 65) scale(18)">
                      <polygon points="0,-1 0.22,-0.43 0.78,-0.62 0.43,-0.09 0.97,0.22 0.38,0.3 0.43,0.9 0,0.5 -0.43,0.9 -0.38,0.3 -0.97,0.22 -0.43,-0.09 -0.78,-0.62 -0.22,-0.43" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(510, 125) scale(18)">
                      <polygon points="0,-1 0.22,-0.43 0.78,-0.62 0.43,-0.09 0.97,0.22 0.38,0.3 0.43,0.9 0,0.5 -0.43,0.9 -0.38,0.3 -0.97,0.22 -0.43,-0.09 -0.78,-0.62 -0.22,-0.43" fill="#FFFFFF" />
                    </g>
                    <g transform="translate(475, 175) scale(10)">
                      <polygon points="0,-1 0.588,0.809 -0.951,-0.309 0.951,-0.309 -0.588,0.809" fill="#FFFFFF" />
                    </g>
                  </svg>
                  <div>
                    <h4 className="font-bold text-slate-200">Australian National Flag</h4>
                    <p className="text-slate-400 leading-normal text-[11px] mt-0.5">
                      Used in accordance with Australian Government rules set out by the Department of the Prime Minister and Cabinet. Under the Flags Act 1953, the Australian National Flag is declared the National Flag of Australia.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 border-t border-white/5 pt-3">
                  <svg viewBox="0 0 3 2" className="w-10 h-6 rounded border border-white/10 shrink-0 mt-0.5" aria-hidden="true">
                    <rect width="3" height="1" fill="#000000" />
                    <rect y="1" width="3" height="1" fill="#E00000" />
                    <circle cx="1.5" cy="1" r="0.4" fill="#FFCC00" />
                  </svg>
                  <div>
                    <h4 className="font-bold text-slate-200">Australian Aboriginal Flag</h4>
                    <p className="text-slate-400 leading-normal text-[11px] mt-0.5">
                      Designed by Luritja/Wombaya artist Harold Thomas in 1971. Under a historic January 2022 agreement with the Commonwealth of Australia, the flag’s copyright was transferred to the public domain. It is freely reproduced here with respect to Aboriginal and Torres Strait Islander peoples.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Safe Work Australia Creative Commons Attribution */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <LucideIcon name="FileText" size={15} className="text-emerald-400" />
                <span>WHS Information Attribution (CC BY 4.0)</span>
              </h3>
              <div className="bg-[#1A1A22] border border-white/5 rounded-xl p-4 space-y-2">
                <p className="leading-relaxed">
                  The model safety booklets, compliance guidelines, and audit checklists represented in this application are derived from publications created by <strong>Safe Work Australia</strong>.
                </p>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Except where otherwise noted, these regulatory source materials are licensed under the <strong className="text-slate-300">Creative Commons Attribution 4.0 International Licence (CC BY 4.0)</strong>. This application acknowledges, attributes, and presents this public guidance to aid workplaces in active compliance and education. We remain unaffiliated with the Australian Government.
                </p>
              </div>
            </section>

            {/* Software Open Source Attributions */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <LucideIcon name="Settings" size={15} className="text-purple-400" />
                <span>Third-Party Open Source Libraries</span>
              </h3>
              <div className="bg-[#1A1A22] border border-white/5 rounded-xl p-4">
                <p className="mb-3 text-slate-400 leading-normal">
                  This application includes components governed by the following open-source licenses:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] text-slate-400">
                  <div className="p-2.5 bg-[#121216] rounded-lg border border-white/5">
                    <span className="text-slate-200 block font-semibold">React & React DOM</span>
                    <span className="text-[10px] text-slate-500">MIT License</span>
                  </div>
                  <div className="p-2.5 bg-[#121216] rounded-lg border border-white/5">
                    <span className="text-slate-200 block font-semibold">Tailwind CSS v4</span>
                    <span className="text-[10px] text-slate-500">MIT License</span>
                  </div>
                  <div className="p-2.5 bg-[#121216] rounded-lg border border-white/5">
                    <span className="text-slate-200 block font-semibold">lucide-react Icons</span>
                    <span className="text-[10px] text-slate-500">ISC License</span>
                  </div>
                  <div className="p-2.5 bg-[#121216] rounded-lg border border-white/5">
                    <span className="text-slate-200 block font-semibold">motion (Animations)</span>
                    <span className="text-[10px] text-slate-500">MIT License</span>
                  </div>
                  <div className="p-2.5 bg-[#121216] rounded-lg border border-white/5">
                    <span className="text-slate-200 block font-semibold">@google/genai SDK</span>
                    <span className="text-[10px] text-slate-500">Apache License 2.0</span>
                  </div>
                  <div className="p-2.5 bg-[#121216] rounded-lg border border-white/5">
                    <span className="text-slate-200 block font-semibold">Express.js Framework</span>
                    <span className="text-[10px] text-slate-500">MIT License</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Disclaimer of Liability */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-[#FF5D5D] flex items-center space-x-2">
                <LucideIcon name="ShieldCheck" size={15} className="text-[#FF5D5D]" />
                <span>WHS Compliance Legal Disclaimer</span>
              </h3>
              <div className="bg-[#1A1112] border border-[#FF5D5D]/10 rounded-xl p-4 text-[#FFACAC] leading-relaxed text-[11px] space-y-1">
                <p className="font-bold">IMPORTANT LEGAL NOTICE:</p>
                <p>
                  The information, checklists, AI advisories, and calculated compliance metrics provided inside this application are compiled for occupational safety education and internal awareness only.
                </p>
                <p>
                  While tailored to modern 2026/2027 Work Health and Safety (WHS) Guidelines, they do not constitute legal advice, binding statutory counsel, or certified safety audits. Workplaces should consult qualified legal professionals or local state regulators (e.g. SafeWork NSW, WorkSafe Victoria) to review certified policies before official adoption.
                </p>
              </div>
            </section>

          </div>

          {/* Footer controls */}
          <div className="bg-[#1C1C21] border-t border-white/5 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0F0F12] rounded-xl font-sans font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-colors outline-none"
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
