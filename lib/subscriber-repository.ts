import { z } from "zod"
import { createInviteToken, hashPassword } from "@/lib/auth-crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const subscriberPayloadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do assinante."),
  email: z.string().trim().email("Informe um e-mail válido."),
  maxClients: z.coerce.number().int().positive().max(10000),
  maxEmployees: z.coerce.number().int().positive().max(1000000),
  adminName: z.string().trim().min(2, "Informe o nome do responsável pelo assinante."),
  accessEmail: z.string().trim().email("Informe um e-mail de acesso válido."),
  temporaryPassword: z.string().min(6, "A senha provisória deve ter pelo menos 6 caracteres."),
})

export type SubscriberPayload = z.infer<typeof subscriberPayloadSchema>

export type SubscriberRecordListItem = {
  id: string
  name: string
  email: string | null
  max_clients: number
  max_employees: number
  admin_name: string | null
  access_email: string | null
  updated_at: string
}

type EnsurePurchasedSubscriberAccessResult = {
  created: boolean
  accessEmail: string
  temporaryPassword: string | null
  subscriberId: string
}

const DEFAULT_PURCHASED_SUBSCRIBER_LIMITS = {
  maxClients: 100,
  maxEmployees: 10000,
}

function createTemporaryPassword() {
  return `Pal${createInviteToken(4)}!`
}

export async function createSubscriberRecord(payload: SubscriberPayload) {
  const supabase = getSupabaseServerClient()

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

  const { data: subscriber, error: subscriberError } = await supabase
    .from("subscribers")
    .insert({
      name: payload.name,
      email: payload.email,
      max_clients: payload.maxClients,
      max_employees: payload.maxEmployees,
    })
    .select("id, name, email, max_clients, max_employees, updated_at")
    .single()

  if (subscriberError) {
    throw subscriberError
  }

  const password = hashPassword(payload.temporaryPassword)
  const { error: userError } = await supabase
    .from("app_users")
    .insert({
      email: payload.accessEmail,
      full_name: payload.adminName,
      role: "subscriber_admin",
      subscriber_id: subscriber.id,
      client_id: null,
      can_view_personal_data: true,
      password_hash: password.hash,
      password_salt: password.salt,
    })

  if (userError) {
    throw userError
  }

  return {
    ...subscriber,
    admin_name: payload.adminName,
    access_email: payload.accessEmail,
  }
}

export async function updateSubscriberRecord(
  id: string,
  payload: SubscriberPayload
) {
  const supabase = getSupabaseServerClient()

  const { data: subscriber, error: subscriberError } = await supabase
    .from("subscribers")
    .update({
      name: payload.name,
      email: payload.email,
      max_clients: payload.maxClients,
      max_employees: payload.maxEmployees,
    })
    .eq("id", id)
    .select("id, name, email, max_clients, max_employees, updated_at")
    .single()

  if (subscriberError) {
    throw subscriberError
  }

  const { data: adminUser, error: adminUserError } = await supabase
    .from("app_users")
    .select("id, email")
    .eq("subscriber_id", id)
    .eq("role", "subscriber_admin")
    .is("client_id", null)
    .maybeSingle()

  if (adminUserError) {
    throw adminUserError
  }

  if (!adminUser) {
    throw new Error("Usuário administrador do assinante não encontrado.")
  }

  if (payload.accessEmail !== adminUser.email) {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", payload.accessEmail)
      .neq("id", adminUser.id)
      .maybeSingle()

    if (existingUserError) {
      throw existingUserError
    }

    if (existingUser) {
      throw new Error("Já existe outro usuário com esse e-mail de acesso.")
    }
  }

  const password = hashPassword(payload.temporaryPassword)
  const { error: userError } = await supabase
    .from("app_users")
    .update({
      email: payload.accessEmail,
      full_name: payload.adminName,
      password_hash: password.hash,
      password_salt: password.salt,
    })
    .eq("id", adminUser.id)

  if (userError) {
    throw userError
  }

  return {
    ...subscriber,
    admin_name: payload.adminName,
    access_email: payload.accessEmail,
  }
}

export async function listSubscriberRecords(limit = 100): Promise<SubscriberRecordListItem[]> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("subscribers")
    .select("id, name, email, max_clients, max_employees, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const subscriberIds = (data ?? []).map((item) => item.id)

  if (subscriberIds.length === 0) {
    return []
  }

  const { data: admins, error: adminsError } = await supabase
    .from("app_users")
    .select("subscriber_id, email, full_name")
    .in("subscriber_id", subscriberIds)
    .eq("role", "subscriber_admin")
    .is("client_id", null)

  if (adminsError) {
    throw adminsError
  }

  const adminBySubscriberId = new Map((admins ?? []).map((admin) => [admin.subscriber_id as string, admin]))

  return (data ?? []).map((item) => {
    const admin = adminBySubscriberId.get(item.id)

    return {
      ...item,
      admin_name: admin?.full_name ?? null,
      access_email: admin?.email ?? null,
    }
  })
}

export async function deleteSubscriberRecord(id: string) {
  const supabase = getSupabaseServerClient()

  const { error: deleteEmployeesError } = await supabase.from("employees").delete().eq("subscriber_id", id)

  if (deleteEmployeesError) {
    throw deleteEmployeesError
  }

  const { error: deleteSubscriberError } = await supabase.from("subscribers").delete().eq("id", id)

  if (deleteSubscriberError) {
    throw deleteSubscriberError
  }
}

export async function ensureSubscriberAccessForPurchase(input: {
  officeName: string
  accessEmail: string
}): Promise<EnsurePurchasedSubscriberAccessResult> {
  const supabase = getSupabaseServerClient()
  const officeName = input.officeName.trim() || input.accessEmail
  const accessEmail = input.accessEmail.trim().toLowerCase()

  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("id, role, subscriber_id")
    .eq("email", accessEmail)
    .maybeSingle()

  if (existingUserError) {
    throw existingUserError
  }

  if (existingUser) {
    if (existingUser.role !== "subscriber_admin" || !existingUser.subscriber_id) {
      throw new Error("Já existe um usuário com este e-mail em outro perfil. Use outro e-mail para o escritório.")
    }

    return {
      created: false,
      accessEmail,
      temporaryPassword: null,
      subscriberId: existingUser.subscriber_id,
    }
  }

  const { data: subscriber, error: subscriberError } = await supabase
    .from("subscribers")
    .insert({
      name: officeName,
      email: accessEmail,
      max_clients: DEFAULT_PURCHASED_SUBSCRIBER_LIMITS.maxClients,
      max_employees: DEFAULT_PURCHASED_SUBSCRIBER_LIMITS.maxEmployees,
    })
    .select("id")
    .single()

  if (subscriberError) {
    throw subscriberError
  }

  const temporaryPassword = createTemporaryPassword()
  const password = hashPassword(temporaryPassword)

  const { error: userError } = await supabase.from("app_users").insert({
    email: accessEmail,
    full_name: officeName,
    role: "subscriber_admin",
    subscriber_id: subscriber.id,
    client_id: null,
    can_view_personal_data: true,
    password_hash: password.hash,
    password_salt: password.salt,
  })

  if (userError) {
    throw userError
  }

  return {
    created: true,
    accessEmail,
    temporaryPassword,
    subscriberId: subscriber.id,
  }
}
