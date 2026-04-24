import { cadastroPayloadSchema } from "@/lib/cadastro-types"
import { listEmployeeRecords, upsertEmployeeRecord } from "@/lib/cadastro-repository"

export async function GET() {
  try {
    const records = await listEmployeeRecords()

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
    const body = await request.json()
    const payload = cadastroPayloadSchema.parse(body)
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
