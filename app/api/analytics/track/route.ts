import { NextResponse } from "next/server"
import { recordSiteAccess } from "@/lib/site-analytics"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      pathname?: string
      visitorId?: string
      referrer?: string
    }

    const userAgent = request.headers.get("user-agent") || null
    const forwardedFor = request.headers.get("x-forwarded-for") || null
    const realIp = request.headers.get("x-real-ip") || null

    await recordSiteAccess({
      pathname: body.pathname || "/",
      visitorId: body.visitorId || null,
      referrer: body.referrer || null,
      ipAddress: realIp || forwardedFor,
      userAgent,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao registrar acesso.",
      },
      { status: 500 },
    )
  }
}
