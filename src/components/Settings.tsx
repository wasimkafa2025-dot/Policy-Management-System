import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Palette, Library, Database, Info, Moon, Sun, 
  Grid, List, FileSpreadsheet, FileCode, Sparkles,
  RefreshCw, CheckCircle2, ExternalLink, Cloud, Loader2, 
  AlertCircle, FileText, Check, UserPlus, Users, KeyRound, 
  Shield, Download, Lock
} from "lucide-react";
import { Policy, AuditLog, SystemNotification, UserAccount } from "../types";

interface SettingsProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  defaultView: "grid" | "list";
  onChangeDefaultView: (view: "grid" | "list") => void;
  onExportData: (format: "json" | "csv") => void;
  policies: Policy[];
  onImportPolicies: (importedPolicies: Policy[]) => void;
  onSyncOneDrive: (syncedPolicies: Policy[], newLogs: AuditLog[], newNotifs: SystemNotification[]) => void;
  username: string;
  userRole?: 'admin' | 'user';
  users: UserAccount[];
  onAddUser: (username: string, email: string, role: 'admin' | 'user', password?: string) => void;
}

export default function Settings({ 
  theme, 
  onToggleTheme, 
  defaultView, 
  onChangeDefaultView, 
  onExportData,
  policies,
  onImportPolicies,
  onSyncOneDrive,
  username,
  userRole = 'admin',
  users,
  onAddUser
}: SettingsProps) {
  // States for JSON import feedback
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (!Array.isArray(parsed)) {
          throw new Error("Imported data must be a JSON array of policy records.");
        }
        
        const valid = parsed.every(p => p && typeof p === "object" && "title" in p);
        if (!valid && parsed.length > 0) {
          throw new Error("Invalid format. Every policy record must contain a 'title' field.");
        }

        const sanitized = parsed.map((p, idx) => ({
          id: p.id || `imported-${Date.now()}-${idx}`,
          code: p.code || `POL-IMP-${1000 + idx}`,
          title: p.title || "Untitled Imported Policy",
          status: p.status || "Draft",
          version: p.version || "1.0",
          effectiveDate: p.effectiveDate || new Date().toISOString().split("T")[0],
          year: p.year || new Date().getFullYear().toString(),
          department: p.department || "General",
          category: p.category || "General Compliance",
          owner: p.owner || "Imported Source",
          description: p.description || "No description provided.",
          complianceScore: typeof p.complianceScore === "number" ? p.complianceScore : 75,
          riskLevel: p.riskLevel || "Low",
          coverTitle: p.coverTitle || p.title || "Imported Policy",
          coverDept: p.coverDept || p.department || "General",
          coverYear: p.coverYear || p.year || new Date().getFullYear().toString(),
          coverColor: p.coverColor || "#4a4a4a",
          coverIcon: p.coverIcon || "finance",
          createdDate: p.createdDate || new Date().toISOString().split("T")[0],
          updatedDate: p.updatedDate || new Date().toISOString().split("T")[0],
          documents: p.documents || [],
          procedures: p.procedures || [],
          forms: p.forms || []
        }));

        onImportPolicies(sanitized);
        setImportSuccess(`Success! Successfully imported ${sanitized.length} policy record(s).`);
      } catch (err: any) {
        setImportError(err?.message || "Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // States for OneDrive simulation
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncStep, setSyncStep] = useState<number>(0); // 0: idle, 1: running, 2: finished
  const [syncResults, setSyncResults] = useState<{ id: string; code: string; title: string; from: string; to: string; success: boolean }[]>([]);

  // States for User Management
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("WIS@123");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>("user");
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserSuccess(null);
    setAddUserError(null);

    if (!newUsername.trim() || !newUserEmail.trim()) {
      setAddUserError("Please fill out both Username and Email fields.");
      return;
    }

    const checkExists = users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (checkExists) {
      setAddUserError(`Username "${newUsername.trim()}" already exists in the registry.`);
      return;
    }

    onAddUser(newUsername.trim(), newUserEmail.trim(), newUserRole, newUserPassword);
    setAddUserSuccess(`Successfully registered user account: "${newUsername.trim()}" as ${newUserRole === "admin" ? "Super Admin" : "User (Read & Download)"}.`);
    
    // Reset form
    setNewUsername("");
    setNewUserEmail("");
    setNewUserPassword("WIS@123");
  };

  // Get all policies with OneDrive tracking link
  const linkedPolicies = policies.filter(p => p.oneDriveLink && p.oneDriveLink.trim() !== "");

  // Format link for display (truncate)
  const formatOneDriveUrl = (url?: string) => {
    if (!url) return "No tracking link configured";
    try {
      const parsed = new URL(url);
      return `onedrive.live.com${parsed.pathname.slice(0, 15)}...`;
    } catch {
      return url.length > 30 ? `${url.slice(0, 30)}...` : url;
    }
  };

  // Start Sync Simulation
  const triggerOneDriveSync = () => {
    if (linkedPolicies.length === 0) {
      alert("No policies are configured with OneDrive tracking links. Please create or edit a policy and add a OneDrive folder link first.");
      return;
    }

    setIsSyncing(true);
    setSyncStep(1);
    setSyncProgress(0);
    setSyncResults([]);
    setSyncLogs(["[SYSTEM] Initializing OneDrive Governance Sync Engine...", "[SYSTEM] Fetching OAuth credentials from vault..."]);

    let progress = 0;
    const logsList = [
      "[SYSTEM] Initializing OneDrive Governance Sync Engine...",
      "[SYSTEM] Fetching OAuth credentials from vault..."
    ];

    const addLog = (msg: string) => {
      logsList.push(msg);
      setSyncLogs([...logsList]);
    };

    // Step 1: Connecting (0 - 20%)
    setTimeout(() => {
      progress = 20;
      setSyncProgress(progress);
      addLog("[CONNECT] Opening secure tunnel to SharePoint/OneDrive enterprise API...");
      addLog("[CONNECT] Session authenticated successfully. User: wis-compliance-service@onedrive.com");
    }, 1000);

    // Step 2: Scanning links (20 - 40%)
    setTimeout(() => {
      progress = 40;
      setSyncProgress(progress);
      addLog(`[DISCOVER] Scanning governance catalog... Located ${linkedPolicies.length} connected policy source(s).`);
      addLog("[DISCOVER] Requesting document manifests & validation checksums...");
    }, 2200);

    // Step 3: Check policies & transition those that need changes (40 - 85%)
    const results: typeof syncResults = [];
    const updatedPoliciesList = [...policies];
    const newLogs: AuditLog[] = [];
    const newNotifs: SystemNotification[] = [];
    const nowStr = new Date().toISOString();

    linkedPolicies.forEach((p, idx) => {
      const delay = 2500 + idx * 1500;
      setTimeout(() => {
        progress = 40 + Math.floor(((idx + 1) / linkedPolicies.length) * 40);
        setSyncProgress(progress);
        addLog(`[SCAN] Comparing files for Policy ${p.code}: "${p.title}"...`);
        addLog(`[SCAN] OneDrive Source Link: ${p.oneDriveLink}`);

        if (p.status !== "Approved") {
          // Document has changed on OneDrive (it was approved there)
          const oldStatus = p.status;
          const targetIndex = updatedPoliciesList.findIndex(item => item.id === p.id);
          if (targetIndex !== -1) {
            updatedPoliciesList[targetIndex] = {
              ...updatedPoliciesList[targetIndex],
              status: "Approved",
              updatedDate: nowStr
            };
          }

          results.push({
            id: p.id,
            code: p.code,
            title: p.title,
            from: oldStatus,
            to: "Approved",
            success: true
          });
          setSyncResults([...results]);

          addLog(`[ALERT] Remote document status mismatch! OneDrive shows "APPROVED & RELEASED".`);
          addLog(`[UPDATE] POL-1003/POL-1004 state transition: "${oldStatus}" ➜ "Approved".`);
          addLog(`[DATABASE] Updated policy registry metadata and version counters.`);

          // Create Audit log
          newLogs.push({
            id: `audit-${Date.now()}-${p.id}`,
            policyId: p.id,
            policyTitle: p.title,
            action: "OneDrive Automated Sync",
            user: "OneDrive Synchronizer",
            timestamp: nowStr,
            details: `Automated OneDrive sync detected status shift on remote server. Local status updated from '${oldStatus}' to 'Approved'. Checksum: SHA-256 Verified.`
          });

          // Create Notification
          newNotifs.push({
            id: `notif-${Date.now()}-${p.id}`,
            title: "OneDrive Status Refreshed",
            message: `Policy "${p.title}" (${p.code}) has been updated from "${oldStatus}" to "Approved" based on its OneDrive source link.`,
            type: "green",
            createdAt: nowStr,
            read: false
          });

        } else {
          // Already approved, no change
          results.push({
            id: p.id,
            code: p.code,
            title: p.title,
            from: "Approved",
            to: "Approved",
            success: false
          });
          setSyncResults([...results]);
          addLog(`[SCAN] Hash matches local cache. No modifications detected in the OneDrive file.`);
        }
      }, delay);
    });

    // Step 4: Wrapping up (85 - 100%)
    const wrapUpDelay = 2500 + linkedPolicies.length * 1500 + 1000;
    setTimeout(() => {
      setSyncProgress(95);
      addLog("[SYSTEM] Re-indexing compliance catalog and recalculating risk models...");
      addLog("[SYSTEM] Triggering push notifications to administration board...");
    }, wrapUpDelay - 600);

    setTimeout(() => {
      setSyncProgress(100);
      addLog("[SUCCESS] Synchronization session finished successfully.");
      addLog("[SUCCESS] Encrypted telemetry tunnel closed.");
      setSyncStep(2);

      // Trigger parent handler to persist in localStorage and app state
      onSyncOneDrive(updatedPoliciesList, newLogs, newNotifs);
    }, wrapUpDelay);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <Palette className="w-6 h-6 text-purple-400" />
          Settings Panel
        </h1>
        <p className="text-xs text-zinc-400">Configure global application themes, document views, backup exports, and OneDrive automated synchronization.</p>
      </div>

      {/* OneDrive Automated Sync (PROMINENT TOP COMPONENT) */}
      <div className="p-6 border border-[#232a3b] bg-[#161b26]/70 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232a3b] pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-400" />
              OneDrive Source Automated Synchronizer
            </h3>
            <p className="text-xs text-zinc-400">Scan connected OneDrive links, analyze remote governance state, and synchronize workflow statuses instantly.</p>
          </div>
          <button
            type="button"
            onClick={triggerOneDriveSync}
            disabled={isSyncing}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all border border-[#1e293b] text-white cursor-pointer select-none bg-purple-600 hover:bg-purple-500 hover:scale-[1.02] active:scale-[0.98] ${isSyncing ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            id="onedrive-sync-btn"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Synchronizing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-white" />
                Scan & Sync OneDrive Sources
              </>
            )}
          </button>
        </div>

        {/* Current Connections Table */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            CONNECTED SOURCE DOCUMENTS ({linkedPolicies.length})
          </h4>

          {linkedPolicies.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#232a3b] bg-[#131926]/40 text-xs text-zinc-500 space-y-2">
              <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-bold text-zinc-400">No active OneDrive tracking links detected.</p>
              <p className="text-zinc-500 text-[11px] max-w-sm mx-auto">Navigate to the Policy Library, edit a governance document (e.g. Remote Work Safety), and paste a OneDrive link to configure active automated synchronization.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {linkedPolicies.map(p => (
                <div key={p.id} className="p-4 border border-[#232a3b] bg-[#131926]/40 rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black bg-[#1e293b] text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                        {p.code}
                      </span>
                      <h5 className="text-xs font-bold text-white truncate max-w-[200px]">{p.title}</h5>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate" title={p.oneDriveLink}>{formatOneDriveUrl(p.oneDriveLink)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : p.status === "Under Review" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                      {p.status}
                    </span>
                    <p className="text-[9px] text-zinc-500 font-mono mt-1">Ready to Sync</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Settings Card */}
        <div className="p-5 border border-[#232a3b] bg-[#161b26]/70 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#232a3b] pb-2">
            <Palette className="w-4.5 h-4.5 text-purple-400" />
            Visual Workspace Customize
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-zinc-400 uppercase">Application Theme</label>
              <div className="grid grid-cols-2 gap-3 pt-1.5">
                <button
                  type="button"
                  onClick={() => theme === "light" && onToggleTheme()}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${theme === "dark" ? 'border-purple-500 bg-purple-500/[0.04] text-purple-400' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <Moon className="w-4 h-4" />
                  Night Mode (Dark Blue)
                </button>
                <button
                  type="button"
                  onClick={() => theme === "dark" && onToggleTheme()}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${theme === "light" ? 'border-purple-500 bg-purple-500/[0.04] text-purple-400' : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <Sun className="w-4 h-4" />
                  Day Mode (Light Gold)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Library Defaults Card */}
        <div className="p-5 border border-[#232a3b] bg-[#161b26]/70 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#232a3b] pb-2">
            <Library className="w-4.5 h-4.5 text-purple-400" />
            Policy Library Defaults
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-zinc-400 uppercase">Default View Mode</label>
              <div className="grid grid-cols-2 gap-3 pt-1.5">
                <button
                  type="button"
                  onClick={() => onChangeDefaultView("grid")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${defaultView === "grid" ? 'border-purple-500 bg-purple-500/[0.04] text-purple-400' : 'border-[#232a3b] text-zinc-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                  Grid Mode
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDefaultView("list")}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${defaultView === "list" ? 'border-purple-500 bg-purple-500/[0.04] text-purple-400' : 'border-[#232a3b] text-zinc-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                  List Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup and Database Export */}
        <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-card)]/70 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <Database className="w-4.5 h-4.5 text-[var(--accent-bg)]" />
            Backup & Database Operations
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Download a full, structured copy of your active policies for backup or load them back into the governance hub.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onExportData("json")}
              className="p-3 border border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[var(--accent-bg)]/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-[var(--accent-bg)]" />
              Export JSON
            </button>
            <button
              onClick={() => onExportData("csv")}
              className="p-3 border border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[var(--accent-bg)]/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Export CSV
            </button>
          </div>

          {/* JSON File Import Zone */}
          <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-[var(--accent-bg)] rotate-180" />
              Import Policies from JSON Backup
            </h4>
            
            <div className="relative border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-bg)] rounded-xl p-4 transition-colors bg-[var(--bg-input)]/40 flex flex-col items-center justify-center text-center cursor-pointer group">
              <input 
                type="file" 
                accept=".json"
                onChange={handleJsonImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <FileCode className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[var(--accent-bg)] transition-colors mb-1.5" />
              <span className="text-xs font-bold text-[var(--text-primary)]">Choose JSON Backup File</span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5">or drag & drop file here</span>
            </div>

            {importError && (
              <div className="p-2.5 border border-rose-500/15 bg-rose-500/5 rounded-xl text-rose-500 text-[11px] font-medium flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 border border-emerald-500/15 bg-emerald-500/5 rounded-xl text-emerald-500 dark:text-emerald-450 text-[11px] font-bold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* System Details */}
        <div className="p-5 border border-[#232a3b] bg-[#161b26]/70 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#232a3b] pb-2">
            <Info className="w-4.5 h-4.5 text-purple-400" />
            System Metadata
          </h3>

          <div className="space-y-3.5 text-xs text-zinc-400">
            <div className="flex items-center justify-between border-b border-[#1f2635] pb-1.5">
              <span>App Core Engine</span>
              <span className="font-semibold text-white">React 19 / Vite 6 / Tailwind 4</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1f2635] pb-1.5">
              <span>AI Integration Model</span>
              <span className="font-semibold text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini 3.5 Flash
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1f2635] pb-1.5 font-sans">
              <span>Local Timezone Alignment</span>
              <span className="font-semibold text-white font-mono">UTC -07:00</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1f2635] pb-1.5 font-sans">
              <span>Database Storage</span>
              <span className="font-semibold text-white">Client State Sandbox with JSON Persistence</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. User Account Registry and Governance Roles Panel */}
      <div className="p-6 border border-[var(--border-color)] bg-[var(--bg-card)]/70 rounded-2xl space-y-6 shadow-sm">
        <div className="border-b border-[var(--border-color)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--accent-bg)]" />
              User Account Directory & Security Roles
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Provision new roles, view access logs, and audit credentials. Super admins can revise/delete policies, while standard users have read & download clearance.
            </p>
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20 px-2.5 py-1 rounded-full font-mono">
            {users.length} Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* User Registration Form (Only for Admins) */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-[var(--accent-bg)]" />
              {userRole === "admin" ? "Register New Governance profile" : "Your security profile status"}
            </h4>

            {userRole === "admin" ? (
              <form onSubmit={handleAddUserSubmit} className="space-y-4 bg-[var(--bg-panel)]/50 p-4 rounded-xl border border-[var(--border-color)]">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Username / Identity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. audit_manager"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-bg)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Institutional Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. audit@wis-policy.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-bg)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Authentication Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="WIS@123"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-bg)] font-mono"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Authorization Clearance Level</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] cursor-pointer"
                  >
                    <option value="user" className="bg-[var(--bg-card)] text-[var(--text-primary)]">User Role (Can Only View & Download Policies)</option>
                    <option value="admin" className="bg-[var(--bg-card)] text-[var(--text-primary)]">Admin Role (Super Admin - All operations allowed)</option>
                  </select>
                </div>

                {addUserSuccess && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-start gap-1.5 leading-normal">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{addUserSuccess}</span>
                  </p>
                )}

                {addUserError && (
                  <p className="text-[11px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-start gap-1.5 leading-normal">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{addUserError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Register Security Account
                </button>
              </form>
            ) : (
              <div className="bg-[var(--bg-panel)]/50 p-5 rounded-xl border border-[var(--border-color)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--accent-bg)]/10 border border-[var(--accent-bg)]/20 rounded-xl text-[var(--accent-bg)]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-[var(--text-primary)] uppercase font-sans">Viewer Clearance Profile</h5>
                    <span className="text-[10px] text-[var(--text-muted)]">Account Username: @{username}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-color)] pt-4 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span>Account Directory Access:</span>
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Blocked (Read-Only)
                    </span>
                  </div>
                  <div className="p-3 bg-[var(--bg-input)]/50 rounded-lg space-y-2.5">
                    <p className="text-[10px] text-[var(--text-muted)] leading-normal">
                      Your current session does not possess Administrative configuration rights. Only Super Administrators can provision or delete credentials.
                    </p>
                    <div className="flex flex-col gap-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" /> View Policy Catalog (Enabled)
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Download Official Documents (Enabled)
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-450 text-rose-400 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Edit or Revise Guidelines (Disabled)
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-450 text-rose-400 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Delete Policy Volumes (Disabled)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Users List Directory */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Active credentials directory ({users.length})
            </h4>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {users.map((u) => (
                <div key={u.id} className="p-4 border border-[var(--border-color)] bg-[var(--bg-panel)]/40 hover:bg-[var(--bg-panel)]/80 rounded-xl flex items-center justify-between gap-4 transition-all">
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-[var(--bg-input)] rounded-md text-[var(--text-muted)] shrink-0">
                        <Users className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">@{u.username}</span>
                      {u.username === username && (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20 px-1.5 py-0.5 rounded">
                          Active Session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] truncate pl-7">{u.email || "No email provided"}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      u.role === "admin" 
                        ? "bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20" 
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                    }`}>
                      {u.role === "admin" ? "Super Admin" : "Auditor User"}
                    </span>
                    <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center justify-end gap-1">
                      {u.role === "admin" ? (
                        <>
                          <Shield className="w-2.5 h-2.5 text-purple-400" />
                          <span>Full Rights</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-2.5 h-2.5 text-emerald-400" />
                          <span>View & Download</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SYNC ANIMATION OVERLAY MODAL */}
      <AnimatePresence>
        {isSyncing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl border border-[#232a3b] bg-[#131926] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#232a3b] bg-[#131926] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-sky-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-sm text-white">OneDrive Automated Governance Sync</h3>
                    <p className="text-[11px] text-zinc-400">Analyzing connected policy source documents</p>
                  </div>
                </div>
                {syncStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setIsSyncing(false)}
                    className="text-xs font-bold bg-[#1e293b] hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-[#272e3f] hover:border-zinc-700 transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}
              </div>

              {/* Progress and status */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-400">
                    <span>
                      {syncStep === 1 ? "Sync in progress..." : "Sync session complete!"}
                    </span>
                    <span className="font-mono text-purple-400">{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-[#181f30] h-2 rounded-full overflow-hidden border border-[#272e3f]">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 via-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>

                {/* Simulated Live Terminal */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Real-time Connection Console</span>
                  <div className="h-48 rounded-xl bg-[#090d16] border border-[#1f2635] p-3 font-mono text-[10px] text-zinc-300 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    {syncLogs.map((log, index) => {
                      let color = "text-zinc-400";
                      if (log.startsWith("[SYSTEM]")) color = "text-purple-400 font-bold";
                      else if (log.startsWith("[CONNECT]")) color = "text-blue-400";
                      else if (log.startsWith("[DISCOVER]")) color = "text-sky-400";
                      else if (log.startsWith("[ALERT]")) color = "text-amber-400 font-bold animate-pulse";
                      else if (log.startsWith("[UPDATE]")) color = "text-emerald-400 font-bold";
                      else if (log.startsWith("[SUCCESS]")) color = "text-emerald-400 font-bold";
                      
                      return (
                        <div key={index} className={`${color} leading-relaxed`}>
                          {log}
                        </div>
                      );
                    })}
                    {syncStep === 1 && (
                      <div className="flex items-center gap-1 text-sky-400 animate-pulse mt-1">
                        <span>▋</span>
                        <span className="text-[9px]">Querying remote repositories...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sync Outcomes List */}
                {syncResults.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#232a3b]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Governance Registry Sync Report</span>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {syncResults.map((res, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#181f30] border border-[#272e3f] rounded-xl text-xs">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="p-1 bg-white/5 rounded-lg shrink-0">
                              <FileText className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold font-mono bg-[#111622] px-1 py-0.5 rounded text-zinc-400">
                                  {res.code}
                                </span>
                                <span className="font-bold text-white truncate max-w-[220px]">{res.title}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {res.success ? (
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 line-through text-[11px]">{res.from}</span>
                                <span className="text-[10px]">➜</span>
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                  {res.to}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                Up to Date
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {syncStep === 2 && (
                <div className="p-5 border-t border-[#232a3b] bg-[#111622] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Synchronized & Persisted successfully!
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSyncing(false)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
                  >
                    Finish Session
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
