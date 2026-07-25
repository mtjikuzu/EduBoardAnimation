// Dev-mode auth store. Production replaces this with Clerk.
let _creatorId: number | null = null
let _creatorEmail: string | null = null

export function getCreatorId(): number | null {
  if (_creatorId !== null) return _creatorId
  const stored = typeof window !== 'undefined' ? (window as any).__eduwb_creator_id : null
  return stored ?? null
}

export function setCreatorId(id: number, email: string) {
  _creatorId = id
  _creatorEmail = email
  if (typeof window !== 'undefined') {
    ;(window as any).__eduwb_creator_id = id
  }
}

export function getCreatorEmail(): string | null {
  return _creatorEmail
}
