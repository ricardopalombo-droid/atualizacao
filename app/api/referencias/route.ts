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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message

    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return null
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session?.subscriberId) {
      return Response.json({ ok: false, error: "Assinante não identificado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json(
        { ok: false, error: "Somente o responsável pelo assinante pode visualizar as bases compartilhadas." },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const typeParam = url.searchParams.get("type")

    if (typeParam) {
      const referenceType = referenceTypeSchema.parse(typeParam)
      const records = await listReferenceCatalog(session.subscriberId, referenceType)

      return Response.json({ ok: true, records })
    }

    const summary = await getReferenceCatalogSummary(session.subscriberId)

    return Response.json({ ok: true, summary })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: getErrorMessage(error) ?? "Erro ao carregar referências",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session?.subscriberId) {
      return Response.json({ ok: false, error: "Assinante não identificado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin") {
      return Response.json(
        { ok: false, error: "Somente o responsável pelo assinante pode importar as bases compartilhadas." },
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
    const importedCount = await replaceReferenceCatalog(session.subscriberId, referenceType, items)

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
        error: getErrorMessage(error) ?? "Erro ao importar PDF de referências",
      },
      { status: 500 }
    )
  }
}
