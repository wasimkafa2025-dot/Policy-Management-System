import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, FileText, Edit, Search, CheckCircle, Archive, 
  Trash2, FolderOpen, Calendar, Clock
} from "lucide-react";
import { Policy, AuditLog } from "../types";

interface DashboardProps {
  policies: Policy[];
  auditLogs: AuditLog[];
  onSelectPolicy: (id: string) => void;
  onNavigate: (page: string) => void;
}

export default function Dashboard({ policies, auditLogs, onSelectPolicy, onNavigate }: DashboardProps) {
  // Compute Stats
  const total = policies.length;
  const draft = policies.filter(p => p.status === 'Draft').length;
  const review = policies.filter(p => p.status === 'Under Review').length;
  const approved = policies.filter(p => p.status === 'Approved').length;
  const archived = policies.filter(p => p.status === 'Archived').length;
  const obsolete = policies.filter(p => p.status === 'Obsolete').length;

  // Department counts
  const departments: Record<string, number> = {};
  policies.forEach(p => {
    departments[p.department] = (departments[p.department] || 0) + 1;
  });

  // Year counts
  const years: Record<string, number> = {};
  policies.forEach(p => {
    if (p.year) {
      years[p.year] = (years[p.year] || 0) + 1;
    } else if (p.coverYear) {
      years[p.coverYear] = (years[p.coverYear] || 0) + 1;
    }
  });
  const sortedYears = Object.keys(years).sort();

  return (
    <div id="page-dashboard" className="space-y-6">
      {/* Dashboard Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-pulse-subtle" />
          Dashboard Overview
        </h1>
        <p className="text-xs text-muted-foreground">Governance alignment and document lifecycle statistics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { title: "Total Policies", val: total, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/15", icon: FileText },
          { title: "Draft", val: draft, color: "text-[#7B5948] bg-[#7B5948]/10 border-[#7B5948]/15", icon: Edit },
          { title: "Under Review", val: review, color: "text-amber-500 bg-amber-500/10 border-amber-500/15", icon: Search },
          { title: "Approved", val: approved, color: "text-emerald-500 bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle },
          { title: "Archived", val: archived, color: "text-amber-700 dark:text-amber-300 bg-amber-600/10 border-amber-600/15", icon: Archive },
          { title: "Obsolete", val: obsolete, color: "text-[#5E4336] bg-[#5E4336]/10 border-[#5E4336]/15", icon: Trash2 },
        ].map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div 
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-5 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl flex items-center gap-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-black text-foreground font-sans leading-none">{item.val}</span>
                <span className="text-xs text-muted-foreground mt-1 font-semibold truncate">{item.title}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policies by Department */}
        <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl flex flex-col justify-between min-h-[300px]">
          <div className="border-b border-[var(--border-color)] pb-3 mb-4">
            <h4 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              Policies by Department Group
            </h4>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {total > 0 ? (
              <div className="space-y-4">
                {/* Custom Interactive SVG Doughnut Chart */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="w-40 h-40 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-color)" strokeWidth="3.5" />
                      {(() => {
                        let accumulatedPercentage = 0;
                        const colors = ["#1E5A4D", "#7FAF7D", "#7B5948", "#E7D2B8", "#17463D", "#5E4336"];
                        return Object.entries(departments).map(([dept, count], idx) => {
                          const percentage = (count / total) * 100;
                          const strokeDasharray = `${percentage} ${100 - percentage}`;
                          const strokeDashoffset = 100 - accumulatedPercentage;
                          accumulatedPercentage += percentage;
                          return (
                            <circle 
                              key={dept}
                              cx="18" 
                              cy="18" 
                              r="15.915" 
                              fill="none" 
                              stroke={colors[idx % colors.length]} 
                              strokeWidth="4" 
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-1000 ease-out hover:stroke-[5px] cursor-pointer"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-foreground">{total}</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Policies</span>
                    </div>
                  </div>
                </div>

                {/* Legend Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-[var(--border-color)] pt-3">
                  {Object.entries(departments).map(([dept, count], idx) => {
                    const colors = ["bg-[#1E5A4D]", "bg-[#7FAF7D]", "bg-[#7B5948]", "bg-[#E7D2B8]", "bg-[#17463D]", "bg-[#5E4336]"];
                    return (
                      <div key={dept} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} shrink-0`} />
                        <span className="truncate max-w-[100px] text-foreground font-medium">{dept}</span>
                        <span className="ml-auto font-mono text-muted-foreground/80 font-semibold">{Math.round((count/total)*100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-zinc-500 text-xs py-16">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Policies by Year */}
        <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl flex flex-col justify-between min-h-[300px]">
          <div className="border-b border-[var(--border-color)] pb-3 mb-4">
            <h4 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              Policies by Year
            </h4>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {total > 0 && sortedYears.length > 0 ? (
              <div className="space-y-4">
                {/* Custom SVG Bar Chart */}
                <div className="h-40 flex items-end justify-between gap-3 px-2 py-2">
                  {sortedYears.map((year) => {
                    const count = years[year];
                    const maxVal = Math.max(...Object.values(years));
                    const pct = maxVal > 0 ? (count / maxVal) * 85 : 0;
                    return (
                      <div key={year} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {count} {count === 1 ? 'doc' : 'docs'}
                        </div>
                        <div className="w-full relative bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg overflow-hidden h-[100px]">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-800 to-emerald-600 rounded-lg transition-all duration-1000 ease-out group-hover:opacity-85"
                            style={{ height: `${Math.max(pct, 8)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground font-mono">{year}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-[10px] text-muted-foreground text-right border-t border-[var(--border-color)] pt-3">
                  Total cataloged span: <span className="text-foreground font-semibold">{sortedYears[0] || 'N/A'} - {sortedYears[sortedYears.length - 1] || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-zinc-500 text-xs py-16">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl">
        <div className="border-b border-[var(--border-color)] pb-3 mb-4">
          <h4 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            Recent Administrative Activity
          </h4>
        </div>

        <div>
          {auditLogs.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 border border-[var(--border-color)] bg-[var(--bg-panel)] rounded-xl flex items-start gap-3 hover:border-emerald-600/30 transition-all">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-foreground truncate">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {log.policyTitle && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Policy: <span className="underline cursor-pointer hover:text-emerald-500" onClick={() => log.policyId && onSelectPolicy(log.policyId)}>{log.policyTitle}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">{log.details}</p>
                    <div className="text-[10px] text-muted-foreground/85 font-semibold">Triggered by: {log.user}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-xs">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-semibold text-zinc-400">No recent activity found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
