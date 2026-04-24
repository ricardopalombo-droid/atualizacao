import { cadastroPayloadSchema } from "@/lib/cadastro-types"
import { listEmployeeRecords, upsertEmployeeRecord } from "@/lib/cadastro-repository"
import { getCurrentSession } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    const records = await listEmployeeRecords(20, {
      subscriberId: session.subscriberId,
      clientId: session.clientId,
    })

    return Response.json({
      ok: true,
      records,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao listar cadastros",
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
        { ok: false, error: "Somente usuários de cliente podem cadastrar funcionários." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const payload = cadastroPayloadSchema.parse({
      ...body,
      clientId: session.clientId,
      subscriberId: session.subscriberId,
    })
    const saved = await upsertEmployeeRecord(payload)

    return Response.json({
      ok: true,
      id: saved.id,
      workflowStatus: saved.workflow_status,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao salvar cadastro",
      },
      { status: 500 }
    )
  }
}
