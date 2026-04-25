import type { CadastroPayload, DependentPayload, WorkflowStatus } from "@/lib/cadastro-types"
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

export type DependentRecordDetail = {
  id: string
  relationship_name: string | null
  cpf: string | null
  relationship_degree: string | null
  birth_date: string | null
  registry_delivery_date: string | null
  full_payload: Record<string, string | boolean | number | null>
}

export type EmployeeRecordDetail = {
  id: string
  subscriber_id: string | null
  client_id: string | null
  workflow_status: string
  invite_email: string | null
  full_payload: Record<string, string | boolean | number | null>
  updated_at: string
  dependents: DependentRecordDetail[]
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

function mapDependentPayload(dependent: DependentPayload, employeeId: string) {
  return {
    id: dependent.id ?? undefined,
    employee_id: employeeId,
    relationship_name: dependent.relationshipName || null,
    cpf: dependent.cpf || null,
    relationship_degree: dependent.relationshipDegree || null,
    birth_date: dependent.birthDate || null,
    registry_delivery_date: dependent.registryDeliveryDate || null,
    full_payload: {
      notes: dependent.notes || "",
    },
  }
}

async function syncDependents(employeeId: string, dependents: DependentPayload[]) {
  const supabase = getSupabaseServerClient()
  const normalized = dependents.map((dependent) => mapDependentPayload(dependent, employeeId))

  if (normalized.length > 0) {
    const { error: upsertError } = await supabase.from("dependents").upsert(normalized, {
      onConflict: "id",
    })

    if (upsertError) {
      throw upsertError
    }
  }

  const currentIds = normalized.map((dependent) => dependent.id).filter(Boolean) as string[]
  let deleteQuery = supabase.from("dependents").delete().eq("employee_id", employeeId)

  if (currentIds.length > 0) {
    deleteQuery = deleteQuery.not("id", "in", `(${currentIds.map((id) => `'${id}'`).join(",")})`)
  }

  const { error: deleteError } = await deleteQuery

  if (deleteError) {
    throw deleteError
  }
}

export async function upsertEmployeeRecord(payload: CadastroPayload) {
  const supabase = getSupabaseServerClient()
  const data = payload.data
  const timestamps = statusTimestamps(payload.workflowStatus)
  const dependentsForPayload = payload.dependents.map((dependent) => ({
    id: dependent.id ?? "",
    codigo: dependent.id ?? "",
    nome_parentesco: dependent.relationshipName,
    cpf: dependent.cpf,
    grau_parentesco: dependent.relationshipDegree,
    nascimento: dependent.birthDate,
    data_entrega_registro: dependent.registryDeliveryDate,
    observacoes: dependent.notes,
  }))

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
    full_payload: {
      ...data,
      dependentes: dependentsForPayload,
    },
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

  await syncDependents(saved.id, payload.dependents)

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

  if (!data) {
    return null
  }

  const { data: dependents, error: dependentsError } = await supabase
    .from("dependents")
    .select("id, relationship_name, cpf, relationship_degree, birth_date, registry_delivery_date, full_payload")
    .eq("employee_id", id)
    .order("created_at", { ascending: true })

  if (dependentsError) {
    throw dependentsError
  }

  return {
    ...(data as Omit<EmployeeRecordDetail, "dependents">),
    dependents: (dependents as DependentRecordDetail[] | null) ?? [],
  }
}

export async function deleteEmployeeRecord(
  id: string,
  scope?: { subscriberId?: string | null; clientId?: string | null }
) {
  const supabase = getSupabaseServerClient()

  let query = supabase.from("employees").delete().eq("id", id)

  if (scope?.clientId) {
    query = query.eq("client_id", scope.clientId)
  } else if (scope?.subscriberId) {
    query = query.eq("subscriber_id", scope.subscriberId)
  }

  const { error } = await query

  if (error) {
    throw error
  }
}
