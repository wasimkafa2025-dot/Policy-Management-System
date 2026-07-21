import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, LayoutGrid, BookOpen, ClipboardList, KanbanSquare, 
  Sparkles, Palette, LogOut, Bell, Moon, Sun, Search, 
  Clock, ShieldAlert, KeyRound, User, ChevronRight, X, Check,
  AlertTriangle, History, Menu, ChevronLeft, ChevronDown, FolderOpen,
  Folder, Layers, Settings as SettingsIcon, BarChart2, Shield, Trash2, Database
} from "lucide-react";

import { 
  Policy, PolicyStatus, SystemNotification, AuditLog, 
  AIAnalysisResult, ProcedureLink, FormLink, UserAccount
} from "./types";
import { initialPolicies, initialNotifications, initialAuditLogs } from "./data/initialPolicies";

// View imports
import Dashboard from "./components/Dashboard";
import PolicyLibrary from "./components/PolicyLibrary";
import Settings from "./components/Settings";
import PolicyDetailModal from "./components/PolicyDetailModal";
import AuditLogs from "./components/AuditLogs";

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [defaultView, setDefaultView] = useState<"grid" | "list">("grid");

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("HRWIS");
  const [loginPassword, setPassword] = useState("WIS@123");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // App States
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("wis_users");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: "1", username: "HRWIS", password: "WIS@123", role: "admin", createdAt: "2026-01-01T00:00:00Z", email: "hr@wis-policy.com" },
      { id: "2", username: "USERWIS", password: "WIS@123", role: "user", createdAt: "2026-01-01T00:00:00Z", email: "user@wis-policy.com" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("wis_users", JSON.stringify(users));
  }, [users]);
  
  const [currentPage, setCurrentPage] = useState("library");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [notifTrayOpen, setNotifTrayOpen] = useState(false);
  const [liveTime, setLiveTime] = useState("");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({
    "tracking-group": true,
  });

  const [resetConfirm, setResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (resetConfirm) {
      const timer = setTimeout(() => {
        setResetConfirm(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [resetConfirm]);

  const handleResetDatabase = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    
    updatePoliciesState([]);
    
    const newAuditLog: AuditLog = {
      id: "audit-reset-" + Date.now(),
      policyId: "ALL",
      policyTitle: "System Policy Library",
      action: "Library Reset",
      user: username,
      timestamp: new Date().toISOString(),
      details: "All policies deleted successfully from local database via left sidebar reset action."
    };
    updateAuditLogsState([newAuditLog, ...auditLogs]);

    const newNotification: SystemNotification = {
      id: "n-reset-" + Date.now(),
      title: "Library Reset",
      message: "The entire policy database was cleared.",
      type: "orange",
      createdAt: new Date().toISOString(),
      read: false
    };
    updateNotificationsState([newNotification, ...notifications]);

    setResetConfirm(false);
  };

  const toggleSubmenu = (menuId: string) => {
    setExpandedSubmenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Push state to server for auto-sync
  const pushState = async (payload: { policies?: Policy[]; notifications?: SystemNotification[]; auditLogs?: AuditLog[]; users?: UserAccount[] }) => {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync with server:", err);
    }
  };

  // Load from server & local storage fallback
  useEffect(() => {
    // Session load
    const savedSession = localStorage.getItem("wis_session") || sessionStorage.getItem("wis_session");
    if (savedSession) {
      const sess = JSON.parse(savedSession);
      setIsLoggedIn(sess.loggedIn);
      setUsername(sess.username);
      const role = sess.role || 'admin';
      setUserRole(role);
      if (role === 'user') {
        setCurrentPage("library");
      }
    }

    // Theme load
    const savedTheme = localStorage.getItem("wis_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    }

    // View load
    const savedView = localStorage.getItem("wis_view") as "grid" | "list" | null;
    if (savedView) setDefaultView(savedView);

    // Initial sync fetch
    const initSync = async () => {
      try {
        const response = await fetch("/api/sync");
        if (response.ok) {
          const data = await response.json();
          // Seed local states if server has policies or custom users
          if (data && (data.policies?.length > 0 || data.users?.length > 2)) {
            setPolicies(data.policies || []);
            setNotifications(data.notifications || []);
            setAuditLogs(data.auditLogs || []);
            setUsers(data.users || []);

            localStorage.setItem("wis_policies", JSON.stringify(data.policies || []));
            localStorage.setItem("wis_notifications", JSON.stringify(data.notifications || []));
            localStorage.setItem("wis_audit_logs", JSON.stringify(data.auditLogs || []));
            localStorage.setItem("wis_users", JSON.stringify(data.users || []));
          } else {
            // Server has no records, bootstrap server from local storage (or defaults)
            const storedPolicies = localStorage.getItem("wis_policies");
            const storedNotifs = localStorage.getItem("wis_notifications");
            const storedAudits = localStorage.getItem("wis_audit_logs");
            const storedUsers = localStorage.getItem("wis_users");

            const localPolicies = storedPolicies ? JSON.parse(storedPolicies) : initialPolicies;
            const localNotifs = storedNotifs ? JSON.parse(storedNotifs) : initialNotifications;
            const localAudits = storedAudits ? JSON.parse(storedAudits) : initialAuditLogs;
            const defaultUsers = [
              { id: "1", username: "HRWIS", password: "WIS@123", role: "admin", createdAt: "2026-01-01T00:00:00Z", email: "hr@wis-policy.com" },
              { id: "2", username: "USERWIS", password: "WIS@123", role: "user", createdAt: "2026-01-01T00:00:00Z", email: "user@wis-policy.com" }
            ];
            const localUsers = storedUsers ? JSON.parse(storedUsers) : defaultUsers;

            setPolicies(localPolicies);
            setNotifications(localNotifs);
            setAuditLogs(localAudits);
            setUsers(localUsers);

            // Seed server
            await fetch("/api/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                policies: localPolicies,
                notifications: localNotifs,
                auditLogs: localAudits,
                users: localUsers
              })
            });
          }
        } else {
          throw new Error(`Server returned status: ${response.status}`);
        }
      } catch (err) {
        console.error("Initial server sync failed, falling back to local cache:", err);
        const storedPolicies = localStorage.getItem("wis_policies");
        const storedNotifs = localStorage.getItem("wis_notifications");
        const storedAudits = localStorage.getItem("wis_audit_logs");
        setPolicies(storedPolicies ? JSON.parse(storedPolicies) : initialPolicies);
        setNotifications(storedNotifs ? JSON.parse(storedNotifs) : initialNotifications);
        setAuditLogs(storedAudits ? JSON.parse(storedAudits) : initialAuditLogs);
      }
    };

    initSync();
  }, []);

  // Listen to deep-link "?policy=id" query parameter
  useEffect(() => {
    if (policies.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const policyParam = params.get("policy");
    if (policyParam) {
      const exists = policies.some(p => p.id === policyParam);
      if (exists) {
        setSelectedPolicyId(policyParam);
        
        // Auto-login as standard user if not logged in to streamline quick-scan mobile access
        const savedSession = localStorage.getItem("wis_session") || sessionStorage.getItem("wis_session");
        if (!savedSession && !isLoggedIn) {
          setIsLoggedIn(true);
          setUsername("USERWIS");
          setUserRole("user");
          setCurrentPage("library");
        }
      }
    }
  }, [policies, isLoggedIn]);

  // Save states helper and push to backend
  const updatePoliciesState = (newPolicies: Policy[]) => {
    setPolicies(newPolicies);
    localStorage.setItem("wis_policies", JSON.stringify(newPolicies));
    pushState({ policies: newPolicies });
  };

  const updateNotificationsState = (newNotifs: SystemNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem("wis_notifications", JSON.stringify(newNotifs));
    pushState({ notifications: newNotifs });
  };

  const updateAuditLogsState = (newAudits: AuditLog[]) => {
    setAuditLogs(newAudits);
    localStorage.setItem("wis_audit_logs", JSON.stringify(newAudits));
    pushState({ auditLogs: newAudits });
  };

  // Background auto-sync polling every 5 seconds
  useEffect(() => {
    let active = true;
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/sync");
        if (response.ok && active) {
          const data = await response.json();
          if (data) {
            // Compare and update only if change exists to avoid component re-render loops
            if (data.policies && JSON.stringify(data.policies) !== JSON.stringify(policies)) {
              setPolicies(data.policies);
              localStorage.setItem("wis_policies", JSON.stringify(data.policies));
            }
            if (data.notifications && JSON.stringify(data.notifications) !== JSON.stringify(notifications)) {
              setNotifications(data.notifications);
              localStorage.setItem("wis_notifications", JSON.stringify(data.notifications));
            }
            if (data.auditLogs && JSON.stringify(data.auditLogs) !== JSON.stringify(auditLogs)) {
              setAuditLogs(data.auditLogs);
              localStorage.setItem("wis_audit_logs", JSON.stringify(data.auditLogs));
            }
            if (data.users && JSON.stringify(data.users) !== JSON.stringify(users)) {
              setUsers(data.users);
              localStorage.setItem("wis_users", JSON.stringify(data.users));
            }
          }
        }
      } catch (err) {
        console.error("Auto-sync background polling error:", err);
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(syncInterval);
    };
  }, [policies, notifications, auditLogs, users]);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      }) + " • " + now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle Dark/Light visual theme
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("wis_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    if (next === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  const handleDefaultViewChange = (view: "grid" | "list") => {
    setDefaultView(view);
    localStorage.setItem("wis_view", view);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && (u.password || "WIS@123") === loginPassword);
    
    if (matchedUser) {
      setIsLoggedIn(true);
      setLoginError(null);
      setUserRole(matchedUser.role);
      
      const session = { 
        username: matchedUser.username, 
        role: matchedUser.role,
        loggedIn: true 
      };
      
      if (rememberMe) {
        localStorage.setItem("wis_session", JSON.stringify(session));
      } else {
        sessionStorage.setItem("wis_session", JSON.stringify(session));
      }

      setCurrentPage("library");
    } else {
      setLoginError("Invalid governance credentials. Please try again.");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("wis_session");
    sessionStorage.removeItem("wis_session");
    setShowLogoutConfirm(false);
  };

  // State manipulation handlers
  const handleSavePolicy = (pData: Partial<Policy>) => {
    let list = [...policies];
    const user = username;
    const nowStr = new Date().toISOString();

    if (pData.id) {
      // Edit mode
      list = list.map(item => {
        if (item.id === pData.id) {
          const updated = {
            ...item,
            ...pData,
            updatedDate: nowStr
          } as Policy;

          // Log Audit Action
          const log: AuditLog = {
            id: "audit-" + Date.now(),
            policyId: item.id,
            policyTitle: item.title,
            action: `Policy Modified (v${item.version} -> v${pData.version || item.version})`,
            user,
            timestamp: nowStr,
            details: `Updated metadata and cover parameters. Status: ${pData.status || item.status}`
          };
          updateAuditLogsState([log, ...auditLogs]);
          return updated;
        }
        return item;
      });
    } else {
      // Create mode
      const nextCode = "POL-" + (1001 + list.length);
      const newPolicy: Policy = {
        id: (list.length + 1).toString(),
        code: nextCode,
        title: pData.title || "New Standard Regulation",
        department: pData.department || "HR",
        category: pData.category || "General Compliance",
        owner: pData.owner || "Compliance Board",
        effectiveDate: pData.effectiveDate || new Date().toISOString().split("T")[0],
        year: pData.year || new Date().getFullYear().toString(),
        version: pData.version || "1.0",
        status: pData.status || "Draft",
        description: pData.description || "",
        coverTitle: pData.coverTitle || pData.title,
        coverDept: pData.coverDept || pData.department,
        coverYear: pData.coverYear || pData.year,
        coverColor: pData.coverColor || "#7B337E",
        coverIcon: pData.coverIcon || "hr",
        createdDate: nowStr,
        updatedDate: nowStr,
        documents: pData.documents || [],
        complianceScore: 75,
        riskLevel: "Medium"
      };

      list = [newPolicy, ...list];

      // Audit Log
      const log: AuditLog = {
        id: "audit-" + Date.now(),
        policyId: newPolicy.id,
        policyTitle: newPolicy.title,
        action: "Draft Document Created",
        user,
        timestamp: nowStr,
        details: `Initial layout parsed. Cataloged under code: ${nextCode}`
      };
      
      // Notification Alert
      const notif: SystemNotification = {
        id: "notif-" + Date.now(),
        title: "Draft Created",
        message: `New draft policy "${newPolicy.title}" (${nextCode}) generated.`,
        type: "purple",
        createdAt: nowStr,
        read: false
      };

      updateAuditLogsState([log, ...auditLogs]);
      updateNotificationsState([notif, ...notifications]);
    }

    updatePoliciesState(list);
  };

  const handleDeletePolicy = (id: string) => {
    const target = policies.find(p => p.id === id);
    if (!target) return;

    const list = policies.filter(p => p.id !== id);
    const nowStr = new Date().toISOString();

    const log: AuditLog = {
      id: "audit-" + Date.now(),
      action: "Policy Decommissioned / Deleted",
      user: username,
      timestamp: nowStr,
      details: `Policy "${target.title}" (${target.code}) removed from active catalog.`
    };

    updateAuditLogsState([log, ...auditLogs]);
    updatePoliciesState(list);
  };

  const handleUpdateStatus = (id: string, newStatus: PolicyStatus) => {
    const list = policies.map(p => {
      if (p.id === id) {
        const updated = {
          ...p,
          status: newStatus,
          updatedDate: new Date().toISOString()
        };

        // Audit Log
        const log: AuditLog = {
          id: "audit-" + Date.now(),
          policyId: p.id,
          policyTitle: p.title,
          action: `Status Transition -> ${newStatus}`,
          user: username,
          timestamp: new Date().toISOString(),
          details: `Shifted policy workflow status to: ${newStatus}`
        };

        // Notification if Approved
        if (newStatus === "Approved") {
          const notif: SystemNotification = {
            id: "notif-" + Date.now(),
            title: "Policy Approved & Released",
            message: `"${p.title}" (${p.code}) has been approved for release.`,
            type: "green",
            createdAt: new Date().toISOString(),
            read: false
          };
          updateNotificationsState([notif, ...notifications]);
        }

        updateAuditLogsState([log, ...auditLogs]);
        return updated;
      }
      return p;
    });

    updatePoliciesState(list);
  };

  const handleSyncOneDrive = (syncedPolicies: Policy[], newLogs: AuditLog[], newNotifs: SystemNotification[]) => {
    updatePoliciesState(syncedPolicies);
    updateAuditLogsState([...newLogs, ...auditLogs]);
    updateNotificationsState([...newNotifs, ...notifications]);
  };

  // AI analysis save callback
  const handleSaveAIAnalysis = (policyId: string, analysis: AIAnalysisResult) => {
    const list = policies.map(p => {
      if (p.id === policyId) {
        return {
          ...p,
          aiAnalysis: analysis,
          complianceScore: analysis.readability, // leverage readability for score
          riskLevel: analysis.riskScore > 60 ? "High" : analysis.riskScore > 30 ? "Medium" : "Low" as any
        };
      }
      return p;
    });

    // Logging audit
    const target = policies.find(x => x.id === policyId);
    if (target) {
      const log: AuditLog = {
        id: "audit-" + Date.now(),
        policyId,
        policyTitle: target.title,
        action: "AI Compliance Review Performed",
        user: "Gemini Compliance Auditor",
        timestamp: new Date().toISOString(),
        details: `Deep audit completed. Grade readability score: ${analysis.readability}%. Evaluated risk: ${analysis.riskScore}/100.`
      };
      updateAuditLogsState([log, ...auditLogs]);
    }

    updatePoliciesState(list);
  };

  // Links procedure step to a policy
  const handleAddProcedure = (policyId: string, proc: ProcedureLink) => {
    const list = policies.map(p => {
      if (p.id === policyId) {
        return {
          ...p,
          procedures: [...(p.procedures || []), proc]
        };
      }
      return p;
    });

    const target = policies.find(x => x.id === policyId);
    if (target) {
      const log: AuditLog = {
        id: "audit-" + Date.now(),
        policyId,
        policyTitle: target.title,
        action: "SOP Workflow Linked",
        user: username,
        timestamp: new Date().toISOString(),
        details: `Linked standard operating procedure: "${proc.title}" containing ${proc.steps.length} checklist steps.`
      };
      updateAuditLogsState([log, ...auditLogs]);
    }

    updatePoliciesState(list);
  };

  const handleAddForm = (policyId: string, form: FormLink) => {
    const list = policies.map(p => {
      if (p.id === policyId) {
        return {
          ...p,
          forms: [...(p.forms || []), form]
        };
      }
      return p;
    });

    const target = policies.find(x => x.id === policyId);
    if (target) {
      const log: AuditLog = {
        id: "audit-" + Date.now(),
        policyId,
        policyTitle: target.title,
        action: "Compliance Form Template Linked",
        user: username,
        timestamp: new Date().toISOString(),
        details: `Linked digital template input form: "${form.name}" containing ${form.fields.length} input declarations.`
      };
      updateAuditLogsState([log, ...auditLogs]);
    }

    updatePoliciesState(list);
  };

  const handleAddManualLog = (action: string, details: string, policyTitle?: string) => {
    const newLog: AuditLog = {
      id: "audit-" + Date.now(),
      action,
      user: username,
      timestamp: new Date().toISOString(),
      details,
      policyTitle
    };
    updateAuditLogsState([newLog, ...auditLogs]);
  };

  const handleAddUser = (newUsername: string, email: string, role: 'admin' | 'user', password?: string) => {
    const newUser: UserAccount = {
      id: "user-" + Date.now(),
      username: newUsername,
      email,
      role,
      password: password || "WIS@123",
      createdAt: new Date().toISOString()
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("wis_users", JSON.stringify(updatedUsers));
    pushState({ users: updatedUsers });

    // Add manual audit log of user addition
    const newLog: AuditLog = {
      id: "audit-" + Date.now(),
      action: "System User Registered",
      user: username,
      timestamp: new Date().toISOString(),
      details: `Registered profile: ${newUsername} with role: ${role}`
    };
    updateAuditLogsState([newLog, ...auditLogs]);
  };

  const handleExportData = (format: "json" | "csv") => {
    if (policies.length === 0) return;

    if (format === "json") {
      const blob = new Blob([JSON.stringify(policies, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wis_policies_backup.json";
      a.click();
    } else {
      const headers = ["ID", "Code", "Title", "Department", "Category", "Owner", "Status", "Version", "EffectiveDate", "Year"];
      const csvContent = [
        headers.join(","),
        ...policies.map(p => [
          p.id,
          p.code,
          `"${p.title.replace(/"/g, '""')}"`,
          p.department,
          p.category,
          p.owner,
          p.status,
          p.version,
          p.effectiveDate,
          p.year
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wis_policies_catalog.csv";
      a.click();
    }
  };

  // Helper navigation and actions combined
  const handleSelectAndOpenDetail = (id: string) => {
    setSelectedPolicyId(id);
  };

  const handleSidebarNavigate = (page: string) => {
    if (userRole === "user" && page !== "library") {
      return;
    }
    setCurrentPage(page);
    setSearchTerm("");
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 relative overflow-hidden font-sans bg-[var(--bg-app)] text-[var(--text-primary)]">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/15 dark:bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[35%] w-[40%] h-[40%] bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ============================================================
            1. REASSURING SECURE GUEST/ADMIN SIGN IN LOCK SCREEN
            ============================================================ */}
        {!isLoggedIn ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-app)]"
          >
            {/* Ambient Background Circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] relative overflow-hidden space-y-6">
              {/* Premium Top Bar layout */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-foreground tracking-tight">WIS Policy & Procedure</h1>
                  <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">Enterprise Management Suite</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase tracking-wide">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter administrator username" 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                    <input 
                      type="password" 
                      required
                      value={loginPassword}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 glass-input"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 border border-rose-500/10 bg-rose-500/5 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-0" 
                    />
                    <span>Remember Active Session</span>
                  </label>
                  <span className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer">SOP Helpdesk</span>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/10 hover:shadow-purple-600/25 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Sign In to Catalog
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* ============================================================
              2. PRIMARY MULTI-VIEW APP LAYOUT
              ============================================================ */
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-screen relative bg-[var(--bg-app)]"
          >
            {/* Mobile Sidebar Overlay (Slide-out drawer from left) */}
            <AnimatePresence>
              {mobileSidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                  />

                  {/* Drawer Content */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] h-screen bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] flex flex-col justify-between p-5 border-r border-slate-200/10 dark:border-white/10 z-50 lg:hidden overflow-y-auto"
                    style={{ backgroundColor: "var(--bg-sidebar)", color: "var(--text-sidebar)" }}
                  >
                    <div className="space-y-5">
                      {/* Brand Logo & Close Button */}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-[#7c3aed] border border-purple-500/20 rounded-xl flex items-center justify-center text-white">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">WIS P&P</h2>
                            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Governance Hub</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setMobileSidebarOpen(false)}
                          className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)]/40 text-[var(--text-primary)] hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
                          title="Close Sidebar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sidebar Search - Filter Menus */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <input 
                          type="text" 
                          placeholder="Quick filter menu..."
                          value={menuSearchTerm}
                          onChange={(e) => setMenuSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-4 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-bg)] transition-colors"
                        />
                        {menuSearchTerm && (
                          <button 
                            onClick={() => setMenuSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Main Navigation List */}
                      <nav className="space-y-1.5 text-xs font-semibold">
                        {[
                          {
                            id: "library",
                            name: "Policy Library",
                            icon: BookOpen
                          },
                          {
                            id: "settings",
                            name: "Settings Panel",
                            icon: SettingsIcon
                          }
                        ].filter(item => {
                          if (!menuSearchTerm) return true;
                          return item.name.toLowerCase().includes(menuSearchTerm.toLowerCase());
                        }).map(item => {
                          const IconComp = item.icon;

                          return (
                            <div key={item.id} className="space-y-1">
                              <button
                                onClick={() => handleSidebarNavigate(item.id)}
                                className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                                  currentPage === item.id 
                                    ? "font-bold shadow-sm" 
                                    : "text-[var(--text-sidebar)] hover:bg-[var(--purple-glow)] hover:text-[var(--text-primary)]"
                                }`}
                                style={currentPage === item.id ? { backgroundColor: "var(--bg-sidebar-active)", color: "var(--text-sidebar-active)" } : {}}
                              >
                                <IconComp className="w-4 h-4 shrink-0" />
                                <span>{item.name}</span>
                              </button>
                            </div>
                          );
                        })}
                      </nav>

                      {/* Reset Database Button */}
                      <div className="pt-2 border-t border-[var(--border-color)]/30">
                        <button
                          onClick={() => {
                            handleResetDatabase();
                            if (resetConfirm) {
                              setMobileSidebarOpen(false);
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-xl flex items-center transition-all cursor-pointer text-xs font-bold ${
                            resetConfirm 
                              ? "bg-rose-500 text-white font-bold animate-pulse shadow-md" 
                              : "text-rose-500/80 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30"
                          }`}
                          title={resetConfirm ? "Click again to confirm deleting all policy records" : "Reset Library"}
                        >
                          <Trash2 className={`w-4 h-4 shrink-0 mr-2.5 ${resetConfirm ? "animate-bounce" : ""}`} />
                          <span>{resetConfirm ? "Confirm Reset?" : "Reset Library"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Sidebar Footer segment */}
                    <div className="border-t border-[var(--border-color)] pt-4 flex flex-col gap-3 mt-auto">
                      {/* Profile section */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)] flex items-center justify-center font-black shrink-0 shadow-sm">
                            {username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold truncate block text-[var(--text-primary)] leading-tight">{username}</span>
                            <span className="text-[9px] text-[var(--text-muted)] block font-mono capitalize">{userRole} role</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setMobileSidebarOpen(false);
                            handleLogout();
                          }}
                          className="p-1.5 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Disconnect Sandbox Session"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Appearance mode toggle switch */}
                      <div className="flex items-center justify-between p-1.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase pl-1.5">Appearance</span>
                        <button 
                          onClick={toggleTheme}
                          className="p-1 px-2.5 text-[10px] bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20 rounded-lg font-bold flex items-center gap-1 cursor-pointer hover:bg-[var(--accent-bg)]/20 transition-all"
                        >
                          {theme === "dark" ? (
                            <>
                              <Sun className="w-3 h-3" />
                              <span>Light Mode</span>
                            </>
                          ) : (
                            <>
                              <Moon className="w-3 h-3" />
                              <span>Dark Mode</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Sidebar Rail */}
            <aside 
              className={`shrink-0 hidden lg:flex flex-col justify-between sticky top-0 h-screen border-r border-slate-200/10 dark:border-white/10 transition-all duration-300 z-40 ${
                sidebarCollapsed ? "w-20 p-3" : "w-72 p-5"
              }`}
              style={{ backgroundColor: "var(--bg-sidebar)", color: "var(--text-sidebar)" }}
            >
              <div className="space-y-5">
                {/* Brand Logo & Collapse Toggle */}
                <div className={`flex items-center justify-between ${sidebarCollapsed ? "flex-col gap-4 py-2" : "py-1"}`}>
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#7c3aed] border border-purple-500/20 rounded-xl flex items-center justify-center text-white">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">WIS P&P</h2>
                        <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Governance Hub</span>
                      </div>
                    </div>
                  )}

                  {sidebarCollapsed && (
                    <div className="p-2 bg-[#7c3aed] border border-purple-500/20 rounded-xl flex items-center justify-center text-white animate-fade-in">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}

                  <button 
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)]/40 text-[var(--text-primary)] hover:bg-[var(--purple-glow)] transition-all cursor-pointer"
                    title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                  >
                    {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                </div>

                {/* Sidebar Search - Filter Menus */}
                {!sidebarCollapsed && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      placeholder="Quick filter menu..."
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-4 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-bg)] transition-colors"
                    />
                    {menuSearchTerm && (
                      <button 
                        onClick={() => setMenuSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Main Navigation List */}
                <nav className="space-y-1.5 text-xs font-semibold max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {[
                    {
                      id: "library",
                      name: "Policy Library",
                      icon: BookOpen
                    },
                    {
                      id: "settings",
                      name: "Settings Panel",
                      icon: SettingsIcon
                    }
                  ].filter(item => {
                    if (!menuSearchTerm) return true;
                    return item.name.toLowerCase().includes(menuSearchTerm.toLowerCase());
                  }).map(item => {
                    const IconComp = item.icon;

                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="relative group">
                          <button
                            onClick={() => handleSidebarNavigate(item.id)}
                            className={`w-full px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                              currentPage === item.id 
                                ? "font-bold shadow-sm" 
                                : "text-[var(--text-sidebar)] hover:bg-[var(--purple-glow)] hover:text-[var(--text-primary)]"
                            }`}
                            style={currentPage === item.id ? { backgroundColor: "var(--bg-sidebar-active)", color: "var(--text-sidebar-active)" } : {}}
                          >
                            <IconComp className="w-4 h-4 shrink-0" />
                            {!sidebarCollapsed && <span>{item.name}</span>}
                          </button>

                          {/* Collapsed Tooltip */}
                          {sidebarCollapsed && (
                            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-zinc-950 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                              {item.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </nav>

                {/* Reset Database Button */}
                <div className="pt-2 border-t border-[var(--border-color)]/30">
                  <div className="relative group">
                    <button
                      onClick={handleResetDatabase}
                      className={`w-full px-3 py-2 rounded-xl flex items-center transition-all cursor-pointer text-xs font-bold ${
                        sidebarCollapsed ? "justify-center" : ""
                      } ${
                        resetConfirm 
                          ? "bg-rose-500 text-white font-bold animate-pulse shadow-md" 
                          : "text-rose-500/80 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30"
                      }`}
                      title={resetConfirm ? "Click again to confirm deleting all policy records" : "Reset Library"}
                    >
                      <Trash2 className={`w-4 h-4 shrink-0 ${sidebarCollapsed ? "" : "mr-2.5"} ${resetConfirm ? "animate-bounce" : ""}`} />
                      {!sidebarCollapsed && (
                        <span>{resetConfirm ? "Confirm Reset?" : "Reset Library"}</span>
                      )}
                    </button>

                    {/* Collapsed Tooltip */}
                    {sidebarCollapsed && (
                      <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none whitespace-nowrap shadow-xl">
                        {resetConfirm ? "Confirm Reset?" : "Reset Library"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Footer segment */}
              <div className="border-t border-[var(--border-color)] pt-4 px-1 flex flex-col gap-3">
                {/* Profile section */}
                <div className={`flex items-center justify-between text-xs ${sidebarCollapsed ? "justify-center" : "px-1"}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)] flex items-center justify-center font-black shrink-0 shadow-sm">
                      {username[0].toUpperCase()}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="min-w-0">
                        <span className="font-bold truncate block text-[var(--text-primary)] leading-tight">{username}</span>
                        <span className="text-[9px] text-[var(--text-muted)] block font-mono capitalize">{userRole} role</span>
                      </div>
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                      title="Disconnect Sandbox Session"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Appearance mode toggle switch */}
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between p-1.5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase pl-1.5">Appearance</span>
                    <button 
                      onClick={toggleTheme}
                      className="p-1 px-2.5 text-[10px] bg-[var(--accent-bg)]/10 text-[var(--accent-bg)] border border-[var(--accent-bg)]/20 rounded-lg font-bold flex items-center gap-1 cursor-pointer hover:bg-[var(--accent-bg)]/20 transition-all"
                    >
                      {theme === "dark" ? (
                        <>
                          <Sun className="w-3 h-3" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3 h-3" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Main view viewport */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[var(--bg-app)]">
              {/* Header top row bar */}
              <header className="px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--bg-app)]/85 backdrop-blur-md gap-3">
                {/* Mobile sidebar trigger */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-[var(--border-color)] bg-[var(--bg-panel)]/40 hover:bg-[var(--purple-glow)]/10 shrink-0"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Search query inputs bar */}
                <div className="relative max-w-sm w-full hidden sm:block">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search policies catalog..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (currentPage !== "library") {
                        setCurrentPage("library");
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 glass-input"
                  />
                </div>

                <div className="flex items-center gap-4 ml-auto md:ml-auto">
                  {/* Live ticking clock */}
                  <div className="text-[10px] font-bold text-muted-foreground font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)]/40">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{liveTime || "Syncing clock..."}</span>
                  </div>

                  {/* Dark Mode toggle button */}
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-[var(--border-color)] bg-[var(--bg-panel)]/40"
                    title="Toggle Theme"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  {/* Notifications Alert Tray toggle */}
                  <div className="relative">
                    <button 
                      onClick={() => setNotifTrayOpen(!notifTrayOpen)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer relative border border-[var(--border-color)] bg-[var(--bg-panel)]/40"
                      title="System Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>

                    {/* Simple compact Dropdown Tray */}
                    <AnimatePresence>
                      {notifTrayOpen && (
                        <div className="absolute right-0 mt-2 w-80 p-4 rounded-2xl shadow-2xl z-50 space-y-3 border border-[var(--border-color)] bg-[var(--bg-card)]">
                          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                            <span className="text-xs font-black text-foreground">Governance Alerts</span>
                            <button 
                              onClick={() => {
                                const list = notifications.map(n => ({ ...n, read: true }));
                                updateNotificationsState(list);
                              }}
                              className="text-[9px] font-bold text-emerald-500 hover:underline"
                            >
                              Mark all as read
                            </button>
                          </div>

                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
                            {notifications.length > 0 ? (
                              notifications.map((n) => (
                                <div key={n.id} className={`p-2.5 rounded-xl flex items-start gap-2.5 border border-[var(--border-color)] ${!n.read ? "bg-emerald-500/[0.03]" : ""}`}>
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <div className="space-y-0.5">
                                    <h5 className="font-bold text-foreground leading-snug">{n.title}</h5>
                                    <p className="text-[11px] text-muted-foreground leading-normal">{n.message}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">All clear. No notifications.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </header>

              {/* Dynamic Pages Area */}
              <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  {currentPage === "library" && (
                    <PolicyLibrary 
                      policies={policies}
                      onSelectPolicy={handleSelectAndOpenDetail}
                      onSavePolicy={handleSavePolicy}
                      onDeletePolicy={handleDeletePolicy}
                      userRole={userRole}
                    />
                  )}
                  {(currentPage === "auditlogs" || currentPage === "employee-access") && (
                    <AuditLogs 
                      auditLogs={auditLogs}
                      onAddManualLog={handleAddManualLog}
                      users={users}
                      onAddUser={handleAddUser}
                    />
                  )}
                  {currentPage === "settings" && (
                    <Settings 
                      theme={theme}
                      onToggleTheme={toggleTheme}
                      defaultView={defaultView}
                      onChangeDefaultView={handleDefaultViewChange}
                      onExportData={handleExportData}
                      policies={policies}
                      onImportPolicies={updatePoliciesState}
                      onSyncOneDrive={handleSyncOneDrive}
                      username={username}
                      userRole={userRole}
                      users={users}
                      onAddUser={handleAddUser}
                    />
                  )}
                </AnimatePresence>
              </div>
            </main>

            {/* Sidebar drawer detail overlay */}
            <AnimatePresence>
              {selectedPolicyId && (
                <PolicyDetailModal 
                  policyId={selectedPolicyId}
                  policies={policies}
                  onClose={() => setSelectedPolicyId(null)}
                  onSaveAIAnalysis={handleSaveAIAnalysis}
                  onDeletePolicy={handleDeletePolicy}
                  userRole={userRole}
                />
              )}
            </AnimatePresence>

            {/* Custom Logout Confirmation Dialog */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowLogoutConfirm(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  >
                    {/* Modal Card */}
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      transition={{ type: "spring", duration: 0.4 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-sm rounded-2xl border border-zinc-200/10 dark:border-white/10 bg-[var(--bg-card)] p-6 shadow-2xl relative overflow-hidden text-center"
                    >
                      {/* Ambient header decoration */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500" />
                      
                      <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                        <LogOut className="w-6 h-6 animate-pulse" />
                      </div>

                      <h3 className="text-sm font-black text-foreground mb-2">
                        Disconnect Governance Session?
                      </h3>
                      <p className="text-xs text-muted-foreground leading-normal mb-6">
                        You are about to sign out from the WIS Policy Hub. Your active session token will be securely purged.
                      </p>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(false)}
                          className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-muted-foreground hover:text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmLogout}
                          className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/20"
                        >
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
