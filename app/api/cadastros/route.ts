import { z } from "zod"
import { cadastroPayloadSchema } from "@/lib/cadastro-types"
import {
  deleteEmployeeRecord,
  getEmployeeRecordById,
  listEmployeeRecords,
  upsertEmployeeRecord,
} from "@/lib/cadastro-repository"
import { getCurrentSession } from "@/lib/auth-session"
import { getClientRecordById } from "@/lib/client-repository"

const deleteEmployeePayloadSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (!["subscriber_admin", "client_user"].includes(session.role)) {
      return Response.json({ ok: false, error: "Acesso não autorizado." }, { status: 403 })
    }

    const url = new URL(request.url)
    const recordId = url.searchParams.get("id")
    const requestedClientId = url.searchParams.get("clientId")
    let scopedClientId = session.clientId

    if (session.role === "subscriber_admin") {
      if (!session.subscriberId || !requestedClientId) {
        return Response.json({ ok: false, error: "Selecione a empresa do cadastro." }, { status: 400 })
      }
      const client = await getClientRecordById(session.subscriberId, requestedClientId)
      if (!client) return Response.json({ ok: false, error: "Empresa não encontrada." }, { status: 404 })
      scopedClientId = client.id
    }

    if (recordId) {
      const record = await getEmployeeRecordById(recordId, {
        subscriberId: session.subscriberId,
        clientId: scopedClientId,
      })

      return Response.json({
        ok: true,
        record,
      })
    }

    const records = await listEmployeeRecords(20, {
      subscriberId: session.subscriberId,
      clientId: scopedClientId,
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

    if (session.role !== "subscriber_admin" || !session.subscriberId) {
      return Response.json(
        { ok: false, error: "Somente o escritório/DP pode cadastrar funcionários." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const clientId = z.string().uuid().parse(body.clientId)
    const client = await getClientRecordById(session.subscriberId, clientId)
    if (!client) return Response.json({ ok: false, error: "Empresa não encontrada." }, { status: 404 })
    const payload = cadastroPayloadSchema.parse({
      ...body,
      clientId,
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

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin" || !session.subscriberId) {
      return Response.json(
        { ok: false, error: "Somente o escritório/DP pode excluir funcionários." },
        { status: 403 }
      )
    }

    const payload = deleteEmployeePayloadSchema.parse(await request.json())
    const record = await getEmployeeRecordById(payload.id, { subscriberId: session.subscriberId })
    if (!record) return Response.json({ ok: false, error: "Cadastro não encontrado." }, { status: 404 })
    await deleteEmployeeRecord(payload.id, {
      subscriberId: session.subscriberId,
      clientId: record.client_id,
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao excluir cadastro",
      },
      { status: 500 }
    )
  }
}
