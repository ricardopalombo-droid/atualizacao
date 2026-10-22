import { NextResponse } from "next/server"
import { listEventHistory } from "@/lib/event-history"
import { eventErrorResponse, requireEventSession } from "@/lib/contmatic-events/http"

export async function GET() {
  try {
    const session = await requireEventSession()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session.userId)) {
      return NextResponse.json({ items: [] })
    }
    return NextResponse.json({ items: await listEventHistory(session.userId) })
  } catch (error) {
    return eventErrorResponse(error)
  }
}
