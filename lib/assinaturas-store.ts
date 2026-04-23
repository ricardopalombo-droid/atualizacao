type AssinaturaRow = {
  subscription_id: string
  email_cliente: string
  nome_cliente?: string
  produto_ref: string
  produto_nome?: string
  status?: string
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseHeaders() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase não configurado")
  }

  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }
}

export async function salvarAssinatura(row: AssinaturaRow) {
  console.log("=== salvarAssinatura ===")
  console.log("SUPABASE_URL:", SUPABASE_URL)
  console.log("subscription_id:", row.subscription_id)
  console.log("nome_cliente:", row.nome_cliente)
  console.log("email_cliente:", row.email_cliente)
  console.log("produto_ref:", row.produto_ref)
  console.log("produto_nome:", row.produto_nome)
  console.log("status:", row.status)

  const endpoint = `${SUPABASE_URL}/rest/v1/assinaturas_mp?on_conflict=subscription_id`
  console.log("Endpoint salvarAssinatura:", endpoint)

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

  console.log("Status HTTP salvarAssinatura:", response.status)
  console.log("Resposta salvarAssinatura:", data)

  if (!response.ok) {
    throw new Error(`Erro ao salvar assinatura: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) ? data[0] : data
}

export async function buscarAssinaturaPorSubscriptionId(subscriptionId: string) {
  console.log("=== buscarAssinaturaPorSubscriptionId ===")
  console.log("SUPABASE_URL:", SUPABASE_URL)
  console.log("subscriptionId:", subscriptionId)

  const endpoint = `${SUPABASE_URL}/rest/v1/assinaturas_mp?subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=*`
  console.log("Endpoint buscarAssinatura:", endpoint)

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getSupabaseHeaders(),
  })

  const data = await response.json().catch(() => null)

  console.log("Status HTTP buscarAssinatura:", response.status)
  console.log("Resposta buscarAssinatura:", data)

  if (!response.ok) {
    throw new Error(`Erro ao buscar assinatura: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

export async function buscarAssinaturaPorEmailEProduto(
  email: string,
  produtoRef: string
) {
  console.log("=== buscarAssinaturaPorEmailEProduto ===")
  console.log("SUPABASE_URL:", SUPABASE_URL)
  console.log("email:", email)
  console.log("produtoRef:", produtoRef)

  const endpoint =
    `${SUPABASE_URL}/rest/v1/assinaturas_mp` +
    `?email_cliente=eq.${encodeURIComponent(email)}` +
    `&produto_ref=eq.${encodeURIComponent(produtoRef)}` +
    `&order=created_at.desc` +
    `&limit=1` +
    `&select=*`

  console.log("Endpoint buscarAssinaturaPorEmailEProduto:", endpoint)

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getSupabaseHeaders(),
  })

  const data = await response.json().catch(() => null)

  console.log("Status HTTP buscarAssinaturaPorEmailEProduto:", response.status)
  console.log("Resposta buscarAssinaturaPorEmailEProduto:", data)

  if (!response.ok) {
    throw new Error(`Erro ao buscar assinatura por email e produto: ${JSON.stringify(data)}`)
  }

  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

export async function atualizarStatusAssinatura(subscriptionId: string, status: string) {
  console.log("=== atualizarStatusAssinatura ===")
  console.log("SUPABASE_URL:", SUPABASE_URL)
  console.log("subscriptionId:", subscriptionId)
  console.log("novo status:", status)

  const endpoint = `${SUPABASE_URL}/rest/v1/assinaturas_mp?subscription_id=eq.${encodeURIComponent(subscriptionId)}`
  console.log("Endpoint atualizarStatus:", endpoint)

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: getSupabaseHeaders(),
    body: JSON.stringify({
      status,
      updated_at: new Date().toISOString(),
    }),
  })

  const data = await response.json().catch(() => null)

  console.log("Status HTTP atualizarStatus:", response.status)
  console.log("Resposta atualizarStatus:", data)

  if (!response.ok) {
    throw new Error(`Erro ao atualizar status: ${JSON.stringify(data)}`)
  }

  return true
}
