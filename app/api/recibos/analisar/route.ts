import { NextResponse } from "next/server"
import {
  beginReceiptAnalysis,
  finishReceiptAnalysis,
  getRequestAddress,
  hashRequestAddress,
  verifyTurnstile,
} from "@/lib/receipt-access"
import { analyzeReceipt } from "@/lib/receipt-analysis"

export const runtime = "nodejs"
export const maxDuration = 120

const MAX_FILE_SIZE = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])

async function hasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (file.type === "application/pdf") {
    return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  }
  if (file.type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8
  return false
}

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Não foi possível analisar o documento."
  return NextResponse.json({ erro: message }, { status })
}

export async function POST(request: Request) {
  let requestId = ""
  try {
    const form = await request.formData()
    const file = form.get("arquivo")
    const answers = String(form.get("respostas") ?? "").trim()
    const consent = String(form.get("consentimento") ?? "") === "true"
    const turnstileToken = String(form.get("turnstileToken") ?? "").trim()

    if (!(file instanceof File)) throw new Error("Selecione um arquivo para analisar.")
    if (!consent) throw new Error("Confirme o consentimento para analisar o documento.")
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Envie um arquivo PDF, JPG ou PNG.")
    }
    if (!file.size || file.size > MAX_FILE_SIZE) {
      throw new Error("O arquivo deve ter no máximo 4 MB.")
    }
    if (!(await hasValidSignature(file))) {
      throw new Error("O conteúdo do arquivo não corresponde ao formato informado.")
    }
    if (answers.length > 2_000) {
      throw new Error("As respostas adicionais devem ter no máximo 2.000 caracteres.")
    }

    const address = getRequestAddress(request)
    await verifyTurnstile(turnstileToken, address)
    requestId = await beginReceiptAnalysis(hashRequestAddress(address), file.size)

    const analysis = await analyzeReceipt({ file, answers })
    await finishReceiptAnalysis(requestId, "completed", analysis.tipo_documento)
    return NextResponse.json({ analise: analysis })
  } catch (error) {
    if (requestId) await finishReceiptAnalysis(requestId, "failed").catch(() => undefined)
    return errorResponse(error)
  }
}

