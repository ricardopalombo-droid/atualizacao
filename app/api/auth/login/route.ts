import { NextResponse } from "next/server"
import { verifyPassword } from "@/lib/auth-crypto"
import { encodeSession, getSessionCookieName } from "@/lib/auth-session"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string }
  const email = String(body.email ?? "")
  const password = String(body.password ?? "")

  const expectedEmail = process.env.APP_LOGIN_EMAIL
  const expectedPassword = process.env.APP_LOGIN_PASSWORD

  if (expectedEmail && expectedPassword && email === expectedEmail && password === expectedPassword) {
    const response = NextResponse.json({ ok: true })

    response.cookies.set(
      getSessionCookieName(),
      encodeSession({
        userId: "palsys-admin",
        email,
        role: "palsys_admin",
        subscriberId: null,
        clientId: null,
        displayName: "Administrador PalSys",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    )

    return response
  }

  const supabase = getSupabaseServerClient()
  const { data: user, error } = await supabase
    .from("app_users")
    .select("id, email, full_name, role, subscriber_id, client_id, is_active, password_hash, password_salt")
    .eq("email", email)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Não foi possível validar o login." }, { status: 500 })
  }

  if (!user || !user.is_active) {
    return NextResponse.json({ error: "Login ou senha inválidos." }, { status: 401 })
  }

  if (!user.password_hash || !user.password_salt || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return NextResponse.json({ error: "Login ou senha inválidos." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set(
    getSessionCookieName(),
    encodeSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriberId: user.subscriber_id,
      clientId: user.client_id,
      displayName: user.full_name,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    }
  )

  return response
}
