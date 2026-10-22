import { NextResponse } from "next/server"
import { requireEventSession, eventErrorResponse } from "@/lib/contmatic-events/http"
import { getConfiguredEventModel } from "@/lib/contmatic-events/openai"

export const runtime = "nodejs"

export async function GET() {
  try {
    await requireEventSession()
    return NextResponse.json({
      chaveConfigurada: Boolean(String(process.env.OPENAI_API_KEY ?? "").trim()),
      modelo: getConfiguredEventModel(),
    })
  } catch (error) {
    return eventErrorResponse(error)
  }
}
