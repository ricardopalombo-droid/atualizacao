import { z } from "zod"
import { dependentPayloadSchema } from "@/lib/cadastro-types"
import { getEmployeeRecordByInviteToken, submitEmployeeRecordByInviteToken } from "@/lib/cadastro-repository"

const publicEmployeeSubmitSchema = z.object({
  token: z.string().min(20, "Token inválido."),
  data: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.null()])).default({}),
  dependents: z.array(dependentPayloadSchema).default([]),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token") ?? ""

    const record = await getEmployeeRecordByInviteToken(token)

    if (!record) {
      return Response.json({ ok: false, error: "Link inválido ou expirado." }, { status: 404 })
    }

    const { dependentes: _legacyDependents, ...publicPayload } = record.full_payload

    return Response.json({
      ok: true,
      record: {
        ...record,
        full_payload: publicPayload,
      },
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao carregar cadastro do funcionário",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const payload = publicEmployeeSubmitSchema.parse(await request.json())
    const saved = await submitEmployeeRecordByInviteToken(payload.token, {
      data: payload.data,
      dependents: payload.dependents,
    })

    return Response.json({
      ok: true,
      id: saved.id,
      workflowStatus: saved.workflow_status,
    })
  } catch (error) {
    console.error(error)

    const message = error instanceof z.ZodError
      ? "Há informações antigas incompatíveis neste cadastro. Atualize a página e tente novamente."
      : error instanceof Error
        ? error.message
        : "Erro ao enviar cadastro do funcionário"

    return Response.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
