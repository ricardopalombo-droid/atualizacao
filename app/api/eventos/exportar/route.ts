import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { validateEvent } from "@/lib/contmatic-events/engine"
import { eventErrorResponse, requireEventSession } from "@/lib/contmatic-events/http"
import { openProposal } from "@/lib/contmatic-events/proposal-token"

export const runtime = "nodejs"

function safeFilename(description: string, code: number) {
  const normalized = description
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `${code}_${normalized || "evento"}.json`
}

export async function POST(request: Request) {
  try {
    await requireEventSession()
    const body = (await request.json()) as { token?: unknown; revisado?: unknown }
    if (body.revisado !== true) throw new Error("Confirme a revisão antes de gerar o arquivo.")
    const proposal = openProposal(body.token)
    if (proposal.bloqueios.length) {
      throw new Error(
        `Resolva as informações pendentes e gere uma nova proposta: ${proposal.bloqueios.join(" | ")}`,
      )
    }
    const errors = validateEvent(proposal.evento)
    if (errors.length) throw new Error(errors.join("\n"))

    const payload = `${JSON.stringify(proposal.evento, null, 2)}\n`
    const filename = safeFilename(
      String(proposal.evento.Descricao),
      Number(proposal.evento.CodUsuario),
    )
    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-SHA256": createHash("sha256").update(payload).digest("hex"),
      },
    })
  } catch (error) {
    return eventErrorResponse(error)
  }
}
