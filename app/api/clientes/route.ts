import {
  clientPayloadSchema,
  createClientRecord,
  listClientRecords,
} from "@/lib/client-repository"
import { getCurrentSession } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode listar clientes." }, { status: 403 })
    }

    const records = await listClientRecords()

    return Response.json({
      ok: true,
      records,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao listar clientes",
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

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode cadastrar clientes." }, { status: 403 })
    }

    const body = await request.json()
    const payload = clientPayloadSchema.parse(body)
    const saved = await createClientRecord(payload)

    return Response.json({
      ok: true,
      record: saved,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao salvar cliente",
      },
      { status: 500 }
    )
  }
}
