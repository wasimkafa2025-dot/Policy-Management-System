import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  History, UserCheck, Search, Plus, Shield, Mail, Calendar, 
  Trash2, UserPlus, KeyRound, Check, FileSpreadsheet, ShieldAlert
} from "lucide-react";
import { AuditLog } from "../types";

interface AuditLogsProps {
  auditLogs: AuditLog[];
  onAddManualLog: (action: string, details: string, policyTitle?: string) => void;
  users: { id: string; username: string; email?: string; role: 'admin' | 'user'; createdAt: string }[];
  onAddUser: (username: string, email: string, role: 'admin' | 'user', password?: string) => void;
}

export default function AuditLogs({ auditLogs, onAddManualLog, users, onAddUser }: AuditLogsProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "users">("logs");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  // Add Manual Log modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logAction, setLogAction] = useState("");
  const [logDetails, setLogDetails] = useState("");
  const [logPolicy, setLogPolicy] = useState("");

  // Add User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("WIS@123");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [userError, setUserError] = useState("");

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");

    if (!newUsername.trim()) {
      setUserError("Username is required");
      return;
    }

    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setUserError("A user with this username already exists.");
      return;
    }

    onAddUser(
      newUsername.trim(),
      newUserEmail.trim() || `${newUsername.trim().toLowerCase()}@wis-policy.com`,
      newUserRole,
      newUserPassword
    );

    // Reset Form
    setNewUsername("");
    setNewUserEmail("");
    setNewUserPassword("WIS@123");
    setNewUserRole("user");
    setIsUserModalOpen(false);
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logAction.trim() || !logDetails.trim()) return;

    onAddManualLog(logAction.trim(), logDetails.trim(), logPolicy.trim() || undefined);
    
    // Reset Form
    setLogAction("");
    setLogDetails("");
    setLogPolicy("");
    setIsLogModalOpen(false);
  };

  // Filters
  const filteredLogs = auditLogs.filter(log => {
    const text = `${log.action} ${log.details} ${log.user} ${log.policyTitle || ""}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const filteredUsers = users.filter(u => {
    const text = `${u.username} ${u.email || ""} ${u.role}`.toLowerCase();
    return text.includes(userSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
            <History className="w-6 h-6 text-purple-400" />
            Audit Logging & User Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Track system changes, register catalog operators, and configure role-based accessibility permissions.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "logs" ? (
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/15 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Manual Audit Event
            </button>
          ) : (
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/15 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add New User Account
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/10 dark:border-white/10 text-xs font-bold text-muted-foreground">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "logs" ? 'border-purple-500 text-foreground' : 'border-transparent hover:text-foreground'}`}
        >
          <History className="w-4 h-4" />
          System Audit Trails ({filteredLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === "users" ? 'border-purple-500 text-foreground' : 'border-transparent hover:text-foreground'}`}
        >
          <UserCheck className="w-4 h-4" />
          Manage Users ({users.length})
        </button>
      </div>

      {/* Primary Panels */}
      {activeTab === "logs" ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search audit trail by event action, details, policy, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 glass-input"
            />
          </div>

          {/* Audit Logs List Card */}
          <div className="border border-slate-200/10 dark:border-white/10 rounded-2xl overflow-hidden glass-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/40 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-bold">Timestamp</th>
                    <th className="py-3.5 px-4 font-bold">Operator / User</th>
                    <th className="py-3.5 px-4 font-bold">Governance Action</th>
                    <th className="py-3.5 px-4 font-bold">Referenced Policy</th>
                    <th className="py-3.5 px-4 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-foreground bg-purple-500/5 px-2 py-1 rounded-lg border border-purple-500/10 text-[11px]">
                            {log.user}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4 text-purple-400 font-semibold max-w-[150px] truncate">
                          {log.policyTitle || <span className="text-muted-foreground text-[11px] font-normal italic">None</span>}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground leading-relaxed max-w-xs font-sans">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No audit events matched your search filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Users Management View */
        <div className="space-y-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search user accounts by username, email, role..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 glass-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-5 border border-slate-200/10 dark:border-white/10 rounded-2xl space-y-4 glass-panel relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground text-sm">{user.username}</h4>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded-full ${
                      user.role === 'admin' ? 'text-purple-400 bg-purple-500/5 border-purple-500/10' : 'text-slate-400 bg-slate-500/5 border-slate-500/10'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-250/5 dark:border-white/5 pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="truncate">{user.email || `${user.username.toLowerCase()}@wis-policy.com`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Sandbox Hint */}
                <div className="text-[10px] bg-zinc-950/40 border border-zinc-900 p-2 rounded-xl text-muted-foreground flex justify-between items-center">
                  <span>Sandbox Sign In Password:</span>
                  <span className="font-mono text-purple-400 font-bold">WIS@123</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Add manual log modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 rounded-3xl border border-slate-200/10 dark:border-white/10 shadow-2xl glass-panel z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200/10 dark:border-white/10 pb-2">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-purple-400" />
                  Add Manual Audit Event
                </h3>
                <button onClick={() => setIsLogModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">Cancel</button>
              </div>

              <form onSubmit={handleAddLogSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">Event Action Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. OneDrive Document Audit, Compliance Meeting Review"
                    value={logAction}
                    onChange={(e) => setLogAction(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-foreground focus:outline-none focus:border-purple-500 glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">Optional Referenced Policy Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Code of Conduct"
                    value={logPolicy}
                    onChange={(e) => setLogPolicy(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-foreground focus:outline-none focus:border-purple-500 glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">Audit Details & Comments</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Provide specific notes regarding the action outcome or compliance check details..."
                    value={logDetails}
                    onChange={(e) => setLogDetails(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-foreground focus:outline-none focus:border-purple-500 glass-input leading-relaxed resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Write to Audit Log
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Add User account modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 rounded-3xl border border-slate-200/10 dark:border-white/10 shadow-2xl glass-panel z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200/10 dark:border-white/10 pb-2">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <UserPlus className="w-4.5 h-4.5 text-purple-400" />
                  Add New User Profile
                </h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">Cancel</button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">Username</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. JASONWIS"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-foreground focus:outline-none focus:border-purple-500 glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. jason@wis-policy.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-foreground focus:outline-none focus:border-purple-500 glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">Sandbox Sign In Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="WIS@123"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-foreground focus:outline-none focus:border-purple-500 glass-input"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">This password will be used to log in as this user on the sign-in screen.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase">System Accessibility Role</label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setNewUserRole("admin")}
                      className={`p-2.5 border rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${newUserRole === 'admin' ? 'border-purple-500 bg-purple-500/5 text-purple-400' : 'border-zinc-850 hover:border-zinc-800'}`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole("user")}
                      className={`p-2.5 border rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${newUserRole === 'user' ? 'border-purple-500 bg-purple-500/5 text-purple-400' : 'border-zinc-850 hover:border-zinc-800'}`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Standard User
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-400/90 leading-normal mt-1">
                    {newUserRole === 'user' 
                      ? "⚠️ Standard users have strictly read-only access: they cannot add, edit, delete policies, or trigger AI compliance audits."
                      : "✅ Administrators have full privileges: they can create/edit policies, manage active users, and trigger audits."
                    }
                  </p>
                </div>

                {userError && (
                  <div className="p-3 border border-rose-500/10 bg-rose-500/5 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Create & Save Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
