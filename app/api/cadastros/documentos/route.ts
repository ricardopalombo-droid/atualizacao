import { z } from "zod"
import { getCurrentSession } from "@/lib/auth-session"
import { getEmployeeRecordById, getEmployeeRecordByInviteToken } from "@/lib/cadastro-repository"
import {
  createEmployeeDocument,
  createEmployeeDocumentSignedUrl,
  deleteEmployeeDocument,
  listEmployeeDocuments,
} from "@/lib/employee-document-repository"
import { employeeDocumentTypeSchema } from "@/lib/employee-document-types"

export const runtime = "nodejs"
export const maxDuration = 120

const MAX_FILE_SIZE = 12 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])

const deleteSchema = z.object({
  employeeId: z.string().uuid(),
  documentId: z.string().uuid(),
  token: z.string().min(20).optional().or(z.literal("")),
})

async function resolveAccess(request: Request, employeeId: string, token?: string | null) {
  if (token) {
    const record = await getEmployeeRecordByInviteToken(token)
    if (!record || record.id !== employeeId) throw new Error("Link invalido ou expirado.")
    return { record, actor: "employee" as const, canManage: record.workflow_status === "convite_enviado" }
  }

  const session = await getCurrentSession()
  if (!session || !["subscriber_admin", "client_user"].includes(session.role)) {
    throw new Error("Acesso não autorizado.")
  }

  const record = await getEmployeeRecordById(employeeId, {
    subscriberId: session.subscriberId,
    clientId: session.role === "client_user" ? session.clientId : null,
  })

  if (!record) throw new Error("Cadastro não encontrado neste escopo.")
  return { record, actor: "dp" as const, canManage: session.role === "subscriber_admin" }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro ao processar documentos."
  const status = /autorizado|escopo|invalido|expirado/i.test(message) ? 403 : 400
  return Response.json({ ok: false, error: message }, { status })
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const employeeId = z.string().uuid().parse(url.searchParams.get("employeeId"))
    const token = url.searchParams.get("token")
    await resolveAccess(request, employeeId, token)

    const documentId = url.searchParams.get("documentId")
    if (documentId) {
      const signedUrl = await createEmployeeDocumentSignedUrl(z.string().uuid().parse(documentId), employeeId)
      return Response.json({ ok: true, signedUrl })
    }

    const records = await listEmployeeDocuments(employeeId)
    return Response.json({ ok: true, records })
  } catch (error) {
    console.error(error)
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const employeeId = z.string().uuid().parse(formData.get("employeeId"))
    const token = String(formData.get("token") ?? "")
    const documentType = employeeDocumentTypeSchema.parse(formData.get("documentType"))
    const consent = formData.get("consent") === "true"
    const file = formData.get("file")
    const access = await resolveAccess(request, employeeId, token)

    if (!access.canManage) {
      throw new Error("Este cadastro não aceita mais anexos ou o usuário possui somente visualização.")
    }
    if (!consent) throw new Error("Confirme a autorização para armazenar e ler o documento.")

    if (!(file instanceof File) || !file.size) throw new Error("Selecione um documento.")
    if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error("Envie PDF, JPG ou PNG.")
    if (file.size > MAX_FILE_SIZE) throw new Error("O arquivo deve ter no maximo 12 MB.")

    const record = await createEmployeeDocument({
      employeeId,
      documentType,
      file,
      uploadedBy: access.actor,
    })

    return Response.json({ ok: true, record })
  } catch (error) {
    console.error(error)
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = deleteSchema.parse(await request.json())
    const access = await resolveAccess(request, payload.employeeId, payload.token)
    if (!access.canManage) throw new Error("Este documento não pode mais ser excluído.")

    await deleteEmployeeDocument(payload.documentId, payload.employeeId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)
    return errorResponse(error)
  }
}
