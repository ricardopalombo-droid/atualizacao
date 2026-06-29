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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.palsys.com.br").replace(/\/+$/, "")
  const logoUrl = `${siteUrl}/logo-palsys.png`
  const greetingName = escapeHtml(nomeExibicao)
  const safeProdutoNome = escapeHtml(produtoNome)
  const safeLicenseKey = escapeHtml(licenseKey)
  const safeDownloadUrl = escapeHtml(downloadUrl)
  const safePanelAccessUrl = panelAccessUrl ? escapeHtml(panelAccessUrl) : null
  const safeAccessEmail = accessEmail ? escapeHtml(accessEmail) : null
  const safeSetupPasswordUrl = setupPasswordUrl ? escapeHtml(setupPasswordUrl) : null

  const html = `
    <div style="margin:0;padding:32px 16px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:20px;">
          <img
            src="${logoUrl}"
            alt="PalSys"
            style="max-width:220px;width:100%;height:auto;display:inline-block;"
          />
        </div>

        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 18px 45px rgba(15,23,42,0.08);overflow:hidden;">
          <div style="padding:32px 32px 22px 32px;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);color:#ffffff;">
            <div style="display:inline-block;background:#fbbf24;color:#7c2d12;font-size:12px;font-weight:700;letter-spacing:0.2px;padding:8px 14px;border-radius:999px;margin-bottom:18px;">
              Entrega liberada
            </div>
            <h1 style="margin:0 0 12px 0;font-size:30px;line-height:1.15;font-weight:800;">
              Compra aprovada com sucesso
            </h1>
            <p style="margin:0;font-size:16px;line-height:1.7;color:#dbeafe;">
              Olá, <strong style="color:#ffffff;">${greetingName}</strong>. Seu pagamento foi confirmado e seu acesso já está disponível.
            </p>
          </div>

          <div style="padding:28px 32px 32px 32px;">
            <p style="margin:0 0 22px 0;font-size:16px;line-height:1.7;color:#334155;">
              Abaixo estão os dados da sua liberação para download e ativação do sistema.
            </p>

      ${
        panelAccessUrl
          ? `
      <div style="margin:0 0 22px 0;padding:20px;border:1px solid #fde68a;border-radius:18px;background:#fff7ed;">
        <p style="margin:0 0 10px 0;font-size:18px;font-weight:700;color:#9a3412;">Acesso ao painel do escritório</p>
        <p style="margin:0 0 8px 0;color:#7c2d12;"><strong>Link:</strong> <a href="${panelAccessUrl}" style="color:#b45309;text-decoration:none;">${safePanelAccessUrl}</a></p>
        ${accessEmail ? `<p style="margin:0 0 8px 0;color:#7c2d12;"><strong>Login:</strong> ${safeAccessEmail}</p>` : ""}
        ${
          setupPasswordUrl
            ? `<p style="margin:0 0 14px 0;color:#7c2d12;">Clique no botão abaixo para criar sua senha de acesso ao painel.</p>
               <p style="margin:0 0 10px 0;">
                 <a href="${setupPasswordUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:bold;">
                   Criar minha senha
                 </a>
               </p>
               <p style="margin:12px 0 0 0;font-size:13px;color:#92400e;">Se preferir, copie este link no navegador: <span style="word-break:break-all;">${safeSetupPasswordUrl}</span></p>`
            : `<p style="margin:0;color:#7c2d12;">Use a senha já cadastrada para este e-mail.</p>`
        }
      </div>
      `
          : ""
      }

            <div style="margin:0 0 24px 0;padding:22px;border:1px solid #dbeafe;border-radius:20px;background:linear-gradient(180deg,#f8fbff 0%,#eef5ff 100%);">
              <p style="margin:0 0 10px 0;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.4px;">
                Produto liberado
              </p>
              <p style="margin:0 0 18px 0;font-size:24px;line-height:1.3;font-weight:800;color:#0f172a;">
                ${safeProdutoNome}
              </p>
              <p style="margin:0 0 10px 0;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:0.4px;">
                Chave da licença
              </p>
              <div style="font-size:28px;font-weight:800;letter-spacing:0.8px;padding:16px 18px;background:#ffffff;border:1px solid #cbd5e1;border-radius:16px;color:#111827;">
                ${safeLicenseKey}
              </div>
            </div>

            <div style="margin:0 0 22px 0;padding:18px 20px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
              <p style="margin:0;font-size:16px;color:#334155;">
                Seu link para download ficará disponível por <strong style="color:#0f172a;">${horasValidade} horas</strong>.
              </p>
            </div>

            <div style="text-align:center;margin:28px 0 22px 0;">
              <a href="${downloadUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:16px 28px;border-radius:14px;font-weight:700;font-size:17px;">
                Baixar sistema
              </a>
            </div>

            <div style="padding:18px 20px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
              <p style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:#0f172a;">Se preferir, copie o link abaixo no navegador:</p>
              <p style="margin:0;word-break:break-all;color:#2563eb;font-size:13px;line-height:1.6;">${safeDownloadUrl}</p>
            </div>

            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px 0;font-size:15px;color:#334155;">Guarde sua chave em local seguro.</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
                Equipe PalSys<br />
                Automação de Sistemas Contábeis<br />
                <a href="${siteUrl}" style="color:#2563eb;text-decoration:none;">${siteUrl}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
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
