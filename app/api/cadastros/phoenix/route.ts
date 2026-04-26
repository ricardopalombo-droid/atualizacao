import { buildPhoenixStructuredPayload } from "@/lib/phoenix-payload"
import { getCurrentSession } from "@/lib/auth-session"
import { getEmployeeRecordById } from "@/lib/cadastro-repository"

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
