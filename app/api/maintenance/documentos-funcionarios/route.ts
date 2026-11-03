import { deleteExpiredEmployeeDocuments } from "@/lib/employee-document-repository"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = String(process.env.CRON_SECRET ?? "").trim()
  const authorization = request.headers.get("authorization") ?? ""

  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Nao autorizado." }, { status: 401 })
  }

  try {
    const deleted = await deleteExpiredEmployeeDocuments(100)
    return Response.json({ ok: true, deleted })
  } catch (error) {
    console.error(error)
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Falha na limpeza de documentos." },
      { status: 500 }
    )
  }
}
