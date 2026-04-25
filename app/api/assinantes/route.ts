import { z } from "zod"
import {
  createSubscriberRecord,
  listSubscriberRecords,
  subscriberPayloadSchema,
  updateSubscriberRecord,
} from "@/lib/subscriber-repository"
import { getCurrentSession } from "@/lib/auth-session"

const updateSubscriberPayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do assinante."),
  email: z.string().trim().email("Informe um e-mail válido."),
  maxClients: z.coerce.number().int().positive().max(10000),
  maxEmployees: z.coerce.number().int().positive().max(1000000),
  adminName: z.string().trim().min(2, "Informe o nome do responsável pelo assinante."),
  accessEmail: z.string().trim().email("Informe um e-mail de acesso válido."),
  temporaryPassword: z.string().min(6, "A senha provisória deve ter pelo menos 6 caracteres."),
})

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "palsys_admin") {
      return Response.json({ ok: false, error: "Somente a PalSys pode listar assinantes." }, { status: 403 })
    }

    const records = await listSubscriberRecords()

    return Response.json({
      ok: true,
      records,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao listar assinantes",
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

    if (session.role !== "palsys_admin") {
      return Response.json({ ok: false, error: "Somente a PalSys pode cadastrar assinantes." }, { status: 403 })
    }

    const payload = subscriberPayloadSchema.parse(await request.json())
    const record = await createSubscriberRecord(payload)

    return Response.json({
      ok: true,
      record,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao salvar assinante",
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

    if (session.role !== "palsys_admin") {
      return Response.json({ ok: false, error: "Somente a PalSys pode editar assinantes." }, { status: 403 })
    }

    const payload = updateSubscriberPayloadSchema.parse(await request.json())
    const record = await updateSubscriberRecord(payload.id, payload)

    return Response.json({
      ok: true,
      record,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao editar assinante",
      },
      { status: 500 }
    )
  }
}
