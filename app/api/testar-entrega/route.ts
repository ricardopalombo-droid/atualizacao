import { gerarLinkDownloadS3 } from "@/lib/s3-download"
import { enviarEmailEntrega } from "@/lib/email-entrega"

export async function GET() {
  try {
    const download = await gerarLinkDownloadS3("ecac-001")

    await enviarEmailEntrega({
      email: "ricardocontmatic@gmail.com",
      nome: "Teste",
      produtoNome: "ECAC",
      licenseKey: "TESTE-123-ABC",
      downloadUrl: download.url,
      horasValidade: 6,
    })

    return Response.json({ ok: true, url: download.url })
  } catch (error) {
    console.error(error)
    return Response.json({ error: true }, { status: 500 })
  }
}
