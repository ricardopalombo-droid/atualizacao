"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const VISITOR_STORAGE_KEY = "palsys_visitor_id"
const BLOCKED_PREFIXES = ["/painel", "/api", "/cadastro/funcionario"]

function getVisitorId() {
  if (typeof window === "undefined") {
    return ""
  }

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const generated = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(VISITOR_STORAGE_KEY, generated)
  return generated
}

export function SiteVisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    if (window.location.hostname !== "www.palsys.com.br") {
      return
    }

    if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return
    }

    const payload = {
      pathname,
      visitorId: getVisitorId(),
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    }

    void fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silencioso para não interferir na navegação do usuário.
    })
  }, [pathname])

  return null
}
