import { NextResponse } from "next/server"

const LICENSE_SERVER_URL =
  "https://license-server-production-ee3a.up.railway.app/webhook/credits/customer-context"

export async function POST(request: Request) {
  const token = String(process.env.LICENSE_API_TOKEN || "").trim()
  if (!token) {
    return NextResponse.json({ error: "Identificação temporariamente indisponível." }, { status: 500 })
  }
  const body = await request.json().catch(() => ({}))
  const accessToken = String(body.accessToken || "").trim()
  if (!accessToken) {
    return NextResponse.json({ error: "Acesso de compra não informado." }, { status: 400 })
  }
  const response = await fetch(LICENSE_SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ access_token: accessToken }),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return NextResponse.json({ error: data.detail || "Acesso inválido ou expirado." }, { status: response.status })
  }
  return NextResponse.json({
    name: data.customer_name,
    email: data.customer_email,
    licenseHint: data.license_hint,
    creditBalance: data.credit_balance,
    unitPriceCents: data.unit_price_cents,
  })
}
