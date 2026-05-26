import { AnalysisResult, ModuleType, User } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

function getToken() {
  return localStorage.getItem("truthguard_token");
}

function normalizeReport(report: any): AnalysisResult {
  return {
    id: report.id,
    module: report.module,
    fileName: report.originalName || report.fileName,
    originalName: report.originalName,
    verdict: report.verdict,
    confidence: Number(report.confidence || 0),
    risk: report.risk,
    status: report.status,
    createdAt: report.createdAt,
    reviewer: report.reviewer || "AI Analyst",
    notes: report.notes || "",

    modelId: report.modelId,
    modelName: report.modelName,
    aiServiceUsed: report.aiServiceUsed,
    fallbackUsed: report.fallbackUsed,
    scores: report.scores || {},
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const token = getToken();

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const payload: ApiResponse<T> = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "API request failed");
  }

  return payload.data;
}

export async function loginApi(email: string, password: string) {
  return request<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMeApi() {
  return request<{ user: User }>("/auth/me");
}

export async function getHealthApi() {
  return request<any>("/health");
}

export async function analyzeMediaApi(
  module: ModuleType,
  file: File,
  fields?: {
    notes?: string;
    modelId?: string;
    caseTitle?: string;
  }
) {
  const formData = new FormData();

  formData.append("file", file);

  if (fields?.notes) {
    formData.append("notes", fields.notes);
  }

  if (fields?.modelId) {
    formData.append("modelId", fields.modelId);
  }

  if (fields?.caseTitle) {
    formData.append("caseTitle", fields.caseTitle);
  }

  const report = await request<any>(`/${module}/analyze`, {
    method: "POST",
    body: formData,
  });

  return normalizeReport(report);
}

export async function getReportsApi(params?: {
  module?: ModuleType;
  risk?: string;
  status?: string;
}) {
  const query = new URLSearchParams();

  if (params?.module) query.set("module", params.module);
  if (params?.risk) query.set("risk", params.risk);
  if (params?.status) query.set("status", params.status);

  const endpoint = query.toString()
    ? `/reports?${query.toString()}`
    : "/reports";

  const reports = await request<any[]>(endpoint);

  return reports.map(normalizeReport);
}

export async function getReportApi(id: string) {
  const report = await request<any>(`/reports/${id}`);

  return normalizeReport(report);
}

export async function reviewReportApi(
  id: string,
  data: {
    status?: AnalysisResult["status"];
    reviewer?: string;
    notes?: string;
  }
) {
  const report = await request<any>(`/reports/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  return normalizeReport(report);
}

export async function deleteReportApi(id: string) {
  return request<{ deleted: boolean }>(`/reports/${id}`, {
    method: "DELETE",
  });
}

export async function getModelsApi() {
  return request<any[]>("/models");
}

export async function getModelHealthApi() {
  return request<any[]>("/models/health");
}

export async function getAuditApi(params?: {
  module?: string;
  severity?: string;
}) {
  const query = new URLSearchParams();

  if (params?.module) query.set("module", params.module);
  if (params?.severity) query.set("severity", params.severity);

  const endpoint = query.toString() ? `/audit?${query.toString()}` : "/audit";

  return request<any[]>(endpoint);
}

export async function createAuditApi(data: {
  action: string;
  module: "image" | "video" | "voice" | "system";
  severity?: "Info" | "Warning" | "High";
  metadata?: Record<string, unknown>;
}) {
  return request<any>("/audit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}