import { cookies } from "next/headers"

export type AppSession = {
  userId: string
  email: string
  role: "subscriber_admin" | "client_user"
  subscriberId: string | null
  clientId: string | null
  displayName: string
}

const COOKIE_NAME = "palsys_session"

export function encodeSession(session: AppSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url")
}

export function decodeSession(value: string): AppSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AppSession

    if (!parsed.userId || !parsed.email || !parsed.role) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)

  if (!raw?.value) {
    return null
  }

  return decodeSession(raw.value)
}

export function getSessionCookieName() {
  return COOKIE_NAME
}
