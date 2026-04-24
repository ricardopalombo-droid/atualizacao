import {
  clientPayloadSchema,
  createClientRecord,
  listClientRecords,
} from "@/lib/client-repository"

export async function GET() {
  try {
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
