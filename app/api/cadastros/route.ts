import { z } from "zod"
import { cadastroPayloadSchema } from "@/lib/cadastro-types"
import {
  deleteEmployeeRecord,
  getEmployeeRecordById,
  listEmployeeRecords,
  upsertEmployeeRecord,
} from "@/lib/cadastro-repository"
import { getCurrentSession } from "@/lib/auth-session"

const deleteEmployeePayloadSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    const url = new URL(request.url)
    const recordId = url.searchParams.get("id")

    if (recordId) {
      const record = await getEmployeeRecordById(recordId, {
        subscriberId: session.subscriberId,
        clientId: session.clientId,
      })

      return Response.json({
        ok: true,
        record,
      })
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

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "client_user") {
      return Response.json(
        { ok: false, error: "Somente usuários de cliente podem excluir funcionários." },
        { status: 403 }
      )
    }

    const payload = deleteEmployeePayloadSchema.parse(await request.json())
    await deleteEmployeeRecord(payload.id, {
      subscriberId: session.subscriberId,
      clientId: session.clientId,
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
