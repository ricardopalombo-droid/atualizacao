import type { CadastroPayload, WorkflowStatus } from "@/lib/cadastro-types"
import { getSupabaseServerClient } from "@/lib/supabase-server"

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
