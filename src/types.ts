export type PolicyStatus = 'Draft' | 'Under Review' | 'Approved' | 'Archived' | 'Obsolete';

export interface DocumentAttachment {
  documentName: string;
  documentType: string;
  downloadURL: string;
  uploadDate: string;
  size: number;
}

export interface ProcedureLink {
  id: string;
  title: string;
  description: string;
  steps: string[];
  createdDate: string;
}

export interface FormLink {
  id: string;
  name: string;
  description: string;
  fields: string[];
  createdDate: string;
}

export interface AIChecklistItem {
  rule: string;
  status: 'Compliant' | 'Warning' | 'Non-Compliant';
  details: string;
  suggestion: string;
}

export interface AIAnalysisResult {
  summary: string;
  riskScore: number; // 0 to 100
  complexity: 'Low' | 'Medium' | 'High';
  readability: number; // 0 to 100
  recommendations: string[];
  checklist: AIChecklistItem[];
}

export interface Policy {
  id: string;
  code: string;
  title: string;
  department: 'HR' | 'Finance' | 'Operations' | 'Academics' | 'IT' | 'Administration';
  category: string;
  owner: string;
  effectiveDate: string;
  year: string;
  version: string;
  status: PolicyStatus;
  description: string;
  oneDriveLink?: string; // Connected OneDrive Tracking Link
  coverTitle?: string;
  coverDept?: string;
  coverYear?: string;
  coverColor?: string;
  coverIcon?: string;
  createdDate: string;
  updatedDate: string;
  documents: DocumentAttachment[];
  procedures?: ProcedureLink[];
  forms?: FormLink[];
  complianceScore?: number; // 0 to 100
  riskLevel?: 'Low' | 'Medium' | 'High';
  aiAnalysis?: AIAnalysisResult;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  createdAt: string;
  email?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  createdAt: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  policyId?: string;
  policyTitle?: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}
