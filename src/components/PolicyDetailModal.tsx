import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Calendar, User, FileText, Settings, ShieldAlert, Sparkles, 
  RefreshCw, CheckCircle, ClipboardList, History, Paperclip, 
  AlertTriangle, FileCode, Check
} from "lucide-react";
import { Policy, AIAnalysisResult } from "../types";

interface PolicyDetailModalProps {
  policyId: string | null;
  policies: Policy[];
  onClose: () => void;
  onSaveAIAnalysis: (policyId: string, analysis: AIAnalysisResult) => void;
  userRole?: 'admin' | 'user';
}

export default function PolicyDetailModal({ 
  policyId, 
  policies, 
  onClose, 
  onSaveAIAnalysis,
  userRole = 'admin'
}: PolicyDetailModalProps) {
  const policy = policies.find(p => p.id === policyId);
  const [activeTab, setActiveTab] = useState<"info" | "sop" | "ai" | "history">("info");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedQR, setZoomedQR] = useState<string | null>(null);

  if (!policy) return null;

  const coverColor = policy.coverColor || "#7B337E";
  const hasAIReport = !!policy.aiAnalysis;

  const triggerSinglePolicyAudit = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: policy.title,
          department: policy.department,
          category: policy.category,
          description: policy.description,
          textContent: policy.description
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Compliance Engine returned an error response.");
      }
      onSaveAIAnalysis(policy.id, data);
    } catch (err: any) {
      setError(err.message || "Failed to contact compliance server.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer Box */}
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-full max-w-2xl h-full border-l border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl flex flex-col z-10"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">{policy.code} &bull; Version {policy.version}</span>
            <h3 className="font-black text-sm text-foreground truncate max-w-sm">{policy.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider ${
              policy.status === 'Draft' ? 'border-zinc-800 text-zinc-400 bg-zinc-900/40' :
              policy.status === 'Under Review' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
              policy.status === 'Approved' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
              policy.status === 'Archived' ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5' :
              'border-rose-500/20 text-rose-400 bg-rose-500/5'
            }`}>
              {policy.status}
            </span>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-panel)]/30 text-xs text-muted-foreground font-semibold">
          {[
            { id: "info", name: "Policy Information", icon: FileText },
            { id: "sop", name: "Procedures & Forms", icon: ClipboardList },
            { id: "ai", name: "AI Compliance Audit", icon: Sparkles },
            { id: "history", name: "Audit Trail", icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 border-b-2 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === tab.id ? 'border-emerald-600 text-foreground bg-emerald-500/[0.03]' : 'border-transparent hover:text-foreground'}`}
            >
              <tab.icon className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* 1. Policy Info Tab */}
            {activeTab === "info" && (
              <motion.div 
                key="info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* 3D-ish Book render block */}
                <div className="py-6 border border-zinc-900 bg-zinc-950 rounded-2xl flex items-center justify-center" style={{ background: `${coverColor}06` }}>
                  <div className="w-[150px] h-[190px] rounded-r-lg shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 text-white" style={{ backgroundColor: coverColor }}>
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/15 shadow-inner" />
                    
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{policy.department}</span>
                      <h4 className="text-xs font-black line-clamp-3 leading-snug tracking-tight text-white">{policy.coverTitle || policy.title}</h4>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-white/20 pt-2 mt-auto text-[9px] font-mono opacity-80">
                      <span>{policy.year}</span>
                      <span>v{policy.version}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/[0.08] pointer-events-none" />
                  </div>
                </div>

                {/* OneDrive Connection Section */}
                {policy.oneDriveLink && (
                  <div className="p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                          OneDrive Approved Document Track
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          This policy is connected to and tracked from an approved OneDrive file link.
                        </p>
                      </div>
                      <a 
                        href={policy.oneDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>Open Document</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                      </a>
                    </div>

                    {/* QR Code Scan Integration Block */}
                    <div className="border-t border-indigo-500/10 pt-4 flex flex-col sm:flex-row items-center gap-4 bg-indigo-950/25 p-3.5 rounded-xl border border-indigo-500/5">
                      <div 
                        onClick={() => setZoomedQR(policy.oneDriveLink || null)}
                        className="relative group shrink-0 bg-white p-2 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-zoom-in"
                        title="Click to zoom scan view"
                      >
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(policy.oneDriveLink)}`} 
                          alt="OneDrive QR Link" 
                          referrerPolicy="no-referrer"
                          className="w-[100px] h-[100px] object-contain rounded-lg block"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left flex-1">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h5 className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">Mobile QR Quick-Scan</h5>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground leading-normal max-w-md">
                          Scan this code with a phone camera to quickly pull up the active OneDrive document trace on mobile without typing credentials.
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                          <a 
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(policy.oneDriveLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            Get High-Res QR Code Image
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 border border-slate-200/10 dark:border-white/10 rounded-xl space-y-1 glass-card">
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Department</span>
                    <span className="text-foreground font-bold block">{policy.department}</span>
                  </div>
                  <div className="p-3.5 border border-slate-200/10 dark:border-white/10 rounded-xl space-y-1 glass-card">
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Category Domain</span>
                    <span className="text-foreground font-bold block">{policy.category}</span>
                  </div>
                  <div className="p-3.5 border border-slate-200/10 dark:border-white/10 rounded-xl space-y-1 glass-card">
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Sponsor / Owner</span>
                    <span className="text-foreground font-bold block">{policy.owner}</span>
                  </div>
                  <div className="p-3.5 border border-slate-200/10 dark:border-white/10 rounded-xl space-y-1 glass-card">
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Effective Compliance Date</span>
                    <span className="text-foreground font-bold block font-mono">{policy.effectiveDate || 'N/A'}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-foreground">Policy Mandate Description</h4>
                  <p className="text-muted-foreground leading-relaxed font-sans">{policy.description}</p>
                </div>

                {/* Document attachments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-emerald-500" />
                    Attached Official Documents
                  </h4>
                  {policy.documents && policy.documents.length > 0 ? (
                    <div className="space-y-2">
                      {policy.documents.map((doc, idx) => (
                        <div key={idx} className="p-3 border border-[var(--border-color)] rounded-xl flex items-center justify-between text-xs bg-[var(--bg-panel)]/40">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4.5 h-4.5 text-emerald-500" />
                            <span className="font-bold text-foreground truncate">{doc.documentName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{doc.uploadDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-zinc-900 rounded-xl text-center text-xs text-muted-foreground">
                      No files uploaded. Draft is entirely metadata.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 2. SOP & Forms Tab */}
            {activeTab === "sop" && (
              <motion.div 
                key="sop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* SOP lists */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                    <ClipboardList className="w-4.5 h-4.5 text-emerald-500" />
                    Linked SOP Workflows
                  </h4>

                  {policy.procedures && policy.procedures.length > 0 ? (
                    <div className="space-y-4">
                      {policy.procedures.map((proc) => (
                        <div key={proc.id} className="p-4 border border-[var(--border-color)] rounded-xl space-y-2.5 text-xs bg-[var(--bg-panel)]/40">
                          <h5 className="font-bold text-foreground">{proc.title}</h5>
                          <p className="text-muted-foreground">{proc.description}</p>
                          <div className="space-y-2 pt-1">
                            {proc.steps.map((s, idx) => (
                              <div key={idx} className="flex gap-2.5 items-start">
                                <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">{idx+1}</span>
                                <span className="text-muted-foreground leading-relaxed">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-zinc-900 rounded-xl">No linked procedures yet.</div>
                  )}
                </div>

                {/* Forms lists */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                    <FileCode className="w-4.5 h-4.5 text-emerald-500" />
                    Linked Compliance Forms
                  </h4>

                  {policy.forms && policy.forms.length > 0 ? (
                    <div className="space-y-4">
                      {policy.forms.map((f) => (
                        <div key={f.id} className="p-4 border border-[var(--border-color)] rounded-xl space-y-2.5 text-xs bg-[var(--bg-panel)]/40">
                          <div>
                            <h5 className="font-bold text-foreground">{f.name}</h5>
                            <span className="text-[10px] text-muted-foreground">{f.description}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            {f.fields.map((field, idx) => (
                              <div key={idx} className="p-2 border border-zinc-900 bg-zinc-950 rounded-lg">
                                <span className="text-[10px] text-muted-foreground font-semibold">{field}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-zinc-900 rounded-xl">No linked forms yet.</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. AI Compliance Report Tab */}
            {activeTab === "ai" && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {analyzing ? (
                  /* Loading view during audit */
                  <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">Running AI Policy Integrity Analysis</h4>
                      <p className="text-[10px] text-muted-foreground">Checking legal safeguarding, evaluating structural risk indexes, and grading clarity...</p>
                    </div>
                  </div>
                ) : error ? (
                  /* Error audit */
                  <div className="p-4 border border-rose-500/10 bg-rose-500/5 rounded-xl text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-foreground">Auditing Interface Halted</h4>
                      <p className="text-rose-400 font-semibold">{error}</p>
                    </div>
                    <button onClick={triggerSinglePolicyAudit} className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-xs font-bold">Retry Analysis</button>
                  </div>
                ) : hasAIReport ? (
                  /* Renders actual analysis if exists */
                  <div className="space-y-5 text-xs text-muted-foreground">
                    <div className="p-4 border border-slate-200/10 dark:border-white/10 rounded-xl flex items-center justify-between glass-card">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Risk Index score</span>
                        <div className="text-xl font-black text-foreground font-mono">{policy.aiAnalysis?.riskScore}/100</div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Readability Clarity</span>
                        <div className="text-xl font-black text-foreground font-mono">{policy.aiAnalysis?.readability}%</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wide">Auditor Executive Brief</h4>
                      <p className="leading-relaxed leading-snug font-sans">{policy.aiAnalysis?.summary}</p>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground uppercase text-[10px] tracking-wide">Key Improvements recommendations</h4>
                      <ul className="space-y-1.5 leading-relaxed">
                        {policy.aiAnalysis?.recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2 text-muted-foreground font-sans">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Simple compliance checklist table */}
                    <div className="border border-slate-200/10 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-zinc-800 glass-panel">
                      {policy.aiAnalysis?.checklist.map((item, idx) => (
                        <div key={idx} className="p-3.5 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-foreground text-xs">{item.rule}</h5>
                            <span className={`text-[8px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                              item.status === 'Compliant' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' :
                              item.status === 'Warning' ? 'text-amber-400 bg-amber-500/5 border-amber-500/10' :
                              'text-rose-400 bg-rose-500/5 border-rose-500/10'
                            }`}>{item.status}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed leading-normal">{item.details}</p>
                          {item.suggestion && item.suggestion !== "N/A" && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400"><span className="font-bold">SOP correction:</span> {item.suggestion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* If no audit yet, provide easy run button */
                  <div className="p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl space-y-4 bg-[var(--bg-panel)]/30">
                    <Sparkles className="w-8 h-8 text-emerald-500 opacity-60 mx-auto" />
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="font-bold text-xs text-foreground">Policy Auditing Available</h4>
                      <p className="text-[11px] text-muted-foreground">Gemini can analyze this document draft against corporate governance standard templates to identify legal gaps, grade readability, and write recommendations.</p>
                    </div>
                    {userRole === 'admin' ? (
                      <button 
                        onClick={triggerSinglePolicyAudit}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Run AI Audit Report Now
                      </button>
                    ) : (
                      <p className="text-amber-400/80 text-[11px] font-semibold bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-xl max-w-xs mx-auto">
                        No compliance audit has been run yet. Please contact an Administrator to initiate auditing.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. History / Timeline Tab */}
            {activeTab === "history" && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-color)]">
                  <div className="relative before:absolute before:left-[-21px] before:top-1.5 before:w-2.5 before:h-2.5 before:rounded-full before:bg-emerald-600 before:border-2 before:border-[var(--bg-card)] text-xs">
                    <span className="font-mono text-muted-foreground">{new Date(policy.updatedDate).toLocaleDateString()}</span>
                    <h4 className="font-bold text-foreground mt-0.5">Policy Modified & Audit Saved</h4>
                    <p className="text-muted-foreground leading-relaxed mt-0.5">Governance catalog version {policy.version} compiled with active documents.</p>
                    <span className="text-[10px] text-muted-foreground font-semibold block mt-1">Author: VP Compliance</span>
                  </div>

                  <div className="relative before:absolute before:left-[-21px] before:top-1.5 before:w-2.5 before:h-2.5 before:rounded-full before:bg-zinc-800 before:border-2 before:border-zinc-950 text-xs">
                    <span className="font-mono text-muted-foreground">{new Date(policy.createdDate).toLocaleDateString()}</span>
                    <h4 className="font-bold text-foreground mt-0.5">Draft Initiated</h4>
                    <p className="text-muted-foreground leading-relaxed mt-0.5">Initial layout parameters defined and stored in database.</p>
                    <span className="text-[10px] text-zinc-500 font-semibold block mt-1">System Action</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Full-Screen Zoomed QR Code Overlay */}
      <AnimatePresence>
        {zoomedQR && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedQR(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative bg-white p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 border border-indigo-500/15 z-10"
            >
              <button 
                onClick={() => setZoomedQR(null)}
                className="absolute top-4 right-4 p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full cursor-pointer transition-all"
                title="Close Zoomed View"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider line-clamp-2 leading-tight">
                  {policy.title}
                </h4>
                <p className="text-[10px] text-zinc-500">Scan code with mobile camera to browse directly</p>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(zoomedQR)}`} 
                  alt="Zoomed QR Code" 
                  referrerPolicy="no-referrer"
                  className="w-[200px] h-[200px] object-contain rounded-lg block"
                />
              </div>

              <div className="space-y-2 w-full text-xs text-zinc-700">
                <span className="font-mono text-[9px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100 inline-block truncate max-w-full">
                  {zoomedQR}
                </span>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a 
                    href={zoomedQR}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    Open Link
                  </a>
                  <a 
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(zoomedQR)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    Download QR
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
