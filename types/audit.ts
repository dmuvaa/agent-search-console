export type Severity = "critical" | "high" | "medium" | "low";
export type IssueSource = "detected" | "ai";
export type SiteKind = "commerce" | "saas" | "booking" | "services" | "content" | "unknown";
export type ScoreRating = "Excellent" | "Strong" | "Good" | "Needs improvement" | "Poor";
export type TaskStatus = "success" | "failed" | "partial";
export type WebMcpVerification = "declared" | "script_signal" | "unverified" | "absent_declared";

export type CategoryKey =
  | "discoverability"
  | "workflow"
  | "webmcp"
  | "toolQuality"
  | "taskSuccess";

export interface CategoryScores {
  discoverability: number;
  workflow: number;
  webmcp: number;
  toolQuality: number;
  taskSuccess: number;
}

export interface Heading {
  level: number;
  text: string;
}

export interface ExtractedLink {
  href: string;
  text: string;
}

export interface ExtractedInput {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface ExtractedForm {
  action: string;
  method: string;
  toolName: string;
  toolDescription: string;
  inputs: ExtractedInput[];
}

export interface ExtractedButton {
  text: string;
  type: string;
  ariaLabel: string;
}

export interface DeclaredWebMcpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

export interface PageExtract {
  url: string;
  status: number;
  title: string;
  metaDescription: string;
  headings: Heading[];
  links: ExtractedLink[];
  buttons: ExtractedButton[];
  forms: ExtractedForm[];
  navItems: string[];
  landmarks: string[];
  jsonLdTypes: string[];
  ariaLabels: string[];
  tables: number;
  declaredTools: DeclaredWebMcpTool[];
  webmcpSignals: string[];
  scriptHints: string[];
  textSample: string;
}

export interface WorkflowSignal {
  id: string;
  label: string;
  present: boolean;
  evidence: string;
}

export interface ToolQualityFinding {
  name: string;
  score: number;
  description: string;
  inputSchema?: Record<string, unknown>;
  problems: string[];
}

export interface Issue {
  id: string;
  severity: Severity;
  category: CategoryKey | "general";
  title: string;
  problem: string;
  whyItMatters: string;
  recommendation: string;
  affectedWorkflow: string;
  suggestedTool?: {
    name: string;
    description: string;
    inputs: { name: string; type: string; description: string; required: boolean }[];
  };
  implementation: string;
  source: IssueSource;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  source: IssueSource;
  toolName?: string;
}

export interface TaskStep {
  order: number;
  action: string;
  tool?: string;
  ok: boolean;
  detail: string;
}

export interface TaskResult {
  id: string;
  title: string;
  template: string;
  status: TaskStatus;
  durationMs: number;
  toolsUsed: string[];
  steps: TaskStep[];
  result: string;
  failurePoint?: string;
  reason?: string;
}

export interface AiAnalysis {
  purpose: string;
  journeys: string[];
  importantActions: string[];
  missingCapabilities: string[];
  recommendedTools: { name: string; description: string; reason: string }[];
  usedLlm: boolean;
  error?: string;
}

export interface AuditReport {
  id: string;
  url: string;
  host: string;
  analyzedAt: string;
  siteKind: SiteKind;
  score: number;
  rating: ScoreRating;
  categories: CategoryScores;
  issues: Issue[];
  recommendations: Recommendation[];
  workflows: WorkflowSignal[];
  tools: ToolQualityFinding[];
  webmcp: {
    verification: WebMcpVerification;
    note: string;
    declaredCount: number;
    signals: string[];
  };
  pages: {
    url: string;
    title: string;
    status: number;
  }[];
  warnings: string[];
  ai: AiAnalysis;
  tasks: TaskResult[];
  generatedTools: {
    name: string;
    description: string;
    schema: Record<string, unknown>;
    implementation: string;
  }[];
}
