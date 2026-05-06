import { NextResponse } from "next/server"

console.log("CREATE PREFERENCE CHAMADO")

function getSiteUrl() {
  const fallback = "https://www.palsys.com.br"
  const raw = String(process.env.NEXT_PUBLIC_SITE_URL ?? fallback).trim()
  const normalized = raw.replace(/\/+$/, "")

  if (!normalized || !/^https?:\/\//i.test(normalized)) {
    return fallback
  }

  return normalized
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const accessToken = String(process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim()
    const siteUrl = getSiteUrl()

    if (!body.title || !body.price || !body.email) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token do Mercado Pago não configurado." },
        { status: 500 }
      )
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: body.title,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(body.price),
          },
        ],
        payer: {
          name: body.name,
          email: body.email,
        },
        external_reference: body.externalReference,
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        back_urls: {
          success: `${siteUrl}/compra/sucesso`,
          failure: `${siteUrl}/compra/falha`,
          pending: `${siteUrl}/compra/pendente`,
        },
        auto_return: "approved",
      }),
    })

    const data = await response.json()

    console.log("Resposta Mercado Pago:", data)

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao criar preferência", details: data },
        { status: 400 }
      )
    }

    return NextResponse.json({ preferenceId: data.id })
  } catch (error) {
    console.error("Erro interno:", error)

    return NextResponse.json(
      { error: "Erro interno ao criar preferência" },
      { status: 500 }
    )
  }
}
