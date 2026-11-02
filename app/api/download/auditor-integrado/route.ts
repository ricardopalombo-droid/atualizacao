import { NextResponse } from "next/server"
import { gerarLinkDownloadS3 } from "@/lib/s3-download"

export async function GET() {
  try {
    const download = await gerarLinkDownloadS3("auditor-integrado-credits", 60 * 60)
    return NextResponse.redirect(download.url, 307)
  } catch (error) {
    console.error("Erro ao gerar download do Auditor Integrado:", error)
    return NextResponse.json(
      { error: "O instalador está temporariamente indisponível. Tente novamente em alguns minutos." },
      { status: 503 },
    )
  }
}
