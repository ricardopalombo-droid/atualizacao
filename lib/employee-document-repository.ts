import "server-only"

import { randomUUID } from "node:crypto"
import { analyzeEmployeeDocument } from "@/lib/employee-document-analysis"
import {
  employeeDocumentTypeSchema,
  type EmployeeDocumentRecord,
  type EmployeeDocumentType,
} from "@/lib/employee-document-types"
import { getSupabaseServerClient } from "@/lib/supabase-server"

const BUCKET = "employee-documents"

function sanitizeFilename(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  return normalized.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "documento"
}

function mapRecord(row: Record<string, unknown>): EmployeeDocumentRecord {
  return {
    id: String(row.id),
    employee_id: String(row.employee_id),
    document_type: employeeDocumentTypeSchema.parse(row.document_type),
    original_name: String(row.original_name),
    mime_type: String(row.mime_type),
    size_bytes: Number(row.size_bytes),
    analysis_status: row.analysis_status as EmployeeDocumentRecord["analysis_status"],
    extracted_fields: Array.isArray(row.extracted_fields)
      ? row.extracted_fields as EmployeeDocumentRecord["extracted_fields"]
      : [],
    analysis_warnings: Array.isArray(row.analysis_warnings)
      ? row.analysis_warnings.filter((item): item is string => typeof item === "string")
      : [],
    analysis_error: typeof row.analysis_error === "string" ? row.analysis_error : null,
    uploaded_by: String(row.uploaded_by),
    delete_after: String(row.delete_after),
    created_at: String(row.created_at),
  }
}

export async function listEmployeeDocuments(employeeId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from("employee_documents")
    .select("id, employee_id, document_type, original_name, mime_type, size_bytes, analysis_status, extracted_fields, analysis_warnings, analysis_error, uploaded_by, delete_after, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapRecord(row as Record<string, unknown>))
}

export async function getEmployeeDocument(documentId: string, employeeId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from("employee_documents")
    .select("id, employee_id, document_type, storage_path, original_name, mime_type, size_bytes, analysis_status, extracted_fields, analysis_warnings, analysis_error, uploaded_by, delete_after, created_at")
    .eq("id", documentId)
    .eq("employee_id", employeeId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createEmployeeDocument(args: {
  employeeId: string
  documentType: EmployeeDocumentType
  file: File
  uploadedBy: "employee" | "dp"
}) {
  const supabase = getSupabaseServerClient()
  const bytes = Buffer.from(await args.file.arrayBuffer())
  const storagePath = `${args.employeeId}/${randomUUID()}-${sanitizeFilename(args.file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: args.file.type,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from("employee_documents")
    .insert({
      employee_id: args.employeeId,
      document_type: args.documentType,
      storage_path: storagePath,
      original_name: args.file.name,
      mime_type: args.file.type,
      size_bytes: bytes.length,
      uploaded_by: args.uploadedBy,
      consent_at: new Date().toISOString(),
      analysis_status: "processing",
    })
    .select("id")
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw error
  }

  try {
    const analysis = await analyzeEmployeeDocument({
      bytes,
      mimeType: args.file.type,
      filename: args.file.name,
      declaredType: args.documentType,
    })

    const { error: updateError } = await supabase
      .from("employee_documents")
      .update({
        analysis_status: "completed",
        document_type: analysis.detectedType,
        extracted_fields: analysis.fields,
        analysis_warnings: analysis.warnings,
        analysis_error: null,
      })
      .eq("id", data.id)

    if (updateError) throw updateError
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível ler o documento."
    const { error: updateError } = await supabase
      .from("employee_documents")
      .update({
        analysis_status: "failed",
        analysis_error: message.slice(0, 2000),
      })
      .eq("id", data.id)

    if (updateError) throw updateError
  }

  const saved = await getEmployeeDocument(data.id, args.employeeId)
  if (!saved) throw new Error("Documento salvo, mas não encontrado para retorno.")
  return mapRecord(saved as Record<string, unknown>)
}

export async function createEmployeeDocumentSignedUrl(documentId: string, employeeId: string) {
  const supabase = getSupabaseServerClient()
  const document = await getEmployeeDocument(documentId, employeeId)
  if (!document) throw new Error("Documento não encontrado.")

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(String(document.storage_path), 60)

  if (error) throw error
  return data.signedUrl
}

export async function deleteEmployeeDocument(documentId: string, employeeId: string) {
  const supabase = getSupabaseServerClient()
  const document = await getEmployeeDocument(documentId, employeeId)
  if (!document) throw new Error("Documento não encontrado.")

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([String(document.storage_path)])
  if (storageError) throw storageError

  const { error } = await supabase
    .from("employee_documents")
    .delete()
    .eq("id", documentId)
    .eq("employee_id", employeeId)

  if (error) throw error
}

export async function deleteExpiredEmployeeDocuments(limit = 100) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from("employee_documents")
    .select("id, employee_id")
    .lte("delete_after", new Date().toISOString())
    .order("delete_after", { ascending: true })
    .limit(limit)

  if (error) throw error

  let deleted = 0
  for (const row of data ?? []) {
    await deleteEmployeeDocument(String(row.id), String(row.employee_id))
    deleted += 1
  }
  return deleted
}
