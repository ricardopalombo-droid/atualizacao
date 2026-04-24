"use client"

import { useEffect, useState } from "react"
import { Building2, Plus, Users } from "lucide-react"

type ClientRecord = {
  id: string
  name: string
  email: string | null
  cnpj: string | null
  max_employees: number | null
  updated_at: string
}

type FormState = {
  name: string
  email: string
  cnpj: string
  maxEmployees: string
}

const initialForm: FormState = {
  name: "",
  email: "",
  cnpj: "",
  maxEmployees: "",
}

export function ClientManagement() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [statusMessage, setStatusMessage] = useState("Cadastre os clientes que ficarão abaixo do assinante.")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
      setStatusMessage("Clientes carregados com sucesso.")
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          cnpj: form.cnpj,
          maxEmployees: form.maxEmployees ? Number(form.maxEmployees) : undefined,
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

      setClients((previous) => [result.record!, ...previous])
      setForm(initialForm)
      setStatusMessage("Cliente cadastrado com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao salvar cliente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Cadastro de clientes do assinante</h2>
              <p className="mt-2 leading-7 text-slate-600">
                Cada cliente cadastrado aqui poderá receber usuários próprios e ter funcionários
                vinculados apenas à sua empresa.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field
              label="Nome do cliente"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              placeholder="Ex.: Clínica Exemplo Ltda"
            />
            <Field
              label="E-mail principal"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              placeholder="contato@cliente.com.br"
            />
            <Field
              label="CNPJ"
              value={form.cnpj}
              onChange={(value) => updateField("cnpj", value)}
              placeholder="00.000.000/0001-00"
            />
            <Field
              label="Limite de funcionários"
              type="number"
              value={form.maxEmployees}
              onChange={(value) => updateField("maxEmployees", value)}
              placeholder="200"
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                <Plus size={18} />
                {isSaving ? "Salvando..." : "Cadastrar cliente"}
              </button>
              <p className="text-sm text-slate-600">{statusMessage}</p>
            </div>
          </form>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Clientes cadastrados</h2>
              <p className="mt-2 text-slate-600">
                Esta lista já separa a carteira do assinante para futuras permissões e filtros.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <Users size={16} />
              {clients.length} cliente(s)
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              Carregando clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
              Ainda não há clientes cadastrados para este assinante.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-sm font-semibold text-slate-700">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">CNPJ</th>
                    <th className="px-4 py-3">Limite</th>
                    <th className="px-4 py-3">Atualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="text-sm text-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-900">{client.name}</td>
                      <td className="px-4 py-3">{client.email || "Sem e-mail"}</td>
                      <td className="px-4 py-3">{client.cnpj || "Sem CNPJ"}</td>
                      <td className="px-4 py-3">{client.max_employees ?? "Não definido"}</td>
                      <td className="px-4 py-3">{formatDateTime(client.updated_at)}</td>
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
  type?: "text" | "email" | "number"
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
