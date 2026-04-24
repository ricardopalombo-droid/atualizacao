import { cadastroPayloadSchema } from "@/lib/cadastro-types"
import { upsertEmployeeRecord } from "@/lib/cadastro-repository"

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
