import { NextResponse } from "next/server"
import { salvarAssinatura } from "@/lib/assinaturas-store"

const PRODUTOS_LIBERADOS = new Set([
  "ecac-001",
  "fgts-001",
  "whats-001",
  "email-001",
  "funcionarios-001",
])

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
    console.log("🔥 CREATE SUBSCRIPTION EXECUTADO 🔥")

    const body = await req.json()

    console.log("BODY RECEBIDO:", JSON.stringify(body, null, 2))
    console.log("SUPABASE_URL OK:", !!process.env.SUPABASE_URL)
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY OK:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const accessToken = String(process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim()
    console.log("MP TOKEN OK:", !!accessToken)

    if (
      !body.reason ||
      !body.price ||
      !body.email ||
      !body.externalReference ||
      !body.nome
    ) {
      console.log("❌ Dados incompletos para criar assinatura")
      return NextResponse.json(
        { error: "Dados incompletos para criar assinatura" },
        { status: 400 }
      )
    }

    if (!PRODUTOS_LIBERADOS.has(body.externalReference)) {
      console.log(
        "❌ Produto não liberado para assinatura:",
        body.externalReference
      )
      return NextResponse.json(
        { error: "Este produto ainda não está disponível para assinatura." },
        { status: 403 }
      )
    }

    console.log("📤 Enviando criação de assinatura para o Mercado Pago")

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token do Mercado Pago não configurado." },
        { status: 500 }
      )
    }

    const siteUrl = getSiteUrl()

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reason: body.reason,
        external_reference: body.externalReference,
        payer_email: body.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(body.price),
          currency_id: "BRL",
        },
        back_url: `${siteUrl}/compra/sucesso`,
        status: "pending",
      }),
    })

    const data = await response.json()

    console.log("Resposta create-subscription:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error("Erro Mercado Pago:", JSON.stringify(data, null, 2))
      if (response.status === 401) {
        return NextResponse.json(
          {
            error:
              "Não foi possível autenticar com o Mercado Pago. Revise o MERCADOPAGO_ACCESS_TOKEN do ambiente.",
            details: data,
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: "Erro ao criar assinatura", details: data },
        { status: 400 }
      )
    }

    console.log("✅ Assinatura criada no Mercado Pago")
    console.log("ID da assinatura criada no MP:", data.id)
    console.log("ANTES DE SALVAR NO SUPABASE")

    await salvarAssinatura({
      subscription_id: data.id,
      nome_cliente: body.nome,
      email_cliente: body.email,
      produto_ref: body.externalReference,
      produto_nome: body.reason,
      status: data.status ?? "pending",
    })

    console.log("DEPOIS DE SALVAR NO SUPABASE")

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro interno create-subscription:", error)

    return NextResponse.json(
      {
        error: "Erro interno ao criar assinatura",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
