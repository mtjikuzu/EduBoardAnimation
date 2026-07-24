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
