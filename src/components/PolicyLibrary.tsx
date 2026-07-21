import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Grid, List, Plus, Search, BookOpen, Edit2, Trash2, ArrowUpDown, 
  Paintbrush, Paperclip, Calendar, User, FileText, 
  SlidersHorizontal, CheckCircle, Shield, AlertTriangle, 
  HelpCircle, UploadCloud, X, Check, Eye, Cloud, ExternalLink, QrCode,
  Award, ShieldCheck,
  Users, Coins, GraduationCap, Building, Laptop, Settings as SettingsIcon,
  TrendingUp, GitFork, HardDrive, Link,
  Sparkles, Target, GitBranch, Droplet, Sprout, Menu, Hexagon, Leaf, Folder, ClipboardList
} from "lucide-react";
import { Policy, PolicyStatus, DocumentAttachment, ProcedureLink, FormLink } from "../types";

// Supported departments
const DEPARTMENTS = ["HR", "Operations", "Finance", "Academics", "IT", "Administration"] as const;

// Preset Colors for Cover Generator
const PRESET_COLORS = [
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Golden Amber", hex: "#b8860b" },
  { name: "Emerald Forest", hex: "#0d6b3a" },
  { name: "Crimson Velvet", hex: "#6b1a2a" },
  { name: "Imperial Violet", hex: "#7B337E" },
  { name: "Slate Blue", hex: "#1a3a6b" },
  { name: "Charcoal Gray", hex: "#2e2e2e" },
  { name: "Teal Dream", hex: "#0d9488" },
  { name: "Royal Sapphire", hex: "#2563eb" },
  { name: "Warm Copper", hex: "#ca6a1f" },
  { name: "Wine Burgundy", hex: "#881337" },
  { name: "Olive Moss", hex: "#3f6212" },
  { name: "Electric Indigo", hex: "#4f46e5" },
  { name: "Rose Quartz", hex: "#be185d" },
  { name: "Ocean Breeze", hex: "#0284c7" },
  { name: "Deep Plum", hex: "#581c87" },
  { name: "Sunset Rust", hex: "#9a3412" },
  { name: "Midnight Onyx", hex: "#0f172a" },
  { name: "Sage Jade", hex: "#15803d" },
  { name: "Velvet Rose", hex: "#9f1239" },
  { name: "Antique Gold", hex: "#a16207" }
];

// Preset Icons for Cover Generator
const PRESET_ICONS = [
  { name: "HR", key: "hr", icon: Users },
  { name: "Finance", key: "finance", icon: Coins },
  { name: "Academic", key: "academic", icon: GraduationCap },
  { name: "Admin", key: "admin", icon: Building },
  { name: "IT", key: "it", icon: Laptop },
  { name: "Ops", key: "operations", icon: SettingsIcon },
  { name: "Security", key: "security", icon: Shield },
  { name: "Training", key: "training", icon: BookOpen },
  { name: "Compliance", key: "compliance", icon: CheckCircle },
  { name: "QA", key: "qa", icon: TrendingUp },
];

const getCoverIconComponent = (key: string) => {
  switch (key) {
    case "hr": return <Users className="w-4 h-4" />;
    case "finance": return <Coins className="w-4 h-4" />;
    case "academic": return <GraduationCap className="w-4 h-4" />;
    case "admin": return <Building className="w-4 h-4" />;
    case "it": return <Laptop className="w-4 h-4" />;
    case "operations": return <SettingsIcon className="w-4 h-4" />;
    case "security": return <Shield className="w-4 h-4" />;
    case "training": return <BookOpen className="w-4 h-4" />;
    case "compliance": return <CheckCircle className="w-4 h-4" />;
    case "qa": return <TrendingUp className="w-4 h-4" />;
    default: return <Users className="w-4 h-4" />;
  }
};

interface PolicyLibraryProps {
  policies: Policy[];
  onSelectPolicy: (id: string) => void;
  onSavePolicy: (policyData: Partial<Policy>) => void;
  onDeletePolicy: (id: string) => void;
  userRole?: "admin" | "user";
}

export default function PolicyLibrary({ 
  policies, 
  onSelectPolicy, 
  onSavePolicy, 
  onDeletePolicy,
  userRole = "admin"
}: PolicyLibraryProps) {
  const [view, setView] = useState<"grid" | "list" | "folder">("grid");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"effectiveDate" | "department" | "title">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy> | null>(null);
  const [activeQRLink, setActiveQRLink] = useState<{ url: string; title: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    department: "HR" as Policy["department"],
    category: "",
    owner: "",
    effectiveDate: "",
    year: new Date().getFullYear().toString(),
    version: "1.0",
    status: "Approved" as PolicyStatus,
    description: "",
    oneDriveLink: "", // Connected OneDrive Tracking Link
    // Cover settings
    coverTitle: "",
    coverDept: "",
    coverYear: new Date().getFullYear().toString(),
    coverColor: "#7B337E",
    coverIcon: "hr",
  });

  // File states
  const [attachedDocs, setAttachedDocs] = useState<DocumentAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Flowchart/workflow states
  const [attachedFlowcharts, setAttachedFlowcharts] = useState<DocumentAttachment[]>([]);
  const [isFlowchartUploading, setIsFlowchartUploading] = useState(false);
  const [flowchartProgress, setFlowchartProgress] = useState(0);

  // External links states
  const [externalLinks, setExternalLinks] = useState<{ id: string; type: "Google Drive" | "OneDrive" | "Google Sheets"; url: string }[]>([]);

  // Nested SOP Procedures and Digital Forms management inside policy modal
  const [modalProcedures, setModalProcedures] = useState<ProcedureLink[]>([]);
  const [modalForms, setModalForms] = useState<FormLink[]>([]);

  // Temp fields for Adding SOP
  const [newSopTitle, setNewSopTitle] = useState("");
  const [newSopDesc, setNewSopDesc] = useState("");
  const [newSopStep, setNewSopStep] = useState("");
  const [newSopStepsList, setNewSopStepsList] = useState<string[]>([]);

  // Temp fields for Adding Form
  const [newFormName, setNewFormName] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");
  const [newFormField, setNewFormField] = useState("");
  const [newFormFieldsList, setNewFormFieldsList] = useState<string[]>([]);

  // Filtered and Sorted Policies
  const filteredPolicies = useMemo(() => {
    const filtered = policies.filter(p => {
      const matchDept = !deptFilter || p.department === deptFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchYear = !yearFilter || p.year === yearFilter;
      const matchSearch = !searchTerm || 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchStatus && matchYear && matchSearch;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "effectiveDate") {
        const dateA = a.effectiveDate || "";
        const dateB = b.effectiveDate || "";
        comparison = dateA.localeCompare(dateB);
      } else if (sortBy === "department") {
        const deptA = a.department || "";
        const deptB = b.department || "";
        comparison = deptA.localeCompare(deptB);
      } else {
        const titleA = a.title || "";
        const titleB = b.title || "";
        comparison = titleA.localeCompare(titleB);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [policies, deptFilter, statusFilter, yearFilter, searchTerm, sortBy, sortOrder]);

  // Unique Years for Filter
  const availableYears = useMemo(() => {
    return [...new Set(policies.map(p => p.year).filter(Boolean))].sort();
  }, [policies]);

  const openAddModal = () => {
    const currentYear = new Date().getFullYear().toString();
    setFormData({
      title: "",
      department: "HR",
      category: "",
      owner: "HR",
      effectiveDate: new Date().toISOString().split("T")[0],
      year: currentYear,
      version: "1.0",
      status: "Approved",
      description: "",
      oneDriveLink: "",
      coverTitle: "",
      coverDept: "HR Department",
      coverYear: currentYear,
      coverColor: "#7B337E",
      coverIcon: "hr",
    });
    setAttachedDocs([]);
    setAttachedFlowcharts([]);
    setExternalLinks([]);
    setModalProcedures([]);
    setModalForms([]);
    setNewSopTitle("");
    setNewSopDesc("");
    setNewSopStep("");
    setNewSopStepsList([]);
    setNewFormName("");
    setNewFormDesc("");
    setNewFormField("");
    setNewFormFieldsList([]);
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Policy, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      title: p.title,
      department: p.department,
      category: p.category || "",
      owner: p.owner || "HR",
      effectiveDate: p.effectiveDate || "",
      year: p.year || "",
      version: p.version || "1.0",
      status: p.status,
      description: p.description || "",
      oneDriveLink: p.oneDriveLink || "",
      coverTitle: p.coverTitle || p.title,
      coverDept: p.coverDept || p.department,
      coverYear: p.coverYear || p.year,
      coverColor: p.coverColor || "#7B337E",
      coverIcon: p.coverIcon || "hr",
    });
    setAttachedDocs(p.documents || []);
    setAttachedFlowcharts([]);
    setModalProcedures(p.procedures || []);
    setModalForms(p.forms || []);
    setNewSopTitle("");
    setNewSopDesc("");
    setNewSopStep("");
    setNewSopStepsList([]);
    setNewFormName("");
    setNewFormDesc("");
    setNewFormField("");
    setNewFormFieldsList([]);
    
    const initialLinks: { id: string; type: "Google Drive" | "OneDrive" | "Google Sheets"; url: string }[] = [];
    if (p.oneDriveLink) {
      initialLinks.push({
        id: "onedrive-init",
        type: "OneDrive",
        url: p.oneDriveLink
      });
    }
    setExternalLinks(initialLinks);

    setEditingPolicy(p);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.department || !formData.owner) return;

    const firstLinkObj = externalLinks.find(link => link.url && link.url.trim() !== "");
    const resolvedOneDriveLink = formData.oneDriveLink.trim() !== "" ? formData.oneDriveLink : (firstLinkObj ? firstLinkObj.url : "");

    onSavePolicy({
      ...(editingPolicy?.id ? { id: editingPolicy.id } : {}),
      title: formData.title,
      department: formData.department,
      category: formData.category,
      owner: formData.owner,
      effectiveDate: formData.effectiveDate,
      year: formData.year,
      version: formData.version,
      status: formData.status,
      description: formData.description,
      oneDriveLink: resolvedOneDriveLink,
      coverTitle: formData.coverTitle || formData.title,
      coverDept: formData.coverDept || formData.department,
      coverYear: formData.coverYear || formData.year,
      coverColor: formData.coverColor,
      coverIcon: formData.coverIcon,
      documents: attachedDocs,
      procedures: modalProcedures,
      forms: modalForms,
    });

    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    // Simulated progress bar & uploading
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          const newDocs: DocumentAttachment[] = Array.from(files).map((f: any) => ({
            documentName: f.name,
            documentType: f.type || "application/pdf",
            downloadURL: "#",
            uploadDate: new Date().toISOString().split("T")[0],
            size: f.size
          }));
          setAttachedDocs(prevDocs => [...prevDocs, ...newDocs]);
          return 0;
        }
        return prev + 30;
      });
    }, 200);
  };

  const removeAttachment = (index: number) => {
    setAttachedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleFlowchartUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsFlowchartUploading(true);
    setFlowchartProgress(10);

    const timer = setInterval(() => {
      setFlowchartProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsFlowchartUploading(false);
          const newFlowcharts: DocumentAttachment[] = Array.from(files).map((f: any) => ({
            documentName: f.name,
            documentType: f.type || "application/pdf",
            downloadURL: "#",
            uploadDate: new Date().toISOString().split("T")[0],
            size: f.size
          }));
          setAttachedFlowcharts(prevFlows => [...prevFlows, ...newFlowcharts]);
          return 0;
        }
        return prev + 30;
      });
    }, 200);
  };

  const removeFlowchartAttachment = (index: number) => {
    setAttachedFlowcharts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[var(--accent-bg)]" />
            Policy Library
          </h1>
          <p className="text-xs text-muted-foreground">Manage, view, and organize institutional policies and regulations</p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Grid/List/Folder View Toggles */}
          <div className="flex border border-[var(--border-color)] p-1 rounded-xl bg-[var(--bg-panel)]/40 backdrop-blur">
            <button 
              onClick={() => { setView("grid"); setSelectedFolder(null); }} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${view === "grid" ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold shadow" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setView("list"); setSelectedFolder(null); }} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${view === "list" ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold shadow" : "text-muted-foreground hover:text-foreground"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setView("folder"); setSelectedFolder(null); }} 
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${view === "folder" ? "bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold shadow" : "text-muted-foreground hover:text-foreground"}`}
              title="Folder View"
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>

          {userRole !== "user" && (
            <button 
              onClick={openAddModal}
              className="px-4 py-2 bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Policy
            </button>
          )}
        </div>
      </div>

      {/* Modern Online Bookstore Library Stats Tracker Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Volumes */}
        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <BookOpen className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total Catalog Volumes</span>
            <div className="text-xl font-black text-foreground mt-0.5 tracking-tight">{policies.length} Policies</div>
            <p className="text-[10px] text-muted-foreground">Across institutional shelves</p>
          </div>
        </div>

        {/* Stat 2: Active Reviews */}
        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Award className="w-24 h-24 text-amber-500" />
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Under Active Review</span>
            <div className="text-xl font-black text-foreground mt-0.5 tracking-tight">
              {policies.filter(p => p.status === 'Draft' || p.status === 'Under Review').length} Volumes
            </div>
            <p className="text-[10px] text-muted-foreground">Drafts & revision drafts</p>
          </div>
        </div>

        {/* Stat 3: Compliant Catalog Ratio */}
        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-24 h-24 text-teal-500" />
          </div>
          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Compliance Index Score</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
              {Math.round(policies.reduce((acc, curr) => acc + (curr.complianceScore || 90), 0) / (policies.length || 1))}% Compliant
            </div>
            <p className="text-[10px] text-muted-foreground">Average security rating</p>
          </div>
        </div>

        {/* Stat 4: Department Shelves */}
        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-24 h-24 text-indigo-500" />
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Department Shelves</span>
            <div className="text-xl font-black text-foreground mt-0.5 tracking-tight">
              {new Set(policies.map(p => p.department)).size} Shelves
            </div>
            <p className="text-[10px] text-muted-foreground">Active structural silos</p>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="p-4 border border-[var(--border-color)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)]">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search key words, codes, departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-600 transition-colors glass-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <select 
            value={deptFilter} 
            onChange={(e) => { setDeptFilter(e.target.value); setSelectedFolder(null); }}
            className="px-3 py-2 border border-[var(--border-color)] rounded-xl text-xs text-muted-foreground font-semibold focus:outline-none focus:border-emerald-600 bg-[var(--bg-panel)] cursor-pointer"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border-color)] rounded-xl text-xs text-muted-foreground font-semibold focus:outline-none focus:border-emerald-600 bg-[var(--bg-panel)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Archived">Archived</option>
            <option value="Obsolete">Obsolete</option>
          </select>

          {/* Year Filter */}
          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border-color)] rounded-xl text-xs text-muted-foreground font-semibold focus:outline-none focus:border-emerald-600 bg-[var(--bg-panel)] cursor-pointer"
          >
            <option value="">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <span className="w-[1px] h-4 bg-[var(--border-color)] hidden sm:block" />

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-bold uppercase hidden xl:inline-block">Sort:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-[var(--border-color)] rounded-xl text-xs text-muted-foreground font-semibold focus:outline-none focus:border-emerald-600 bg-[var(--bg-panel)] cursor-pointer"
            >
              <option value="title">Title Policy</option>
              <option value="effectiveDate">Effective Date</option>
              <option value="department">Department</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="p-2 border border-[var(--border-color)] hover:border-emerald-500/30 rounded-xl bg-[var(--bg-panel)] text-muted-foreground hover:text-emerald-500 transition-all cursor-pointer flex items-center justify-center h-8 w-8 shrink-0"
              title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
            >
              <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sortOrder === "desc" ? "rotate-180 text-emerald-500" : ""}`} />
            </button>
          </div>

          <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden lg:block" />
        </div>
      </div>

      {/* ============================================================
          BENTO VISUAL TRACKER TEMPLATE
          ============================================================ */}

      {/* Policies Grid/List/Folder */}
      <AnimatePresence mode="popLayout">
        {view === "folder" && !selectedFolder ? (
          <motion.div
            key="folders-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {DEPARTMENTS.map((dept) => {
              const deptPolicies = filteredPolicies.filter(p => p.department === dept);
              const count = deptPolicies.length;
              const approvedCount = deptPolicies.filter(p => p.status === "Approved").length;

              return (
                <motion.div
                  key={dept}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedFolder(dept)}
                  className="rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--bg-card)] cursor-pointer hover:shadow-lg transition-all group relative flex flex-col justify-between h-44"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-emerald-950 transition-all">
                        <Folder className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        {approvedCount}/{count} Approved
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {dept} Department
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Folder containing structural governance guidelines.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-[10px] font-bold text-muted-foreground">
                    <span>{count} Total Policies</span>
                    <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">Explore →</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div>
            {view === "folder" && selectedFolder && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <button 
                    onClick={() => setSelectedFolder(null)}
                    className="hover:text-foreground text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Folders
                  </button>
                  <span>/</span>
                  <span className="text-foreground">{selectedFolder} Department</span>
                </div>
                <button 
                  onClick={() => setSelectedFolder(null)}
                  className="px-3 py-1 bg-emerald-850 text-amber-300 text-[11px] font-bold rounded-lg hover:bg-emerald-800 transition-all cursor-pointer"
                >
                  ← Back to Folders
                </button>
              </div>
            )}

            {(() => {
              const activePolicies = view === "folder" && selectedFolder
                ? filteredPolicies.filter(p => p.department === selectedFolder)
                : filteredPolicies;

              if (activePolicies.length > 0) {
                return (
                  <motion.div 
                    layout 
                    className={view === 'list' 
                      ? "space-y-4"
                      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                    }
                  >
                    {activePolicies.map((p) => {
                       const coverColor = p.coverColor || "#7B337E";
                       const isHovered = hoveredCardId === p.id;
                       const statusClass = 
                         p.status === 'Draft' ? 'border-zinc-800 text-zinc-400 bg-zinc-900/40' :
                         p.status === 'Under Review' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                         p.status === 'Approved' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                         p.status === 'Archived' ? 'border-zinc-500/20 text-zinc-400 bg-zinc-500/5' :
                         'border-rose-500/20 text-rose-400 bg-rose-500/5';

                       return (
                         <motion.div
                           key={p.id}
                           layout
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           transition={{ duration: 0.25 }}
                           onClick={() => onSelectPolicy(p.id)}
                           onMouseEnter={() => setHoveredCardId(p.id)}
                           onMouseLeave={() => setHoveredCardId(null)}
                           className={`rounded-2xl overflow-hidden cursor-pointer border bg-[var(--bg-card)] hover:shadow-xl transition-all duration-300 flex ${view === 'list' ? 'flex-row items-stretch p-4 gap-5' : 'flex-col h-[320px]'}`}
                           style={{
                             borderColor: isHovered ? coverColor : 'var(--border-color)',
                             boxShadow: isHovered ? `0 12px 24px -6px ${coverColor}25, 0 8px 16px -8px ${coverColor}20` : undefined,
                             backgroundColor: isHovered ? `${coverColor}05` : 'var(--bg-card)'
                           }}
                         >
                           {/* Grid/Folder List Cover */}
                            {view !== 'list' ? (
                             <div 
                               className="h-[175px] relative overflow-hidden flex items-center justify-center border-b transition-all duration-300" 
                               style={{ 
                                 background: `linear-gradient(135deg, ${coverColor}18, ${coverColor}05)`,
                                 borderBottomColor: `${coverColor}20`
                               }}
                             >
                               {/* Ambient colored glowing aura behind the book */}
                               <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 dark:opacity-45">
                                 <div 
                                   className="w-28 h-28 rounded-full blur-2xl transition-all duration-500 scale-125"
                                   style={{ 
                                     backgroundColor: coverColor,
                                     transform: isHovered ? 'scale(1.3)' : 'scale(1)'
                                   }} 
                                 />
                               </div>

                               {/* Elegant bookstore library shelf line */}
                               <div className="absolute bottom-0 inset-x-0 h-1 bg-white/[0.04] backdrop-blur-sm border-t border-white/5" />

                               <div className="relative group/book mt-1" style={{ perspective: '1000px' }}>
                                 {/* Silk Bookmark Ribbon */}
                                 <div 
                                   className="absolute bottom-[-12px] left-[32px] w-2 h-6 bg-amber-500/95 rounded-b shadow transition-all duration-300 origin-top z-10"
                                   style={{
                                     transform: isHovered 
                                       ? 'rotate(8deg) translateZ(8px) translateY(1px)' 
                                       : 'rotate(2deg) translateZ(-4px)',
                                   }}
                                 />

                                 {/* Realistic 3D paper page stack underneath - Outer page edge */}
                                 <div 
                                   className="absolute top-1 bottom-1 w-[114px] rounded-r bg-neutral-100 dark:bg-zinc-800 border-r border-y border-neutral-300 dark:border-zinc-700 transition-all duration-300"
                                   style={{
                                     transformStyle: 'preserve-3d',
                                     transform: isHovered
                                       ? 'rotateY(-18deg) rotateX(6deg) translateZ(4px) translateX(11px) scaleY(0.99)'
                                       : 'rotateY(-8deg) rotateX(3deg) translateZ(-5px) translateX(6px)',
                                     boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.15)'
                                   }}
                                 >
                                   {/* Page line pattern for realism */}
                                   <div className="absolute inset-y-0 right-0 w-3 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.06)_50%)] bg-[size:100%_4px] opacity-70 rounded-r" />
                                 </div>

                                 {/* Inner page edge layer for extra thickness */}
                                 <div 
                                   className="absolute top-2 bottom-2 w-[112px] rounded-r bg-white dark:bg-zinc-900 border-r border-y border-neutral-250 dark:border-zinc-755 transition-all duration-300"
                                   style={{
                                     transformStyle: 'preserve-3d',
                                     transform: isHovered
                                       ? 'rotateY(-14deg) rotateX(6deg) translateZ(8px) translateX(14px) scaleY(0.98)'
                                       : 'rotateY(-6deg) rotateX(3deg) translateZ(-10px) translateX(10px)',
                                   }}
                                 >
                                   {/* Page line pattern */}
                                   <div className="absolute inset-y-0 right-0 w-2 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.06)_50%)] bg-[size:100%_4px] opacity-50 rounded-r" />
                                 </div>

                                 {/* Primary Book bound cover */}
                                 <div 
                                   className="w-[116px] h-[152px] rounded-r shadow-2xl relative overflow-hidden flex flex-col justify-between p-3 text-white transition-all duration-300 select-none" 
                                   style={{ 
                                     backgroundColor: coverColor,
                                     transformStyle: 'preserve-3d',
                                     transform: isHovered 
                                       ? 'rotateY(-24deg) rotateX(6deg) translateZ(12px) scale(1.05)' 
                                       : 'rotateY(-12deg) rotateX(3deg) translateZ(0px)',
                                     boxShadow: isHovered 
                                       ? `18px 12px 28px -4px rgba(0,0,0,0.4), -4px 4px 12px -3px ${coverColor}50` 
                                       : `8px 6px 14px -4px rgba(0,0,0,0.3), -1px 2px 6px -4px ${coverColor}20`
                                   }}
                                 >
                                   {/* Left book joint crease shading */}
                                   <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none" />
                                   <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-white/10" />
                                   <div className="absolute left-3 top-0 bottom-0 w-[1px] bg-black/15" />
                                   
                                   {/* Embossed gold/silver premium highlights on hover */}
                                   <div 
                                     className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/20 transition-opacity duration-300"
                                     style={{ opacity: isHovered ? 0.4 : 0 }}
                                   />
                                   
                                   {/* Gloss sheen overlay */}
                                   <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.04] to-white/[0.12] pointer-events-none" />

                                   <div className="space-y-1 relative z-10">
                                     <span className="text-[7px] font-black uppercase tracking-wider bg-black/30 px-1.5 py-0.5 rounded inline-block text-amber-200 border border-white/5">{p.department}</span>
                                     <h4 className="text-[10px] font-black line-clamp-3 leading-normal tracking-tight text-white drop-shadow-md mt-1">{p.coverTitle || p.title}</h4>
                                   </div>
                                   
                                   <div className="flex items-center justify-between border-t border-white/20 pt-1 mt-auto text-[8px] font-mono relative z-10">
                                     <span className="font-bold tracking-wider">{p.code}</span>
                                     <span>v{p.version}</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                            ) : (
                             /* List view Cover */
                             <div className="relative shrink-0 flex items-center justify-center py-1 px-2">
                               {/* Miniature page stack under */}
                               <div className="absolute left-1 top-0.5 bottom-0.5 w-12 bg-neutral-200 dark:bg-zinc-800 rounded-r-md translate-x-2.5 rotate-[1deg] -z-10" />
                               <div 
                                 className="w-12 h-[76px] rounded-r shadow-lg relative overflow-hidden flex flex-col justify-between p-2 text-white transition-transform duration-300" 
                                 style={{ 
                                   backgroundColor: coverColor,
                                   transform: isHovered ? 'scale(1.05) translateY(-2px)' : 'none'
                                 }}
                                >
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
                                 <div className="text-[6px] uppercase font-black tracking-wider truncate opacity-85 text-amber-200">{p.department}</div>
                                 <h4 className="text-[8px] font-black line-clamp-2 leading-none text-white drop-shadow-sm mt-0.5">{p.coverTitle || p.title}</h4>
                                 <div className="text-[6px] font-mono opacity-85 mt-auto flex justify-between">
                                   <span>{p.code}</span>
                                 </div>
                               </div>
                             </div>
                            )}

                            {/* Info Section */}
                            <div className={`flex-1 flex flex-col justify-between ${view === 'list' ? 'p-1 gap-2' : 'p-4 h-[145px]'}`}>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span 
                                    className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${coverColor}15`,
                                      color: coverColor
                                    }}
                                  >
                                    {p.category}
                                  </span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 border rounded-full uppercase tracking-wider ${statusClass}`}>
                                    {p.status}
                                  </span>
                                </div>
                                <h3 
                                  className={`font-bold transition-colors ${view === 'list' ? 'text-sm mt-0.5' : 'text-xs mt-1.5'}`}
                                  style={{
                                    color: isHovered ? coverColor : 'var(--text-primary)'
                                  }}
                                >
                                  {p.title}
                                </h3>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-sans">{p.description}</p>
                              </div>

                              {/* Actions bar inside card */}
                              <div 
                                className="flex items-center justify-between border-t pt-2.5 text-[11px] text-muted-foreground mt-auto"
                                style={{ borderTopColor: `${coverColor}18` }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                                  <span>{p.year}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectPolicy(p.id);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer animate-none border"
                                    style={{
                                      backgroundColor: `${coverColor}15`,
                                      borderColor: `${coverColor}25`,
                                      color: coverColor,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = coverColor;
                                      e.currentTarget.style.color = '#ffffff';
                                      e.currentTarget.style.borderColor = coverColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = `${coverColor}15`;
                                      e.currentTarget.style.color = coverColor;
                                      e.currentTarget.style.borderColor = `${coverColor}25`;
                                    }}
                                    title="Open detailed policy record"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>

                                  {userRole !== "user" && (
                                    <>
                                      <button 
                                        onClick={(e) => openEditModal(p, e)}
                                        className="p-1.5 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-500 border border-transparent hover:border-amber-500/15 rounded-lg transition-all cursor-pointer"
                                        title="Edit Policy"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      {deleteConfirmId === p.id ? (
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeletePolicy(p.id);
                                              setDeleteConfirmId(null);
                                            }}
                                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] rounded-md transition-all cursor-pointer shadow-sm shadow-rose-950/25 border border-rose-700 animate-none"
                                            title="Confirm Deletion"
                                          >
                                            Confirm
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteConfirmId(null);
                                            }}
                                            className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-md transition-all cursor-pointer text-[9px] font-black"
                                            title="Cancel"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmId(p.id);
                                          }}
                                          className="p-1.5 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-transparent hover:border-rose-500/15 rounded-lg transition-all cursor-pointer"
                                          title="Delete Policy"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              </div>
                          </motion.div>
                       );
                    })}
                  </motion.div>
                );
              } else {
                return (
                  <div className="p-12 border border-dashed border-[var(--border-color)] rounded-2xl text-center space-y-4 bg-[var(--bg-card)]">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                    <h3 className="font-bold text-sm text-foreground">No Policies Found</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No documents matched your filtering criteria. Try adjusting filters or create a new policy draft.
                    </p>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl shadow-2xl flex flex-col z-10 scrollbar-thin scrollbar-thumb-zinc-800"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-20">
                <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--accent-bg)]" />
                  {editingPolicy ? "Edit Policy" : "Add New Policy"}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-[var(--purple-glow)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] bg-[var(--bg-input)] rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-6 bg-[var(--bg-card)]">
                
                {/* SECTION 1: BASIC INFORMATION */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#94a3b8]" />
                    BASIC INFORMATION
                  </h4>
                  
                  {/* Title * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter policy title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value, coverTitle: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                    />
                  </div>

                  {/* Department and Category (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Department *</label>
                      <div className="relative">
                        <select 
                          required
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value as Policy["department"], coverDept: `${e.target.value} Dept` }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] transition-all cursor-pointer appearance-none"
                        >
                          {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{d}</option>)}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#505a6e] text-[8px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Category</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Compliance, Safety"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Owner and Effective Date (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Owner *</label>
                      <div className="relative">
                        <select 
                          required
                          value={formData.owner}
                          onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] transition-all cursor-pointer appearance-none"
                        >
                          <option value="HR" className="bg-[var(--bg-card)] text-[var(--text-primary)]">HR</option>
                          <option value="Finance" className="bg-[var(--bg-card)] text-[var(--text-primary)]">Finance</option>
                          <option value="Legal" className="bg-[#181f30]" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>Legal</option>
                          <option value="Academic Board" className="bg-[#181f30]" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>Academic Board</option>
                          <option value="IT Governance" className="bg-[#181f30]" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>IT Governance</option>
                          <option value="Operations Board" className="bg-[#181f30]" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>Operations Board</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#505a6e] text-[8px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Effective Date</label>
                      <input 
                        type="date" 
                        value={formData.effectiveDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Year and Version (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Year *</label>
                      <div className="relative">
                        <select 
                          required
                          value={formData.year}
                          onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value, coverYear: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] transition-all cursor-pointer appearance-none"
                        >
                          <option value="2024" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2024</option>
                          <option value="2025" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2025</option>
                          <option value="2026" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2026</option>
                          <option value="2027" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2027</option>
                          <option value="2028" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2028</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#505a6e] text-[8px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Version</label>
                      <input 
                        type="text" 
                        placeholder="1.0"
                        value={formData.version}
                        onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                      />
                    </div>
                  </div>


                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter policy description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all resize-none"
                    />
                  </div>

                  {/* Connected Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Connected OneDrive Tracking / File Link</label>
                    <input 
                      type="url" 
                      placeholder="https://onedrive.live.com/... or any shared file link"
                      value={formData.oneDriveLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, oneDriveLink: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                    />
                  </div>
                </div>

                {/* SECTION 2: POLICY COVER GENERATOR */}
                <div className="p-5 border border-[var(--border-color)] bg-[var(--bg-panel)]/40 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 pb-1.5 border-b border-[var(--border-color)]">
                    <Paintbrush className="w-4 h-4 text-amber-500" />
                    POLICY COVER GENERATOR
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left: Customizer controls */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Cover Title</label>
                        <input 
                          type="text" 
                          placeholder="Policy Title"
                          value={formData.coverTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, coverTitle: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--text-secondary)]">Department for Cover</label>
                          <div className="relative">
                            <select 
                              value={formData.coverDept}
                              onChange={(e) => setFormData(prev => ({ ...prev, coverDept: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] transition-all cursor-pointer appearance-none"
                            >
                              {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{d}</option>)}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#505a6e] text-[8px]">
                              ▼
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--text-secondary)]">Year for Cover</label>
                          <div className="relative">
                            <select 
                              value={formData.coverYear}
                              onChange={(e) => setFormData(prev => ({ ...prev, coverYear: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-bg)] transition-all cursor-pointer appearance-none"
                            >
                              <option value="2024" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2024</option>
                              <option value="2025" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2025</option>
                              <option value="2026" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2026</option>
                              <option value="2027" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2027</option>
                              <option value="2028" className="bg-[var(--bg-card)] text-[var(--text-primary)]">2028</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#505a6e] text-[8px]">
                              ▼
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cover Color Picker */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block">Cover Color</label>
                        <div className="flex flex-wrap gap-2.5">
                          {PRESET_COLORS.map(c => (
                            <button 
                              key={c.hex}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, coverColor: c.hex }))}
                              className={`w-6 h-6 rounded-full border transition-all ${formData.coverColor === c.hex ? 'border-white scale-110 ring-2 ring-[var(--accent-bg)]/40' : 'border-transparent'}`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Cover Icon Picker Grid */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block">Cover Icon</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {PRESET_ICONS.map(i => {
                            return (
                              <button 
                                key={i.key}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, coverIcon: i.key }))}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all truncate text-center ${formData.coverIcon === i.key ? 'border-[var(--accent-bg)] bg-[var(--accent-bg)]/10 text-[var(--text-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'}`}
                                title={i.name}
                              >
                                {i.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Cover 3D Book Preview */}
                    <div className="md:col-span-5 flex items-center justify-center p-4">
                      <div 
                        className="w-[160px] h-[215px] rounded-r-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 text-white border-y border-r border-white/10 transition-all duration-300" 
                        style={{ 
                          backgroundColor: formData.coverColor,
                          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 4px 0 10px rgba(255, 255, 255, 0.15)"
                        }}
                      >
                        {/* Spine 3D shading lines */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent shadow-inner" />
                        <div className="absolute left-[1px] top-0 bottom-0 w-[1px] bg-white/20" />
                        <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-black/15" />
                        <div className="absolute left-[4px] top-0 bottom-0 w-[1px] bg-white/10" />

                        {/* Top-Right Decorative Corner Frame line exactly as in screenshot */}
                        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/40 rounded-tr" />

                        {/* Center Card Content containing file icon, Title, Dept, Year */}
                        <div className="my-auto flex flex-col items-center text-center space-y-2.5 z-10 px-2 mt-4">
                          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-md">
                            {getCoverIconComponent(formData.coverIcon)}
                          </div>
                          
                          <div className="space-y-1 w-full">
                            <h4 className="text-[11px] font-black tracking-tight leading-snug line-clamp-3 uppercase text-white min-h-[33px] flex items-center justify-center">
                              {formData.coverTitle || formData.title || "Policy Title"}
                            </h4>
                            <div className="w-8 h-[2px] bg-white/30 mx-auto rounded" />
                            <p className="text-[8px] font-bold tracking-widest uppercase text-white/85 truncate">
                              {formData.coverDept || formData.department}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Metadata: Year */}
                        <div className="text-center z-10 pt-2 border-t border-white/10">
                          <span className="text-[10px] font-black tracking-widest font-mono text-white/90">
                            {formData.coverYear}
                          </span>
                        </div>
                        
                        {/* Front cover glossy sheen layer */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.02] to-white/[0.08] pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: DOCUMENT ATTACHMENTS */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-[var(--text-muted)]" />
                    DOCUMENT ATTACHMENTS
                  </h4>

                  <div className="relative border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-bg)]/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-input)]/30 hover:bg-[var(--bg-input)]/50 group">
                    <input 
                      type="file" 
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2.5">
                      <div className="p-3 bg-[var(--accent-bg)]/5 rounded-2xl inline-block border border-[var(--border-color)] group-hover:border-[var(--accent-bg)]/20 transition-all">
                        <UploadCloud className="w-6 h-6 text-[var(--accent-bg)] group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Click to upload or drag and drop</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-none">PDF, JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  {/* Document upload status bar */}
                  {isUploading && (
                    <div className="space-y-2 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)]">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-bold">
                        <span>Processing and attaching files...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[var(--bg-card)] h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-bg)] rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Listed document attachments */}
                  {attachedDocs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                      {attachedDocs.map((doc, idx) => (
                        <div key={idx} className="p-2.5 border border-[var(--border-color)] bg-[var(--bg-input)]/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-[var(--accent-bg)] shrink-0" />
                            <span className="font-semibold text-[var(--text-primary)] truncate">{doc.documentName}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="p-1 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 4: FLOWCHART / WORKFLOW ATTACHMENTS */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-2">
                    <GitFork className="w-4 h-4 text-[var(--text-muted)] rotate-90" />
                    FLOWCHART / WORKFLOW ATTACHMENTS
                  </h4>

                  <div className="relative border-2 border-dashed border-[var(--border-color)] hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-input)]/30 hover:bg-[var(--bg-input)]/50 group">
                    <input 
                      type="file" 
                      multiple
                      onChange={handleFlowchartUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2.5">
                      <div className="p-3 bg-amber-500/5 rounded-2xl inline-block border border-amber-500/10 group-hover:border-amber-500/20 transition-all">
                        <GitFork className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform rotate-90" />
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Upload flowchart or workflow diagram</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-none">PDF, JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  {/* Flowchart upload status bar */}
                  {isFlowchartUploading && (
                    <div className="space-y-2 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)]">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-bold">
                        <span>Attaching flowchart diagram...</span>
                        <span>{flowchartProgress}%</span>
                      </div>
                      <div className="w-full bg-[var(--bg-card)] h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${flowchartProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Listed flowchart attachments */}
                  {attachedFlowcharts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                      {attachedFlowcharts.map((flow, idx) => (
                        <div key={idx} className="p-2.5 border border-[var(--border-color)] bg-[var(--bg-input)]/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <GitFork className="w-4 h-4 text-amber-500 shrink-0 rotate-90" />
                            <span className="font-semibold text-[var(--text-primary)] truncate">{flow.documentName}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFlowchartAttachment(idx)}
                            className="p-1 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 5: EXTERNAL LINK ATTACHMENTS */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Link className="w-4 h-4 text-[var(--text-muted)]" />
                    EXTERNAL LINK ATTACHMENTS
                  </h4>

                  {/* Dynamic Added Links List */}
                  {externalLinks.length > 0 && (
                    <div className="space-y-2.5">
                      {externalLinks.map((link) => {
                        // Compute icon and pill style based on link type
                        let badgeStyle = "bg-sky-500/10 dark:bg-[#0f2334] border-sky-500/20 dark:border-[#1d4f73] text-sky-600 dark:text-[#38bdf8]";
                        let TypeIcon = Cloud;
                        
                        if (link.type === "Google Drive") {
                          badgeStyle = "bg-emerald-500/10 dark:bg-[#142921] border-emerald-500/20 dark:border-[#1b6241] text-emerald-600 dark:text-[#4ade80]";
                          TypeIcon = HardDrive;
                        } else if (link.type === "Google Sheets") {
                          badgeStyle = "bg-teal-500/10 dark:bg-[#122421] border-teal-500/20 dark:border-[#227263] text-teal-600 dark:text-[#2dd4bf]";
                          TypeIcon = FileText;
                        }

                        return (
                          <div key={link.id} className="flex items-center gap-2">
                            {/* Type badge on left */}
                            <div className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${badgeStyle}`}>
                              <TypeIcon className="w-3.5 h-3.5" />
                              {link.type}
                            </div>

                            {/* URL input in the middle */}
                            <input 
                              type="url" 
                              placeholder="Paste link URL here..."
                              value={link.url}
                              onChange={(e) => {
                                const updatedVal = e.target.value;
                                setExternalLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: updatedVal } : l));
                              }}
                              className="flex-1 px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-bg)] transition-all"
                            />

                            {/* Trash button on right */}
                            <button 
                              type="button"
                              onClick={() => {
                                setExternalLinks(prev => prev.filter(l => l.id !== link.id));
                              }}
                              className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-rose-500/30 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                              title="Delete Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Button rail below links to add more links */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setExternalLinks(prev => [
                          ...prev, 
                          { id: `gdrive-${Date.now()}`, type: "Google Drive", url: "" }
                        ]);
                      }}
                      className="px-3 py-2 bg-emerald-500/10 dark:bg-[#14231d] hover:bg-emerald-500/20 dark:hover:bg-[#1a382b] border border-emerald-500/20 dark:border-[#1b6241]/40 text-emerald-600 dark:text-[#4ade80] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      Add Google Drive
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setExternalLinks(prev => [
                          ...prev, 
                          { id: `onedrive-${Date.now()}`, type: "OneDrive", url: "" }
                        ]);
                      }}
                      className="px-3 py-2 bg-sky-500/10 dark:bg-[#0f2030] hover:bg-sky-500/20 dark:hover:bg-[#15314d] border border-sky-500/20 dark:border-[#1d4f73]/40 text-sky-600 dark:text-[#38bdf8] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      Add OneDrive
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setExternalLinks(prev => [
                          ...prev, 
                          { id: `gsheets-${Date.now()}`, type: "Google Sheets", url: "" }
                        ]);
                      }}
                      className="px-3 py-2 bg-teal-500/10 dark:bg-[#122421] hover:bg-teal-500/20 dark:hover:bg-[#1a3d37] border border-teal-500/20 dark:border-[#227263]/40 text-teal-600 dark:text-[#2dd4bf] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Add Google Sheets
                    </button>
                  </div>
                </div>





                {/* Actions Row */}
                <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5 bg-[var(--bg-card)] sticky bottom-0 z-10">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-[var(--border-color)] hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold rounded-xl transition-all cursor-pointer bg-[var(--bg-card)]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-[var(--accent-bg)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {editingPolicy ? "Save Changes" : "Create Policy"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick-Scan Document QR Code Popover Modal */}
      <AnimatePresence>
        {activeQRLink && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveQRLink(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-6 sm:p-7 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 border border-indigo-500/10 z-10"
            >
              <button 
                onClick={() => setActiveQRLink(null)}
                className="absolute top-4.5 right-4.5 p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full cursor-pointer transition-all"
                title="Close Scanner"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  Mobile Document Scan
                </span>
                <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider line-clamp-2 leading-tight pt-1">
                  {activeQRLink.title}
                </h4>
              </div>

              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeQRLink.url)}`} 
                  alt="Document Quick Scan Link" 
                  referrerPolicy="no-referrer"
                  className="w-[180px] h-[180px] object-contain rounded-lg block"
                />
              </div>

              <div className="space-y-2 w-full text-xs text-zinc-700">
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Point your mobile device's camera at this QR code to instantly review the official policy document on the go.
                </p>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a 
                    href={activeQRLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    Open Document
                  </a>
                  <a 
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(activeQRLink.url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
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
