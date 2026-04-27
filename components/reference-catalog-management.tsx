"use client"

import { useEffect, useState } from "react"
import { FileUp, Layers3 } from "lucide-react"

type ReferenceType = "cargo" | "horario" | "sindicato"

type ReferenceRecord = {
  id: string
  code: string
  label: string
  updated_at: string
}

type ReferenceSummary = Record<ReferenceType, ReferenceRecord[]>

const referenceLabels: Record<ReferenceType, string> = {
  cargo: "Cargos",
  horario: "Horarios",
  sindicato: "Sindicatos",
}

const helpByType: Record<ReferenceType, string> = {
  cargo: "Importe o PDF de cargos para alimentar o campo Cargo e reaproveitar o CBO do cadastro de origem.",
  horario: "Importe o PDF de horarios para transformar o campo Horario em lista selecionavel.",
  sindicato: "Importe o PDF de sindicatos para oferecer uma lista padronizada no cadastro contratual.",
}

const replaceWarningByType: Record<ReferenceType, string> = {
  cargo: "Esta importacao vai substituir toda a base atual de cargos desta empresa pelo conteudo do novo PDF.",
  horario: "Esta importacao vai substituir toda a base atual de horarios desta empresa pelo conteudo do novo PDF.",
  sindicato: "Esta importacao vai substituir toda a base atual de sindicatos desta empresa pelo conteudo do novo PDF.",
}

export function ReferenceCatalogManagement() {
  const [summary, setSummary] = useState<ReferenceSummary>({
    cargo: [],
    horario: [],
    sindicato: [],
  })
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<ReferenceType, File | null>>>({})
  const [statusMessage, setStatusMessage] = useState(
    "Importe os PDFs de cargos, horarios e sindicatos para alimentar as listas da sua empresa."
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState<ReferenceType | null>(null)

  useEffect(() => {
    void loadSummary()
  }, [])

  async function parseApiResponse<T>(response: Response): Promise<T> {
    const raw = await response.text()

    try {
      return JSON.parse(raw) as T
    } catch {
      throw new Error(raw.startsWith("<!DOCTYPE") ? "A funcao retornou uma pagina de erro do servidor." : raw || "Resposta invalida da API.")
    }
  }

  async function loadSummary() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/referencias", {
        method: "GET",
        cache: "no-store",
      })
      const result = await parseApiResponse<{
        ok: boolean
        summary?: ReferenceSummary
        error?: string
      }>(response)

      if (!response.ok || !result.ok || !result.summary) {
        setStatusMessage(result.error ?? "Nao foi possivel carregar as bases da empresa.")
        return
      }

      setSummary(result.summary)
      setStatusMessage("Bases carregadas com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao carregar referencias.")
    } finally {
      setIsLoading(false)
    }
  }

  async function uploadReference(referenceType: ReferenceType) {
    const file = selectedFiles[referenceType]

    if (!file) {
      setStatusMessage(`Selecione o PDF de ${referenceLabels[referenceType].toLowerCase()} antes de importar.`)
      return
    }

    const currentCount = summary[referenceType].length
    const confirmed = window.confirm(
      `${replaceWarningByType[referenceType]}\n\nRegistros atuais: ${currentCount}\nArquivo selecionado: ${file.name}\n\nDeseja continuar?`
    )

    if (!confirmed) {
      setStatusMessage(`Importacao de ${referenceLabels[referenceType]} cancelada.`)
      return
    }

    setIsUploading(referenceType)

    try {
      const formData = new FormData()
      formData.set("type", referenceType)
      formData.set("file", file)

      const response = await fetch("/api/referencias", {
        method: "POST",
        body: formData,
      })

      const result = await parseApiResponse<{ ok: boolean; importedCount?: number; error?: string }>(response)

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Nao foi possivel importar o PDF.")
        return
      }

      setSelectedFiles((previous) => ({
        ...previous,
        [referenceType]: null,
      }))
      await loadSummary()
      setStatusMessage(`${result.importedCount ?? 0} registro(s) importados para ${referenceLabels[referenceType]}.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao importar PDF.")
    } finally {
      setIsUploading(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        {(["cargo", "horario", "sindicato"] as const).map((referenceType) => (
          <article
            key={referenceType}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <FileUp size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{referenceLabels[referenceType]}</h2>
                <p className="mt-2 leading-7 text-slate-600">{helpByType[referenceType]}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {replaceWarningByType[referenceType]}
              </div>

              <input
                type="file"
                accept="application/pdf"
                onChange={(event) =>
                  setSelectedFiles((previous) => ({
                    ...previous,
                    [referenceType]: event.target.files?.[0] ?? null,
                  }))
                }
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
              />

              <button
                type="button"
                onClick={() => void uploadReference(referenceType)}
                disabled={isUploading === referenceType}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <FileUp size={18} />
                {isUploading === referenceType ? "Importando..." : `Importar ${referenceLabels[referenceType]}`}
              </button>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Resumo das bases importadas</h2>
            <p className="mt-2 text-slate-600">
              Esta conferencia pertence a empresa e ajuda a validar se os PDFs da propria base foram lidos corretamente.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            <Layers3 size={16} />
            {summary.cargo.length + summary.horario.length + summary.sindicato.length} registro(s) exibidos
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">{statusMessage}</p>

        {isLoading ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
            Carregando bases...
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {(["cargo", "horario", "sindicato"] as const).map((referenceType) => (
              <div key={referenceType} className="rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <strong className="text-slate-900">{referenceLabels[referenceType]}</strong>
                </div>
                <div className="max-h-96 overflow-auto">
                  {summary[referenceType].length === 0 ? (
                    <div className="p-4 text-sm text-slate-600">Nenhum registro importado ainda.</div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3">Codigo</th>
                          <th className="px-4 py-3">Descricao</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {summary[referenceType].slice(0, 20).map((item) => (
                          <tr key={item.id} className="align-top text-sm text-slate-700">
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.code}</td>
                            <td className="px-4 py-3">{item.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
