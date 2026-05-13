type AssinaturaRow = {
  subscription_id: string
  email_cliente: string
  nome_cliente?: string
  produto_ref: string
  produto_nome?: string
  status?: string
}

type AssinaturaLookupRow = AssinaturaRow & {
  id?: string | number
  created_at?: string
  updated_at?: string
}

const SUPABASE_URL = String(
  process.env.BILLING_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
)
  .trim()
  .replace(/\/+$/, "")

const SUPABASE_SERVICE_ROLE_KEY = String(
  process.env.BILLING_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
).trim()

function getSupabaseHeaders() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase de assinaturas não configurado. Defina BILLING_SUPABASE_URL e BILLING_SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }
}

export async function salvarAssinatura(row: AssinaturaRow) {
  const endpoint = `${SUPABASE_URL}/rest/v1/assinaturas_mp?on_conflict=subscription_id`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...getSupabaseHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        subscription_id: row.subscription_id,
        nome_cliente: row.nome_cliente ?? null,
        email_cliente: row.email_cliente,
        produto_ref: row.produto_ref,
        produto_nome: row.produto_nome ?? null,
        status: row.status ?? "pending",
        updated_at: new Date().toISOString(),
      },
    ]),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`Erro ao salvar assinatura: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) ? data[0] : data
}

export async function buscarAssinaturaPorSubscriptionId(subscriptionId: string) {
  const endpoint = `${SUPABASE_URL}/rest/v1/assinaturas_mp?subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=*`

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getSupabaseHeaders(),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`Erro ao buscar assinatura: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

export async function buscarAssinaturaPorEmailEProduto(
  email: string,
  produtoRef: string
) {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/assinaturas_mp` +
    `?email_cliente=eq.${encodeURIComponent(email)}` +
    `&produto_ref=eq.${encodeURIComponent(produtoRef)}` +
    `&order=created_at.desc` +
    `&limit=1` +
    `&select=*`

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getSupabaseHeaders(),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`Erro ao buscar assinatura por email e produto: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) && data.length > 0 ? (data[0] as AssinaturaLookupRow) : null
}

export async function buscarAssinaturasRecentesPorEmail(email: string, limit = 5) {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/assinaturas_mp` +
    `?email_cliente=eq.${encodeURIComponent(email)}` +
    `&order=created_at.desc` +
    `&limit=${limit}` +
    `&select=*`

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getSupabaseHeaders(),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`Erro ao buscar assinaturas recentes por email: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) ? (data as AssinaturaLookupRow[]) : []
}

export async function atualizarStatusAssinatura(subscriptionId: string, status: string) {
  const endpoint = `${SUPABASE_URL}/rest/v1/assinaturas_mp?subscription_id=eq.${encodeURIComponent(subscriptionId)}`

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: getSupabaseHeaders(),
    body: JSON.stringify({
      status,
      updated_at: new Date().toISOString(),
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`Erro ao atualizar status: ${JSON.stringify(data)}`)
  }

  return true
}
