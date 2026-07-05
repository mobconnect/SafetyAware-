import React, { useState, useMemo } from "react";
import LucideIcon from "./LucideIcon";

export default function SavingsCalculator() {
  // Input States
  const [currentAge, setCurrentAge] = useState<number>(20);
  const [retirementAge, setRetirementAge] = useState<number>(65);
  const [annualSalary, setAnnualSalary] = useState<number>(65000);
  const [currentSuperBalance, setCurrentSuperBalance] = useState<number>(5000);
  const [superRate, setSuperRate] = useState<number>(12.0); // Australian statutory rate for 2026/27 is 12%
  const [annualGrowth, setAnnualGrowth] = useState<number>(7.5); // Average balanced fund return
  const [extraContribution, setExtraContribution] = useState<number>(50); // $ per week
  const [extraContribFreq, setExtraContribFreq] = useState<"weekly" | "monthly">("weekly");
  const [salaryGrowth, setSalaryGrowth] = useState<number>(3.0); // 3% wage inflation/progression

  // Calculate annual projections
  const projections = useMemo(() => {
    const years = retirementAge - currentAge;
    if (years <= 0) return [];

    let currentBalance = currentSuperBalance;
    let currentSalary = annualSalary;
    const list = [];

    // Personal extra contribution per annum
    const extraAnnual = extraContribFreq === "weekly" ? extraContribution * 52 : extraContribution * 12;

    let totalEmployerPaid = 0;
    let totalPersonalPaid = 0;
    let totalEarnings = 0;

    for (let i = 0; i <= years; i++) {
      const age = currentAge + i;
      const yearLabel = new Date().getFullYear() + i;

      // Employer super contributions
      const employerContrib = currentSalary * (superRate / 100);
      
      // Personal extra contribution
      const personalContrib = i === 0 ? 0 : extraAnnual; // assume first year extra contributions starting now

      // Total incoming funds for the year (applied half-yearly on average for growth calculation)
      const inputs = employerContrib + personalContrib;
      
      // Calculate growth (using standard half-year compounding for mid-year contributions)
      const rate = annualGrowth / 100;
      const yearGrowth = (currentBalance * rate) + (inputs * (rate / 2));

      if (i > 0) {
        currentBalance = currentBalance + inputs + yearGrowth;
        totalEmployerPaid += employerContrib;
        totalPersonalPaid += personalContrib;
        totalEarnings += yearGrowth;
      }

      list.push({
        year: yearLabel,
        age: age,
        salary: Math.round(currentSalary),
        employerContrib: Math.round(i === 0 ? 0 : employerContrib),
        personalContrib: Math.round(i === 0 ? 0 : personalContrib),
        growth: Math.round(i === 0 ? 0 : yearGrowth),
        balance: Math.round(currentBalance)
      });

      // Grow salary for next year
      currentSalary = currentSalary * (1 + salaryGrowth / 100);
    }

    return {
      table: list,
      totalEmployerPaid: Math.round(totalEmployerPaid),
      totalPersonalPaid: Math.round(totalPersonalPaid),
      totalEarnings: Math.round(totalEarnings),
      finalBalance: Math.round(currentBalance)
    };
  }, [currentAge, retirementAge, annualSalary, currentSuperBalance, superRate, annualGrowth, extraContribution, extraContribFreq, salaryGrowth]);

  // Providers Directory Data
  const superProviders = [
    {
      name: "AustralianSuper",
      phone: "1300 300 273",
      intlPhone: "+61 3 8648 3900",
      type: "Industry Fund",
      rating: "5-Star Outstanding",
      website: "https://www.australiansuper.com"
    },
    {
      name: "Australian Retirement Trust (ART)",
      phone: "13 11 84",
      intlPhone: "+61 7 3333 7400",
      type: "Industry Fund",
      rating: "Top-Tier Merged",
      website: "https://www.australianretirementtrust.com.au"
    },
    {
      name: "REST Super",
      phone: "1300 300 778",
      intlPhone: "+61 2 9086 6300",
      type: "Industry (Retail/General)",
      rating: "Low Fees Leader",
      website: "https://www.rest.com.au"
    },
    {
      name: "Hostplus",
      phone: "1300 467 875",
      intlPhone: "+61 3 8636 7777",
      type: "Industry (Hospitality)",
      rating: "High Growth Leader",
      website: "https://www.hostplus.com.au"
    },
    {
      name: "Aware Super",
      phone: "1300 650 873",
      intlPhone: "+61 2 9238 5555",
      type: "Industry (Public Sector)",
      rating: "Top Balanced Fund",
      website: "https://www.aware.com.au"
    },
    {
      name: "HESTA",
      phone: "1800 813 327",
      intlPhone: "+61 3 8660 1600",
      type: "Industry (Health & Community)",
      rating: "Ethical Investment Care",
      website: "https://www.hesta.com.au"
    },
    {
      name: "Cbus Super",
      phone: "1300 361 787",
      intlPhone: "+61 3 9918 1400",
      type: "Industry (Construction)",
      rating: "Strong Property Portfolio",
      website: "https://www.cbussuper.com.au"
    },
    {
      name: "UniSuper",
      phone: "1800 331 685",
      intlPhone: "+61 3 8831 6100",
      type: "Industry (Higher Ed & Research)",
      rating: "Outstanding Value",
      website: "https://www.unisuper.com.au"
    }
  ];

  // Quick info helpers for Indigenous & Young Workers
  const guides = [
    {
      title: "Indigenous Superannuation Rights",
      icon: "HeartHandshake",
      color: "border-red-500/20 bg-red-500/5",
      badgeColor: "bg-red-500 text-white",
      badgeText: "FIRST NATIONS SUPPORT",
      points: [
        "Abolishment of the $450 threshold: You are legally entitled to employer super contributions on every dollar earned, regardless of hours or monthly salary.",
        "Indigenous Helpline: The Australian Taxation Office (ATO) operates a direct First Nations information line on 13 10 30 to help locate lost superannuation accounts or consolidate multiple funds.",
        "Superannuation Estate Planning: Under traditional kinship systems, nominating binding death beneficiaries is critical to ensure super benefits are distributed in accordance with your wishes."
      ]
    },
    {
      title: "Young Worker Protection Standards",
      icon: "UserCheck",
      color: "border-sky-500/20 bg-sky-500/5",
      badgeColor: "bg-sky-500 text-black",
      badgeText: "YOUTH RIGHTS",
      points: [
        "Under-18 Work Rule: If you are under 18 years of age, you are entitled to superannuation contributions if you work more than 30 hours in a given week, regardless of salary amount.",
        "Automatic Insurance Caution: Under Australian laws, super funds cannot automatically charge you for life insurance if you are under 25 or your balance is under $6,000, unless you opt-in.",
        "Co-contribution Scheme: If you earn low-to-middle income and make voluntary after-tax contributions, the government may match up to 50% (maximum $500 bonus) into your account."
      ]
    },
    {
      title: "Superannuation Guarantee (SG) Laws",
      icon: "Scale",
      color: "border-amber-500/20 bg-amber-500/5",
      badgeColor: "bg-amber-500 text-black",
      badgeText: "ALL INDUSTRIES COMPLIANCE",
      points: [
        "Statutory Rate Increase: The current compulsory Super Guarantee (SG) rate is 12% of ordinary time earnings, protecting retirement growth across all service sectors.",
        "Quarterly Payment Dates: Employers must deposit superannuation into your fund at least quarterly (28 days after each quarter). Unpaid super is a direct breach of employment safety conditions.",
        "Tax Deductions on Personal Contributions: Self-employed individuals, contractors, and employees can claim a full personal income tax deduction on voluntary super contributions up to the $30,000 annual concessional cap."
      ]
    }
  ];

  const chartYears = projections.table ? projections.table.filter((_, idx) => idx % Math.max(1, Math.floor(projections.table.length / 6)) === 0 || idx === projections.table.length - 1) : [];

  return (
    <div className="space-y-8">
      {/* Page Title & Insight */}
      <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-white/5 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 opacity-5 transform translate-x-12 -translate-y-12">
          <LucideIcon name="TrendingUp" size={320} />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
            Financial Safety and Future Planning
          </span>
          <h1 className="font-sans font-light text-2xl sm:text-3.5xl tracking-tight leading-tight">
            Superannuation & <span className="text-amber-500 font-bold">Savings Hub</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
            WHS legislation is built around employee wellbeing—including long-term financial security. Calculate your compounding superannuation, explore Australian super funds, and understand statutory compliance rules tailored for Young Workers, Indigenous Employees, and All Industry sectors.
          </p>
        </div>
      </div>

      {/* Main Grid: Calculator Inputs vs. Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Calculator Inputs */}
        <div className="lg:col-span-5 bg-[#16161A] border border-white/5 rounded-3xl p-5 sm:p-6 space-y-5 h-fit shadow-xl">
          <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
            <LucideIcon name="Settings" className="text-amber-500" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">Projection Settings</h2>
          </div>

          <div className="space-y-4 font-sans text-xs">
            {/* Age Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <span>Current Age</span>
                  <span className="text-amber-500 font-mono">({currentAge} yrs)</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="64"
                  value={currentAge}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setCurrentAge(val);
                    if (val >= retirementAge) setRetirementAge(val + 5);
                  }}
                  className="w-full accent-amber-500 bg-[#1A1A1F] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <span>Target Retirement</span>
                  <span className="text-amber-500 font-mono">({retirementAge} yrs)</span>
                </label>
                <input
                  type="range"
                  min={currentAge + 1}
                  max="75"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-[#1A1A1F] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Income Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 font-semibold">Annual Income ($ AUD)</label>
                <span className="text-white font-mono bg-[#1A1A1F] px-2 py-0.5 rounded border border-white/5 font-semibold text-[10px]">
                  ${annualSalary.toLocaleString()} / yr
                </span>
              </div>
              <input
                type="number"
                value={annualSalary}
                onChange={(e) => setAnnualSalary(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#1A1A1F] border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 text-xs font-semibold"
                placeholder="e.g. 65000"
              />
            </div>

            {/* Current Super Balance */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 font-semibold">Current Super Balance ($)</label>
                <span className="text-white font-mono bg-[#1A1A1F] px-2 py-0.5 rounded border border-white/5 font-semibold text-[10px]">
                  ${currentSuperBalance.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                value={currentSuperBalance}
                onChange={(e) => setCurrentSuperBalance(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#1A1A1F] border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 text-xs font-semibold"
                placeholder="e.g. 5000"
              />
            </div>

            {/* Contribution Rates & Growth Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Employer Super Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={superRate}
                  onChange={(e) => setSuperRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#1A1A1F] border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-500 leading-tight">Compulsory 12% rate applies from 1 July 2025.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Assumed Fund Growth (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={annualGrowth}
                  onChange={(e) => setAnnualGrowth(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#1A1A1F] border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-500 leading-tight">Average historical net return (Balanced Fund).</p>
              </div>
            </div>

            {/* Extra Personal Voluntary Contributions */}
            <div className="border-t border-white/5 pt-4 space-y-3.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold flex items-center gap-1">
                  <LucideIcon name="Sparkles" size={13} className="text-amber-500" />
                  <span>Voluntary Contributions</span>
                </label>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setExtraContribFreq("weekly")}
                    className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase cursor-pointer border transition-all ${
                      extraContribFreq === "weekly"
                        ? "bg-amber-500/25 border-amber-500/50 text-amber-400"
                        : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setExtraContribFreq("monthly")}
                    className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase cursor-pointer border transition-all ${
                      extraContribFreq === "monthly"
                        ? "bg-amber-500/25 border-amber-500/50 text-amber-400"
                        : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Payment Amount ($)</label>
                  <input
                    type="number"
                    value={extraContribution}
                    onChange={(e) => setExtraContribution(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#1A1A1F] border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 text-xs font-semibold"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Wage Annual Rise (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={salaryGrowth}
                    onChange={(e) => setSalaryGrowth(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#1A1A1F] border border-white/10 text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Projections Visual Summary */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {/* Main Key metrics cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#16161A] border border-white/5 rounded-2xl p-4 text-center shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Final Balance</span>
              <span className="text-xl font-bold font-sans text-amber-400 tracking-tight block">
                ${projections.finalBalance?.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">At Age {retirementAge}</span>
            </div>

            <div className="bg-[#16161A] border border-white/5 rounded-2xl p-4 text-center shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Employer Paid</span>
              <span className="text-xl font-bold font-sans text-slate-300 tracking-tight block">
                ${projections.totalEmployerPaid?.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Compulsory deposits</span>
            </div>

            <div className="bg-[#16161A] border border-white/5 rounded-2xl p-4 text-center shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Your Contribution</span>
              <span className="text-xl font-bold font-sans text-slate-300 tracking-tight block">
                ${projections.totalPersonalPaid?.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Voluntary deposits</span>
            </div>

            <div className="bg-[#16161A] border border-white/5 rounded-2xl p-4 text-center shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">Compounded Gain</span>
              <span className="text-xl font-bold font-sans text-emerald-400 tracking-tight block">
                ${projections.totalEarnings?.toLocaleString()}
              </span>
              <span className="text-[9px] text-emerald-500/70 font-mono mt-0.5 block">Accumulated earnings</span>
            </div>
          </div>

          {/* Visual Bar chart (Custom Pure SVG & CSS stacked chart) */}
          <div className="bg-[#16161A] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl flex-grow flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <LucideIcon name="LineChart" className="text-amber-500" size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">Compounding Interest Projection Growth</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Compounding over {retirementAge - currentAge} Years</span>
            </div>

            {/* Stacked Bar Graphics */}
            <div className="py-4">
              <div className="h-44 sm:h-52 flex items-end justify-between gap-2.5 sm:gap-4 px-2 select-none">
                {chartYears.map((d, idx) => {
                  const maxBal = projections.finalBalance || 1;
                  const employerPct = (d.employerContrib / maxBal) * 100;
                  const personalPct = (d.personalContrib / maxBal) * 100;
                  const growthPct = (d.growth / maxBal) * 100;
                  const remainingPct = 100 - (employerPct + personalPct + growthPct);

                  // Calculate proportional height relative to final balance
                  const scaleFactor = d.balance / maxBal;
                  const totalBarHeight = Math.max(12, scaleFactor * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 bg-[#0F0F12] border border-white/10 p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 w-44 font-sans text-[10px] space-y-1">
                        <p className="font-bold text-white mb-1">Year {d.year} (Age {d.age})</p>
                        <div className="flex justify-between text-slate-400">
                          <span>Salary:</span>
                          <span className="font-mono text-white">${d.salary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                          <span>Super balance:</span>
                          <span className="font-mono font-bold">${d.balance.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Bar Stack */}
                      <div className="w-full bg-white/5 rounded-lg flex flex-col justify-end overflow-hidden transition-all duration-300 group-hover:bg-white/10" style={{ height: `${totalBarHeight}%` }}>
                        {/* Gain */}
                        <div className="w-full bg-emerald-500 transition-colors" style={{ height: `${(d.growth / d.balance) * 100}%` }} title={`Compounding earnings: $${d.growth.toLocaleString()}`} />
                        {/* Personal contributions */}
                        <div className="w-full bg-sky-400" style={{ height: `${(d.personalContrib / d.balance) * 100}%` }} title={`Personal added: $${d.personalContrib.toLocaleString()}`} />
                        {/* Employer statutory */}
                        <div className="w-full bg-amber-500" style={{ height: `${(d.employerContrib / d.balance) * 100}%` }} title={`Employer super: $${d.employerContrib.toLocaleString()}`} />
                      </div>

                      {/* X Axis Labels */}
                      <span className="text-[9px] font-mono text-slate-500 mt-2 font-bold group-hover:text-amber-400 transition-colors">Age {d.age}</span>
                      <span className="text-[8px] font-mono text-slate-600 mt-0.5">{d.year}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-center items-center gap-6 mt-5 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>Employer Statutory (12%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-sky-400" />
                  <span>Voluntary Contributions</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span>Investment Growth / Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Guides: Indigenous, Youth & Compliance */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 px-1">
          <LucideIcon name="FileText" className="text-amber-500" size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white">Australian Superannuation Guideline Manual</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide, idx) => (
            <div key={idx} className={`border ${guide.color} rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono uppercase font-black px-2.5 py-1 rounded-full ${guide.badgeColor}`}>
                    {guide.badgeText}
                  </span>
                  <div className="text-amber-500 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <LucideIcon name={guide.icon} size={15} />
                  </div>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">{guide.title}</h3>
                <ul className="space-y-3">
                  {guide.points.map((pt, pIdx) => {
                    const [boldText, restText] = pt.split(":");
                    return (
                      <li key={pIdx} className="text-xs text-slate-400 leading-relaxed list-disc list-inside">
                        <strong className="text-slate-200">{boldText}:</strong>{restText}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Australian Superannuation Providers Directory */}
      <div className="bg-[#16161A] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <LucideIcon name="PhoneCall" className="text-amber-500" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">Australian Superannuation Providers Directory</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Contact directly for Consolidation or Helpline support</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-3xl">
          Consolidating your accounts is one of the most effective ways to prevent multiple set-up fees from eroding your savings. Keep your contact details up to date with your selected provider, and review fund insurance charges periodically.
        </p>

        {/* Directory Cards (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {superProviders.map((provider) => (
            <div key={provider.name} className="bg-[#1D1D24] border border-white/5 hover:border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-white font-sans">{provider.name}</h4>
                  <span className="text-[9px] font-mono text-slate-500 bg-black/30 px-1.5 py-0.5 rounded uppercase font-semibold">
                    {provider.type}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-semibold text-amber-500 block">
                  🏆 {provider.rating}
                </span>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                  <span className="flex items-center gap-1">
                    <LucideIcon name="Phone" size={10} className="text-amber-400" />
                    <span>In Australia:</span>
                  </span>
                  <a href={`tel:${provider.phone.replace(/\s+/g, "")}`} className="font-bold text-slate-200 hover:text-amber-500 transition-colors">
                    {provider.phone}
                  </a>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                  <span className="flex items-center gap-1">
                    <LucideIcon name="Globe" size={10} className="text-slate-500" />
                    <span>Website:</span>
                  </span>
                  <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-amber-500 underline transition-colors">
                    {provider.website.replace("https://www.", "")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Savings Projection Table */}
      <div className="bg-[#16161A] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <LucideIcon name="Table" className="text-amber-500" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">Compound Interest Projection Table</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-amber-500/10 text-amber-500 font-semibold px-2 py-0.5 rounded">
            Age {currentAge} to {retirementAge}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">Year</th>
                <th className="py-3 px-3 text-center">Age</th>
                <th className="py-3 px-3 text-right">Est. Salary</th>
                <th className="py-3 px-3 text-right">Employer Super ({superRate}%)</th>
                <th className="py-3 px-3 text-right">Your Contribution</th>
                <th className="py-3 px-3 text-right">Growth Gains ({annualGrowth}%)</th>
                <th className="py-3 px-3 text-right text-amber-400 font-bold">End Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-300">
              {projections.table?.map((row) => (
                <tr key={row.year} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-400">{row.year}</td>
                  <td className="py-2.5 px-3 text-center text-slate-200">{row.age}</td>
                  <td className="py-2.5 px-3 text-right">${row.salary.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">${row.employerContrib.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">${row.personalContrib.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-500">${row.growth.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-bold">${row.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
