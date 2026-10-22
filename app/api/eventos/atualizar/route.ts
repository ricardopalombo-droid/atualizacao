import { NextResponse } from "next/server"
import { validateEvent } from "@/lib/contmatic-events/engine"
import { eventErrorResponse, requireEventSession } from "@/lib/contmatic-events/http"
import { openProposal, toPublicProposal } from "@/lib/contmatic-events/proposal-token"
import type { ContmaticEvent } from "@/lib/contmatic-events/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    await requireEventSession()
    const body = (await request.json()) as { token?: unknown; evento?: unknown }
    const proposal = openProposal(body.token)
    const errors = validateEvent(body.evento)
    if (errors.length) throw new Error(errors.join("\n"))
    proposal.evento = structuredClone(body.evento) as ContmaticEvent
    return NextResponse.json(toPublicProposal(proposal))
  } catch (error) {
    return eventErrorResponse(error)
  }
}
