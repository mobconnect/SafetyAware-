import { motion } from "motion/react";
import { Booklet } from "../types";
import LucideIcon from "./LucideIcon";

interface BookletCardProps {
  key?: string;
  booklet: Booklet;
  onOpenDetails: (booklet: Booklet) => void;
  onDiscuss: (booklet: Booklet) => void;
}

export default function BookletCard({ booklet, onOpenDetails, onDiscuss }: BookletCardProps) {
  // Define dynamic accent colors based on group to make groups visually scannable
  const getGroupStyle = (group: string) => {
    switch (group) {
      case "Core and Support":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          iconBg: "bg-blue-500",
          accentLine: "border-l-blue-500/70"
        };
      case "Launch Materials":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          iconBg: "bg-purple-500",
          accentLine: "border-l-purple-500/70"
        };
      case "Industry Booklets":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          iconBg: "bg-amber-500",
          accentLine: "border-l-amber-500/70"
        };
      case "Young and General":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          iconBg: "bg-emerald-500",
          accentLine: "border-l-emerald-500/70"
        };
      case "Indigenous and Remote":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          iconBg: "bg-rose-500",
          accentLine: "border-l-rose-500/70"
        };
      default:
        return {
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          iconBg: "bg-slate-500",
          accentLine: "border-l-slate-500/70"
        };
    }
  };

  const styles = getGroupStyle(booklet.group);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className={`bg-[#1C1C21] rounded-2xl border border-white/5 border-l-4 ${styles.accentLine} shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-amber-500/30 flex flex-col h-full overflow-hidden group`}
    >
      {/* Top Details & Icon */}
      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between mb-3">
          {/* Group Badge */}
          <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${styles.bg}`}>
            {booklet.group}
          </span>
          {/* Year Badge */}
          <span className="bg-white/5 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10">
            {booklet.year === "Both" ? "2026/27" : booklet.year}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-sans font-bold text-white leading-snug mb-2 group-hover:text-amber-400 transition-colors line-clamp-2 min-h-[2.8rem]">
          {booklet.title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed font-sans">
          {booklet.description}
        </p>

        {/* Audience */}
        <div className="flex items-center space-x-1.5 py-1.5 px-2.5 bg-white/5 border border-white/5 rounded-lg text-slate-300 text-[11px] font-sans">
          <LucideIcon name="Users" size={13} className="text-slate-500 flex-shrink-0" />
          <span className="truncate font-medium">Audience: {booklet.audience}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-[#121216]/50 px-5 py-3.5 border-t border-white/5 flex items-center justify-between mt-auto">
        <button
          onClick={() => onOpenDetails(booklet)}
          className="text-amber-500 hover:text-amber-400 font-sans font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer outline-none"
        >
          <LucideIcon name="BookOpen" size={14} />
          <span>Full Details</span>
        </button>

        <button
          onClick={() => onDiscuss(booklet)}
          className="text-slate-300 hover:text-amber-400 font-sans font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer outline-none bg-white/5 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-amber-500/20 shadow-sm"
        >
          <LucideIcon name="Brain" size={13} />
          <span>Consult AI</span>
        </button>
      </div>
    </motion.div>
  );
}
