"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Building2, Pencil, Plus, Settings2, Trash2, Users } from "lucide-react"

type SubscriberType = "accounting_office" | "company" | "business_group"

type ClientRecord = {
  id: string
  name: string
  email: string | null
  cnpj: string | null
  contmatic_nickname: string | null
  employee_defaults: Record<string, string | boolean | number | null>
  max_employees: number | null
  access_email: string | null
  contact_name: string | null
  updated_at: string
}

type FormState = {
  id: string | null
  name: string
  email: string
  cnpj: string
  contmaticNickname: string
  maxEmployees: string
  contactName: string
  accessEmail: string
  temporaryPassword: string
}

const initialForm: FormState = {
  id: null,
  name: "",
  email: "",
  cnpj: "",
  contmaticNickname: "",
  maxEmployees: "",
  contactName: "",
  accessEmail: "",
  temporaryPassword: "",
}

export function ClientManagement({ subscriberType }: { subscriberType: SubscriberType }) {
  const entitySingular = subscriberType === "accounting_office" ? "cliente" : "empresa"
  const entityPlural = subscriberType === "accounting_office" ? "clientes" : "empresas"
  const [form, setForm] = useState<FormState>(initialForm)
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [editingDefaults, setEditingDefaults] = useState<Record<string, string | boolean | number | null>>({})
  const [statusMessage, setStatusMessage] = useState(`Cadastre ${subscriberType === "accounting_office" ? "os clientes" : "as empresas"} e depois configure os padrões contábeis de cada empresa em uma tela separada.`)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  useEffect(() => {
    void loadClients()
  }, [])

  async function loadClients() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/clientes", {
        method: "GET",
        cache: "no-store",
      })
      const result = (await response.json()) as {
        ok: boolean
        records?: ClientRecord[]
        error?: string
      }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Não foi possível carregar os clientes.")
        return
      }

      setClients(result.records ?? [])
      setStatusMessage(`${subscriberType === "company" ? "Empresa carregada" : `${entityPlural[0].toUpperCase()}${entityPlural.slice(1)} carregadas`} com sucesso.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao carregar clientes.")
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

  function startEditing(client: ClientRecord) {
    setEditingDefaults(client.employee_defaults ?? {})
    setForm({
      id: client.id,
      name: client.name,
      email: client.email ?? "",
      cnpj: client.cnpj ?? "",
      contmaticNickname: client.contmatic_nickname ?? "",
      maxEmployees: client.max_employees ? String(client.max_employees) : "",
      contactName: client.contact_name ?? "",
      accessEmail: client.access_email ?? "",
      temporaryPassword: "",
    })
    setStatusMessage(`Editando ${entitySingular} ${client.name}.`)
  }

  function cancelEditing() {
    setForm(initialForm)
    setEditingDefaults({})
    setStatusMessage("Edição cancelada.")
  }

  async function handleDelete(client: ClientRecord) {
    const confirmed = window.confirm(
      `Excluir ${entitySingular} ${client.name}? Isso também remove o login e os funcionários vinculados.`
    )

    if (!confirmed) {
      return
    }

    setIsDeletingId(client.id)

    try {
      const response = await fetch("/api/clientes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: client.id,
        }),
      })

      const result = (await response.json()) as { ok: boolean; error?: string }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? `Não foi possível excluir ${entitySingular}.`)
        return
      }

      setClients((previous) => previous.filter((item) => item.id !== client.id))

      if (form.id === client.id) {
        setForm(initialForm)
      }

      setStatusMessage(`${entitySingular === "cliente" ? "Cliente excluído" : "Empresa excluída"} com sucesso.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao excluir cliente.")
    } finally {
      setIsDeletingId(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const isEditing = Boolean(form.id)
      const response = await fetch("/api/clientes", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          email: form.email,
          cnpj: form.cnpj,
          contmaticNickname: form.contmaticNickname,
          maxEmployees: form.maxEmployees ? Number(form.maxEmployees) : undefined,
          contactName: form.contactName,
          accessEmail: form.accessEmail,
          temporaryPassword: form.temporaryPassword,
          employeeDefaults: form.id ? editingDefaults : {},
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        record?: ClientRecord
        error?: string
      }

      if (!response.ok || !result.ok || !result.record) {
        setStatusMessage(result.error ?? "Não foi possível salvar o cliente.")
        return
      }

      if (isEditing) {
        setClients((previous) =>
          previous.map((item) => (item.id === result.record!.id ? result.record! : item))
        )
        setStatusMessage(`${entitySingular === "cliente" ? "Cliente atualizado" : "Empresa atualizada"} com sucesso.`)
      } else {
        setClients((previous) => [result.record!, ...previous])
        setStatusMessage(`${entitySingular === "cliente" ? "Cliente cadastrado" : "Empresa cadastrada"} com sucesso.`)
      }

      setForm(initialForm)
      setEditingDefaults({})
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao salvar cliente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Cadastro de {subscriberType === "company" ? "empresa" : entityPlural}</h2>
              <p className="mt-2 leading-7 text-slate-600">
                Informe os dados da empresa e o apelido Contmatic usado para gerar o script no destino correto. O acesso separado é {subscriberType === "accounting_office" ? "obrigatório para clientes do escritório" : "opcional para empresas do grupo"}.
              </p>
            </div>
          </div>

          {subscriberType === "company" && !form.id ? (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
              O perfil Empresa possui um único cadastro. Use o botão Editar abaixo para informar CNPJ, apelido Contmatic e demais dados.
            </div>
          ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label={subscriberType === "accounting_office" ? "Nome do cliente" : "Nome da empresa"} value={form.name} onChange={(value) => updateField("name", value)} placeholder="Ex.: Clínica Exemplo Ltda" />
              <Field label="E-mail principal" type="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="contato@cliente.com.br" />
              <Field label="CNPJ" value={form.cnpj} onChange={(value) => updateField("cnpj", value)} placeholder="00.000.000/0001-00" />
              <Field label="Apelido Contmatic" value={form.contmaticNickname} onChange={(value) => updateField("contmaticNickname", value)} placeholder="Ex.: SOFTMATIC" />
              <Field label={`Responsável pelo ${entitySingular}${subscriberType === "accounting_office" ? " *" : " (opcional)"}`} value={form.contactName} onChange={(value) => updateField("contactName", value)} placeholder="Ex.: Maria Oliveira" />
              <Field label={`E-mail de acesso separado${subscriberType === "accounting_office" ? " *" : " (opcional)"}`} type="email" value={form.accessEmail} onChange={(value) => updateField("accessEmail", value)} placeholder="login@empresa.com.br" />
              <Field label={form.id || subscriberType !== "accounting_office" ? "Senha do acesso separado (opcional)" : "Senha provisória *"} type="password" value={form.temporaryPassword} onChange={(value) => updateField("temporaryPassword", value)} placeholder={form.id ? "Preencha apenas se quiser trocar" : "Defina uma senha inicial se criar um acesso"} />
              <Field label="Limite de funcionários" type="number" value={form.maxEmployees} onChange={(value) => updateField("maxEmployees", value)} placeholder="200" />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={18} />
                {isSaving ? "Salvando..." : form.id ? "Salvar alterações" : `Cadastrar ${entitySingular}`}
              </button>
              {form.id ? (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar edicao
                </button>
              ) : null}
              <p className="text-sm text-slate-600">{statusMessage}</p>
            </div>
          </form>
          )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{subscriberType === "company" ? "Empresa cadastrada" : `${entityPlural[0].toUpperCase()}${entityPlural.slice(1)} cadastradas`}</h2>
              <p className="mt-2 text-slate-600">
                Depois do cadastro básico, abra a configuração de padrões contábeis para deixar a empresa com os campos internos pré-preenchidos.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <Users size={16} />
              {clients.length} {entitySingular}(s)
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              Carregando {entityPlural}...
            </div>
          ) : clients.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              Ainda não há {entityPlural} cadastradas para este assinante.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
              <table className="min-w-[1100px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-sm font-semibold text-slate-700">
                    <th className="px-4 py-3">{subscriberType === "accounting_office" ? "Cliente" : "Empresa"}</th>
                    <th className="px-4 py-3">Apelido Contmatic</th>
                    <th className="px-4 py-3">Acesso separado</th>
                    <th className="px-4 py-3">CNPJ</th>
                    <th className="px-4 py-3">Limite</th>
                    <th className="px-4 py-3">Padrões</th>
                    <th className="px-4 py-3">Atualizado</th>
                    <th className="px-4 py-3">Acao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{client.name}</div>
                        <div className="text-xs text-slate-500">{client.contact_name || "Sem responsável"}</div>
                      </td>
                      <td className="px-4 py-3">{client.contmatic_nickname || "Sem apelido"}</td>
                      <td className="px-4 py-3">{client.access_email || client.email || "Sem e-mail"}</td>
                      <td className="px-4 py-3">{client.cnpj || "Sem CNPJ"}</td>
                      <td className="px-4 py-3">{client.max_employees ?? "Não definido"}</td>
                      <td className="px-4 py-3">{countFilledDefaults(client.employee_defaults)} campo(s)</td>
                      <td className="px-4 py-3">{formatDateTime(client.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/painel/clientes/${client.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Settings2 size={16} />
                            Padrões contábeis
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEditing(client)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>
                          {subscriberType !== "company" ? <button
                            type="button"
                            onClick={() => void handleDelete(client)}
                            disabled={isDeletingId === client.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 size={16} />
                            {isDeletingId === client.id ? "Excluindo..." : "Excluir"}
                          </button> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
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

function countFilledDefaults(defaults: Record<string, string | boolean | number | null>) {
  return Object.values(defaults).filter((value) => {
    if (typeof value === "boolean") {
      return value
    }

    if (typeof value === "number") {
      return true
    }

    return typeof value === "string" && value.trim().length > 0
  }).length
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
