import { NextResponse } from "next/server"

const LICENSE_SERVER_URL =
  "https://license-server-production-ee3a.up.railway.app/webhook/credits/preview"

function siteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "https://www.palsys.com.br").replace(/\/+$/, "")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const licenseKey = String(body.licenseKey || "").trim().toUpperCase()
    const quantity = Number.parseInt(String(body.quantity || "0"), 10)
    const mercadoPagoToken = String(process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim()
    const licenseApiToken = String(process.env.LICENSE_API_TOKEN || "").trim()

    if (!name || !email || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      return NextResponse.json({ error: "Dados da compra inválidos." }, { status: 400 })
    }
    if (!mercadoPagoToken || !licenseApiToken) {
      return NextResponse.json({ error: "Pagamento não configurado." }, { status: 500 })
    }

    const previewResponse = await fetch(LICENSE_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${licenseApiToken}`,
      },
      body: JSON.stringify({
        name,
        email,
        license_key: licenseKey || null,
        product_code: "22",
        quantity,
      }),
      cache: "no-store",
    })
    const preview = await previewResponse.json().catch(() => ({}))
    if (!previewResponse.ok) {
      return NextResponse.json(
        { error: preview.detail || "Não foi possível preparar a compra de créditos." },
        { status: previewResponse.status },
      )
    }

    const baseUrl = siteUrl()
    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mercadoPagoToken}`,
      },
      body: JSON.stringify({
        items: [{
          title: `${preview.quantity} créditos - PalSys Auditor Integrado`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(preview.amount_cents) / 100,
        }],
        payer: { name, email },
        external_reference: `credits:${preview.order_id}`,
        metadata: { credit_order_id: preview.order_id, credit_quantity: preview.quantity },
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        back_urls: {
          success: `${baseUrl}/compra/sucesso?tipo=creditos`,
          failure: `${baseUrl}/compra/falha?tipo=creditos`,
          pending: `${baseUrl}/compra/pendente?tipo=creditos`,
        },
        auto_return: "approved",
      }),
      cache: "no-store",
    })
    const preference = await preferenceResponse.json().catch(() => ({}))
    if (!preferenceResponse.ok || !preference.init_point) {
      return NextResponse.json({ error: "O Mercado Pago não iniciou a compra." }, { status: 400 })
    }
    return NextResponse.json({
      initPoint: preference.init_point,
      quantity: preview.quantity,
      amountCents: preview.amount_cents,
    })
  } catch (error) {
    console.error("Erro ao criar compra de créditos:", error)
    return NextResponse.json({ error: "Erro interno ao iniciar a compra." }, { status: 500 })
  }
}
