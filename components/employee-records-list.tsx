"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

type EmployeeRecord = {
  id: string
  employee_name: string | null
  employee_email: string | null
  invite_email: string | null
  workflow_status: string
  phoenix_status: string | null
  phoenix_status_updated_at: string | null
  updated_at: string
}

type PhoenixRunnerData = {
  baseUrl: string
  email: string
  employeeId: string
  legacyScript: string
  empresaHabilitada: string
  empresaRateio: string
}

const statusLabels: Record<string, string> = {
  rascunho_interno: "Rascunho interno",
  convite_enviado: "Convite enviado",
  preenchido_funcionario: "Preenchido pelo funcionário",
  em_revisao_cliente: "Em revisão do cliente",
  finalizado: "Finalizado",
  exportado: "Exportado",
}

const phoenixStatusLabels: Record<string, string> = {
  pronto_para_phoenix: "Pronto para Phoenix",
  enviado_ao_phoenix: "Enviado ao Phoenix",
  concluido_no_phoenix: "Concluído no Phoenix",
  falha_no_phoenix: "Falha no Phoenix",
}

export function EmployeeRecordsList() {
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [statusMessage, setStatusMessage] = useState("Carregando funcionários do cliente.")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isUpdatingPhoenixId, setIsUpdatingPhoenixId] = useState<string | null>(null)
  const [runnerCommand, setRunnerCommand] = useState<string | null>(null)
  const [runnerData, setRunnerData] = useState<PhoenixRunnerData | null>(null)

  useEffect(() => {
    void loadRecords()
  }, [])

  async function loadRecords() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/cadastros", {
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
    setIsUpdatingPhoenixId(record.id)

    try {
      const response = await fetch("/api/cadastros/phoenix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: record.id,
          action,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        phoenixStatus?: string
        phoenixStatusUpdatedAt?: string | null
        runnerCommand?: string | null
        runnerData?: PhoenixRunnerData | null
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
              }
            : item
        )
      )

      const actionMessage =
        action === "start"
          ? "Cadastro marcado como enviado ao Phoenix."
          : action === "complete"
            ? "Cadastro marcado como concluído no Phoenix."
            : action === "fail"
              ? "Cadastro marcado com falha no Phoenix."
              : "Cadastro voltou para pronto para Phoenix."

      setStatusMessage(actionMessage)
      setRunnerCommand(action === "start" ? result.runnerCommand ?? null : null)
      setRunnerData(action === "start" ? result.runnerData ?? null : null)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao atualizar status do Phoenix.")
    } finally {
      setIsUpdatingPhoenixId(null)
    }
  }

  async function handleCopyRunnerCommand() {
    if (!runnerCommand) {
      return
    }

    try {
      await navigator.clipboard.writeText(runnerCommand)
      setStatusMessage("Comando do runner copiado. Agora Ã© sÃ³ colar no PowerShell dentro da pasta automacao-phoenix.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "NÃ£o foi possÃ­vel copiar o comando.")
    }
  }

  async function handleDelete(record: EmployeeRecord) {
    const confirmed = window.confirm(
      `Excluir o funcionário ${record.employee_name || "sem nome informado"}? Essa ação remove o cadastro salvo.`
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
      setStatusMessage("Funcionário excluído com sucesso.")
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
          <h2 className="text-2xl font-bold text-slate-900">Funcionários deste cliente</h2>
          <p className="mt-2 text-slate-600">
            Continue a edição de um cadastro salvo sem perder o vínculo com a empresa logada.
          </p>
        </div>
        <Link
          href="/painel/cadastros"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
        >
          Novo funcionário
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
          Carregando funcionários...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
          Ainda não há funcionários cadastrados para este cliente.
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
                  <td className="px-4 py-3">
                    {record.employee_email || record.invite_email || "Sem e-mail"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                      {statusLabels[record.workflow_status] ?? record.workflow_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getPhoenixStatus(record) ? (
                      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                        {phoenixStatusLabels[getPhoenixStatus(record) as string] ?? getPhoenixStatus(record)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Aguardando finalização</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDateTime(record.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/painel/cadastros?id=${record.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                      >
                        Continuar edição
                      </Link>
                      {["finalizado", "exportado"].includes(record.workflow_status) && (
                        <>
                          {(getPhoenixStatus(record) === "pronto_para_phoenix" ||
                            getPhoenixStatus(record) === "falha_no_phoenix") && (
                            <button
                              type="button"
                              onClick={() => void handlePhoenixAction(record, "start")}
                              disabled={isUpdatingPhoenixId === record.id}
                              className="inline-flex items-center justify-center rounded-lg border border-sky-200 px-4 py-2 font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                            >
                              {isUpdatingPhoenixId === record.id ? "Atualizando..." : "Enviar para Phoenix"}
                            </button>
                          )}

                          {getPhoenixStatus(record) === "enviado_ao_phoenix" && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handlePhoenixAction(record, "complete")}
                                disabled={isUpdatingPhoenixId === record.id}
                                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                              >
                                {isUpdatingPhoenixId === record.id ? "Atualizando..." : "Marcar concluído"}
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
                      <button
                        type="button"
                        onClick={() => void handleDelete(record)}
                        disabled={isDeletingId === record.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                        {isDeletingId === record.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500">{statusMessage}</p>

      {runnerCommand && runnerData ? (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-sky-950">Runner pronto para o Phoenix</h3>
              <p className="mt-1 text-sm text-sky-900">
                O contador pode abrir a pasta <code>automacao-phoenix</code>, colar o comando abaixo no PowerShell
                e trocar apenas a senha.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyRunnerCommand()}
              className="inline-flex items-center justify-center rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800"
            >
              Copiar comando
            </button>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-sky-950 md:grid-cols-2">
            <p>
              <span className="font-semibold">Base URL:</span> {runnerData.baseUrl}
            </p>
            <p>
              <span className="font-semibold">Login do cliente:</span> {runnerData.email}
            </p>
            <p>
              <span className="font-semibold">Employee ID:</span> {runnerData.employeeId}
            </p>
            <p>
              <span className="font-semibold">Script legado:</span> {runnerData.legacyScript}
            </p>
          </div>

          <textarea
            readOnly
            value={runnerCommand}
            className="mt-4 min-h-52 w-full rounded-2xl border border-sky-200 bg-white p-4 font-mono text-sm text-slate-900"
          />
        </div>
      ) : null}
    </section>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
