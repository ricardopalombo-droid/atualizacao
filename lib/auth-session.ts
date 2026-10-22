import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export type AppSession = {
  userId: string
  email: string
  role: "palsys_admin" | "subscriber_admin" | "client_user"
  subscriberId: string | null
  clientId: string | null
  displayName: string
}

const COOKIE_NAME = "palsys_session"
const SESSION_VERSION = "v1"

function getSessionSecret() {
  const secret = String(
    process.env.APP_SESSION_SECRET ?? process.env.APP_LOGIN_PASSWORD ?? "",
  ).trim()
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("APP_SESSION_SECRET não configurado no servidor.")
  }
  return secret || "palsys-session-dev-only-change-me"
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

export function encodeSession(session: AppSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url")
  return `${SESSION_VERSION}.${payload}.${sign(payload)}`
}

export function decodeSession(value: string): AppSession | null {
  try {
    const [version, payload, signature, extra] = value.split(".")
    if (version !== SESSION_VERSION || !payload || !signature || extra) return null

    const expected = Buffer.from(sign(payload), "utf8")
    const received = Buffer.from(signature, "utf8")
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession

    if (
      !parsed.userId ||
      !parsed.email ||
      !["palsys_admin", "subscriber_admin", "client_user"].includes(parsed.role)
    ) {
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
