"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type EmployeeRecord = {
  id: string
  employee_name: string | null
  employee_email: string | null
  invite_email: string | null
  workflow_status: string
  updated_at: string
}

const statusLabels: Record<string, string> = {
  rascunho_interno: "Rascunho interno",
  convite_enviado: "Convite enviado",
  preenchido_funcionario: "Preenchido pelo funcionário",
  em_revisao_cliente: "Em revisão do cliente",
  finalizado: "Finalizado",
  exportado: "Exportado",
}

export function EmployeeRecordsList() {
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [statusMessage, setStatusMessage] = useState("Carregando funcionários do cliente.")
  const [isLoading, setIsLoading] = useState(true)

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
                  <td className="px-4 py-3">{formatDateTime(record.updated_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/painel/cadastros?id=${record.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                    >
                      Continuar edição
                    </Link>
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
  }).format(new Date(value))
}
