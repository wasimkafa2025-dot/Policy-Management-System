import { Policy, SystemNotification, AuditLog, UserAccount } from "../types";

export const initialUsers: UserAccount[] = [
  { id: "1", username: "HRWIS", password: "WIS@123", role: "admin", createdAt: "2026-01-01T00:00:00Z", email: "hr@wis-policy.com" },
  { id: "2", username: "USERWIS", password: "WIS@123", role: "user", createdAt: "2026-01-01T00:00:00Z", email: "user@wis-policy.com" }
];

export const initialPolicies: Policy[] = [
  {
    id: "1",
    code: "WIS-POLICY-1001",
    title: "Recruitment Policy and Procedure",
    department: "HR",
    category: "Recruitment",
    owner: "HR Department",
    effectiveDate: "2026-07-21",
    year: "2026",
    version: "1.0",
    status: "Approved",
    description: "Comprehensive policy and procedures governing employee recruitment, selection, candidate assessment, appointment declarations, and onboarding standards for Western International School.",
    oneDriveLink: "https://westernedukh-my.sharepoint.com/personal/hrcd_western_edu_kh/_layouts/15/onedrive.aspx",
    coverTitle: "Recruitment Policy and Procedure",
    coverDept: "HR Department",
    coverYear: "2026",
    coverColor: "#ca6a1f",
    coverIcon: "hr",
    createdDate: "2026-07-21T01:53:14.895Z",
    updatedDate: "2026-07-24T06:13:53.271Z",
    documents: [],
    procedures: [
      {
        id: "p1",
        title: "Staff Selection & Interview Workflow",
        description: "Standard operating steps for conducting structured panel interviews and background verification.",
        steps: [
          "Post job announcement internally and via official career portal",
          "Filter applications according to minimum educational requirements",
          "Conduct round 1 preliminary screening interview",
          "Perform mandatory credential & background verification",
          "Issue formal employment offer letter and appointment declaration"
        ],
        createdDate: "2026-07-21"
      }
    ],
    forms: [
      {
        id: "f1",
        name: "Appointment Declaration Form",
        description: "Standard candidate declaration form required prior to final onboarding.",
        fields: ["Full Name", "Position Applied", "National ID / Passport", "Declaration Checkbox", "Signature"],
        createdDate: "2026-07-21"
      }
    ],
    complianceScore: 92,
    riskLevel: "Low",
    aiAnalysis: {
      summary: "The Recruitment Policy complies with standard labor regulations and institutional hiring governance. Transparency and candidate screening criteria are well outlined.",
      riskScore: 15,
      complexity: "Medium",
      readability: 88,
      recommendations: [
        "Include explicit timelines for background check completions.",
        "Add digital sign-off procedures for remote onboarding candidates."
      ],
      checklist: [
        { rule: "Non-Discrimination & Equal Opportunity", status: "Compliant", details: "Clear statement prohibiting bias during hiring.", suggestion: "N/A" },
        { rule: "Background Verification Clause", status: "Compliant", details: "Mandatory verification required before contract execution.", suggestion: "N/A" },
        { rule: "Data Privacy & Candidate Confidentiality", status: "Warning", details: "Candidate document retention period is not explicitly defined.", suggestion: "Specify candidate data retention policy (e.g. 1 year)." }
      ]
    }
  },
  {
    id: "2",
    code: "WIS-POLICY-1002",
    title: "Staff Performance Evaluation & Development",
    department: "HR",
    category: "Performance",
    owner: "HR Department",
    effectiveDate: "2026-01-15",
    year: "2026",
    version: "2.0",
    status: "Approved",
    description: "Guidelines and cycle schedules for academic and administrative staff performance appraisals, KPI reviews, and professional growth programs.",
    coverTitle: "Staff Performance & Appraisals",
    coverDept: "HR Department",
    coverYear: "2026",
    coverColor: "#2563eb",
    coverIcon: "growth",
    createdDate: "2026-01-15T08:00:00.000Z",
    updatedDate: "2026-01-15T08:00:00.000Z",
    documents: [],
    complianceScore: 95,
    riskLevel: "Low"
  },
  {
    id: "3",
    code: "WIS-POLICY-1003",
    title: "Campus Security & Safety Guidelines",
    department: "Operations",
    category: "Security",
    owner: "Operations Department",
    effectiveDate: "2026-03-01",
    year: "2026",
    version: "1.2",
    status: "Approved",
    description: "Campus access control protocols, visitor registration procedures, emergency evacuation drills, and incident reporting mechanisms.",
    coverTitle: "Campus Security Guidelines",
    coverDept: "Operations Department",
    coverYear: "2026",
    coverColor: "#059669",
    coverIcon: "shield",
    createdDate: "2026-03-01T09:30:00.000Z",
    updatedDate: "2026-03-01T09:30:00.000Z",
    documents: [],
    complianceScore: 90,
    riskLevel: "Medium"
  }
];

export const initialNotifications: SystemNotification[] = [
  {
    id: "n1",
    title: "System Initialization",
    message: "HRWIS Western International School Governance Suite initialized successfully.",
    type: "purple",
    createdAt: "2026-07-24T00:00:00Z",
    read: false
  },
  {
    id: "n2",
    title: "Policy Update",
    message: "Recruitment Policy and Procedure (WIS-POLICY-1001) state validated.",
    type: "green",
    createdAt: "2026-07-24T06:13:53Z",
    read: true
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    policyId: "1",
    policyTitle: "Recruitment Policy and Procedure",
    action: "Policy Approved & Released",
    user: "HRWIS",
    timestamp: "2026-07-24T06:13:53Z",
    details: "Approved for Western International School campus distribution."
  },
  {
    id: "audit-2",
    policyId: "2",
    policyTitle: "Staff Performance Evaluation & Development",
    action: "Policy Cataloged",
    user: "HRWIS",
    timestamp: "2026-01-15T08:00:00Z",
    details: "Version 2.0 registered in active catalog."
  }
];

