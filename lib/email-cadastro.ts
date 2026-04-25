import nodemailer from "nodemailer"

type EnviarEmailCadastroParams = {
  email: string
  nome?: string
  inviteLink: string
  expiresAt: string
}

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

export async function enviarEmailCadastroFuncionario({
  email,
  nome,
  inviteLink,
  expiresAt,
}: EnviarEmailCadastroParams) {
  const nomeExibicao = nome?.trim() || email
  const { transporter, from } = getTransporter()
  const expirationLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(expiresAt))

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
      <h2 style="margin-bottom:16px;">Complete seu cadastro</h2>

      <p>Olá, <strong>${escapeHtml(nomeExibicao)}</strong>.</p>

      <p>
        Você recebeu um link para preencher seu cadastro básico na plataforma da PalSys.
      </p>

      <p>O link abaixo fica válido até <strong>${escapeHtml(expirationLabel)}</strong>.</p>

      <p style="margin:24px 0;">
        <a href="${inviteLink}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;">
          Abrir meu cadastro
        </a>
      </p>

      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p style="word-break:break-all;color:#2563eb;">${escapeHtml(inviteLink)}</p>

      <p style="margin-top:24px;">Equipe PalSys</p>
    </div>
  `

  const text = `
Complete seu cadastro

Olá, ${nomeExibicao}.

Você recebeu um link para preencher seu cadastro básico na plataforma da PalSys.
O link fica válido até ${expirationLabel}.

Abra aqui:
${inviteLink}

Equipe PalSys
  `.trim()

  await transporter.sendMail({
    from,
    to: email,
    subject: "Complete seu cadastro - PalSys",
    html,
    text,
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
