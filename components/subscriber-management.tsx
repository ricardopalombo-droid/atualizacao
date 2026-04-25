"use client"

import { useEffect, useState } from "react"
import { Building2, Pencil, Plus, Shield, Trash2 } from "lucide-react"

type SubscriberRecord = {
  id: string
  name: string
  email: string | null
  max_clients: number
  max_employees: number
  admin_name: string | null
  access_email: string | null
  updated_at: string
}

type FormState = {
  id: string | null
  name: string
  email: string
  maxClients: string
  maxEmployees: string
  adminName: string
  accessEmail: string
  temporaryPassword: string
}

const initialForm: FormState = {
  id: null,
  name: "",
  email: "",
  maxClients: "10",
  maxEmployees: "1000",
  adminName: "",
  accessEmail: "",
  temporaryPassword: "",
}

export function SubscriberManagement() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [records, setRecords] = useState<SubscriberRecord[]>([])
  const [statusMessage, setStatusMessage] = useState("Cadastre os assinantes que contratarão a plataforma.")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  useEffect(() => {
    void loadSubscribers()
  }, [])

  async function loadSubscribers() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/assinantes", {
        method: "GET",
        cache: "no-store",
      })
      const result = (await response.json()) as {
        ok: boolean
        records?: SubscriberRecord[]
        error?: string
      }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Não foi possível carregar os assinantes.")
        return
      }

      setRecords(result.records ?? [])
      setStatusMessage("Assinantes carregados com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao carregar assinantes.")
    } finally {
      setIsLoading(false)
    }
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function startEditing(record: SubscriberRecord) {
    setForm({
      id: record.id,
      name: record.name,
      email: record.email ?? "",
      maxClients: String(record.max_clients),
      maxEmployees: String(record.max_employees),
      adminName: record.admin_name ?? "",
      accessEmail: record.access_email ?? "",
      temporaryPassword: "",
    })
    setStatusMessage(`Editando o assinante ${record.name}.`)
  }

  function cancelEditing() {
    setForm(initialForm)
    setStatusMessage("Edição cancelada.")
  }

  async function handleDelete(record: SubscriberRecord) {
    const confirmed = window.confirm(
      `Excluir o assinante ${record.name}? Isso também remove clientes, usuários e funcionários vinculados.`
    )

    if (!confirmed) {
      return
    }

    setIsDeletingId(record.id)

    try {
      const response = await fetch("/api/assinantes", {
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
        setStatusMessage(result.error ?? "Não foi possível excluir o assinante.")
        return
      }

      setRecords((previous) => previous.filter((item) => item.id !== record.id))

      if (form.id === record.id) {
        setForm(initialForm)
      }

      setStatusMessage("Assinante excluído com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao excluir assinante.")
    } finally {
      setIsDeletingId(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const isEditing = Boolean(form.id)
      const response = await fetch("/api/assinantes", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          email: form.email,
          maxClients: Number(form.maxClients),
          maxEmployees: Number(form.maxEmployees),
          adminName: form.adminName,
          accessEmail: form.accessEmail,
          temporaryPassword: form.temporaryPassword,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        record?: SubscriberRecord
        error?: string
      }

      if (!response.ok || !result.ok || !result.record) {
        setStatusMessage(result.error ?? "Não foi possível salvar o assinante.")
        return
      }

      if (isEditing) {
        setRecords((previous) =>
          previous.map((item) => (item.id === result.record!.id ? result.record! : item))
        )
        setStatusMessage("Assinante atualizado com sucesso.")
      } else {
        setRecords((previous) => [result.record!, ...previous])
        setStatusMessage("Assinante cadastrado com sucesso.")
      }

      setForm(initialForm)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao salvar assinante.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Cadastro de assinantes</h2>
              <p className="mt-2 leading-7 text-slate-600">
                Crie os escritórios ou empresas que contratarão a plataforma e já defina o login
                administrativo de cada um.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field label="Nome do assinante" value={form.name} onChange={(value) => updateField("name", value)} placeholder="Ex.: Escritório X" />
            <Field label="E-mail comercial" type="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="contato@escritorio.com.br" />
            <Field label="Limite de clientes" type="number" value={form.maxClients} onChange={(value) => updateField("maxClients", value)} placeholder="10" />
            <Field label="Limite de funcionários" type="number" value={form.maxEmployees} onChange={(value) => updateField("maxEmployees", value)} placeholder="1000" />
            <Field label="Responsável pelo assinante" value={form.adminName} onChange={(value) => updateField("adminName", value)} placeholder="Ex.: Maria Oliveira" />
            <Field label="E-mail de acesso do assinante" type="email" value={form.accessEmail} onChange={(value) => updateField("accessEmail", value)} placeholder="admin@escritorio.com.br" />
            <Field label={form.id ? "Nova senha do assinante" : "Senha provisória"} type="password" value={form.temporaryPassword} onChange={(value) => updateField("temporaryPassword", value)} placeholder={form.id ? "Informe a nova senha" : "Defina a senha inicial"} />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={18} />
                {isSaving ? "Salvando..." : form.id ? "Salvar alterações" : "Cadastrar assinante"}
              </button>
              {form.id ? (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar edição
                </button>
              ) : null}
              <p className="text-sm text-slate-600">{statusMessage}</p>
            </div>
          </form>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Assinantes cadastrados</h2>
              <p className="mt-2 text-slate-600">
                A PalSys gerencia o acesso macro. Cada assinante depois controla os próprios clientes.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <Shield size={16} />
              {records.length} assinante(s)
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              Carregando assinantes...
            </div>
          ) : records.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              Ainda não há assinantes cadastrados.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-sm font-semibold text-slate-700">
                    <th className="px-4 py-3">Assinante</th>
                    <th className="px-4 py-3">Login</th>
                    <th className="px-4 py-3">Limite de clientes</th>
                    <th className="px-4 py-3">Limite de funcionários</th>
                    <th className="px-4 py-3">Atualizado</th>
                    <th className="px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {records.map((record) => (
                    <tr key={record.id} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{record.name}</div>
                        <div className="text-xs text-slate-500">{record.admin_name || "Sem responsável"}</div>
                      </td>
                      <td className="px-4 py-3">{record.access_email || record.email || "Sem e-mail"}</td>
                      <td className="px-4 py-3">{record.max_clients}</td>
                      <td className="px-4 py-3">{record.max_employees}</td>
                      <td className="px-4 py-3">{formatDateTime(record.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(record)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>
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
        </section>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "number" | "password"
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
      />
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
