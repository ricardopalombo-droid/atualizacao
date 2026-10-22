import "server-only"

import { createHmac } from "node:crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

const HOURLY_LIMIT = 3
const DAILY_LIMIT = 10
const GLOBAL_DAILY_LIMIT = 200

function getSecret() {
  const secret = String(process.env.APP_SESSION_SECRET ?? "").trim()
  if (!secret) throw new Error("Proteção do serviço não configurada.")
  return secret
}

export function getRequestAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

export function hashRequestAddress(address: string) {
  return createHmac("sha256", getSecret()).update(address).digest("hex")
}

export async function verifyTurnstile(token: string, address: string) {
  if (process.env.NODE_ENV !== "production" && token === "development") return

  const secret = String(process.env.TURNSTILE_SECRET_KEY ?? "").trim()
  if (!secret) throw new Error("A proteção contra uso automatizado ainda não foi configurada.")
  if (!token) throw new Error("Confirme a verificação de segurança.")

  const body = new URLSearchParams({ secret, response: token })
  if (address !== "unknown") body.set("remoteip", address)
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(10_000) },
  )
  const result = (await response.json()) as { success?: boolean }
  if (!result.success) throw new Error("A verificação de segurança expirou. Faça-a novamente.")
}

export async function beginReceiptAnalysis(ipHash: string, fileSize: number) {
  const supabase = getSupabaseServerClient()
  const now = Date.now()
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const [hourly, daily, globalDaily] = await Promise.all([
    supabase
      .from("receipt_analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo),
    supabase
      .from("receipt_analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneDayAgo),
    supabase
      .from("receipt_analysis_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneDayAgo),
  ])

  const queryError = hourly.error || daily.error || globalDaily.error
  if (queryError) throw new Error("O controle de uso ainda não foi configurado no banco de dados.")
  if ((hourly.count ?? 0) >= HOURLY_LIMIT) {
    throw new Error("Limite de 3 análises por hora atingido. Tente novamente mais tarde.")
  }
  if ((daily.count ?? 0) >= DAILY_LIMIT) {
    throw new Error("Limite diário de 10 análises atingido.")
  }
  if ((globalDaily.count ?? 0) >= GLOBAL_DAILY_LIMIT) {
    throw new Error("O limite diário do serviço foi atingido. Tente novamente amanhã.")
  }

  const { data, error } = await supabase
    .from("receipt_analysis_requests")
    .insert({ ip_hash: ipHash, file_size: fileSize, status: "processing" })
    .select("id")
    .single()
  if (error || !data) throw new Error("Não foi possível iniciar a análise.")
  return String(data.id)
}

export async function finishReceiptAnalysis(
  id: string,
  status: "completed" | "failed",
  documentType?: string,
) {
  const supabase = getSupabaseServerClient()
  await supabase
    .from("receipt_analysis_requests")
    .update({ status, document_type: documentType ?? null })
    .eq("id", id)
}

type ReceiptAccessRow = {
  visitor_id: string | null
  created_at: string
}

type ReceiptRequestRow = {
  status: "processing" | "completed" | "failed"
  document_type: "holerite" | "ferias" | "rescisao" | "desconhecido" | null
  created_at: string
}

export async function getReceiptAnalysisAdminSummary() {
  const supabase = getSupabaseServerClient()
  const now = new Date()
  const from30Days = new Date(now)
  from30Days.setDate(now.getDate() - 30)
  const from7Days = new Date(now)
  from7Days.setDate(now.getDate() - 7)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [accessResult, requestResult] = await Promise.all([
    supabase
      .from("site_access_events")
      .select("visitor_id, created_at")
      .eq("pathname", "/explicar-recibo")
      .gte("created_at", from30Days.toISOString()),
    supabase
      .from("receipt_analysis_requests")
      .select("status, document_type, created_at")
      .gte("created_at", from30Days.toISOString()),
  ])

  if (accessResult.error || requestResult.error) {
    throw new Error(
      accessResult.error?.message || requestResult.error?.message || "Não foi possível carregar as estatísticas.",
    )
  }

  const accesses = (accessResult.data ?? []) as ReceiptAccessRow[]
  const requests = (requestResult.data ?? []) as ReceiptRequestRow[]
  const isSince = (value: string, date: Date) => new Date(value) >= date
  const completed = requests.filter((request) => request.status === "completed")
  const finished = requests.filter((request) => request.status !== "processing")
  const documentTypeMap = new Map<string, number>()

  for (const request of completed) {
    const type = request.document_type || "desconhecido"
    documentTypeMap.set(type, (documentTypeMap.get(type) ?? 0) + 1)
  }

  return {
    accessesToday: accesses.filter((access) => isSince(access.created_at, startOfToday)).length,
    accesses7Days: accesses.filter((access) => isSince(access.created_at, from7Days)).length,
    accesses30Days: accesses.length,
    uniqueVisitors30Days: new Set(accesses.map((access) => access.visitor_id).filter(Boolean)).size,
    requests30Days: requests.length,
    completed30Days: completed.length,
    failed30Days: requests.filter((request) => request.status === "failed").length,
    completionRate: finished.length === 0 ? 0 : Math.round((completed.length / finished.length) * 100),
    documentTypes: [...documentTypeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
  }
}

