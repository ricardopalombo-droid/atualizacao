import {
  atualizarStatusAssinatura,
  buscarAssinaturaPorEmailEProduto,
  buscarAssinaturasRecentesPorEmail,
  buscarAssinaturaPorSubscriptionId,
} from "@/lib/assinaturas-store"
import { gerarLinkDownloadS3 } from "@/lib/s3-download"
import { enviarEmailEntrega } from "@/lib/email-entrega"
import { ensureSubscriberAccessForPurchase } from "@/lib/subscriber-repository"

type DadosLicenca = {
  assinaturaId: string
  pagamentoId?: string
  produto: string
  emailCliente: string
  nomeCliente?: string
  status: string
}

type RespostaLicenca = {
  ok?: boolean
  acao?: string
  license_id?: string | number
  license_key?: string
  expires_at?: string | null
  [key: string]: unknown
}

const LICENSE_SERVER_URL =
  "https://license-server-production-ee3a.up.railway.app/webhook/mercadopago"
const LICENSE_API_TOKEN = process.env.LICENSE_API_TOKEN || ""
const HORAS_VALIDADE_DOWNLOAD = 6
const PRODUTO_CADASTRO_FUNCIONARIOS = "funcionarios-001"

async function buscarComRetry(subscriptionId: string, tentativas = 5) {
  for (let i = 0; i < tentativas; i++) {
    const cadastro = await buscarAssinaturaPorSubscriptionId(subscriptionId)

    if (cadastro) {
      console.log(`Assinatura encontrada na tentativa ${i + 1}`)
      return cadastro
    }

    console.log(`Tentativa ${i + 1} - assinatura ainda não encontrada...`)
    await new Promise((r) => setTimeout(r, 1500))
  }

  return null
}

function mapearProdutoParaServidor(produtoRef: string) {
  const mapa: Record<string, string> = {
    "dre-001": "7",
    "fgts-001": "12",
    "ecac-001": "13",
    "whats-001": "9",
    "email-001": "11",
    "extratos-001": "8",
    "funcionarios-001": "14",
  }

  return mapa[produtoRef] || produtoRef
}

async function liberarLicenca(dados: DadosLicenca): Promise<RespostaLicenca> {
  console.log("LIBERAR LICENCA")
  console.log("Assinatura ID:", dados.assinaturaId)
  console.log("Pagamento ID:", dados.pagamentoId)
  console.log("Produto original:", dados.produto)
  console.log("Cliente:", dados.emailCliente)
  console.log("Nome cliente:", dados.nomeCliente)
  console.log("Status:", dados.status)

  const produtoServidor = mapearProdutoParaServidor(dados.produto)
  console.log("Produto mapeado p/ servidor:", produtoServidor)

  const response = await fetch(LICENSE_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LICENSE_API_TOKEN}`,
    },
    body: JSON.stringify({
      email: dados.emailCliente,
      nome: dados.nomeCliente || dados.emailCliente,
      produto: produtoServidor,
      status: dados.status,
      assinatura_id: dados.assinaturaId,
      pagamento_id: dados.pagamentoId ?? null,
    }),
  })

  const text = await response.text()
  console.log("Resposta servidor licença:", text)

  let data: RespostaLicenca = {}
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: response.ok }
  }

  if (!response.ok) {
    throw new Error(`Servidor de licença respondeu com erro ${response.status}: ${text}`)
  }

  return data
}

async function suspenderLicenca(dados: DadosLicenca) {
  console.log("SUSPENDER LICENCA")

  const produtoServidor = mapearProdutoParaServidor(dados.produto)

  const response = await fetch(LICENSE_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LICENSE_API_TOKEN}`,
    },
    body: JSON.stringify({
      email: dados.emailCliente,
      nome: dados.nomeCliente || dados.emailCliente,
      produto: produtoServidor,
      status: "blocked",
      assinatura_id: dados.assinaturaId,
      pagamento_id: dados.pagamentoId ?? null,
    }),
  })

  const text = await response.text()
  console.log("Resposta servidor licença (suspensão):", text)

  if (!response.ok) {
    throw new Error(`Erro ao suspender licença: ${response.status} - ${text}`)
  }
}

export async function GET() {
  return Response.json({ ok: true })
}

export async function POST(req: Request) {
  try {
    console.log("WEBHOOK MERCADO PAGO CHEGOU")

    const url = new URL(req.url)
    const queryType = url.searchParams.get("type")
    const queryId = url.searchParams.get("data.id")

    const body = await req.json().catch(() => null)

    console.log("Webhook recebido:", JSON.stringify(body, null, 2))
    console.log("Search Params:", {
      type: queryType,
      id: queryId,
    })

    const tipo = queryType || body?.type
    const entity = body?.entity || null
    const id = queryId || body?.data?.id

    console.log("Tipo:", tipo)
    console.log("Entity:", entity)
    console.log("ID:", id)

    const ACCESS_TOKEN = String(process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim()

    if (!ACCESS_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não configurado")
      return Response.json({ error: true }, { status: 500 })
    }

    if (!tipo || !id) {
      console.log("Evento sem tipo ou id")
      return Response.json({ ok: true })
    }

    if (tipo === "subscription_preapproval" || entity === "preapproval") {
      const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      })

      const subscription = await response.json()

      console.log("DADOS COMPLETOS DA ASSINATURA:")
      console.log(JSON.stringify(subscription, null, 2))
      console.log("Status assinatura:", subscription?.status)
      console.log("Reference assinatura:", subscription?.external_reference)

      const assinaturaId = String(subscription?.id || id)
      const status = String(subscription?.status || "")

      const cadastro = await buscarComRetry(assinaturaId)

      if (!cadastro) {
        console.log("Assinatura não encontrada após várias tentativas.")
        return Response.json({ ok: true })
      }

      await atualizarStatusAssinatura(assinaturaId, status)

      const dadosLicenca: DadosLicenca = {
        assinaturaId,
        produto: cadastro.produto_ref,
        emailCliente: cadastro.email_cliente,
        nomeCliente: cadastro.nome_cliente || cadastro.email_cliente,
        status,
      }

      if (status === "authorized") {
        console.log("ASSINATURA ATIVA - LIBERANDO LICENCA")
        await liberarLicenca(dadosLicenca)
      } else if (status === "paused" || status === "cancelled") {
        console.log("ASSINATURA INATIVA - SUSPENDENDO LICENCA")
        await suspenderLicenca(dadosLicenca)
      } else {
        console.log("Status sem ação automática:", status)
      }

      return Response.json({ ok: true })
    }

    if (
      tipo === "subscription_authorized_payment" ||
      entity === "authorized_payment" ||
      tipo === "payment"
    ) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      })

      const payment = await response.json()

      console.log("DADOS COMPLETOS DO PAGAMENTO:")
      console.log(JSON.stringify(payment, null, 2))
      console.log("Status pagamento:", payment?.status)
      console.log("Email pagamento:", payment?.payer?.email)
      console.log("Reference pagamento:", payment?.external_reference)
      console.log("metadata.preapproval_id:", payment?.metadata?.preapproval_id)
      console.log("subscription_id:", payment?.subscription_id)
      console.log("order.id:", payment?.order?.id)

      const pagamentoId = String(payment?.id || id)
      const statusPagamento = String(payment?.status || "")
      const emailPagamento = String(payment?.payer?.email || "").trim().toLowerCase()
      const produtoRef = String(payment?.external_reference || "").trim()

      let assinaturaId =
        payment?.metadata?.preapproval_id ||
        payment?.subscription_id ||
        payment?.order?.id ||
        null

      let cadastro = null

      if (assinaturaId) {
        assinaturaId = String(assinaturaId)
        console.log("Assinatura ID obtido do pagamento:", assinaturaId)
        cadastro = await buscarComRetry(assinaturaId)
      }

      if (!cadastro && emailPagamento && produtoRef) {
        console.log("Tentando localizar assinatura por email + produto...")
        cadastro = await buscarAssinaturaPorEmailEProduto(emailPagamento, produtoRef)

        if (cadastro) {
          assinaturaId = String(cadastro.subscription_id)
          console.log("Assinatura encontrada por email + produto:", assinaturaId)
        }
      }

      if (!cadastro && emailPagamento) {
        console.log("Tentando localizar assinatura por e-mail apenas...")
        const candidatas = await buscarAssinaturasRecentesPorEmail(emailPagamento, 5)

        console.log(
          "Candidatas encontradas por e-mail:",
          JSON.stringify(
            candidatas.map((item) => ({
              subscription_id: item.subscription_id,
              produto_ref: item.produto_ref,
              status: item.status,
              created_at: item.created_at,
              updated_at: item.updated_at,
            })),
            null,
            2
          )
        )

        if (produtoRef) {
          const porProduto = candidatas.find((item) => item.produto_ref === produtoRef)

          if (porProduto) {
            cadastro = porProduto
            assinaturaId = String(porProduto.subscription_id)
            console.log("Assinatura encontrada por e-mail na lista do produto:", assinaturaId)
          }
        }

        if (!cadastro && candidatas.length === 1) {
          cadastro = candidatas[0]
          assinaturaId = String(candidatas[0].subscription_id)
          console.log("Assinatura encontrada por e-mail único:", assinaturaId)
        }
      }

      if (!cadastro || !assinaturaId) {
        console.log("Não foi possível identificar a assinatura a partir do pagamento")
        return Response.json({ ok: true })
      }

      if (statusPagamento === "approved" && cadastro.status === "approved") {
        console.log("Pagamento já processado anteriormente. Ignorando duplicidade.")
        return Response.json({ ok: true })
      }

      const dadosLicenca: DadosLicenca = {
        assinaturaId,
        pagamentoId,
        produto: cadastro.produto_ref,
        emailCliente: cadastro.email_cliente,
        nomeCliente: cadastro.nome_cliente || cadastro.email_cliente,
        status: statusPagamento,
      }

      if (statusPagamento === "approved") {
        console.log("PAGAMENTO APROVADO - LIBERANDO LICENCA E ENVIANDO ENTREGA")

        const licenca = await liberarLicenca(dadosLicenca)
        const licenseKey = licenca?.license_key

        if (!licenseKey) {
          throw new Error("Servidor de licença não retornou license_key")
        }

        await atualizarStatusAssinatura(assinaturaId, statusPagamento)

        const download = await gerarLinkDownloadS3(
          cadastro.produto_ref,
          HORAS_VALIDADE_DOWNLOAD * 60 * 60
        )

        let accessPayload:
          | {
              panelAccessUrl: string
              accessEmail: string
              setupPasswordUrl: string | null
            }
          | undefined

        if (cadastro.produto_ref === PRODUTO_CADASTRO_FUNCIONARIOS) {
          const access = await ensureSubscriberAccessForPurchase({
            officeName: cadastro.nome_cliente || cadastro.email_cliente,
            accessEmail: cadastro.email_cliente,
          })

          accessPayload = {
            panelAccessUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.palsys.com.br"}/acesso`,
            accessEmail: access.accessEmail,
            setupPasswordUrl: access.setupPasswordUrl,
          }
        }

        await enviarEmailEntrega({
          email: cadastro.email_cliente,
          nome: cadastro.nome_cliente || cadastro.email_cliente,
          produtoNome: cadastro.produto_nome || cadastro.produto_ref,
          licenseKey,
          downloadUrl: download.url,
          horasValidade: HORAS_VALIDADE_DOWNLOAD,
          panelAccessUrl: accessPayload?.panelAccessUrl,
          accessEmail: accessPayload?.accessEmail,
          setupPasswordUrl: accessPayload?.setupPasswordUrl ?? null,
        })

        console.log("E-mail de entrega enviado com sucesso")
      } else {
        console.log("Pagamento sem ação automática:", statusPagamento)
      }

      return Response.json({ ok: true })
    }

    console.log("Evento recebido sem tratamento específico:", tipo)
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Erro no webhook:", error)
    return Response.json({ error: true }, { status: 500 })
  }
}
