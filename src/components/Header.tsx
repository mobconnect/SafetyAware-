import { motion } from "motion/react";
import LucideIcon from "./LucideIcon";

interface HeaderProps {
  activeTab: "booklets" | "advisor" | "planner" | "savings";
  setActiveTab: (tab: "booklets" | "advisor" | "planner" | "savings") => void;
  advisorUnread?: boolean;
}

export default function Header({ activeTab, setActiveTab, advisorUnread }: HeaderProps) {
  return (
    <header className="bg-[#16161A] border-b border-white/5 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-[#0F0F12] p-2.5 rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center">
              <LucideIcon name="Shield" className="text-[#0F0F12]" size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-sans font-bold text-lg tracking-tight text-white">SafetyAware</span>
                <span className="bg-white/5 text-slate-300 border border-white/10 font-mono text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md">WHS 2026/27</span>
              </div>
              <p className="text-xs text-slate-500 font-sans hidden sm:block">Australian Respectful Workplace & Compliance Portal</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1" aria-label="Tabs">
            {[
              { id: "booklets", label: "Catalog", icon: "BookOpen" },
              { id: "savings", label: "Super & Savings", icon: "TrendingUp" },
              { id: "advisor", label: "Safety Advisor", icon: "Brain", badge: advisorUnread },
              { id: "planner", label: "WHS Planner", icon: "ClipboardCheck" }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-sans font-medium text-sm transition-all duration-200 outline-none cursor-pointer ${
                    isActive
                      ? "text-amber-500 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center space-x-1.5">
                    <LucideIcon
                      name={tab.icon}
                      size={16}
                      className={isActive ? "text-amber-500" : "text-slate-500"}
                    />
                    <span className="hidden xs:inline">{tab.label}</span>
                    {tab.badge && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
