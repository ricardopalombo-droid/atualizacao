import "server-only"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import type { ContmaticEvent } from "@/lib/contmatic-events/types"

export type EventHistoryItem = {
  id: string
  request_text: string
  event_description: string
  event_code: number
  filename: string
  event_json: ContmaticEvent
  created_at: string
}

export type EventUserAdminItem = {
  id: string
  name: string
  email: string
  phone: string
  eventCount: number
  emailVerified: boolean
  createdAt: string
}

export async function listEventHistory(userId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("event_requests")
    .select("id, request_text, event_description, event_code, filename, event_json, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as EventHistoryItem[]
}

export async function saveEventHistory(input: {
  userId: string
  exportHash: string
  requestText: string
  eventDescription: string
  eventCode: number
  filename: string
  eventJson: ContmaticEvent
  model?: string
}) {
  const { error } = await getSupabaseServerClient()
    .from("event_requests")
    .upsert(
      {
        user_id: input.userId,
        export_hash: input.exportHash,
        request_text: input.requestText,
        event_description: input.eventDescription,
        event_code: input.eventCode,
        filename: input.filename,
        event_json: input.eventJson,
        model: input.model || null,
      },
      { onConflict: "user_id,export_hash", ignoreDuplicates: true },
    )

  if (error) throw error
}

export async function getEventUserAdminSummary() {
  const { data, error } = await getSupabaseServerClient()
    .from("app_users")
    .select("id, full_name, email, phone, email_verified_at, created_at, event_requests(count)")
    .eq("role", "event_user")

  if (error) throw error

  const users: EventUserAdminItem[] = (data ?? []).map((user) => ({
    id: String(user.id),
    name: String(user.full_name ?? ""),
    email: String(user.email ?? ""),
    phone: String(user.phone ?? ""),
    eventCount: Number(user.event_requests?.[0]?.count ?? 0),
    emailVerified: Boolean(user.email_verified_at),
    createdAt: String(user.created_at),
  }))

  users.sort((left, right) => right.eventCount - left.eventCount || left.name.localeCompare(right.name, "pt-BR"))

  return {
    users,
    totalUsers: users.length,
    verifiedUsers: users.filter((user) => user.emailVerified).length,
    usersWithEvents: users.filter((user) => user.eventCount > 0).length,
    totalEvents: users.reduce((total, user) => total + user.eventCount, 0),
  }
}
