import { z } from "zod"
import {
  clientPayloadSchema,
  createClientRecord,
  deleteClientRecord,
  getClientDefaultsForClientUser,
  listClientRecords,
  updateClientRecord,
} from "@/lib/client-repository"
import { getCurrentSession } from "@/lib/auth-session"

const updateClientPayloadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  email: z.string().trim().email("Informe um e-mail valido.").optional().or(z.literal("")),
  cnpj: z.string().trim().optional().or(z.literal("")),
  contmaticNickname: z.string().trim().optional().or(z.literal("")),
  maxEmployees: z.coerce.number().int().positive().max(100000).optional(),
  contactName: z.string().trim().min(2, "Informe o nome do responsavel."),
  accessEmail: z.string().trim().email("Informe um e-mail de acesso valido."),
  temporaryPassword: z.string().optional().or(z.literal("")),
  employeeDefaults: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.null()])).default({}),
})

const deleteClientPayloadSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Nao autenticado." }, { status: 401 })
    }

    const url = new URL(request.url)
    const currentClientDefaults = url.searchParams.get("current") === "1"

    if (currentClientDefaults) {
      if (session.role !== "client_user" || !session.clientId) {
        return Response.json({ ok: false, error: "Somente o cliente pode consultar os proprios padroes." }, { status: 403 })
      }

      const record = await getClientDefaultsForClientUser(session.clientId, session.subscriberId)

      return Response.json({
        ok: true,
        record,
      })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode listar clientes." }, { status: 403 })
    }

    if (!session.subscriberId) {
      return Response.json({ ok: false, error: "Assinante sem escopo definido." }, { status: 400 })
    }

    const records = await listClientRecords(session.subscriberId)

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
      return Response.json({ ok: false, error: "Nao autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode cadastrar clientes." }, { status: 403 })
    }

    const body = await request.json()
    const payload = clientPayloadSchema.parse(body)

    if (!session.subscriberId) {
      return Response.json({ ok: false, error: "Assinante sem escopo definido." }, { status: 400 })
    }

    const saved = await createClientRecord(session.subscriberId, payload)

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
      return Response.json({ ok: false, error: "Nao autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode editar clientes." }, { status: 403 })
    }

    const payload = updateClientPayloadSchema.parse(await request.json())

    if (!session.subscriberId) {
      return Response.json({ ok: false, error: "Assinante sem escopo definido." }, { status: 400 })
    }

    const record = await updateClientRecord(session.subscriberId, payload.id, payload)

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

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Nao autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json({ ok: false, error: "Somente o assinante pode excluir clientes." }, { status: 403 })
    }

    if (!session.subscriberId) {
      return Response.json({ ok: false, error: "Assinante sem escopo definido." }, { status: 400 })
    }

    const payload = deleteClientPayloadSchema.parse(await request.json())
    await deleteClientRecord(session.subscriberId, payload.id)

    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao excluir cliente",
      },
      { status: 500 }
    )
  }
}
