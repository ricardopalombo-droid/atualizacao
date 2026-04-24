import { z } from "zod"
import { hashPassword } from "@/lib/auth-crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const clientPayloadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  cnpj: z.string().trim().optional().or(z.literal("")),
  maxEmployees: z.coerce.number().int().positive().max(100000).optional(),
  contactName: z.string().trim().min(2, "Informe o nome do responsável."),
  accessEmail: z.string().trim().email("Informe um e-mail de acesso válido."),
  temporaryPassword: z.string().min(6, "A senha provisória deve ter pelo menos 6 caracteres."),
})

export type ClientPayload = z.infer<typeof clientPayloadSchema>

export type ClientRecordListItem = {
  id: string
  name: string
  email: string | null
  cnpj: string | null
  max_employees: number | null
  access_email: string | null
  contact_name: string | null
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

  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", payload.accessEmail)
    .maybeSingle()

  if (existingUserError) {
    throw existingUserError
  }

  if (existingUser) {
    throw new Error("Já existe um usuário com esse e-mail de acesso.")
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

  const password = hashPassword(payload.temporaryPassword)
  const { error: userError } = await supabase
    .from("app_users")
    .insert({
      email: payload.accessEmail,
      full_name: payload.contactName,
      role: "client_user",
      subscriber_id: subscriber.id,
      client_id: data.id,
      can_view_personal_data: true,
      password_hash: password.hash,
      password_salt: password.salt,
    })

  if (userError) {
    throw userError
  }

  return {
    ...data,
    access_email: payload.accessEmail,
    contact_name: payload.contactName,
  }
}

export async function updateClientRecord(
  id: string,
  payload: Partial<ClientPayload> & { accessEmail?: string; contactName?: string; temporaryPassword?: string }
) {
  const supabase = getSupabaseServerClient()
  const subscriber = await ensureDefaultSubscriber()

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .eq("subscriber_id", subscriber.id)
    .maybeSingle()

  if (clientError) {
    throw clientError
  }

  if (!client) {
    throw new Error("Cliente não encontrado.")
  }

  const { error: updateClientError } = await supabase
    .from("clients")
    .update({
      name: payload.name,
      email: payload.email || null,
      cnpj: payload.cnpj || null,
      max_employees: payload.maxEmployees ?? null,
    })
    .eq("id", id)

  if (updateClientError) {
    throw updateClientError
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("app_users")
    .select("id, email")
    .eq("client_id", id)
    .eq("role", "client_user")
    .maybeSingle()

  if (appUserError) {
    throw appUserError
  }

  if (!appUser) {
    throw new Error("Usuário do cliente não encontrado.")
  }

  if (payload.accessEmail && payload.accessEmail !== appUser.email) {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", payload.accessEmail)
      .neq("id", appUser.id)
      .maybeSingle()

    if (existingUserError) {
      throw existingUserError
    }

    if (existingUser) {
      throw new Error("Já existe outro usuário com esse e-mail de acesso.")
    }
  }

  const userUpdates: Record<string, string> = {}

  if (payload.accessEmail) {
    userUpdates.email = payload.accessEmail
  }

  if (payload.contactName) {
    userUpdates.full_name = payload.contactName
  }

  if (payload.temporaryPassword) {
    const password = hashPassword(payload.temporaryPassword)
    userUpdates.password_hash = password.hash
    userUpdates.password_salt = password.salt
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error: updateUserError } = await supabase
      .from("app_users")
      .update(userUpdates)
      .eq("id", appUser.id)

    if (updateUserError) {
      throw updateUserError
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, cnpj, max_employees, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error) {
    throw error
  }

  return {
    ...data,
    access_email: payload.accessEmail ?? appUser.email,
    contact_name: payload.contactName ?? null,
  }
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

  const clientIds = (data ?? []).map((item) => item.id)

  if (clientIds.length === 0) {
    return []
  }

  const { data: users, error: usersError } = await supabase
    .from("app_users")
    .select("client_id, email, full_name")
    .in("client_id", clientIds)
    .eq("role", "client_user")

  if (usersError) {
    throw usersError
  }

  const userByClientId = new Map(
    (users ?? []).map((user) => [user.client_id as string, user])
  )

  return (data ?? []).map((item) => {
    const user = userByClientId.get(item.id)

    return {
      ...item,
      access_email: user?.email ?? null,
      contact_name: user?.full_name ?? null,
    }
  })
}
