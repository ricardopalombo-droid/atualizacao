import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string }
  const email = String(body.email ?? "")
  const password = String(body.password ?? "")

  const expectedEmail = process.env.APP_LOGIN_EMAIL
  const expectedPassword = process.env.APP_LOGIN_PASSWORD

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { error: "Credenciais do aplicativo não configuradas no ambiente." },
      { status: 500 }
    )
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: "Login ou senha inválidos." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set("palsys_session", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
