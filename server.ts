import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent JSON storage file path
const DATA_FILE = path.join(process.cwd(), "data-store.json");

interface DataStore {
  policies: any[];
  notifications: any[];
  auditLogs: any[];
  users: any[];
}

const defaultStore: DataStore = {
  policies: [],
  notifications: [],
  auditLogs: [],
  users: [
    { id: "1", username: "HRWIS", password: "WIS@123", role: "admin", createdAt: "2026-01-01T00:00:00Z", email: "hr@wis-policy.com" },
    { id: "2", username: "USERWIS", password: "WIS@123", role: "user", createdAt: "2026-01-01T00:00:00Z", email: "user@wis-policy.com" }
  ]
};

function readStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading data store file:", err);
  }
  return defaultStore;
}

function writeStore(data: DataStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing data store file:", err);
  }
}

// Sync GET endpoint
app.get("/api/sync", (req, res) => {
  res.json(readStore());
});

// Sync POST endpoint
app.post("/api/sync", (req, res) => {
  try {
    const current = readStore();
    const { policies, notifications, auditLogs, users } = req.body;

    if (policies !== undefined) current.policies = policies;
    if (notifications !== undefined) current.notifications = notifications;
    if (auditLogs !== undefined) current.auditLogs = auditLogs;
    if (users !== undefined) current.users = users;

    writeStore(current);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("Error writing to sync data-store:", err);
    res.status(500).json({ error: err.message || "Failed to update sync store" });
  }
});

// Helper to get Gemini Client lazily
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please open Settings > Secrets and add your GEMINI_API_KEY.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ============================================================
// API ENDPOINTS
// ============================================================

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Policy analyzer endpoint (Metadata extraction & Governance check)
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { title, department, category, description, textContent } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Policy title and description are required for analysis." });
    }

    const ai = getGeminiClient();
    const prompt = `
Analyze the following policy document. Extract details, identify governance risks, grade its readability, and run an automated corporate policy compliance audit.

POLICY TITLE: ${title}
DEPARTMENT: ${department}
CATEGORY: ${category}
BRIEF DESCRIPTION: ${description}
FULL POLICY CONTENT (or extended details):
${textContent || "No additional text provided. Please base analysis on the title, category, and description."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert enterprise compliance auditor, corporate attorney, and legal risk analyst. You analyze policies for accuracy, readability, governance risks, and compliance, outputting structured JSON according to the requested schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A high-level executive summary of the policy (2-3 sentences)." },
            riskScore: { type: Type.INTEGER, description: "Compliance risk score from 0 (perfect compliance, no risk) to 100 (severe regulatory and operational risks)." },
            complexity: { type: Type.STRING, description: "The complexity level of the legal/corporate wording. Must be 'Low', 'Medium', or 'High'." },
            readability: { type: Type.INTEGER, description: "Language clarity/readability grade score from 0 (very dry/dense legal jargon) to 100 (exceptionally clear, easy for all staff)." },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 specific, actionable legal or administrative recommendations to improve the policy."
            },
            checklist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rule: { type: Type.STRING, description: "Standard governance check (e.g. Scope defined, Owner identified, Review cycle set, Version history present, Legal safeguards, Operational limits)." },
                  status: { type: Type.STRING, description: "Compliance status. Must be 'Compliant', 'Warning', or 'Non-Compliant'." },
                  details: { type: Type.STRING, description: "Detailed findings or evaluation of the policy against this rule." },
                  suggestion: { type: Type.STRING, description: "Actionable suggestion to resolve warning or non-compliant status (leave empty or write N/A if compliant)." }
                },
                required: ["rule", "status", "details"]
              },
              description: "Standard policy auditing checklist covering operational, legal, and clarity domains."
            }
          },
          required: ["summary", "riskScore", "complexity", "readability", "recommendations", "checklist"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from Gemini model.");
    }

    const jsonResult = JSON.parse(resultText);
    res.json(jsonResult);
  } catch (err: any) {
    console.error("Gemini Analysis Error:", err);
    res.status(500).json({
      error: err.message || "An unexpected error occurred during document analysis."
    });
  }
});

// 3. Framework-specific compliance auditor endpoint
app.post("/api/gemini/compliance", async (req, res) => {
  try {
    const { title, department, description, textContent, framework } = req.body;

    if (!title || !framework) {
      return res.status(400).json({ error: "Policy title and target compliance framework are required." });
    }

    const ai = getGeminiClient();
    const prompt = `
Perform a targeted compliance audit of this policy against the '${framework}' framework. 
Verify control objectives, check for mandatory disclosures, assess security/operational practices, and flag high-risk areas.

POLICY TITLE: ${title}
DEPARTMENT: ${department}
DESCRIPTION: ${description}
POLICY TEXT CONTENT:
${textContent || "No additional text content. Audit based on policy metadata."}

TARGET FRAMEWORK: ${framework}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are a certified information systems auditor and lead regulatory compliance officer specializing in industrial, security, financial, and digital privacy standards (including GDPR, HIPAA, SOC 2, OSHA, ISO 27001, and general corporate rules). audit the text against the requested standard.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            framework: { type: Type.STRING, description: "The compliance framework evaluated (e.g. SOC 2, GDPR, HIPAA, etc.)" },
            complianceScore: { type: Type.INTEGER, description: "Evaluated alignment score from 0 (completely non-aligned) to 100 (fully compliant with framework controls)." },
            summary: { type: Type.STRING, description: "A detailed 3-4 sentence audit brief describing the policy's alignment with the selected framework." },
            violations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific gaps, violations, or missing regulatory controls identified in the policy text."
            },
            checklist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  control: { type: Type.STRING, description: "Specific framework control section or control objective checked." },
                  status: { type: Type.STRING, description: "Status. Must be 'Compliant', 'Warning', or 'Non-Compliant'." },
                  findings: { type: Type.STRING, description: "Specific observations from the policy regarding this control objective." },
                  remediation: { type: Type.STRING, description: "Step-by-step guidance on how to update the policy text to meet this control requirement." }
                },
                required: ["control", "status", "findings"]
              },
              description: "Key control checklist evaluated against the specific compliance framework guidelines."
            }
          },
          required: ["framework", "complianceScore", "summary", "violations", "checklist"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response received from Gemini model.");
    }

    const jsonResult = JSON.parse(resultText);
    res.json(jsonResult);
  } catch (err: any) {
    console.error("Gemini Compliance Error:", err);
    res.status(500).json({
      error: err.message || "An unexpected error occurred during the compliance audit."
    });
  }
});

// 4. Compliance assistant chat endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, contextPolicies } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();

    // Prepare contextual information about existing policies to ground the conversation
    const policiesContext = contextPolicies && contextPolicies.length > 0 
      ? `Here is the current active policy database metadata to assist with context-aware compliance queries:\n` + 
        contextPolicies.map((p: any) => `- CODE: ${p.code}, TITLE: ${p.title}, DEPT: ${p.department}, STATUS: ${p.status}, VER: ${p.version}, DESC: ${p.description}`).join("\n")
      : "The active policy database is currently empty.";

    const systemInstruction = `You are the WIS Corporate Policy & Compliance Co-Pilot. Your role is to assist human resource managers, administrative officers, and risk directors with corporate compliance, draft reviews, legal risk guidance, policy structuring, and framework alignments (such as HIPAA, GDPR, SOC 2, OSHA, ISO 27001, etc.).

${policiesContext}

Provide professional, accurate, and concise compliance advisory answers. If suggesting text for a policy, format it clearly in markdown blocks. Use friendly, objective, professional tone.`;

    // Reconstruct the chat with history if provided, otherwise simple generation
    // To make things perfectly robust, we will query via generateContent with history formatted in contents
    const contents: any[] = [];
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({
      reply: response.text || "I was unable to formulate a response. Please try again."
    });
  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({
      error: err.message || "An error occurred with the AI Compliance Co-Pilot."
    });
  }
});

// ============================================================
// VITE / STATIC FILE ROUTING
// ============================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WIS Policy System server running on http://localhost:${PORT}`);
  });
}

startServer();
