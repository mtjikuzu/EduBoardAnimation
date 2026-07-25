/**
 * API helpers with automatic auth headers.
 */
import { getAuthHeaders } from "./auth";

const BASE = "";

export interface ApiError {
  error: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return body as T;
}

// --- Creator API ---

export interface CreatorProfile {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
}

export async function signupCreator(email: string, name?: string): Promise<CreatorProfile> {
  return request<CreatorProfile>("/creators/signup", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}

export async function getMyProfile(): Promise<CreatorProfile> {
  return request<CreatorProfile>("/creators/me");
}

// --- Audit API ---

export interface AuditEvent {
  id: number;
  creatorId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function getAuditEvents(limit = 50): Promise<AuditEvent[]> {
  return request<AuditEvent[]>(`/audit/events?limit=${limit}`);
}

// --- Storyboard API ---

export interface SceneElement {
  type: string;
  content: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  drawOrder?: number;
  timingHint?: string;
}

export interface Scene {
  id: number;
  order: number;
  title: string;
  narration: string;
  durationSec: number;
  elements: SceneElement[];
}

export interface SafetyFlag {
  category: string;
  severity: "info" | "warning" | "block";
  message: string;
}

export interface StoryboardResult {
  id: number;
  lessonId: number;
  revision: number;
  status: string;
  briefText: string;
  scenes: Scene[];
  safetyFlags: SafetyFlag[];
  modelUsed: string;
  createdAt: string;
}

export async function generateStoryboard(lessonId: number, brief: string): Promise<StoryboardResult> {
  return request<StoryboardResult>("/storyboards/generate", {
    method: "POST",
    body: JSON.stringify({ lessonId, brief }),
  });
}

export interface ReviseStoryboardResult {
  revision: number;
  id: number;
  updatedScenes: Scene[];
  changedSceneIds: number[];
  explanation: string;
  elementCount: number;
}

export async function reviseStoryboard(
  storyboardId: number,
  edit: string,
): Promise<ReviseStoryboardResult> {
  const res = await fetch(BASE + "/api/agent/revision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ storyboardId, edit }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Revision failed" }));
    throw new Error(err.error || "Revision failed");
  }
  return res.json() as Promise<ReviseStoryboardResult>;
}

export async function getStoryboard(id: number): Promise<StoryboardResult> {
  return request<StoryboardResult>(`/storyboards/${id}`);
}

export async function getStoryboardsByLesson(lessonId: number): Promise<StoryboardResult[]> {
  return request<StoryboardResult[]>(`/storyboards?lessonId=${lessonId}`);
}

export async function updateStoryboardScenes(
  storyboardId: number,
  scenes: Scene[],
  changedSceneIds?: number[],
): Promise<StoryboardResult> {
  return request<StoryboardResult>(`/storyboards/${storyboardId}/scenes`, {
    method: "PATCH",
    body: JSON.stringify({ scenes, changedSceneIds }),
  });
}

export async function reorderStoryboardScenes(
  storyboardId: number,
  sceneIds: number[],
): Promise<StoryboardResult> {
  return request<StoryboardResult>(`/storyboards/${storyboardId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ sceneIds }),
  });
}

// --- Credit API ---

export interface CreditBalance {
  available: number;
  held: number;
  totalGrants: number;
}

export interface CreditLedgerEntry {
  id: number;
  creatorId: number;
  entryType: string;
  amount: string;
  balanceAfter: string;
  description: string;
  referenceType: string | null;
  referenceId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApproveRenderResult {
  approved: boolean;
  storyboardId: number;
  estimatedCost: number;
  availableAfterHold: number;
  holdDescription: string;
}

export async function getCreditBalance(): Promise<CreditBalance> {
  return request<CreditBalance>("/credits/balance");
}

export async function getCreditLedger(limit = 50): Promise<CreditLedgerEntry[]> {
  return request<CreditLedgerEntry[]>(`/credits/ledger?limit=${limit}`);
}

export async function approveRender(storyboardId: number): Promise<ApproveRenderResult> {
  return request<ApproveRenderResult>("/credits/approve-render", {
    method: "POST",
    body: JSON.stringify({ storyboardId }),
  });
}

export async function mockCheckout(amount: number): Promise<{
  success: boolean;
  creditsAdded: number;
  newBalance: number;
}> {
  return request("/credits/mock-checkout", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

// --- Render API ---

export interface RenderJobResult {
  jobId: number;
  status: string;
  outputUrl?: string;
}

export async function renderPreview(params: { storyboardId: number; sceneIndex: number }): Promise<RenderJobResult> {
  return request<RenderJobResult>("/renderer/preview", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function renderExport(params: { storyboardId: number }): Promise<RenderJobResult> {
  return request<RenderJobResult>("/renderer/export", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getRenderJob(jobId: number): Promise<{
  id: number;
  status: string;
  progress: string;
  outputUrl: string | null;
  errorMessage: string | null;
}> {
  return request(`/renderer/jobs/${jobId}`);
}

// --- YouTube API ---

export interface YouTubeConnectResult {
  url: string;
  note?: string;
}

export interface YouTubeUploadResult {
  success: boolean;
  videoId: string;
  watchUrl: string;
  privacyStatus: string;
}

export async function connectYouTube(): Promise<YouTubeConnectResult> {
  return request<YouTubeConnectResult>("/publish/youtube/connect", {
    method: "POST",
  });
}

export async function uploadToYouTube(params: {
  jobId: number;
  title: string;
  description: string;
  privacyStatus: string;
}): Promise<YouTubeUploadResult> {
  return request<YouTubeUploadResult>("/publish/youtube/upload", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
