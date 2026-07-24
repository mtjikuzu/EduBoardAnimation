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
