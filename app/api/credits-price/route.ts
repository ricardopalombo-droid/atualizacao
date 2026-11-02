import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const token = String(process.env.LICENSE_API_TOKEN || "").trim()
  if (!token) {
    return NextResponse.json({ error: "Preço indisponível." }, { status: 500 })
  }
  const licenseKey = String(request.nextUrl.searchParams.get("licenseKey") || "").trim().toUpperCase()
  const response = await fetch(
    "https://license-server-production-ee3a.up.railway.app/webhook/credits/price",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_code: "22", license_key: licenseKey || null }),
      cache: "no-store",
    },
  )
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return NextResponse.json({ error: data.detail || "Preço indisponível." }, { status: response.status })
  }
  return NextResponse.json({ unitPriceCents: data.unit_price_cents })
}
