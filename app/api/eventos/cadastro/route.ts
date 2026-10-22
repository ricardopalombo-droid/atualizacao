import { NextResponse } from "next/server"
import { createInviteToken, hashPassword, sha256Hex } from "@/lib/auth-crypto"
import { escapeHtml, getEmailTransporter } from "@/lib/email-server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const runtime = "nodejs"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const name = String(body?.name ?? "").trim().replace(/\s+/g, " ")
    const email = String(body?.email ?? "").trim().toLowerCase()
    const phone = String(body?.phone ?? "").trim()
    const phoneDigits = phone.replace(/\D/g, "")
    const password = String(body?.password ?? "")

    if (name.length < 3 || name.length > 120) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 })
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 })
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Informe um telefone válido com DDD." }, { status: 400 })
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres, com letra e número." },
        { status: 400 },
      )
    }

    const supabase = getSupabaseServerClient()
    const { data: existing, error: lookupError } = await supabase
      .from("app_users")
      .select("id, is_active, role")
      .eq("email", email)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (existing && (existing.role !== "event_user" || existing.is_active)) {
      return NextResponse.json(
        { error: "Este e-mail já possui cadastro. Use a opção de entrar ou recuperar a senha." },
        { status: 409 },
      )
    }

    const token = createInviteToken(32)
    const passwordData = hashPassword(password)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const accountData = {
        email,
        full_name: name,
        phone,
        role: "event_user",
        subscriber_id: null,
        client_id: null,
        password_hash: passwordData.hash,
        password_salt: passwordData.salt,
        activation_token_hash: sha256Hex(token),
        activation_token_expires_at: expiresAt,
        email_verified_at: null,
        can_view_personal_data: false,
        is_active: false,
      }
    const mutation = existing
      ? supabase.from("app_users").update(accountData).eq("id", existing.id)
      : supabase.from("app_users").insert(accountData)
    const { data: created, error: insertError } = await mutation
      .select("id")
      .single()

    if (insertError || !created) throw insertError ?? new Error("Cadastro não criado.")

    const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "")
    const verificationUrl = `${siteUrl}/api/eventos/cadastro/confirmar?token=${encodeURIComponent(token)}`

    try {
      const { transporter, from } = getEmailTransporter()
      await transporter.sendMail({
        from,
        to: email,
        subject: "Confirme seu cadastro - PalSys",
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
            <h2>Confirme seu cadastro</h2>
            <p>Olá, <strong>${escapeHtml(name)}</strong>.</p>
            <p>Confirme seu e-mail para acessar o criador de eventos Contmatic.</p>
            <p style="margin:24px 0"><a href="${verificationUrl}" style="display:inline-block;background:#facc15;color:#0f172a;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold">Confirmar meu e-mail</a></p>
            <p>O link é válido por 24 horas. Se você não fez este cadastro, ignore esta mensagem.</p>
          </div>
        `,
        text: `Olá, ${name}. Confirme seu cadastro no criador de eventos PalSys: ${verificationUrl}\n\nO link é válido por 24 horas.`,
      })
    } catch (emailError) {
      if (!existing) {
        await supabase.from("app_users").delete().eq("id", created.id).eq("is_active", false)
      }
      throw emailError
    }

    return NextResponse.json({
      ok: true,
      message: "Cadastro recebido. Abra o e-mail enviado para confirmar sua conta.",
    })
  } catch (error) {
    console.error("Falha no cadastro de usuário de eventos:", error)
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro. Tente novamente em alguns instantes." },
      { status: 500 },
    )
  }
}
