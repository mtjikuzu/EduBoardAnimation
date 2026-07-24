/**
 * Auth helpers for the EduWhiteboard frontend.
 *
 * Stores the active creator id and session metadata in localStorage.
 * In production this is replaced by Clerk's session/client library.
 */

const CREATOR_ID_KEY = "eduwb_creator_id";
const CREATOR_EMAIL_KEY = "eduwb_creator_email";
const CREATOR_NAME_KEY = "eduwb_creator_name";

export interface CreatorSession {
  id: number;
  email: string;
  name: string;
}

export function getSession(): CreatorSession | null {
  const id = localStorage.getItem(CREATOR_ID_KEY);
  const email = localStorage.getItem(CREATOR_EMAIL_KEY);
  const name = localStorage.getItem(CREATOR_NAME_KEY);
  if (id && email) {
    return { id: parseInt(id, 10), email, name: name ?? "" };
  }
  return null;
}

export function setSession(creator: CreatorSession): void {
  localStorage.setItem(CREATOR_ID_KEY, String(creator.id));
  localStorage.setItem(CREATOR_EMAIL_KEY, creator.email);
  localStorage.setItem(CREATOR_NAME_KEY, creator.name);
}

export function clearSession(): void {
  localStorage.removeItem(CREATOR_ID_KEY);
  localStorage.removeItem(CREATOR_EMAIL_KEY);
  localStorage.removeItem(CREATOR_NAME_KEY);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getAuthHeaders(): Record<string, string> {
  const session = getSession();
  if (session) {
    return { "X-Dev-Creator-Id": String(session.id) };
  }
  return {};
}
