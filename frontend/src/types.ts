export type Role = "analyst" | "reviewer" | "admin";

export type ModuleType = "image" | "video" | "voice";

export type Risk = "Low" | "Medium" | "High" | "Critical";

export type ReportStatus = "Completed" | "In Review" | "Flagged" | "Archived";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AnalysisResult {
  id: string;
  module: ModuleType;
  fileName: string;
  verdict: string;
  confidence: number;
  risk: Risk;
  status: ReportStatus;
  createdAt: string;
  reviewer: string;
  notes: string;

  originalName?: string;
  modelId?: string;
  modelName?: string;
  aiServiceUsed?: boolean;
  fallbackUsed?: boolean;

  scores?: {
    fakeProbability?: number;
    realProbability?: number;
    modelTopLabel?: string;
    modelPredictions?: Array<{
      label: string;
      score: number;
      percentage: number;
    }>;
    artifactScore?: number;
    edgeComplexity?: number;
    colorVariance?: number;
    textureFrequencyMismatch?: number;
    imageWidth?: number;
    imageHeight?: number;
    inferenceTimeMs?: number;
    modelId?: string;
    [key: string]: any;
  };
}

export interface ModelSlot {
  id: string;
  module: ModuleType | "all";
  name: string;
  provider: string;
  status: "Active" | "Standby" | "Training" | "Offline";
  accuracy: number;
  latency: string;
  endpoint?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  module: ModuleType | "system";
  time?: string;
  createdAt?: string;
  severity: "Info" | "Warning" | "High";
  metadata?: Record<string, any>;
}