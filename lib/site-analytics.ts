import { getSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentSession } from "@/lib/auth-session"

type AccessEventRow = {
  pathname: string
  visitor_id: string | null
  session_role: string | null
  created_at: string
}

export async function recordSiteAccess(input: {
  pathname: string
  visitorId?: string | null
  referrer?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const pathname = String(input.pathname || "").trim()
  if (!pathname) {
    return
  }

  const supabase = getSupabaseServerClient()
  const session = await getCurrentSession()

  const { error } = await supabase.from("site_access_events").insert({
    pathname,
    visitor_id: input.visitorId || null,
    referrer: input.referrer || null,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
    user_id: session?.userId || null,
    session_role: session?.role || "anonymous",
    subscriber_id: session?.subscriberId || null,
    client_id: session?.clientId || null,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getSiteAccessSummary() {
  const supabase = getSupabaseServerClient()
  const now = new Date()
  const from30Days = new Date(now)
  from30Days.setDate(now.getDate() - 30)

  const { data, error } = await supabase
    .from("site_access_events")
    .select("pathname, visitor_id, session_role, created_at")
    .gte("created_at", from30Days.toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const events = (data ?? []) as AccessEventRow[]

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from7Days = new Date(now)
  from7Days.setDate(now.getDate() - 7)

  const totalToday = events.filter((event) => new Date(event.created_at) >= startOfToday).length
  const total7Days = events.filter((event) => new Date(event.created_at) >= from7Days).length
  const total30Days = events.length
  const homepage30Days = events.filter((event) => event.pathname === "/").length
  const otherPages30Days = events.filter((event) => event.pathname !== "/").length

  const uniqueVisitors30Days = new Set(events.map((event) => event.visitor_id).filter(Boolean)).size

  const topPagesMap = new Map<string, number>()
  for (const event of events) {
    topPagesMap.set(event.pathname, (topPagesMap.get(event.pathname) ?? 0) + 1)
  }

  const topPages = [...topPagesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pathname, count]) => ({ pathname, count }))

  const roleMap = new Map<string, number>()
  for (const event of events) {
    const role = event.session_role || "anonymous"
    roleMap.set(role, (roleMap.get(role) ?? 0) + 1)
  }

  const byRole = [...roleMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => ({ role, count }))

  return {
    totalToday,
    total7Days,
    total30Days,
    homepage30Days,
    otherPages30Days,
    uniqueVisitors30Days,
    topPages,
    byRole,
  }
}
