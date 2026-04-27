import { buildPhoenixStructuredPayload } from "@/lib/phoenix-payload"
import { getCurrentSession } from "@/lib/auth-session"
import { getEmployeeRecordById, listEmployeeRecords, updateEmployeePhoenixStatus } from "@/lib/cadastro-repository"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { z } from "zod"

const phoenixStatusPayloadSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["start", "complete", "fail", "reset"]),
})

function buildPhoenixRunnerCommand(params: {
  baseUrl: string
  email: string
  employeeId: string
}) {
  const baseUrl = params.baseUrl.replace(/\/$/, "")

  return [
    'python .\\phoenix_legacy_site_runner.py `',
    `  --base-url "${baseUrl}" ` + "`",
    `  --email "${params.email}" ` + "`",
    '  --password "SUA_SENHA_AQUI" `',
    `  --employee-id "${params.employeeId}" ` + "`",
    '  --legacy-script ".\\cadastros_final_adaptado.py" `',
    '  --empresa-habilitada N `',
    '  --empresa-rateio N',
  ].join("\n")
}

type Session = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>

async function listClientScopesForSubscriber(subscriberId: string) {
  const supabase = getSupabaseServerClient()

  const [{ data: clients, error: clientsError }, { data: users, error: usersError }] = await Promise.all([
    supabase.from("clients").select("id, name, contmatic_nickname").eq("subscriber_id", subscriberId),
    supabase
      .from("app_users")
      .select("client_id")
      .eq("subscriber_id", subscriberId)
      .eq("role", "client_user")
      .not("client_id", "is", null),
  ])

  if (clientsError) {
    throw clientsError
  }

  if (usersError) {
    throw usersError
  }

  const map = new Map<string, { id: string; name: string | null; contmaticNickname: string | null }>()

  for (const client of clients ?? []) {
    map.set(client.id, {
      id: client.id,
      name: typeof client.name === "string" ? client.name : null,
      contmaticNickname: typeof client.contmatic_nickname === "string" ? client.contmatic_nickname : null,
    })
  }

  for (const user of users ?? []) {
    const clientId = typeof user.client_id === "string" ? user.client_id : null
    if (clientId && !map.has(clientId)) {
      map.set(clientId, { id: clientId, name: null, contmaticNickname: null })
    }
  }

  return Array.from(map.values())
}

async function listEmployeeIdsForSubscriber(subscriberId: string) {
  const supabase = getSupabaseServerClient()
  const clientScopes = await listClientScopesForSubscriber(subscriberId)
  const clientIds = clientScopes.map((item) => item.id)

  if (clientIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id, client_id, employee_name, employee_email, invite_email, workflow_status, updated_at, full_payload")
    .in("client_id", clientIds)
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  const clientMetaById = new Map(clientScopes.map((item) => [item.id, item]))

  return (data ?? []).map((item) => {
    const payload = (item.full_payload ?? {}) as Record<string, unknown>

    return {
      id: item.id,
      client_id: item.client_id as string | null,
      employee_name: item.employee_name as string | null,
      employee_email: item.employee_email as string | null,
      invite_email: item.invite_email as string | null,
      workflow_status: item.workflow_status as string,
      updated_at: item.updated_at as string,
      phoenix_status: typeof payload.phoenix_status === "string" ? payload.phoenix_status : null,
      phoenix_status_updated_at:
        typeof payload.phoenix_status_updated_at === "string" ? payload.phoenix_status_updated_at : null,
      client_name: item.client_id ? clientMetaById.get(item.client_id as string)?.name ?? null : null,
      client_contmatic_nickname: item.client_id
        ? clientMetaById.get(item.client_id as string)?.contmaticNickname ?? null
        : null,
    }
  })
}

async function getClientInfoById(clientId: string | null) {
  if (!clientId) {
    return { name: null, contmaticNickname: null }
  }

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from("clients")
    .select("name, contmatic_nickname")
    .eq("id", clientId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return {
    name: typeof data?.name === "string" ? data.name : null,
    contmaticNickname: typeof data?.contmatic_nickname === "string" ? data.contmatic_nickname : null,
  }
}

async function getSubscriberRunnerEmail(subscriberId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from("app_users")
    .select("email")
    .eq("subscriber_id", subscriberId)
    .eq("role", "subscriber_admin")
    .is("client_id", null)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.email ?? null
}

async function getEmployeeRecordForPhoenixScope(session: Session, recordId: string) {
  if (session.role === "client_user") {
    return getEmployeeRecordById(recordId, {
      subscriberId: session.subscriberId,
      clientId: session.clientId,
    })
  }

  if (session.role === "subscriber_admin" && session.subscriberId) {
    const clientScopes = await listClientScopesForSubscriber(session.subscriberId)

    for (const client of clientScopes) {
      const record = await getEmployeeRecordById(recordId, {
        subscriberId: session.subscriberId,
        clientId: client.id,
      })

      if (record) {
        return record
      }
    }
  }

  return null
}

async function listPendingPhoenixQueue(session: Session) {
  if (session.role === "client_user") {
    const records = await listEmployeeRecords(200, {
      subscriberId: session.subscriberId,
      clientId: session.clientId,
    })

    return records.map((item) => ({
      ...item,
      client_name: null,
      client_contmatic_nickname: null,
    }))
  }

  if (session.role === "subscriber_admin" && session.subscriberId) {
    return listEmployeeIdsForSubscriber(session.subscriberId)
  }

  return []
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (!["client_user", "subscriber_admin"].includes(session.role)) {
      return Response.json(
        { ok: false, error: "Somente clientes autorizados ou assinantes podem preparar payload para o Phoenix." },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const queueMode = url.searchParams.get("queue")

    if (queueMode === "pending") {
      const records = await listPendingPhoenixQueue(session)

      const pending = records.filter(
        (item) =>
          ["finalizado", "exportado"].includes(item.workflow_status) &&
          (item.phoenix_status ?? "pronto_para_phoenix") === "enviado_ao_phoenix"
      )

      return Response.json({
        ok: true,
        records: pending.map((item) => ({
          id: item.id,
          employeeName: item.employee_name,
          employeeEmail: item.employee_email ?? item.invite_email,
          clientName: item.client_name,
          clientContmaticNickname: item.client_contmatic_nickname,
          workflowStatus: item.workflow_status,
          phoenixStatus: item.phoenix_status ?? "pronto_para_phoenix",
          updatedAt: item.updated_at,
          phoenixStatusUpdatedAt: item.phoenix_status_updated_at,
        })),
      })
    }

    const recordId = url.searchParams.get("id")

    if (!recordId) {
      return Response.json({ ok: false, error: "Informe o id do cadastro." }, { status: 400 })
    }

    const record = await getEmployeeRecordForPhoenixScope(session, recordId)

    if (!record) {
      return Response.json({ ok: false, error: "Cadastro não encontrado." }, { status: 404 })
    }

    if (!["finalizado", "exportado"].includes(record.workflow_status)) {
      return Response.json(
        {
          ok: false,
          error: "O cadastro precisa estar finalizado antes de seguir para o Phoenix.",
        },
        { status: 409 }
      )
    }

    const clientInfo = await getClientInfoById(record.client_id)

    return Response.json({
      ok: true,
      payload: {
        ...buildPhoenixStructuredPayload(record),
        clientName: clientInfo.name,
        clientContmaticNickname: clientInfo.contmaticNickname,
      },
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao preparar payload do Phoenix",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (!["client_user", "subscriber_admin"].includes(session.role)) {
      return Response.json(
        { ok: false, error: "Somente clientes autorizados ou assinantes podem atualizar o status do Phoenix." },
        { status: 403 }
      )
    }

    const payload = phoenixStatusPayloadSchema.parse(await request.json())
    const record = await getEmployeeRecordForPhoenixScope(session, payload.id)

    if (!record) {
      return Response.json({ ok: false, error: "Cadastro não encontrado." }, { status: 404 })
    }

    if (!["finalizado", "exportado"].includes(record.workflow_status)) {
      return Response.json(
        { ok: false, error: "O cadastro precisa estar finalizado antes do fluxo do Phoenix." },
        { status: 409 }
      )
    }

    const statusByAction = {
      start: "enviado_ao_phoenix",
      complete: "concluido_no_phoenix",
      fail: "falha_no_phoenix",
      reset: "pronto_para_phoenix",
    } as const

    const result = await updateEmployeePhoenixStatus(payload.id, statusByAction[payload.action], {
      subscriberId: session.subscriberId,
      clientId: record.client_id,
    })

    let runnerCommand: string | null = null
    let runnerData: Record<string, string> | null = null

    if (payload.action === "start" && session.role === "subscriber_admin") {
      const requestUrl = new URL(request.url)
      const runnerEmail = (session.subscriberId && (await getSubscriberRunnerEmail(session.subscriberId))) || session.email

      runnerCommand = buildPhoenixRunnerCommand({
        baseUrl: requestUrl.origin,
        email: runnerEmail,
        employeeId: payload.id,
      })

      runnerData = {
        baseUrl: requestUrl.origin,
        email: runnerEmail,
        employeeId: payload.id,
        legacyScript: ".\\cadastros_final_adaptado.py",
        empresaHabilitada: "N",
        empresaRateio: "N",
      }
    }

    return Response.json({
      ok: true,
      phoenixStatus: result.phoenixStatus,
      phoenixStatusUpdatedAt: result.phoenixStatusUpdatedAt,
      runnerCommand,
      runnerData,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar status do Phoenix",
      },
      { status: 500 }
    )
  }
}
