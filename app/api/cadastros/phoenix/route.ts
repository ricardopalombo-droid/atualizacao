import { buildPhoenixStructuredPayload } from "@/lib/phoenix-payload"
import { getCurrentSession } from "@/lib/auth-session"
import { getEmployeeRecordById, updateEmployeePhoenixStatus } from "@/lib/cadastro-repository"
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
    "  --empresa-rateio N",
  ].join("\n")
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "client_user") {
      return Response.json(
        { ok: false, error: "Somente usuários de cliente podem preparar payload para o Phoenix." },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const recordId = url.searchParams.get("id")

    if (!recordId) {
      return Response.json({ ok: false, error: "Informe o id do cadastro." }, { status: 400 })
    }

    const record = await getEmployeeRecordById(recordId, {
      subscriberId: session.subscriberId,
      clientId: session.clientId,
    })

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

    return Response.json({
      ok: true,
      payload: buildPhoenixStructuredPayload(record),
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

    if (session.role !== "client_user") {
      return Response.json(
        { ok: false, error: "Somente usuários de cliente podem atualizar o status do Phoenix." },
        { status: 403 }
      )
    }

    const payload = phoenixStatusPayloadSchema.parse(await request.json())
    const record = await getEmployeeRecordById(payload.id, {
      subscriberId: session.subscriberId,
      clientId: session.clientId,
    })

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
      clientId: session.clientId,
    })

    const requestUrl = new URL(request.url)
    const runnerCommand =
      payload.action === "start"
        ? buildPhoenixRunnerCommand({
            baseUrl: requestUrl.origin,
            email: session.email,
            employeeId: payload.id,
          })
        : null

    return Response.json({
      ok: true,
      phoenixStatus: result.phoenixStatus,
      phoenixStatusUpdatedAt: result.phoenixStatusUpdatedAt,
      runnerCommand,
      runnerData:
        payload.action === "start"
          ? {
              baseUrl: requestUrl.origin,
              email: session.email,
              employeeId: payload.id,
              legacyScript: ".\\cadastros_final_adaptado.py",
              empresaHabilitada: "N",
              empresaRateio: "N",
            }
          : null,
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
