import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Calendar, FileText, ShieldAlert, Sparkles, 
  RefreshCw, CheckCircle, Paperclip, AlertTriangle, Check
} from "lucide-react";
import QRCode from "qrcode";
import { Policy, AIAnalysisResult } from "../types";

interface PolicyDetailModalProps {
  policyId: string | null;
  policies: Policy[];
  onClose: () => void;
  onSaveAIAnalysis: (policyId: string, analysis: AIAnalysisResult) => void;
  onDeletePolicy?: (id: string) => void;
  userRole?: 'admin' | 'user';
}

export default function PolicyDetailModal({ 
  policyId, 
  policies, 
  onClose, 
  onSaveAIAnalysis,
  onDeletePolicy,
  userRole = 'admin'
}: PolicyDetailModalProps) {
  const policy = policies.find(p => p.id === policyId);
  const [activeTab, setActiveTab] = useState<"info" | "ai">("info");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedQR, setZoomedQR] = useState<string | null>(null);
  const [zoomedQrBase64, setZoomedQrBase64] = useState<string>("");
  const [detailDeleteConfirm, setDetailDeleteConfirm] = useState(false);
  const [qrType, setQrType] = useState<"app" | "onedrive">("app");
  const [qrBase64, setQrBase64] = useState<string>("");

  useEffect(() => {
    if (!policy) return;

    let targetUrl = window.location.origin + "?policy=" + policy.id;
    if (qrType === "onedrive" && policy.oneDriveLink) {
      targetUrl = policy.oneDriveLink;
    }

    QRCode.toDataURL(
      targetUrl,
      {
        width: 400,
        margin: 2,
        color: {
          dark: "#0a0a0c",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (err) {
          console.error("Failed to generate QR code:", err);
          return;
        }
        setQrBase64(url);
      }
    );
  }, [policy, qrType]);

  useEffect(() => {
    if (!zoomedQR) {
      setZoomedQrBase64("");
      return;
    }
    QRCode.toDataURL(
      zoomedQR,
      {
        width: 600,
        margin: 2,
        color: {
          dark: "#0a0a0c",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && url) {
          setZoomedQrBase64(url);
        }
      }
    );
  }, [zoomedQR]);

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
        className="relative w-full max-w-2xl h-full border-l bg-[var(--bg-card)] shadow-2xl flex flex-col z-10"
        style={{ borderLeftColor: coverColor }}
      >
        {/* Color Strip Indicator */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: coverColor }} />

        {/* Drawer Header */}
        <div className="p-5 border-b flex items-center justify-between bg-[var(--bg-card)]/90 sticky top-0 z-20 backdrop-blur-md" style={{ borderBottomColor: `${coverColor}20` }}>
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
        <div className="flex border-b bg-[var(--bg-panel)]/30 text-xs text-muted-foreground font-semibold" style={{ borderBottomColor: `${coverColor}15` }}>
          {[
            { id: "info", name: "Policy Information", icon: FileText },
            { id: "ai", name: "AI Compliance Audit", icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 border-b-2 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === tab.id ? 'text-foreground' : 'border-transparent hover:text-foreground'}`}
              style={{
                borderColor: activeTab === tab.id ? coverColor : 'transparent',
                backgroundColor: activeTab === tab.id ? `${coverColor}0c` : 'transparent'
              }}
            >
              <tab.icon className="w-4 h-4 shrink-0" style={{ color: activeTab === tab.id ? coverColor : undefined }} />
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
                <div className="py-6 border border-[var(--border-color)] bg-[var(--bg-panel)]/40 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${coverColor}12, ${coverColor}03)` }}>
                  <div className="relative group/book my-2" style={{ perspective: '1000px' }}>
                    {/* Silk Bookmark Ribbon */}
                    <div className="absolute bottom-[-6px] right-4 w-3 h-7 bg-gradient-to-b from-amber-400 to-amber-600 rounded-b shadow-md origin-top z-10 -rotate-3" />

                    {/* Page stack under */}
                    <div className="absolute top-1 bottom-1 w-[146px] rounded-r bg-slate-100 dark:bg-zinc-800 border-r border-y border-slate-300 dark:border-zinc-700 shadow-md" style={{ transform: 'rotateY(-8deg) rotateX(3deg) translateZ(-5px) translateX(6px)' }}>
                      <div className="absolute inset-y-0 right-0 w-3 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.06)_50%)] bg-[size:100%_4px] opacity-70 rounded-r" />
                    </div>

                    <div className="w-[148px] h-[192px] rounded-r-lg shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 text-white transition-all duration-300 border-r border-white/20" style={{ backgroundColor: coverColor, transform: 'rotateY(-10deg) rotateX(2deg) translateZ(0px)' }}>
                      {/* Spine Crease & Shading */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />
                      <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-amber-300/30" />
                      <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-black/20" />
                      
                      <div className="space-y-1.5 relative z-10 pl-1">
                        <span className="text-[8.5px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded text-amber-200 border border-amber-300/20 backdrop-blur-xs inline-block truncate max-w-[120px] shadow-2xs">
                          {policy.department}
                        </span>
                        <h4 className="text-xs font-black line-clamp-3 leading-snug tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-1">
                          {policy.coverTitle || policy.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-white/25 pt-2 mt-auto text-[9.5px] font-mono relative z-10 text-white/95 pl-1">
                        <span className="font-bold tracking-wider">{policy.code ? policy.code.replace(/^POL-/, 'WIS-POLICY-') : 'WIS-POLICY-1001'}</span>
                        <span className="bg-white/15 px-1.5 py-0.5 rounded text-[8.5px] font-sans font-bold text-amber-100">v{policy.version}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.05] to-white/[0.15] pointer-events-none" />
                    </div>
                  </div>
                </div>

                 {/* Unified QR Code Quick Share / Mobile Access Section */}
                 <div className="p-4 border rounded-2xl space-y-4 shadow-sm" style={{ backgroundColor: `${coverColor}05`, borderColor: `${coverColor}20` }}>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="space-y-1">
                       <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: coverColor }}>
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                           <rect x="7" y="7" width="3" height="3"/>
                           <rect x="14" y="7" width="3" height="3"/>
                           <rect x="7" y="14" width="3" height="3"/>
                         </svg>
                         Mobile Access & QR Share
                       </h4>
                       <p className="text-[11px] text-muted-foreground leading-normal">
                         Generate and scan a high-resolution, secure QR code to instantly pull up this policy on any mobile device or share the direct link.
                       </p>
                     </div>
                     {policy.oneDriveLink && (
                       <a 
                         href={policy.oneDriveLink}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="px-3 py-1.5 text-white font-bold text-[10px] rounded-lg flex items-center gap-1.5 shadow-lg transition-all cursor-pointer whitespace-nowrap hover:brightness-110 active:scale-95"
                         style={{ backgroundColor: coverColor }}
                       >
                         <span>OneDrive Source</span>
                         <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                       </a>
                     )}
                   </div>

                   {/* Toggle QR code source (only show tabs if OneDrive link exists) */}
                   {policy.oneDriveLink && (
                     <div className="flex gap-1.5 p-1 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)] text-xs">
                       <button
                         type="button"
                         onClick={() => setQrType("app")}
                         className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all cursor-pointer ${
                           qrType === "app" 
                             ? "bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm" 
                             : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                         }`}
                       >
                         App Deep-Link
                       </button>
                       <button
                         type="button"
                         onClick={() => setQrType("onedrive")}
                         className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all cursor-pointer ${
                           qrType === "onedrive" 
                             ? "bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm" 
                             : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                         }`}
                       >
                         OneDrive Original
                       </button>
                     </div>
                   )}

                   {/* QR Code Graphic and Options */}
                   <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl border bg-[var(--bg-input)]/45" style={{ borderColor: `${coverColor}15` }}>
                     <div 
                       onClick={() => {
                         const target = qrType === "onedrive" && policy.oneDriveLink ? policy.oneDriveLink : window.location.origin + "?policy=" + policy.id;
                         setZoomedQR(target);
                       }}
                       className="relative group shrink-0 bg-white p-2.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-zoom-in border border-zinc-200/5"
                       title="Click to zoom scan view"
                     >
                       {qrBase64 ? (
                         <img 
                           src={qrBase64} 
                           alt="Policy QR Code" 
                           className="w-[100px] h-[100px] object-contain rounded-lg block"
                         />
                       ) : (
                         <div className="w-[100px] h-[100px] flex items-center justify-center bg-zinc-50 rounded-lg">
                           <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                         <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                       </div>
                     </div>

                     <div className="space-y-1.5 text-center sm:text-left flex-1">
                       <div className="flex items-center justify-center sm:justify-start gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: coverColor }} />
                         <h5 className="text-[11px] font-black uppercase tracking-wider" style={{ color: coverColor }}>
                           {qrType === "app" ? "Mobile App Quick-Scan" : "OneDrive Document Link"}
                         </h5>
                       </div>
                       <p className="text-[10.5px] text-[var(--text-muted)] leading-normal max-w-md font-sans">
                         {qrType === "app" 
                           ? "Scan to open this specific policy detail drawer on your mobile device instantly. Includes automated guest credentials."
                           : "Scan to navigate directly to the official, unedited corporate OneDrive document for reading or printing."
                         }
                       </p>

                       <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                         {qrBase64 && (
                           <a 
                             href={qrBase64}
                             download={`policy_qr_${policy.code}.png`}
                             className="text-[10px] hover:underline font-bold cursor-pointer flex items-center gap-1 transition-colors hover:brightness-110"
                             style={{ color: coverColor }}
                           >
                             <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                             Download QR Image
                           </a>
                         )}

                         {qrType === "app" && (
                           <button 
                             type="button"
                             onClick={() => {
                               navigator.clipboard.writeText(window.location.origin + "?policy=" + policy.id);
                               alert("Deep link copied to clipboard!");
                             }}
                             className="text-[10px] hover:underline font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer bg-transparent border-none"
                           >
                             <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                             Copy Link
                           </button>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 border rounded-xl space-y-1 shadow-inner" style={{ backgroundColor: `${coverColor}06`, borderColor: `${coverColor}18` }}>
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Department</span>
                    <span className="text-foreground font-bold block">{policy.department}</span>
                  </div>
                  <div className="p-3.5 border rounded-xl space-y-1 shadow-inner" style={{ backgroundColor: `${coverColor}06`, borderColor: `${coverColor}18` }}>
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Category Domain</span>
                    <span className="text-foreground font-bold block">{policy.category}</span>
                  </div>
                  <div className="p-3.5 border rounded-xl space-y-1 shadow-inner" style={{ backgroundColor: `${coverColor}06`, borderColor: `${coverColor}18` }}>
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Sponsor / Owner</span>
                    <span className="text-foreground font-bold block">{policy.owner}</span>
                  </div>
                  <div className="p-3.5 border rounded-xl space-y-1 shadow-inner" style={{ backgroundColor: `${coverColor}06`, borderColor: `${coverColor}18` }}>
                    <span className="font-semibold text-muted-foreground uppercase text-[9px]">Effective Compliance Date</span>
                    <span className="text-foreground font-bold block font-mono">{policy.effectiveDate || 'N/A'}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-foreground" style={{ color: coverColor }}>Policy Mandate Description</h4>
                  <p className="text-muted-foreground leading-relaxed font-sans">{policy.description}</p>
                </div>

                {/* Document attachments */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2" style={{ color: coverColor }}>
                    <Paperclip className="w-4 h-4" style={{ color: coverColor }} />
                    Attached Official Documents
                  </h4>
                  {policy.documents && policy.documents.length > 0 ? (
                    <div className="space-y-2">
                      {policy.documents.map((doc, idx) => (
                        <div key={idx} className="p-3 border rounded-xl flex items-center justify-between text-xs bg-[var(--bg-panel)]/40" style={{ borderColor: `${coverColor}20` }}>
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4.5 h-4.5" style={{ color: coverColor }} />
                            <span className="font-bold text-foreground truncate">{doc.documentName}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{doc.uploadDate}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground" style={{ borderColor: `${coverColor}25` }}>
                      No files uploaded. Draft is entirely metadata.
                    </div>
                  )}
                </div>

                {/* Decommission/Delete section */}
                {userRole !== "user" && onDeletePolicy && (
                  <div className="pt-6 border-t border-zinc-200/10 dark:border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-rose-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      Danger Zone
                    </h4>
                    <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-foreground">Decommission / Delete Policy</h5>
                        <p className="text-[11px] text-muted-foreground max-w-sm leading-normal">
                          Permanently remove this governance volume from the active corporate registry. This action cannot be undone.
                        </p>
                      </div>
                      
                      {detailDeleteConfirm ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onDeletePolicy(policy.id);
                              onClose();
                            }}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-950/35 transition-all"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailDeleteConfirm(false)}
                            className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailDeleteConfirm(true)}
                          className="w-full sm:w-auto px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 rounded-xl font-bold text-xs transition-all cursor-pointer text-center"
                        >
                          Decommission Policy
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
              className="relative bg-white p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 border border-zinc-200/5 z-10"
            >
              <button 
                onClick={() => setZoomedQR(null)}
                className="absolute top-4 right-4 p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-850 rounded-full cursor-pointer transition-all"
                title="Close Zoomed View"
              >
                <X className="w-4 h-4 text-zinc-800" />
              </button>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider line-clamp-2 leading-tight">
                  {policy.title}
                </h4>
                <p className="text-[10px] text-zinc-500">Scan code with mobile camera to browse directly</p>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 shadow-inner flex items-center justify-center min-h-[220px]">
                {zoomedQrBase64 ? (
                  <img 
                    src={zoomedQrBase64} 
                    alt="Zoomed QR Code" 
                    className="w-[200px] h-[200px] object-contain rounded-lg block"
                  />
                ) : (
                  <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
                )}
              </div>

              <div className="space-y-2 w-full text-xs text-zinc-700">
                <span className="font-mono text-[9px] bg-zinc-50 text-zinc-600 px-2.5 py-1 rounded-full border border-zinc-200 inline-block truncate max-w-full">
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
                  {zoomedQrBase64 && (
                    <a 
                      href={zoomedQrBase64}
                      download={`policy_qr_high_res_${policy.code}.png`}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      Download QR
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
