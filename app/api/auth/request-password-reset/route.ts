import nodemailer from "nodemailer"
import { NextResponse } from "next/server"
import { createInviteToken, sha256Hex } from "@/lib/auth-crypto"
import { getSupabaseServerClient } from "@/lib/supabase-server"

function getTransporter() {
  const SMTP_HOST = process.env.SMTP_HOST
  const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
  const SMTP_USER = process.env.SMTP_USER
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD
  const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new Error("Configuração SMTP incompleta no .env")
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  })

  return {
    transporter,
    from: SMTP_FROM,
  }
}

async function enviarEmailRedefinicaoSenha(params: {
  email: string
  nome?: string | null
  resetUrl: string
}) {
  const { transporter, from } = getTransporter()
  const nomeExibicao = params.nome?.trim() || params.email

  await transporter.sendMail({
    from,
    to: params.email,
    subject: "Redefinição de senha - PalSys",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin-bottom:16px;">Redefinição de senha</h2>
        <p>Olá, <strong>${escapeHtml(nomeExibicao)}</strong>.</p>
        <p>Recebemos um pedido para redefinir a senha do seu acesso ao painel.</p>
        <p style="margin:24px 0;">
          <a href="${params.resetUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">
            Criar nova senha
          </a>
        </p>
        <p>Se preferir, copie este link no navegador:</p>
        <p style="word-break:break-all;color:#2563eb;">${escapeHtml(params.resetUrl)}</p>
        <p style="margin-top:24px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
        <p>Equipe PalSys</p>
      </div>
    `,
    text: `
Redefinição de senha

Olá, ${nomeExibicao}.

Recebemos um pedido para redefinir a senha do seu acesso ao painel.

Crie sua nova senha aqui:
${params.resetUrl}

Se você não solicitou esta alteração, ignore este e-mail.
    `.trim(),
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null
  const email = String(body?.email ?? "").trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id, email, full_name, is_active")
    .eq("email", email)
    .maybeSingle()

  if (userError) {
    return NextResponse.json({ error: "Não foi possível processar sua solicitação." }, { status: 500 })
  }

  if (user) {
    const token = createInviteToken()
    const tokenHash = sha256Hex(token)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString()
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.palsys.com.br"}/acesso/definir-senha?token=${encodeURIComponent(token)}`

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        activation_token_hash: tokenHash,
        activation_token_expires_at: expiresAt,
      })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Não foi possível processar sua solicitação." }, { status: 500 })
    }

    await enviarEmailRedefinicaoSenha({
      email: user.email,
      nome: user.full_name,
      resetUrl,
    })
  }

  return NextResponse.json({
    ok: true,
    message: "Se o e-mail existir na base, enviaremos um link para criar uma nova senha.",
  })
}
