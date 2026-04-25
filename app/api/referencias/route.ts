import { getCurrentSession } from "@/lib/auth-session"
import {
  getReferenceCatalogSummary,
  listReferenceCatalog,
  parseReferencePdf,
  referenceTypeSchema,
  replaceReferenceCatalog,
} from "@/lib/reference-catalog"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session?.clientId) {
      return Response.json({ ok: false, error: "Cliente nao identificado." }, { status: 401 })
    }

    if (session.role !== "client_user") {
      return Response.json(
        { ok: false, error: "Somente o cliente pode visualizar as bases importadas." },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const typeParam = url.searchParams.get("type")

    if (typeParam) {
      const referenceType = referenceTypeSchema.parse(typeParam)
      const records = await listReferenceCatalog(session.clientId, referenceType)

      return Response.json({ ok: true, records })
    }

    const summary = await getReferenceCatalogSummary(session.clientId)

    return Response.json({ ok: true, summary })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao carregar referencias",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session?.clientId) {
      return Response.json({ ok: false, error: "Cliente nao identificado." }, { status: 401 })
    }

    if (session.role !== "client_user") {
      return Response.json(
        { ok: false, error: "Somente o cliente pode importar cargos, horarios e sindicatos." },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const referenceType = referenceTypeSchema.parse(formData.get("type"))
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "Selecione um arquivo PDF valido." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const items = await parseReferencePdf(buffer, referenceType)
    const importedCount = await replaceReferenceCatalog(session.clientId, referenceType, items)

    return Response.json({
      ok: true,
      importedCount,
      records: items.slice(0, 20),
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao importar PDF de referencias",
      },
      { status: 500 }
    )
  }
}
