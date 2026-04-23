"use client"

import { useState } from "react"
import { CheckCircle2, Download, Save } from "lucide-react"
import {
  defaultFormValues,
  formSections,
  type FormField,
} from "@/lib/employee-form-config"

type FormState = Record<string, string | boolean>

export function EmployeeOnboardingForm() {
  const [activeSection, setActiveSection] = useState(formSections[0].id)
  const [formData, setFormData] = useState<FormState>(defaultFormValues)
  const [statusMessage, setStatusMessage] = useState("Cadastro em rascunho.")

  const currentSection =
    formSections.find((section) => section.id === activeSection) ?? formSections[0]

  function updateField(key: string, value: string | boolean) {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function saveDraft() {
    setFormData((previous) => ({
      ...previous,
      status: "rascunho",
      aprovado_para_integracao: false,
    }))
    setStatusMessage("Rascunho salvo localmente para esta sessão.")
  }

  function approveRecord() {
    setFormData((previous) => ({
      ...previous,
      status: "aprovado",
      aprovado_para_integracao: true,
    }))
    setStatusMessage("Cadastro aprovado e pronto para exportação ou integração.")
  }

  function exportToCsv() {
    const rows = Object.entries(formData).map(([key, value]) => [
      key,
      typeof value === "boolean" ? (value ? "Sim" : "Não") : value,
    ])

    const csv = [
      "campo,valor",
      ...rows.map(([key, value]) => `"${key}","${String(value).replaceAll('"', '""')}"`),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `cadastro-funcionario-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setStatusMessage("Arquivo exportado com sucesso.")
  }

  function finalizeInternalFlow() {
    if (!formData.aprovado_para_integracao) {
      setStatusMessage("Aprove o cadastro antes de concluir o fluxo interno.")
      return
    }

    setStatusMessage("Cadastro concluído internamente e pronto para uso pela equipe PalSys.")
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        {formSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              section.id === activeSection
                ? "bg-yellow-400 text-slate-900"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{currentSection.title}</h2>
            <p className="mt-2 text-slate-600">{currentSection.description}</p>
          </div>
          <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            Liberação para integração:{" "}
            {formData.aprovado_para_integracao ? "autorizada" : "pendente"}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {currentSection.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={(value) => updateField(field.key, value)}
            />
          ))}
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <strong className="text-slate-900">Status atual</strong>
          <p className="mt-2 text-slate-600">{statusMessage}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Save size={18} />
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={approveRecord}
            className="rounded-xl bg-yellow-400 px-4 py-3 font-bold text-slate-900 hover:brightness-95"
          >
            Aprovar cadastro
          </button>
          <button
            type="button"
            onClick={exportToCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Download size={18} />
            Exportar planilha
          </button>
          <button
            type="button"
            onClick={finalizeInternalFlow}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
          >
            <CheckCircle2 size={18} />
            Concluir no painel
          </button>
        </div>
      </section>
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string | boolean | undefined
  onChange: (value: string | boolean) => void
}) {
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700">
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

  if (field.type === "textarea") {
    return (
      <div className="md:col-span-2 xl:col-span-3">
        <label htmlFor={field.key} className="mb-2 block text-sm font-semibold text-slate-700">
          {field.label}
        </label>
        <textarea
          id={field.key}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        />
      </div>
    )
  }

  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={field.key} className="mb-2 block text-sm font-semibold text-slate-700">
          {field.label}
        </label>
        <select
          id={field.key}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        >
          {field.options?.map((option) => (
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
      <label htmlFor={field.key} className="mb-2 block text-sm font-semibold text-slate-700">
        {field.label}
      </label>
      <input
        id={field.key}
        type={field.type}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
      />
    </div>
  )
}
