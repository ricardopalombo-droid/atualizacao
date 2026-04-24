import { z } from "zod"
import { clientPayloadSchema, createClientRecord, listClientRecords, updateClientRecord } from "@/lib/client-repository"
import { getCurrentSession } from "@/lib/auth-session"

const updateClientPayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  cnpj: z.string().trim().optional().or(z.literal("")),
  maxEmployees: z.coerce.number().int().positive().max(100000).optional(),
  contactName: z.string().trim().min(2, "Informe o nome do responsável."),
  accessEmail: z.string().trim().email("Informe um e-mail de acesso válido."),
  temporaryPassword: z.string().optional().or(z.literal("")),
})

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

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode editar clientes." }, { status: 403 })
    }

    const payload = updateClientPayloadSchema.parse(await request.json())

    const record = await updateClientRecord(payload.id, payload)

    return Response.json({
      ok: true,
      record,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao editar cliente",
      },
      { status: 500 }
    )
  }
}
