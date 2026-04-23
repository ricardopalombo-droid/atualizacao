import { NextResponse } from "next/server"

console.log("🔥 CREATE PREFERENCE CHAMADO 🔥")

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.title || !body.price || !body.email) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
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
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/compra/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/compra/falha`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/compra/pendente`,
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
