import nodemailer from "nodemailer"

type EnviarEmailEntregaParams = {
  email: string
  nome?: string
  produtoNome: string
  licenseKey: string
  downloadUrl: string
  horasValidade: number
  panelAccessUrl?: string
  accessEmail?: string
  setupPasswordUrl?: string | null
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

export async function enviarEmailEntrega({
  email,
  nome,
  produtoNome,
  licenseKey,
  downloadUrl,
  horasValidade,
  panelAccessUrl,
  accessEmail,
  setupPasswordUrl,
}: EnviarEmailEntregaParams) {
  const nomeExibicao = nome?.trim() || email
  const { transporter, from } = getTransporter()

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
      <h2 style="margin-bottom:16px;">Compra aprovada com sucesso</h2>

      <p>Olá, <strong>${escapeHtml(nomeExibicao)}</strong>.</p>

      <p>Seu pagamento foi confirmado e seu acesso já foi liberado.</p>

      ${
        panelAccessUrl
          ? `
      <div style="margin:24px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff7ed;">
        <p style="margin:0 0 10px 0;"><strong>Acesso ao painel do escritório</strong></p>
        <p style="margin:0 0 8px 0;"><strong>Link:</strong> <a href="${panelAccessUrl}">${panelAccessUrl}</a></p>
        ${accessEmail ? `<p style="margin:0 0 8px 0;"><strong>Login:</strong> ${escapeHtml(accessEmail)}</p>` : ""}
        ${
          setupPasswordUrl
            ? `<p style="margin:0 0 14px 0;">Clique no botão abaixo para criar sua senha de acesso ao painel.</p>
               <p style="margin:0;">
                 <a href="${setupPasswordUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">
                   Criar minha senha
                 </a>
               </p>
               <p style="margin:12px 0 0 0;font-size:13px;color:#475569;">Se preferir, copie este link no navegador: <span style="word-break:break-all;">${escapeHtml(setupPasswordUrl)}</span></p>`
            : `<p style="margin:0;">Use a senha já cadastrada para este e-mail.</p>`
        }
      </div>
      `
          : ""
      }

      <div style="margin:24px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
        <p style="margin:0 0 10px 0;"><strong>Produto:</strong> ${escapeHtml(produtoNome)}</p>
        <p style="margin:0 0 10px 0;"><strong>Chave da licença:</strong></p>
        <div style="font-size:18px;font-weight:bold;letter-spacing:0.5px;padding:12px;background:#fff;border:1px solid #d1d5db;border-radius:8px;">
          ${escapeHtml(licenseKey)}
        </div>
      </div>

      <p>Seu link para download ficará disponível por <strong>${horasValidade} horas</strong>.</p>

      <p style="margin:24px 0;">
        <a href="${downloadUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;">
          Baixar sistema
        </a>
      </p>

      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p style="word-break:break-all;color:#2563eb;">${escapeHtml(downloadUrl)}</p>

      <p style="margin-top:24px;">Guarde esta chave em local seguro.</p>
      <p>Equipe PalSys</p>
    </div>
  `

  const text = `
Compra aprovada com sucesso

Olá, ${nomeExibicao}.

Seu pagamento foi confirmado e seu acesso já foi liberado.

${panelAccessUrl ? `Acesso ao painel: ${panelAccessUrl}` : ""}
${accessEmail ? `Login: ${accessEmail}` : ""}
${setupPasswordUrl ? `Defina sua senha aqui: ${setupPasswordUrl}` : ""}

Produto: ${produtoNome}
Chave da licença: ${licenseKey}

Link para download (${horasValidade} horas):
${downloadUrl}

Equipe PalSys
  `.trim()

  await transporter.sendMail({
    from,
    to: email,
    subject: `Sua licença e download - ${produtoNome}`,
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
