"use client"

import { useMemo, useState } from "react"
import { Save, Settings2 } from "lucide-react"
import { clientPresetFieldKeys, dynamicReferenceFieldKeys, formSections, type FieldOption } from "@/lib/employee-form-config"

type ClientDefaultsFormProps = {
  client: {
    id: string
    name: string
    email: string | null
    cnpj: string | null
    contmatic_nickname: string | null
    employee_defaults: Record<string, string | boolean | number | null>
  }
  lookupCatalog?: Partial<Record<"cargo" | "horario" | "sindicato", LookupRecord[]>>
}

type LookupRecord = {
  code: string
  label: string
  metadata?: Record<string, string | number | boolean | null>
}

type PresetFieldMeta = {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox"
  options?: FieldOption[]
  placeholder?: string
  group: string
}

const presetGroups = [
  { title: "Admissao e vinculo", keys: ["indicativo_admissao", "tipo_contrato", "vinculo_empregaticio", "codigo_admissao", "caged", "percepcao_seguro_desemprego"] },
  { title: "Jornada e cargo", keys: ["cargo", "horario", "regime_jornada", "horas_semanais", "horas_mensais"] },
  { title: "Sindicato e tributacao", keys: ["sindicato", "tipo_tributacao_sindical", "categoria_normativa", "grau_risco"] },
  { title: "Pagamento", keys: ["forma_pagamento", "tipo_pagamento"] },
  { title: "Lotacao interna", keys: ["local", "departamento", "setor", "secao", "registro_funcionario", "folha_ficha", "chapa"] },
  { title: "Banco e FGTS", keys: ["banco", "agencia", "tipo_conta", "numero_conta", "antecipar_indenizacao_fgts"] },
] as const

const presetFieldMeta = formSections
  .flatMap((section) => section.fields)
  .filter((field) => clientPresetFieldKeys.includes(field.key as (typeof clientPresetFieldKeys)[number]))
  .map((field) => ({
    key: field.key,
    label:
      dynamicReferenceFieldKeys.includes(field.key as (typeof dynamicReferenceFieldKeys)[number])
        ? `${field.label} padrao (codigo)`
        : field.label,
    type:
      field.type === "checkbox"
        ? "checkbox"
        : field.type === "select"
          ? "select"
          : field.type === "number"
            ? "number"
            : "text",
    options: field.options,
    placeholder:
      dynamicReferenceFieldKeys.includes(field.key as (typeof dynamicReferenceFieldKeys)[number])
        ? `Informe o codigo padrao de ${field.label.toLowerCase()}`
        : field.placeholder,
    group:
      presetGroups.find((group) => group.keys.includes(field.key as never))?.title ?? "Outros padroes",
  })) as PresetFieldMeta[]

const initialValues = presetFieldMeta.reduce<Record<string, string | boolean>>((accumulator, field) => {
  accumulator[field.key] = field.type === "checkbox" ? false : ""
  return accumulator
}, {})

export function ClientDefaultsForm({ client, lookupCatalog = {} }: ClientDefaultsFormProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>({
    ...initialValues,
    ...client.employee_defaults,
  })
  const [statusMessage, setStatusMessage] = useState(
    "Defina os padroes internos que costumam se repetir nesta empresa."
  )
  const [isSaving, setIsSaving] = useState(false)

  const dynamicOptionsByKey = useMemo(() => {
    const buildOptions = (records: LookupRecord[] = []) => [
      { label: "Selecione", value: "" },
      ...records.map((record) => ({
        label: `${record.code} - ${record.label}`,
        value: record.code,
      })),
    ]

    return {
      cargo: buildOptions(lookupCatalog?.cargo ?? []),
      horario: buildOptions(lookupCatalog?.horario ?? []),
      sindicato: buildOptions(lookupCatalog?.sindicato ?? []),
    }
  }, [lookupCatalog])

  const groupedFields = useMemo(() => {
    return presetGroups.map((group) => ({
      title: group.title,
      fields: presetFieldMeta.filter((field) => field.group === group.title),
    }))
  }, [])

  function updateValue(key: string, value: string | boolean) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  async function saveDefaults(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/clientes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: client.id,
          employeeDefaults: values,
        }),
      })

      const result = (await response.json()) as { ok: boolean; error?: string }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Nao foi possivel salvar os padroes contabeis.")
        return
      }

      setStatusMessage("Padroes contabeis salvos com sucesso.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao salvar os padroes contabeis.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={saveDefaults} className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <Settings2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Padroes contabeis da empresa</h2>
            <p className="mt-2 leading-7 text-slate-600">
              Esses valores entram automaticamente nos campos internos de novos funcionarios desta empresa. O cliente ainda pode revisar e alterar antes de finalizar o cadastro.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Empresa" value={client.name} />
          <SummaryCard label="Apelido Contmatic" value={client.contmatic_nickname || "Sem apelido"} />
          <SummaryCard label="E-mail principal" value={client.email || "Sem e-mail"} />
          <SummaryCard label="CNPJ" value={client.cnpj || "Sem CNPJ"} />
        </div>
      </section>

      {groupedFields.map((group) => (
        <section key={group.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">{group.title}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.fields.map((field) => (
              <PresetField
                key={field.key}
                field={field}
                value={values[field.key]}
                optionsOverride={
                  field.key === "cargo" || field.key === "horario" || field.key === "sindicato"
                    ? dynamicOptionsByKey[field.key]
                    : undefined
                }
                onChange={(value) => updateValue(field.key, value)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          <Save size={18} />
          {isSaving ? "Salvando..." : "Salvar padroes contabeis"}
        </button>
        <p className="text-sm text-slate-600">{statusMessage}</p>
      </section>
    </form>
  )
}

function PresetField({
  field,
  value,
  optionsOverride,
  onChange,
}: {
  field: PresetFieldMeta
  value: string | boolean | undefined
  optionsOverride?: FieldOption[]
  onChange: (value: string | boolean) => void
}) {
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
        />
        <span>{field.label}</span>
      </label>
    )
  }

  if (field.type === "select") {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{field.label}</label>
        <select
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        >
          {(optionsOverride ?? field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{field.label}</label>
      <input
        type={field.type}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
      />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}
