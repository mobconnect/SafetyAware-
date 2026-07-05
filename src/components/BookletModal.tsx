import { useState, useEffect } from "react";
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

  // Tabs: overview vs quiz
  const [activeTab, setActiveTab] = useState<"overview" | "quiz">("overview");

  // Quiz States
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Reset quiz states when booklet changes
  useEffect(() => {
    setActiveTab("overview");
    setQuizQuestions([]);
    setCurrentQ(0);
    setAnswers([null, null, null]);
    setSubmitted(false);
    setQuizError(null);
  }, [booklet]);

  // Persist score in localStorage upon submission
  useEffect(() => {
    if (submitted && quizQuestions.length > 0) {
      const score = answers.filter((ans, idx) => ans === quizQuestions[idx]?.correctAnswer).length;
      try {
        const key = `safetyaware-quiz-${booklet.name}`;
        localStorage.setItem(key, JSON.stringify({ score, timestamp: Date.now() }));
        window.dispatchEvent(new Event("quiz-completed"));
      } catch (err) {
        console.error("Failed to save quiz score to localStorage:", err);
      }
    }
  }, [submitted, answers, quizQuestions, booklet]);

  const handleFetchQuiz = async () => {
    setLoadingQuiz(true);
    setQuizError(null);
    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookletName: booklet.name }),
      });
      const data = await response.json();
      if (data && data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      } else {
        throw new Error(data.error || "No quiz questions returned.");
      }
    } catch (err: any) {
      console.error("Failed to load quiz questions:", err);
      setQuizError(err.message || "Unable to load compliance quiz.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleTabChange = (tab: "overview" | "quiz") => {
    setActiveTab(tab);
    if (tab === "quiz" && quizQuestions.length === 0) {
      handleFetchQuiz();
    }
  };

  const handleOptionSelect = (choiceIndex: number) => {
    const updated = [...answers];
    updated[currentQ] = choiceIndex;
    setAnswers(updated);
  };

  const handleNextQ = () => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setSubmitted(true);
    }
  };

  const handlePrevQ = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  const handleRetake = () => {
    setAnswers([null, null, null]);
    setCurrentQ(0);
    setSubmitted(false);
  };

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

  // Opens the booklet PDF in a new tab via our server-side viewer
  const handleOpenBooklet = () => {
    window.open(`/${booklet.path}`, "_blank");
  };

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
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl border border-amber-500/20 flex-shrink-0">
                <LucideIcon name={booklet.iconName} size={22} className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md">
                  {booklet.group}
                </span>
                <h2 className="font-sans font-bold text-white text-base md:text-lg leading-snug mt-1 truncate">{booklet.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer outline-none flex-shrink-0"
            >
              <LucideIcon name="X" size={18} />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="bg-[#121216] border-b border-white/5 px-6 flex space-x-4">
            <button
              onClick={() => handleTabChange("overview")}
              className={`py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview & Audits
            </button>
            <button
              onClick={() => handleTabChange("quiz")}
              className={`py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "quiz"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <LucideIcon name="GraduationCap" size={13} />
              <span>Comprehension Quiz</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === "overview" ? (
              <>
                {/* Overview Card */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-slate-500 text-[11px] font-mono uppercase tracking-wider font-bold">Booklet Overview</h4>
                    <button
                      onClick={handleOpenBooklet}
                      className="text-amber-500 hover:text-amber-400 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <LucideIcon name="ExternalLink" size={12} />
                      <span>Read Digital Copy</span>
                    </button>
                  </div>
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

                  <div
                    onClick={handleOpenBooklet}
                    className="bg-[#1C1C21] border border-white/5 hover:border-amber-500/20 p-3.5 rounded-xl flex items-center space-x-3 cursor-pointer transition-all hover:bg-amber-500/[0.02] group"
                    title="Click to open booklet document"
                  >
                    <LucideIcon name="FileText" size={18} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-mono text-slate-500 group-hover:text-amber-500 transition-colors uppercase font-bold">WHS File Path (Open)</p>
                      <p className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors truncate">{booklet.path}</p>
                    </div>
                    <LucideIcon name="ChevronRight" size={14} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
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
              </>
            ) : (
              /* Quiz View Space */
              <div className="space-y-6">
                {loadingQuiz ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                    <p className="text-xs text-slate-400 font-mono">Generating customized WHS comprehension quiz...</p>
                  </div>
                ) : quizError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-3">
                    <p className="text-xs text-red-400">{quizError}</p>
                    <button
                      onClick={handleFetchQuiz}
                      className="px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Retry Quiz Generation
                    </button>
                  </div>
                ) : submitted ? (
                  /* Quiz Result summary view */
                  <div className="space-y-6">
                    <div className="bg-[#1C1C21] border border-white/5 p-6 rounded-2xl text-center space-y-3 relative overflow-hidden">
                      {answers.filter((ans, idx) => ans === quizQuestions[idx]?.correctAnswer).length === 3 && (
                        <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                          PERFECT SCORE
                        </div>
                      )}
                      <div className="bg-amber-500/10 text-amber-500 p-3 rounded-full border border-amber-500/20 inline-block">
                        <LucideIcon name="Trophy" size={24} />
                      </div>
                      <h3 className="font-sans font-bold text-base text-white">Quiz Results Compiled</h3>
                      <h2 className="text-3xl font-mono font-bold text-amber-500">
                        {answers.filter((ans, idx) => ans === quizQuestions[idx]?.correctAnswer).length} / 3
                      </h2>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        {answers.filter((ans, idx) => ans === quizQuestions[idx]?.correctAnswer).length === 3
                          ? "COMPREHENSION FULLY VERIFIED"
                          : "COMPREHENSION REVIEWS SUGGESTED"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">Question Review</h4>
                      {quizQuestions.map((q, idx) => {
                        const userAnsIdx = answers[idx];
                        const isCorrect = userAnsIdx === q.correctAnswer;
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border ${
                              isCorrect ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-rose-500/20 bg-rose-500/[0.02]"
                            } space-y-2`}
                          >
                            <div className="flex items-start justify-between space-x-2">
                              <p className="text-xs font-semibold text-white">
                                Q{idx + 1}: {q.question}
                              </p>
                              <span
                                className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                  isCorrect ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {isCorrect ? "Correct" : "Incorrect"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans mt-2 space-y-1">
                              <p>
                                Your Choice:{" "}
                                <span className={isCorrect ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                                  {userAnsIdx !== null ? q.options[userAnsIdx] : "Unanswered"}
                                </span>
                              </p>
                              {!isCorrect && (
                                <p>
                                  Correct Choice:{" "}
                                  <span className="text-emerald-400 font-medium">{q.options[q.correctAnswer]}</span>
                                </p>
                              )}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-300 font-sans border-l-2 border-amber-500/30 pl-2.5 pt-1 mt-2">
                              <strong>WHS Feedback:</strong> {q.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleRetake}
                      className="w-full py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Retake Quiz
                    </button>
                  </div>
                ) : quizQuestions.length > 0 ? (
                  /* Question Display Workspace */
                  <div className="space-y-5">
                    <div className="bg-[#1C1C21] border border-white/5 p-3.5 rounded-xl flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">
                        Question <strong className="text-amber-500">{currentQ + 1}</strong> of 3
                      </span>
                      <span className="text-slate-400">Single Choice</span>
                    </div>

                    <div className="space-y-3.5">
                      <h3 className="font-sans font-bold text-sm md:text-base text-white leading-relaxed">
                        {quizQuestions[currentQ].question}
                      </h3>

                      <div className="space-y-2.5">
                        {quizQuestions[currentQ].options.map((opt: string, optIdx: number) => {
                          const isSelected = answers[currentQ] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleOptionSelect(optIdx)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer outline-none ${
                                isSelected
                                  ? "bg-amber-500/15 border-amber-500 text-amber-400 font-semibold shadow-md shadow-amber-500/5"
                                  : "bg-[#1C1C21] border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <button
                        onClick={handlePrevQ}
                        disabled={currentQ === 0}
                        className="px-4 py-2 border border-white/5 bg-transparent hover:bg-white/5 disabled:opacity-30 text-xs text-slate-400 rounded-lg font-medium cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNextQ}
                        disabled={answers[currentQ] === null}
                        className="px-5 py-2 bg-amber-500 disabled:bg-[#1C1C21] disabled:text-slate-500 text-black font-bold text-xs rounded-lg cursor-pointer hover:bg-amber-600 transition-colors"
                      >
                        {currentQ === 2 ? "Finish & Grade" : "Next Question"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-[#121216] px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 bg-transparent hover:bg-white/5 text-slate-300 rounded-xl font-sans font-medium text-sm transition-colors cursor-pointer outline-none text-center"
            >
              Close Window
            </button>
            <button
              onClick={() => {
                onDiscuss(booklet);
                onClose();
              }}
              className="px-5 py-2.5 bg-[#1C1C21] hover:bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:border-amber-500/30 rounded-xl font-sans font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer outline-none"
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
