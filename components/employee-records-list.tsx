"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { FileArchive, Trash2 } from "lucide-react"

type EmployeeRecord = {
  id: string
  employee_name: string | null
  employee_email: string | null
  invite_email: string | null
  workflow_status: string
  phoenix_status: string | null
  phoenix_status_updated_at: string | null
  phoenix_status_note: string | null
  updated_at: string
}

const statusLabels: Record<string, string> = {
  rascunho_interno: "Rascunho interno",
  convite_enviado: "Convite enviado",
  preenchido_funcionario: "Preenchido pelo funcionário",
  em_revisao_cliente: "Em revisão do DP",
  finalizado: "Finalizado",
  exportado: "Exportado",
}

const phoenixStatusLabels: Record<string, string> = {
  pronto_para_phoenix: "Pronto para Phoenix",
  enviado_ao_phoenix: "Pacote gerado",
  concluido_no_phoenix: "Importado no Phoenix",
  falha_no_phoenix: "Falha no Phoenix",
}

export function EmployeeRecordsList({ clientId, canManage }: { clientId: string; canManage: boolean }) {
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [statusMessage, setStatusMessage] = useState("Carregando funcionários da empresa.")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isUpdatingPhoenixId, setIsUpdatingPhoenixId] = useState<string | null>(null)

  useEffect(() => {
    void loadRecords()
  }, [clientId])

  async function loadRecords() {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/cadastros?clientId=${encodeURIComponent(clientId)}`, {
        method: "GET",
        cache: "no-store",
      })
      const result = (await response.json()) as {
        ok: boolean
        records?: EmployeeRecord[]
        error?: string
      }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Não foi possível carregar os funcionários.")
        return
      }

      setRecords(result.records ?? [])
      setStatusMessage("Funcionários carregados com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao carregar funcionários.")
    } finally {
      setIsLoading(false)
    }
  }

  function getPhoenixStatus(record: EmployeeRecord) {
    if (record.phoenix_status) {
      return record.phoenix_status
    }

    if (["finalizado", "exportado"].includes(record.workflow_status)) {
      return "pronto_para_phoenix"
    }

    return null
  }

  async function handlePhoenixAction(record: EmployeeRecord, action: "start" | "complete" | "fail" | "reset") {
    if (
      action === "start" &&
      !window.confirm(
        "Antes de importar, confirme que não existe uma empresa com o apelido ZZLIMPA no Contmatic. O pacote será baixado agora e a ZZLIMPA deverá ser excluída manualmente depois da importação. Deseja gerar o pacote?"
      )
    ) {
      return
    }

    const note =
      action === "fail"
        ? window.prompt("Informe o motivo da falha no Phoenix:", record.phoenix_status_note ?? "") ?? null
        : null

    if (action === "fail" && note === null) {
      return
    }

    setIsUpdatingPhoenixId(record.id)

    try {
      if (action === "start") {
        const packageResponse = await fetch(
          `/api/cadastros/phoenix?id=${encodeURIComponent(record.id)}&download=package`,
          { method: "GET", cache: "no-store" }
        )

        if (!packageResponse.ok) {
          const packageError = (await packageResponse.json().catch(() => null)) as
            | { error?: string }
            | null
          setStatusMessage(packageError?.error ?? "Não foi possível gerar o pacote Contmatic.")
          return
        }

        const disposition = packageResponse.headers.get("Content-Disposition") ?? ""
        const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "Script_Contmatic.zip"
        const packageBlob = await packageResponse.blob()
        const packageUrl = URL.createObjectURL(packageBlob)
        const downloadLink = document.createElement("a")
        downloadLink.href = packageUrl
        downloadLink.download = filename
        document.body.appendChild(downloadLink)
        downloadLink.click()
        downloadLink.remove()
        URL.revokeObjectURL(packageUrl)
      }

      const response = await fetch("/api/cadastros/phoenix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: record.id,
          action,
          note:
            action === "start"
              ? "Pacote Contmatic gerado para importação manual."
              : note ?? undefined,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        phoenixStatus?: string
        phoenixStatusUpdatedAt?: string | null
        phoenixStatusNote?: string | null
        error?: string
      }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Não foi possível atualizar o status do Phoenix.")
        return
      }

      setRecords((previous) =>
        previous.map((item) =>
          item.id === record.id
            ? {
                ...item,
                phoenix_status: result.phoenixStatus ?? item.phoenix_status,
                phoenix_status_updated_at: result.phoenixStatusUpdatedAt ?? item.phoenix_status_updated_at,
                phoenix_status_note:
                  result.phoenixStatusNote !== undefined ? result.phoenixStatusNote : item.phoenix_status_note,
              }
            : item
        )
      )

      const actionMessage =
        action === "start"
          ? "Pacote Contmatic gerado. Antes de importar, confirme que a ZZLIMPA não existe; depois da importação, exclua-a manualmente."
          : action === "complete"
            ? "Cadastro marcado como importado no Phoenix."
            : action === "fail"
              ? "Cadastro marcado com falha no Phoenix."
              : "Cadastro voltou para pronto para Phoenix."

      setStatusMessage(actionMessage)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao atualizar status do Phoenix.")
    } finally {
      setIsUpdatingPhoenixId(null)
    }
  }

  async function handleDelete(record: EmployeeRecord) {
    const confirmed = window.confirm(
      `Excluir o funcionário ${record.employee_name || "sem nome informado"}? Esta ação excluirá permanentemente o cadastro e todos os documentos anexados. Não será possível desfazer.`
    )

    if (!confirmed) {
      return
    }

    setIsDeletingId(record.id)

    try {
      const response = await fetch("/api/cadastros", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: record.id,
        }),
      })

      const result = (await response.json()) as { ok: boolean; error?: string }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Não foi possível excluir o funcionário.")
        return
      }

      setRecords((previous) => previous.filter((item) => item.id !== record.id))
      setStatusMessage("Funcionário e documentos anexados excluídos com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao excluir funcionário.")
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Funcionários desta empresa</h2>
          <p className="mt-2 text-slate-600">
            O DP administra convites e revisoes; a empresa possui acesso de consulta aos cadastros e documentos.
          </p>
        </div>
        {canManage ? <Link
          href={`/painel/cadastros?clientId=${encodeURIComponent(clientId)}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
        >
          Novo funcionário
        </Link> : null}
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
          Carregando funcionários...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
          Ainda não há funcionários cadastrados para esta empresa.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Funcionário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Phoenix</th>
                <th className="px-4 py-3">Atualizado</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {records.map((record) => (
                <tr key={record.id} className="text-sm text-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {record.employee_name || "Sem nome informado"}
                  </td>
                  <td className="px-4 py-3">{record.employee_email || record.invite_email || "Sem e-mail"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                      {statusLabels[record.workflow_status] ?? record.workflow_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getPhoenixStatus(record) ? (
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                          {phoenixStatusLabels[getPhoenixStatus(record) as string] ?? getPhoenixStatus(record)}
                        </span>
                        {record.phoenix_status_note ? (
                          <div className="max-w-xs text-xs text-slate-500">{record.phoenix_status_note}</div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-400">Aguardando finalização</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(record.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/painel/cadastros?clientId=${encodeURIComponent(clientId)}&id=${record.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                      >
                        {canManage ? "Revisar cadastro" : "Consultar"}
                      </Link>
                      {canManage && ["finalizado", "exportado"].includes(record.workflow_status) && (
                        <>
                          {(getPhoenixStatus(record) === "pronto_para_phoenix" ||
                            getPhoenixStatus(record) === "falha_no_phoenix") && (
                            <button
                              type="button"
                              onClick={() => void handlePhoenixAction(record, "start")}
                              disabled={isUpdatingPhoenixId === record.id}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 px-4 py-2 font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                            >
                              <FileArchive size={16} />
                              {isUpdatingPhoenixId === record.id ? "Gerando..." : "Gerar pacote Phoenix"}
                            </button>
                          )}

                          {getPhoenixStatus(record) === "enviado_ao_phoenix" && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handlePhoenixAction(record, "start")}
                                disabled={isUpdatingPhoenixId === record.id}
                                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 px-4 py-2 font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                              >
                                <FileArchive size={16} />
                                {isUpdatingPhoenixId === record.id ? "Gerando..." : "Baixar novamente"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handlePhoenixAction(record, "complete")}
                                disabled={isUpdatingPhoenixId === record.id}
                                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              >
                                {isUpdatingPhoenixId === record.id ? "Atualizando..." : "Marcar como importado"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handlePhoenixAction(record, "fail")}
                                disabled={isUpdatingPhoenixId === record.id}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-200 px-4 py-2 font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                              >
                                {isUpdatingPhoenixId === record.id ? "Atualizando..." : "Marcar falha"}
                              </button>
                            </>
                          )}

                          {getPhoenixStatus(record) === "concluido_no_phoenix" && (
                            <button
                              type="button"
                              onClick={() => void handlePhoenixAction(record, "reset")}
                              disabled={isUpdatingPhoenixId === record.id}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                            >
                              {isUpdatingPhoenixId === record.id ? "Atualizando..." : "Voltar para pronto"}
                            </button>
                          )}
                        </>
                      )}
                      {canManage ? <button
                        type="button"
                        onClick={() => void handleDelete(record)}
                        disabled={isDeletingId === record.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                        {isDeletingId === record.id ? "Excluindo..." : "Excluir"}
                      </button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500">{statusMessage}</p>
    </section>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}
