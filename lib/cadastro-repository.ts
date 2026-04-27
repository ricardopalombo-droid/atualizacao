import type { CadastroPayload, DependentPayload, WorkflowStatus } from "@/lib/cadastro-types"
import { createInviteToken, sha256Hex } from "@/lib/auth-crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export type EmployeeRecordListItem = {
  id: string
  employee_name: string | null
  employee_email: string | null
  invite_email: string | null
  workflow_status: string
  phoenix_status: string | null
  phoenix_status_updated_at: string | null
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

function buildDependentsForPayload(dependents: DependentPayload[]) {
  return dependents.map((dependent) => ({
    id: dependent.id ?? "",
    codigo: dependent.id ?? "",
    nome_parentesco: dependent.relationshipName,
    cpf: dependent.cpf,
    grau_parentesco: dependent.relationshipDegree,
    nascimento: dependent.birthDate,
    data_entrega_registro: dependent.registryDeliveryDate,
    observacoes: dependent.notes,
  }))
}

async function listClientIdsForSubscriber(subscriberId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from("clients").select("id").eq("subscriber_id", subscriberId)

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => item.id as string)
}

function dedupeEmployeeList<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
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
    full_payload: {
      ...data,
      dependentes: buildDependentsForPayload(payload.dependents),
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

  if (scope?.subscriberId && !scope?.clientId) {
    const clientIds = await listClientIdsForSubscriber(scope.subscriberId)

    const { data: bySubscriber, error: bySubscriberError } = await supabase
      .from("employees")
      .select("id, employee_name, employee_email, invite_email, workflow_status, client_id, created_at, updated_at, full_payload")
      .eq("subscriber_id", scope.subscriberId)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (bySubscriberError) {
      throw bySubscriberError
    }

    let byClient: typeof bySubscriber = []

    if (clientIds.length > 0) {
      const { data: clientData, error: byClientError } = await supabase
        .from("employees")
        .select(
          "id, employee_name, employee_email, invite_email, workflow_status, client_id, created_at, updated_at, full_payload"
        )
        .in("client_id", clientIds)
        .order("updated_at", { ascending: false })
        .limit(limit)

      if (byClientError) {
        throw byClientError
      }

      byClient = clientData ?? []
    }

    const merged = dedupeEmployeeList([...(bySubscriber ?? []), ...(byClient ?? [])])
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit)

    return merged.map((item) => {
      const payload = (item.full_payload ?? {}) as Record<string, unknown>

      return {
        id: item.id,
        employee_name: item.employee_name,
        employee_email: item.employee_email,
        invite_email: item.invite_email,
        workflow_status: item.workflow_status,
        phoenix_status: typeof payload.phoenix_status === "string" ? payload.phoenix_status : null,
        phoenix_status_updated_at:
          typeof payload.phoenix_status_updated_at === "string" ? payload.phoenix_status_updated_at : null,
        client_id: item.client_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      } satisfies EmployeeRecordListItem
    })
  }

  let query = supabase
    .from("employees")
    .select("id, employee_name, employee_email, invite_email, workflow_status, client_id, created_at, updated_at, full_payload")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (scope?.clientId) {
    query = query.eq("client_id", scope.clientId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => {
    const payload = (item.full_payload ?? {}) as Record<string, unknown>

    return {
      id: item.id,
      employee_name: item.employee_name,
      employee_email: item.employee_email,
      invite_email: item.invite_email,
      workflow_status: item.workflow_status,
      phoenix_status: typeof payload.phoenix_status === "string" ? payload.phoenix_status : null,
      phoenix_status_updated_at:
        typeof payload.phoenix_status_updated_at === "string" ? payload.phoenix_status_updated_at : null,
      client_id: item.client_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
    } satisfies EmployeeRecordListItem
  })
}

export async function updateEmployeePhoenixStatus(
  id: string,
  phoenixStatus: string,
  scope?: { subscriberId?: string | null; clientId?: string | null }
) {
  const supabase = getSupabaseServerClient()
  const record = await getEmployeeRecordById(id, scope)

  if (!record) {
    throw new Error("Cadastro do funcionário não encontrado.")
  }

  const fullPayload = {
    ...record.full_payload,
    phoenix_status: phoenixStatus,
    phoenix_status_updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("employees")
    .update({
      full_payload: fullPayload,
    })
    .eq("id", id)
    .select("id, full_payload")
    .single()

  if (error) {
    throw error
  }

  const payload = (data.full_payload ?? {}) as Record<string, unknown>

  return {
    id: data.id,
    phoenixStatus: typeof payload.phoenix_status === "string" ? payload.phoenix_status : phoenixStatus,
    phoenixStatusUpdatedAt:
      typeof payload.phoenix_status_updated_at === "string" ? payload.phoenix_status_updated_at : null,
  }
}

export async function getEmployeeRecordById(
  id: string,
  scope?: { subscriberId?: string | null; clientId?: string | null }
): Promise<EmployeeRecordDetail | null> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("employees")
    .select("id, subscriber_id, client_id, workflow_status, invite_email, full_payload, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  if (scope?.clientId && data.client_id !== scope.clientId) {
    return null
  }

  if (scope?.subscriberId && !scope?.clientId) {
    const clientIds = await listClientIdsForSubscriber(scope.subscriberId)
    const belongsToSubscriber =
      data.subscriber_id === scope.subscriberId ||
      (data.client_id !== null && clientIds.includes(data.client_id))

    if (!belongsToSubscriber) {
      return null
    }
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

export async function createEmployeeInviteLink(
  id: string,
  inviteEmail: string,
  baseUrl: string,
  scope?: { subscriberId?: string | null; clientId?: string | null }
) {
  const supabase = getSupabaseServerClient()
  const record = await getEmployeeRecordById(id, scope)

  if (!record) {
    throw new Error("Cadastro do funcionário não encontrado.")
  }

  const token = createInviteToken()
  const tokenHash = sha256Hex(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const { error } = await supabase
    .from("employees")
    .update({
      invite_email: inviteEmail,
      invite_token_hash: tokenHash,
      invite_token_expires_at: expiresAt,
      workflow_status: "convite_enviado",
      invited_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw error
  }

  const inviteLink = `${baseUrl}/cadastro/funcionario?token=${token}`

  return {
    inviteLink,
    expiresAt,
    employeeName: String(record.full_payload.nome_completo ?? ""),
  }
}

export async function getEmployeeRecordByInviteToken(token: string): Promise<EmployeeRecordDetail | null> {
  const supabase = getSupabaseServerClient()
  const tokenHash = sha256Hex(token)

  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "id, subscriber_id, client_id, workflow_status, invite_email, full_payload, updated_at, invite_token_expires_at"
    )
    .eq("invite_token_hash", tokenHash)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!employee) {
    return null
  }

  if (
    employee.invite_token_expires_at &&
    new Date(employee.invite_token_expires_at).getTime() < Date.now()
  ) {
    return null
  }

  const { data: dependents, error: dependentsError } = await supabase
    .from("dependents")
    .select("id, relationship_name, cpf, relationship_degree, birth_date, registry_delivery_date, full_payload")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: true })

  if (dependentsError) {
    throw dependentsError
  }

  return {
    id: employee.id,
    subscriber_id: employee.subscriber_id,
    client_id: employee.client_id,
    workflow_status: employee.workflow_status,
    invite_email: employee.invite_email,
    full_payload: employee.full_payload as Record<string, string | boolean | number | null>,
    updated_at: employee.updated_at,
    dependents: (dependents as DependentRecordDetail[] | null) ?? [],
  }
}

export async function submitEmployeeRecordByInviteToken(
  token: string,
  payload: Pick<CadastroPayload, "data" | "dependents">
) {
  const record = await getEmployeeRecordByInviteToken(token)

  if (!record) {
    throw new Error("Link inválido ou expirado.")
  }

  return upsertEmployeeRecord({
    id: record.id,
    clientId: record.client_id,
    subscriberId: record.subscriber_id,
    actor: "employee",
    workflowStatus: "preenchido_funcionario",
    inviteEmail: record.invite_email ?? String(payload.data.email ?? ""),
    data: payload.data,
    dependents: payload.dependents,
  })
}

export async function deleteEmployeeRecord(
  id: string,
  scope?: { subscriberId?: string | null; clientId?: string | null }
) {
  const supabase = getSupabaseServerClient()
  const record = await getEmployeeRecordById(id, scope)

  if (!record) {
    throw new Error("Cadastro do funcionário não encontrado.")
  }

  const { error } = await supabase.from("employees").delete().eq("id", id)

  if (error) {
    throw error
  }
}
