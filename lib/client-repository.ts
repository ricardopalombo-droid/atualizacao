import { z } from "zod"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const clientPayloadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  cnpj: z.string().trim().optional().or(z.literal("")),
  maxEmployees: z.coerce.number().int().positive().max(100000).optional(),
})

export type ClientPayload = z.infer<typeof clientPayloadSchema>

export type ClientRecordListItem = {
  id: string
  name: string
  email: string | null
  cnpj: string | null
  max_employees: number | null
  created_at: string
  updated_at: string
}

export async function ensureDefaultSubscriber() {
  const supabase = getSupabaseServerClient()
  const subscriberEmail = process.env.APP_LOGIN_EMAIL ?? "assinante@palsys.com.br"
  const subscriberName = process.env.APP_SUBSCRIBER_NAME ?? "Assinante principal"

  const { data: existing, error: existingError } = await supabase
    .from("subscribers")
    .select("id, name, email, max_clients, max_employees")
    .eq("email", subscriberEmail)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return existing
  }

  const { data: created, error: createError } = await supabase
    .from("subscribers")
    .insert({
      name: subscriberName,
      email: subscriberEmail,
      max_clients: 10,
      max_employees: 1000,
    })
    .select("id, name, email, max_clients, max_employees")
    .single()

  if (createError) {
    throw createError
  }

  return created
}

export async function createClientRecord(payload: ClientPayload) {
  const supabase = getSupabaseServerClient()
  const subscriber = await ensureDefaultSubscriber()

  const { count, error: countError } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("subscriber_id", subscriber.id)

  if (countError) {
    throw countError
  }

  if ((count ?? 0) >= subscriber.max_clients) {
    throw new Error(`Limite de clientes atingido para este assinante (${subscriber.max_clients}).`)
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      subscriber_id: subscriber.id,
      name: payload.name,
      email: payload.email || null,
      cnpj: payload.cnpj || null,
      max_employees: payload.maxEmployees ?? null,
    })
    .select("id, name, email, cnpj, max_employees, created_at, updated_at")
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listClientRecords(limit = 100): Promise<ClientRecordListItem[]> {
  const supabase = getSupabaseServerClient()
  const subscriber = await ensureDefaultSubscriber()

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, cnpj, max_employees, created_at, updated_at")
    .eq("subscriber_id", subscriber.id)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}
