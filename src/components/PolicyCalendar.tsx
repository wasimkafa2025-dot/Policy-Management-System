import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronDown, ChevronRight, Search, 
  Filter, BookOpen, Shield, Tag, Clock, ArrowRight, ExternalLink,
  Info, Sparkles, Layers, List, Grid
} from "lucide-react";
import { Policy } from "../types";

interface PolicyCalendarProps {
  policies: Policy[];
  onSelectPolicy?: (policy: Policy) => void;
}

export default function PolicyCalendar({ policies, onSelectPolicy }: PolicyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to normalize and parse dates from policy.effectiveDate
  const parsePolicyDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    // Try YYYY-MM-DD
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10),
        formatted: `${match[1]}-${match[2]}-${match[3]}`
      };
    }
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();
      const mm = String(m + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return {
        year: y,
        month: m,
        day,
        formatted: `${y}-${mm}-${dd}`
      };
    }
    return null;
  };

  // Filter policies based on search & dept
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch = !searchTerm || 
        (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === "All" || p.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [policies, searchTerm, selectedDept]);

  // Map of date string "YYYY-MM-DD" -> array of policies
  const policyDateMap = useMemo(() => {
    const map: Record<string, Policy[]> = {};
    filteredPolicies.forEach(p => {
      const parsed = parsePolicyDate(p.effectiveDate);
      if (parsed) {
        if (!map[parsed.formatted]) {
          map[parsed.formatted] = [];
        }
        map[parsed.formatted].push(p);
      }
    });
    return map;
  }, [filteredPolicies]);

  // Total policies released this month
  const currentMonthPoliciesCount = useMemo(() => {
    let count = 0;
    filteredPolicies.forEach(p => {
      const parsed = parsePolicyDate(p.effectiveDate);
      if (parsed && parsed.year === year && parsed.month === month) {
        count++;
      }
    });
    return count;
  }, [filteredPolicies, year, month]);

  // Calendar Grid Calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const departments = ["All", "HR", "Finance", "Operations", "Academics", "IT", "Administration"];

  // Selected Day's policies
  const selectedDayPolicies = selectedDate ? (policyDateMap[selectedDate] || []) : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[var(--accent-bg)]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                Policy Release Calendar
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-xl">
              Chronological schedule of organizational policies, effective release dates, and version announcements.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-sm font-bold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Month Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-sm font-bold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Release List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Month Switcher & Filters */}
      <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--purple-glow)] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--purple-glow)] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-[var(--text-primary)] min-w-[160px]">
            {monthNames[month]} <span className="text-[var(--accent-bg)]">{year}</span>
          </h3>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] hover:bg-[var(--accent-bg)]/10 hover:border-[var(--accent-bg)]/40 text-[var(--text-primary)] transition-all cursor-pointer"
          >
            Today
          </button>

          <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-input)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
            {currentMonthPoliciesCount} Release{currentMonthPoliciesCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search & Department Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter by policy name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-bg)] transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] appearance-none cursor-pointer"
            >
              {departments.map(dept => (
                <option key={dept} value={dept} className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                  {dept === "All" ? "All Departments" : dept}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "grid" ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md overflow-hidden">
          {/* Calendar Days Header */}
          <div className="grid grid-cols-7 border-b border-[var(--border-color)] bg-[var(--bg-panel)] text-center py-2.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className={idx === 0 || idx === 6 ? "text-amber-500/80" : ""}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr gap-px bg-[var(--border-color)]/30">
            {/* Previous Month Cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
              const prevDayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
              return (
                <div 
                  key={`prev-${idx}`}
                  className="min-h-[100px] p-2 bg-[var(--bg-panel)]/30 text-[var(--text-muted)]/40 text-xs"
                >
                  <span className="font-mono text-[11px]">{prevDayNum}</span>
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const mm = String(month + 1).padStart(2, "0");
              const dd = String(dayNum).padStart(2, "0");
              const dateKey = `${year}-${mm}-${dd}`;
              
              const dayPolicies = policyDateMap[dateKey] || [];
              const isToday = dateKey === todayStr;
              const isSelected = dateKey === selectedDate;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (dayPolicies.length > 0) {
                      setSelectedDate(isSelected ? null : dateKey);
                    }
                  }}
                  className={`min-h-[110px] sm:min-h-[120px] p-2 bg-[var(--bg-card)] transition-all flex flex-col justify-between group ${
                    dayPolicies.length > 0 ? "cursor-pointer hover:bg-[var(--purple-glow)]" : ""
                  } ${isToday ? "ring-2 ring-[var(--accent-bg)] ring-inset bg-[var(--accent-bg)]/5" : ""} ${
                    isSelected ? "bg-[var(--accent-bg)]/15 border-2 border-[var(--accent-bg)]" : ""
                  }`}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      isToday 
                        ? "bg-[var(--accent-bg)] text-[var(--accent-text)]" 
                        : "text-[var(--text-primary)]"
                    }`}>
                      {dayNum}
                    </span>

                    {dayPolicies.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-bg)]/20 text-[var(--accent-bg)] border border-[var(--accent-bg)]/30 font-mono">
                        {dayPolicies.length}
                      </span>
                    )}
                  </div>

                  {/* Policy Release Badges */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {dayPolicies.map(p => (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPolicy) onSelectPolicy(p);
                        }}
                        className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] hover:border-[var(--accent-bg)] text-left transition-all cursor-pointer group/item"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[9px] font-bold text-[var(--accent-bg)] truncate">
                            {p.code}
                          </span>
                          <span className="text-[8px] font-bold px-1 rounded bg-[var(--bg-input)] text-[var(--text-muted)] shrink-0">
                            {p.department}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-[var(--text-primary)] line-clamp-1 group-hover/item:text-[var(--accent-bg)] transition-colors">
                          {p.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Release List / Timeline View */
        <div className="space-y-3">
          {Object.keys(policyDateMap).length === 0 ? (
            <div className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl space-y-3">
              <Info className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                No policy releases recorded for the selected search or month.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Try clearing filters or switching to another month using the controls above.
              </p>
            </div>
          ) : (
            Object.keys(policyDateMap)
              .sort((a, b) => b.localeCompare(a))
              .map(dateKey => {
                const dayPols = policyDateMap[dateKey];
                return (
                  <div 
                    key={dateKey}
                    className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-color)]/50 pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--accent-bg)]" />
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          Release Date: {dateKey}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20">
                        {dayPols.length} Policy{dayPols.length !== 1 ? "ies" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dayPols.map(p => (
                        <div
                          key={p.id}
                          onClick={() => onSelectPolicy && onSelectPolicy(p)}
                          className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)]/60 hover:bg-[var(--bg-panel)] hover:border-[var(--accent-bg)] transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-[var(--accent-bg)] px-2 py-0.5 bg-[var(--bg-input)] rounded-md border border-[var(--border-color)]">
                                {p.code}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                {p.department}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-bg)] transition-colors">
                              {p.title}
                            </h4>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                              {p.description || "No description provided."}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] border-t border-[var(--border-color)]/30 pt-2">
                            <span>Owner: {p.owner || "Administration"}</span>
                            <span className="font-semibold text-[var(--accent-bg)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              View Details <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Selected Day Details Modal */}
      <AnimatePresence>
        {selectedDate && selectedDayPolicies.length > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg border border-[var(--border-color)] bg-[var(--bg-panel)] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20 rounded-xl">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">
                      Policies Released on {selectedDate}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {selectedDayPolicies.length} policy release record(s)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {selectedDayPolicies.map(p => (
                  <div 
                    key={p.id}
                    className="p-3.5 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--accent-bg)]">
                        {p.code}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {p.department}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--text-primary)]">
                      {p.title}
                    </h4>

                    {p.description && (
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                        {p.description}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Effective: {p.effectiveDate || selectedDate}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(null);
                          if (onSelectPolicy) onSelectPolicy(p);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Open Policy</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
