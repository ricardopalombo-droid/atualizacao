import { NextResponse } from "next/server"
import { hashPassword, sha256Hex } from "@/lib/auth-crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { token?: string; password?: string; confirmPassword?: string }
    | null

  const token = String(body?.token ?? "").trim()
  const password = String(body?.password ?? "")
  const confirmPassword = String(body?.confirmPassword ?? "")

  if (!token) {
    return NextResponse.json({ error: "Link de acesso inválido." }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "A confirmação da senha não confere." }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const tokenHash = sha256Hex(token)

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id, activation_token_expires_at")
    .eq("activation_token_hash", tokenHash)
    .maybeSingle()

  if (userError) {
    return NextResponse.json({ error: "Não foi possível validar o link." }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Link expirado ou já utilizado." }, { status: 400 })
  }

  if (
    user.activation_token_expires_at &&
    new Date(user.activation_token_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "Este link já expirou. Solicite um novo acesso." }, { status: 400 })
  }

  const hashed = hashPassword(password)
  const { error: updateError } = await supabase
    .from("app_users")
    .update({
      is_active: true,
      password_hash: hashed.hash,
      password_salt: hashed.salt,
      activation_token_hash: null,
      activation_token_expires_at: null,
    })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: "Não foi possível definir a senha." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
