import { NextResponse } from "next/server"
import { sha256Hex } from "@/lib/auth-crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = String(url.searchParams.get("token") ?? "").trim()
  const accessUrl = new URL("/acesso", url.origin)

  if (!token || token.length > 256) {
    accessUrl.searchParams.set("confirmacao", "invalida")
    return NextResponse.redirect(accessUrl)
  }

  const supabase = getSupabaseServerClient()
  const { data: user, error } = await supabase
    .from("app_users")
    .select("id, role, activation_token_expires_at")
    .eq("activation_token_hash", sha256Hex(token))
    .eq("role", "event_user")
    .maybeSingle()

  if (
    error ||
    !user ||
    !user.activation_token_expires_at ||
    new Date(user.activation_token_expires_at).getTime() < Date.now()
  ) {
    accessUrl.searchParams.set("confirmacao", "invalida")
    return NextResponse.redirect(accessUrl)
  }

  const { error: updateError } = await supabase
    .from("app_users")
    .update({
      is_active: true,
      email_verified_at: new Date().toISOString(),
      activation_token_hash: null,
      activation_token_expires_at: null,
    })
    .eq("id", user.id)

  accessUrl.searchParams.set("confirmacao", updateError ? "invalida" : "ok")
  return NextResponse.redirect(accessUrl)
}
