import type { CadastroPayload, WorkflowStatus } from "@/lib/cadastro-types"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export type EmployeeRecordListItem = {
  id: string
  employee_name: string | null
  employee_email: string | null
  invite_email: string | null
  workflow_status: string
  client_id: string | null
  created_at: string
  updated_at: string
}

export type EmployeeRecordDetail = {
  id: string
  subscriber_id: string | null
  client_id: string | null
  workflow_status: string
  invite_email: string | null
  full_payload: Record<string, string | boolean | number | null>
  updated_at: string
}

function statusTimestamps(status: WorkflowStatus) {
  const now = new Date().toISOString()

  return {
    invited_at: status === "convite_enviado" ? now : null,
    employee_completed_at: status === "preenchido_funcionario" ? now : null,
    client_completed_at: status === "finalizado" ? now : null,
    exported_at: status === "exportado" ? now : null,
  }
}

export async function upsertEmployeeRecord(payload: CadastroPayload) {
  const supabase = getSupabaseServerClient()
  const data = payload.data
  const timestamps = statusTimestamps(payload.workflowStatus)

  const record = {
    id: payload.id ?? undefined,
    client_id: payload.clientId ?? null,
    subscriber_id: payload.subscriberId ?? null,
    workflow_status: payload.workflowStatus,
    invite_email: payload.inviteEmail || String(data.convite_email ?? data.email ?? "") || null,
    employee_name: String(data.nome_completo ?? ""),
    employee_email: String(data.email ?? ""),
    cpf: String(data.cpf ?? ""),
    actor_last_updated: payload.actor,
    full_payload: data,
    ...timestamps,
  }

  const { data: saved, error } = await supabase
    .from("employees")
    .upsert(record, {
      onConflict: "id",
    })
    .select("id, workflow_status")
    .single()

  if (error) {
    throw error
  }

  return saved
}

export async function listEmployeeRecords(
  limit = 20,
  scope?: { subscriberId?: string | null; clientId?: string | null }
): Promise<EmployeeRecordListItem[]> {
  const supabase = getSupabaseServerClient()

  let query = supabase
    .from("employees")
    .select("id, employee_name, employee_email, invite_email, workflow_status, client_id, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (scope?.clientId) {
    query = query.eq("client_id", scope.clientId)
  } else if (scope?.subscriberId) {
    query = query.eq("subscriber_id", scope.subscriberId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getEmployeeRecordById(
  id: string,
  scope?: { subscriberId?: string | null; clientId?: string | null }
): Promise<EmployeeRecordDetail | null> {
  const supabase = getSupabaseServerClient()

  let query = supabase
    .from("employees")
    .select("id, subscriber_id, client_id, workflow_status, invite_email, full_payload, updated_at")
    .eq("id", id)

  if (scope?.clientId) {
    query = query.eq("client_id", scope.clientId)
  } else if (scope?.subscriberId) {
    query = query.eq("subscriber_id", scope.subscriberId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw error
  }

  return (data as EmployeeRecordDetail | null) ?? null
}
