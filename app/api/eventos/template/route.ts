import { NextResponse } from "next/server"
import { buildProposal } from "@/lib/contmatic-events/engine"
import { eventErrorResponse, requireEventSession } from "@/lib/contmatic-events/http"
import { toPublicProposal } from "@/lib/contmatic-events/proposal-token"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    await requireEventSession()
    const body = (await request.json()) as { evento?: unknown }
    return NextResponse.json(
      toPublicProposal(buildProposal({ officialTemplate: body.evento })),
    )
  } catch (error) {
    return eventErrorResponse(error)
  }
}
