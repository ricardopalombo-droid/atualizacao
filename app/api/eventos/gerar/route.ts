import { NextResponse } from "next/server"
import { eventErrorResponse, requireEventSession } from "@/lib/contmatic-events/http"
import { generateEventProposal } from "@/lib/contmatic-events/openai"
import { toPublicProposal } from "@/lib/contmatic-events/proposal-token"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    await requireEventSession()
    const body = (await request.json()) as { pedido?: unknown }
    if (typeof body.pedido !== "string" || !body.pedido.trim()) {
      throw new Error("Descreva o evento que deseja criar.")
    }
    const proposal = await generateEventProposal(body.pedido)
    return NextResponse.json(toPublicProposal(proposal))
  } catch (error) {
    return eventErrorResponse(error)
  }
}
