import React, { useState, useMemo } from "react";
import Header from "./components/Header";
import BookletCard from "./components/BookletCard";
import BookletModal from "./components/BookletModal";
import LicensingModal from "./components/LicensingModal";
import AdvisorChat from "./components/AdvisorChat";
import CompliancePlan from "./components/CompliancePlan";
import SavingsCalculator from "./components/SavingsCalculator";
import { booklets } from "./data/booklets";
import { Booklet, BookletGroup, BookletYear, BookletsFilter } from "./types";
import LucideIcon from "./components/LucideIcon";

export default function App() {
  const [activeTab, setActiveTab] = useState<"booklets" | "advisor" | "planner" | "savings">("booklets");
  const [selectedBookletForModal, setSelectedBookletForModal] = useState<Booklet | null>(null);
  const [isLicensingOpen, setIsLicensingOpen] = useState<boolean>(false);
  
  // States for Safety AI Advisor communication bridge
  const [initialPromptForAdvisor, setInitialPromptForAdvisor] = useState<string | null>(null);
  const [selectedBookletContext, setSelectedBookletContext] = useState<Booklet | null>(null);
  const [advisorUnread, setAdvisorUnread] = useState<boolean>(false);

  // Filter States
  const [filters, setFilters] = useState<BookletsFilter>({
    searchQuery: "",
    group: "All",
    year: "All",
    selectedTag: null
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Group Categories with count logic
  const groups: { label: BookletGroup; count: number }[] = useMemo(() => {
    const rawGroups: BookletGroup[] = [
      "All",
      "Core and Support",
      "Launch Materials",
      "Industry Booklets",
      "Young and General",
      "Indigenous and Remote"
    ];

    return rawGroups.map((g) => {
      const count = g === "All"
        ? booklets.length
        : booklets.filter((b) => b.group === g).length;
      return { label: g, count };
    });
  }, []);

  // Extract unique popular tags for quick clicking
  const popularTags = useMemo(() => {
    const allTags = booklets.flatMap((b) => b.tags);
    const counts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, []);

  // Filtering Logic
  const filteredBooklets = useMemo(() => {
    return booklets.filter((booklet) => {
      // 1. Search Query Filter
      const query = filters.searchQuery.toLowerCase().trim();
      const matchesQuery =
        query === "" ||
        booklet.title.toLowerCase().includes(query) ||
        booklet.description.toLowerCase().includes(query) ||
        booklet.audience.toLowerCase().includes(query) ||
        booklet.tags.some((t) => t.toLowerCase().includes(query));

      // 2. Group Filter
      const matchesGroup =
        filters.group === "All" || booklet.group === filters.group;

      // 3. Year Filter
      const matchesYear =
        filters.year === "All" ||
        booklet.year === filters.year ||
        booklet.year === "Both";

      // 4. Tag Clicked Filter
      const matchesTag =
        filters.selectedTag === null || booklet.tags.includes(filters.selectedTag);

      return matchesQuery && matchesGroup && matchesYear && matchesTag;
    });
  }, [filters]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      group: "All",
      year: "All",
      selectedTag: null
    });
  };

  // Switch to Advisor tab and populate a pre-defined prompt based on booklet context
  const handleConsultAI = (booklet: Booklet) => {
    setSelectedBookletContext(booklet);
    setInitialPromptForAdvisor(
      `I am preparing to roll out the "${booklet.title}" in our workplace. Could you explain the core statutory duties, employee responsibilities, and highlight the recommended WHS checklist steps for this booklet?`
    );
    setAdvisorUnread(true);
    setActiveTab("advisor");
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] text-[#E2E8F0] flex flex-col font-sans">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === "advisor") setAdvisorUnread(false);
        }}
        advisorUnread={advisorUnread}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === "booklets" && (
          <div className="space-y-6">
            {/* Catalog Hero Banner */}
            <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-white/5 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl mb-2">
              {/* Background ambient details */}
              <div className="absolute right-0 top-0 opacity-5 transform translate-x-12 -translate-y-12">
                <LucideIcon name="Shield" size={320} />
              </div>

              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
                  Interactive WHS Directory
                </span>
                <h1 className="font-sans font-light text-2xl sm:text-3.5xl tracking-tight leading-tight">
                  Workplace Safety & <span className="text-amber-500 font-bold">Respect Catalog</span>
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
                  Search, review, and consult on 47 legislative and safety booklets designed for Australian industries in 2026/27. Ensure compliance and build psychologically safe environments.
                </p>
              </div>
            </div>

            {/* Quick Filters Area */}
            <div className="bg-[#16161A] border border-white/5 rounded-3xl p-5 shadow-lg space-y-4">
              {/* Search Bar & Advanced Trigger */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <LucideIcon name="Search" size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search titles, industries, audiences, or tags (e.g. 'hospitality', 'aged care')..."
                    value={filters.searchQuery}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchQuery: e.target.value,
                        selectedTag: null // Reset tag selection if searching manually
                      }))
                    }
                    className="w-full bg-[#1A1A1F] border border-white/10 focus:border-amber-500/50 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none transition-all font-sans placeholder-slate-500"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-4 py-3 rounded-xl border font-sans font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer outline-none ${
                      showAdvancedFilters || filters.year !== "All"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                        : "bg-[#1A1A1F] border-white/10 text-slate-300 hover:bg-[#222228]"
                    }`}
                  >
                    <LucideIcon name="Filter" size={13} />
                    <span>Filters</span>
                    {filters.year !== "All" && (
                      <span className="bg-amber-500 text-[#0F0F12] font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        1
                      </span>
                    )}
                  </button>

                  {(filters.searchQuery || filters.group !== "All" || filters.year !== "All" || filters.selectedTag) && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-3 bg-[#1A1A1F] hover:bg-[#222228] border border-white/10 rounded-xl font-sans font-medium text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1.5 transition-colors cursor-pointer outline-none"
                    >
                      <LucideIcon name="RefreshCw" size={12} />
                      <span className="hidden xs:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Year selection dropdown (Visible conditionally) */}
              {showAdvancedFilters && (
                <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">WHS Release Year</label>
                    <select
                      value={filters.year}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          year: e.target.value as BookletYear
                        }))
                      }
                      className="w-full bg-[#1A1A1F] border border-white/10 text-slate-300 text-xs font-semibold rounded-xl px-3.5 py-2 outline-none appearance-none cursor-pointer font-sans"
                    >
                      <option value="All">All Years</option>
                      <option value="2026">2026 Guidelines</option>
                      <option value="2027">2027 Guidelines</option>
                      <option value="Both">Multi-Year (Both)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Group Chips Navigation */}
              <div className="pt-1.5 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                {groups.map((g) => {
                  const isActive = filters.group === g.label;
                  return (
                    <button
                      key={g.label}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          group: g.label,
                          selectedTag: null // Reset tag selection when group shifts
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium flex items-center space-x-2 cursor-pointer border transition-all duration-200 outline-none flex-shrink-0 ${
                        isActive
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm font-semibold"
                          : "bg-[#1A1A1F] border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>{g.label}</span>
                      <span
                        className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {g.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Popular Tags Quick filter list */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1">
                <span className="font-sans font-medium text-[11px] mr-1 text-slate-400">Popular:</span>
                {popularTags.map((tag) => {
                  const isSelected = filters.selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          selectedTag: isSelected ? null : tag
                        }))
                      }
                      className={`px-2 py-0.5 rounded border font-mono text-[10px] cursor-pointer transition-all outline-none ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold"
                          : "bg-[#1A1A1F] border-white/5 hover:border-white/10 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="font-sans font-bold text-white text-base">
                  {filters.group === "All" ? "All Booklets Catalog" : `${filters.group} Booklets`}
                </h2>
                <span className="text-xs text-slate-500 font-sans">
                  Showing <strong>{filteredBooklets.length}</strong> safety booklets
                </span>
              </div>

              {filteredBooklets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBooklets.map((booklet) => (
                    <BookletCard
                      key={booklet.name}
                      booklet={booklet}
                      onOpenDetails={(b) => setSelectedBookletForModal(b)}
                      onDiscuss={(b) => handleConsultAI(b)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#16161A] border border-white/5 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
                  <div className="bg-white/5 text-slate-400 p-4 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-white/10">
                    <LucideIcon name="AlertCircle" size={24} />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-white text-sm">No safety booklets found</h3>
                    <p className="text-slate-400 text-xs font-sans mt-1">
                      No booklets fit your active filters. Try adjusting your query search, selecting another industry group, or resetting filters.
                    </p>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0F0F12] rounded-xl font-sans font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-colors outline-none"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "advisor" && (
          <div className="space-y-4">
            {/* Advisor Explanation Hero */}
            <div className="bg-[#16161A] border border-white/5 rounded-3xl p-5 shadow-lg flex items-start space-x-4">
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <LucideIcon name="Brain" size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-white text-sm">Consult Safety Advisor AI</h2>
                <p className="text-slate-400 text-xs leading-relaxed font-sans mt-0.5">
                  The virtual Safety Advisor is powered directly by server-side Gemini AI. It has comprehensive context on the 47 safety guidelines, anti-discrimination regulations, and legal standards to provide accurate step-by-step checklists or policy draft assistance.
                </p>
              </div>
            </div>

            {/* Conversation Core */}
            <AdvisorChat
              initialPrompt={initialPromptForAdvisor}
              setInitialPrompt={setInitialPromptForAdvisor}
              selectedBooklet={selectedBookletContext}
              setSelectedBooklet={setSelectedBookletContext}
            />
          </div>
        )}

        {activeTab === "planner" && (
          <div className="space-y-4">
            {/* Planner Explanation Hero */}
            <div className="bg-[#16161A] border border-white/5 rounded-3xl p-5 shadow-lg flex items-start space-x-4">
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <LucideIcon name="ClipboardCheck" size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-white text-sm">WHS Compliance & Rollout Planner</h2>
                <p className="text-slate-400 text-xs leading-relaxed font-sans mt-0.5">
                  Organize, check, and copy your compliance program milestones. Select your industry to compile targeted checklists, audits, and recommended booklets, then copy your formatted WHS plan directly into your email or company portal.
                </p>
              </div>
            </div>

            {/* Planner Core Component */}
            <CompliancePlan
              booklets={booklets}
              onOpenBooklet={(b) => setSelectedBookletForModal(b)}
            />
          </div>
        )}

        {activeTab === "savings" && (
          <SavingsCalculator />
        )}
      </main>

      {/* Safety Details Popup Modal */}
      <BookletModal
        booklet={selectedBookletForModal}
        onClose={() => setSelectedBookletForModal(null)}
        onDiscuss={(b) => handleConsultAI(b)}
      />

      {/* Licensing & Compliance Modal */}
      <LicensingModal
        isOpen={isLicensingOpen}
        onClose={() => setIsLicensingOpen(false)}
      />

      {/* Global Footer */}
      <footer className="bg-[#0A0A0C] border-t border-white/5 py-8 mt-12 text-slate-500 font-sans text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div className="flex items-center space-x-3">
              {/* Australian National Flag */}
              <svg viewBox="0 0 600 300" className="w-8 h-5 rounded shadow-sm border border-white/10 object-cover shrink-0" aria-label="Australian National Flag">
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

              {/* Australian Aboriginal Flag */}
              <svg viewBox="0 0 3 2" className="w-8 h-5 rounded shadow-sm border border-white/10 object-cover shrink-0" aria-label="Australian Aboriginal Flag">
                <rect width="3" height="1" fill="#000000" />
                <rect y="1" width="3" height="1" fill="#E00000" />
                <circle cx="1.5" cy="1" r="0.4" fill="#FFCC00" />
              </svg>

              <span className="text-[11px] text-slate-400 font-sans tracking-wide">Australian National & Aboriginal flags respectfully displayed</span>
            </div>
            <p className="text-center md:text-left text-slate-400 font-sans leading-relaxed">
              Copyright © 2026 SafetyAware. All Rights Reserved. Tailored to Australian Work Health and Safety (WHS) Guidelines.
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center md:justify-start text-[11px] text-slate-500 font-mono">
              <span>ABN: 59 726 146 692</span>
              <span className="text-slate-700">|</span>
              <span>DUNS: 74-906-8766</span>
              <span className="text-slate-700">|</span>
              <button 
                onClick={() => setIsLicensingOpen(true)}
                className="text-amber-500/80 hover:text-amber-400 underline cursor-pointer transition-colors outline-none font-sans"
              >
                Licensing, Disclaimers & Attributions
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end space-y-2">
            <div className="flex space-x-3 text-[11px] font-medium text-slate-500">
              <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10 font-mono text-slate-400">Ver: 2026.07.05</span>
              <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10 text-slate-400">Client-Authored Portal</span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans text-center md:text-right">
              We acknowledge the Traditional Custodians of land throughout Australia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
