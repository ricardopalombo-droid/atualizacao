"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Download, FileCheck2, FileUp, LoaderCircle, Trash2 } from "lucide-react"
import {
  employeeDocumentTypeLabels,
  type EmployeeDocumentRecord,
  type EmployeeDocumentType,
  type EmployeeDocumentExtractedField,
} from "@/lib/employee-document-types"
import { formSections } from "@/lib/employee-form-config"

type Props = {
  employeeId: string | null
  publicToken?: string | null
  canUpload: boolean
  canApply: boolean
  currentValues: Record<string, string | boolean>
  onApplyFields: (fields: EmployeeDocumentExtractedField[]) => void
}

const fieldLabels = Object.fromEntries(
  formSections.flatMap((section) => section.fields.map((field) => [field.key, field.label]))
) as Record<string, string>

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

export function EmployeeDocuments({
  employeeId,
  publicToken,
  canUpload,
  canApply,
  currentValues,
  onApplyFields,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [records, setRecords] = useState<EmployeeDocumentRecord[]>([])
  const [documentType, setDocumentType] = useState<EmployeeDocumentType>("rg_cin")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const tokenQuery = publicToken ? `&token=${encodeURIComponent(publicToken)}` : ""

  useEffect(() => {
    if (!employeeId) return
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/cadastros/documentos?employeeId=${encodeURIComponent(employeeId!)}${tokenQuery}`,
          { cache: "no-store" }
        )
        const result = await response.json() as { ok: boolean; records?: EmployeeDocumentRecord[]; error?: string }
        if (!response.ok || !result.ok) throw new Error(result.error ?? "Nao foi possivel carregar os documentos.")
        if (active) setRecords(result.records ?? [])
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Erro ao carregar documentos.")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [employeeId, tokenQuery])

  const availableFields = useMemo(
    () => records.flatMap((record) => record.extracted_fields.map((field) => ({ ...field, documentId: record.id }))),
    [records]
  )

  const emptyFieldSuggestions = useMemo(
    () => availableFields.filter((field) => {
      const current = currentValues[field.key]
      return current === undefined || current === false || String(current).trim() === ""
    }),
    [availableFields, currentValues]
  )

  const conflictingSuggestions = useMemo(
    () => availableFields.filter((field) => {
      const current = currentValues[field.key]
      return current !== undefined && current !== false && String(current).trim() !== "" && String(current) !== field.value
    }),
    [availableFields, currentValues]
  )

  async function uploadSelectedFile() {
    const file = inputRef.current?.files?.[0]
    if (!employeeId || !file) {
      setMessage(employeeId ? "Selecione um arquivo." : "Salve o cadastro antes de anexar documentos.")
      return
    }

    setIsUploading(true)
    setMessage("Enviando e lendo o documento. Isso pode levar alguns segundos.")

    try {
      const body = new FormData()
      body.set("employeeId", employeeId)
      body.set("documentType", documentType)
      body.set("file", file)
      body.set("consent", String(consent))
      if (publicToken) body.set("token", publicToken)

      const response = await fetch("/api/cadastros/documentos", { method: "POST", body })
      const result = await response.json() as { ok: boolean; record?: EmployeeDocumentRecord; error?: string }
      if (!response.ok || !result.ok || !result.record) throw new Error(result.error ?? "Nao foi possivel anexar o documento.")

      setRecords((previous) => [result.record!, ...previous])
      if (inputRef.current) inputRef.current.value = ""
      setMessage(
        result.record.analysis_status === "completed"
          ? "Documento salvo e lido. Confira as sugestoes antes de aplica-las."
          : `Documento salvo, mas a leitura precisa de atencao: ${result.record.analysis_error ?? "nao concluida"}`
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao enviar documento.")
    } finally {
      setIsUploading(false)
    }
  }

  async function openDocument(record: EmployeeDocumentRecord) {
    if (!employeeId) return
    try {
      const response = await fetch(
        `/api/cadastros/documentos?employeeId=${encodeURIComponent(employeeId)}&documentId=${encodeURIComponent(record.id)}${tokenQuery}`,
        { cache: "no-store" }
      )
      const result = await response.json() as { ok: boolean; signedUrl?: string; error?: string }
      if (!response.ok || !result.ok || !result.signedUrl) throw new Error(result.error ?? "Documento indisponivel.")
      window.open(result.signedUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao abrir documento.")
    }
  }

  async function removeDocument(record: EmployeeDocumentRecord) {
    if (!employeeId || !window.confirm(`Excluir o documento ${record.original_name}?`)) return
    setDeletingId(record.id)
    try {
      const response = await fetch("/api/cadastros/documentos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, documentId: record.id, token: publicToken ?? "" }),
      })
      const result = await response.json() as { ok: boolean; error?: string }
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Nao foi possivel excluir o documento.")
      setRecords((previous) => previous.filter((item) => item.id !== record.id))
      setMessage("Documento excluido.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir documento.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <FileCheck2 size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Documentos do funcionario</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Envie PDF, JPG ou PNG de ate 12 MB. Os dados lidos sao apenas sugestoes e precisam ser conferidos.
          </p>
        </div>
      </div>

      {canUpload ? (
        employeeId ? (
          <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as EmployeeDocumentType)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              {Object.entries(employeeDocumentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={() => void uploadSelectedFile()}
              disabled={isUploading || !consent}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
            >
              {isUploading ? <LoaderCircle className="animate-spin" size={18} /> : <FileUp size={18} />}
              {isUploading ? "Lendo..." : "Anexar e ler"}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">
            Salve o rascunho ou envie o convite antes de anexar documentos.
          </p>
        )
      ) : null}

      {canUpload && employeeId ? (
        <label className="mt-3 flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          Confirmo que o titular autorizou o armazenamento privado e a leitura deste documento para o cadastro admissional, com exclusao programada em ate 60 dias apos o encerramento.
        </label>
      ) : null}

      {message ? <p className="mt-4 text-sm font-medium text-slate-700">{message}</p> : null}

      {isLoading ? (
        <p className="mt-5 text-sm text-slate-600">Carregando documentos...</p>
      ) : records.length > 0 ? (
        <div className="mt-5 space-y-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{record.original_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {employeeDocumentTypeLabels[record.document_type]} - {formatBytes(record.size_bytes)} - enviado em {formatDate(record.created_at)}
                  </p>
                  <p className={`mt-2 text-xs font-bold ${record.analysis_status === "completed" ? "text-emerald-700" : record.analysis_status === "failed" ? "text-amber-700" : "text-sky-700"}`}>
                    {record.analysis_status === "completed" ? `${record.extracted_fields.length} campo(s) identificado(s)` : record.analysis_status === "failed" ? `Leitura nao concluida: ${record.analysis_error ?? "verifique o arquivo"}` : "Leitura em andamento"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void openDocument(record)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Download size={16} /> Abrir
                  </button>
                  {canUpload ? (
                    <button type="button" onClick={() => void removeDocument(record)} disabled={deletingId === record.id} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                      <Trash2 size={16} /> Excluir
                    </button>
                  ) : null}
                </div>
              </div>

              {record.analysis_warnings.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-700">
                  {record.analysis_warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-white p-4 text-sm text-slate-600">
          Nenhum documento anexado.
        </p>
      )}

      {availableFields.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Sugestoes encontradas</h4>
              <p className="mt-1 text-xs text-slate-500">
                {emptyFieldSuggestions.length} campo(s) vazio(s) podem ser preenchidos. {conflictingSuggestions.length} divergencia(s) devem ser conferidas manualmente.
              </p>
            </div>
            {canApply && emptyFieldSuggestions.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onApplyFields(emptyFieldSuggestions)
                  setMessage(`${emptyFieldSuggestions.length} campo(s) vazio(s) preenchido(s). Confira antes de enviar.`)
                }}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Preencher campos vazios
              </button>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {availableFields.map((field, index) => (
              <div key={`${field.documentId}-${field.key}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-800">{fieldLabels[field.key] ?? field.key}:</span>{" "}
                <span className="text-slate-700">{field.value}</span>{" "}
                <span className="text-xs text-slate-500">({field.confidence})</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
