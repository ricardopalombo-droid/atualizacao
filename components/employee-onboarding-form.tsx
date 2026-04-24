"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Download,
  Link2,
  Mail,
  Save,
  SendHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react"
import {
  defaultFormValues,
  getSectionsForAudience,
  type FieldAudience,
  type FormField,
  type WorkflowStatus,
  workflowStatusLabels,
  workflowStatusOrder,
} from "@/lib/employee-form-config"
import { exportEmployeeWorkbook } from "@/lib/planilha-export"

type FormState = Record<string, string | boolean>

type EmployeeOnboardingFormProps = {
  variant?: "client" | "employee"
}

const viewerLabels: Record<FieldAudience, string> = {
  employee: "Funcionário",
  client: "Cliente",
}

export function EmployeeOnboardingForm({ variant = "client" }: EmployeeOnboardingFormProps) {
  const [editRecordId, setEditRecordId] = useState<string | null>(null)
  const [viewer, setViewer] = useState<FieldAudience>(variant === "employee" ? "employee" : "client")
  const [activeSection, setActiveSection] = useState(getSectionsForAudience(viewer)[0]?.id ?? "")
  const [formData, setFormData] = useState<FormState>(defaultFormValues)
  const [status, setStatus] = useState<WorkflowStatus>("rascunho_interno")
  const [recordId, setRecordId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState(
    variant === "employee"
      ? "Preencha os dados básicos e envie para revisão do cliente."
      : "Monte o cadastro, envie o link ao funcionário e finalize após a revisão."
  )

  const currentSections = useMemo(() => getSectionsForAudience(viewer), [viewer])
  const currentSection = currentSections.find((section) => section.id === activeSection) ?? currentSections[0]
  const canSwitchViewer = variant === "client"

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const params = new URLSearchParams(window.location.search)
    setEditRecordId(params.get("id"))
  }, [])

  useEffect(() => {
    if (!editRecordId) {
      return
    }

    let isMounted = true

    async function loadRecord() {
      try {
        const response = await fetch(`/api/cadastros?id=${editRecordId}`, {
          method: "GET",
          cache: "no-store",
        })
        const result = (await response.json()) as {
          ok: boolean
          record?: {
            id: string
            workflow_status: WorkflowStatus
            invite_email: string | null
            full_payload: FormState
          } | null
          error?: string
        }

        if (!response.ok || !result.ok || !result.record || !isMounted) {
          if (result.error && isMounted) {
            setStatusMessage(result.error)
          }
          return
        }

        setRecordId(result.record.id)
        setStatus(result.record.workflow_status)
        setFormData({
          ...defaultFormValues,
          ...result.record.full_payload,
          convite_email: result.record.invite_email ?? String(result.record.full_payload.convite_email ?? ""),
        })
        setStatusMessage("Cadastro carregado para continuar a edição.")
      } catch (error) {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : "Erro ao carregar cadastro salvo.")
        }
      }
    }

    void loadRecord()

    return () => {
      isMounted = false
    }
  }, [editRecordId])

  function updateField(key: string, value: string | boolean) {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function changeViewer(nextViewer: FieldAudience) {
    setViewer(nextViewer)
    setActiveSection(getSectionsForAudience(nextViewer)[0]?.id ?? "")
  }

  function setWorkflow(nextStatus: WorkflowStatus, message: string) {
    setStatus(nextStatus)
    setStatusMessage(message)
  }

  async function persist(nextStatus: WorkflowStatus, message: string) {
    setIsSaving(true)

    try {
      const response = await fetch("/api/cadastros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: recordId,
          actor: viewer,
          workflowStatus: nextStatus,
          inviteEmail: String(formData.convite_email ?? formData.email ?? ""),
          data: formData,
        }),
      })

      const result = (await response.json()) as { ok: boolean; id?: string; error?: string }

      if (!response.ok || !result.ok || !result.id) {
        setStatusMessage(result.error ?? "Não foi possível salvar no banco agora.")
        return false
      }

      setRecordId(result.id)
      setWorkflow(nextStatus, message)
      return true
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao persistir cadastro.")
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function saveDraft() {
    await persist("rascunho_interno", "Rascunho salvo no banco. O cliente ainda pode revisar tudo antes do envio.")
  }

  async function sendInvite() {
    const email = String(formData.convite_email ?? formData.email ?? "")

    if (!email) {
      setStatusMessage("Informe o e-mail do funcionário para disparar o link de cadastro.")
      return
    }

    updateField("convite_email", email)
    await persist("convite_enviado", `Link preparado para envio ao funcionário em ${email}.`)
  }

  async function submitEmployeeData() {
    await persist(
      "preenchido_funcionario",
      "Cadastro básico enviado. Agora o cliente deve revisar e completar os campos internos."
    )
  }

  async function moveToClientReview() {
    const success = await persist(
      "em_revisao_cliente",
      "O cadastro entrou em revisão do cliente. Complete dados contratuais, banco, eSocial e validações."
    )
    if (success) {
      changeViewer("client")
    }
  }

  async function finalizeRecord() {
    await persist("finalizado", "Cadastro finalizado. A planilha agora pode ser gerada.")
  }

  function exportToWorkbook() {
    if (status !== "finalizado" && status !== "exportado") {
      setStatusMessage("Finalize o cadastro antes de gerar a planilha.")
      return
    }

    exportEmployeeWorkbook(formData)
    setWorkflow("exportado", "Planilha gerada com sucesso para a próxima etapa operacional.")
  }

  return (
    <div className="space-y-6">
      {variant === "client" ? (
        <WorkflowOverview
          formData={formData}
          status={status}
          onInviteEmailChange={(value) => updateField("convite_email", value)}
        />
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              {variant === "employee" ? "Link do funcionário" : "Fluxo do cadastro"}
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              {variant === "employee"
                ? "Preencha seu cadastro básico"
                : "Convite, revisão e finalização do funcionário"}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{statusMessage}</p>
          </div>

          <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            Status atual: {workflowStatusLabels[status]}
          </div>
        </div>

        {canSwitchViewer ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => changeViewer("employee")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewer === "employee"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <UserRound size={16} />
              Visão do funcionário
            </button>
            <button
              type="button"
              onClick={() => changeViewer("client")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewer === "client"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <UsersRound size={16} />
              Visão do cliente
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {currentSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                section.id === currentSection?.id
                  ? "bg-yellow-400 text-slate-900"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {currentSection ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{currentSection.title}</h3>
                <p className="mt-2 text-slate-600">{currentSection.description}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                Responsável: {viewerLabels[currentSection.audience]}
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {currentSection.fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  readOnly={variant === "employee" ? field.audience === "client" : false}
                  onChange={(value) => updateField(field.key, value)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <ActionPanel
          variant={variant}
          viewer={viewer}
          status={status}
          isSaving={isSaving}
          onSaveDraft={saveDraft}
          onSendInvite={sendInvite}
          onSubmitEmployeeData={submitEmployeeData}
          onMoveToClientReview={moveToClientReview}
          onFinalizeRecord={finalizeRecord}
          onExport={exportToWorkbook}
        />
      </div>
    </div>
  )
}

function WorkflowOverview({
  formData,
  status,
  onInviteEmailChange,
}: {
  formData: FormState
  status: WorkflowStatus
  onInviteEmailChange: (value: string) => void
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <Link2 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Fluxo em duas etapas</h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-600">
              O funcionário recebe um link e preenche apenas os dados básicos. Depois o cliente
              entra para revisar, completar os campos internos e liberar a geração da planilha.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <WorkflowCard
            title="1. Convite"
            description="O cliente informa o e-mail e dispara o link seguro para o funcionário."
            highlighted={status === "convite_enviado"}
          />
          <WorkflowCard
            title="2. Cadastro básico"
            description="O funcionário informa documentos, endereço e dados pessoais liberados."
            highlighted={status === "preenchido_funcionario"}
          />
          <WorkflowCard
            title="3. Revisão e finalização"
            description="O cliente complementa salário, sindicato, horas, eSocial e fecha o cadastro."
            highlighted={status === "em_revisao_cliente" || status === "finalizado" || status === "exportado"}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Convite do funcionário</h3>
        <p className="mt-2 text-slate-600">
          Informe o e-mail que receberá o link de preenchimento.
        </p>
        <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="convite_email">
          E-mail do funcionário
        </label>
        <input
          id="convite_email"
          type="email"
          value={String(formData.convite_email ?? "")}
          onChange={(event) => onInviteEmailChange(event.target.value)}
          placeholder="funcionario@empresa.com"
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        />
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Link sugerido para a experiência pública: <strong>/cadastro/funcionario</strong>
        </div>
      </div>
    </section>
  )
}

function WorkflowCard({
  title,
  description,
  highlighted,
}: {
  title: string
  description: string
  highlighted?: boolean
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        highlighted ? "border-yellow-300 bg-yellow-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <strong className="text-slate-900">{title}</strong>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  )
}

function ActionPanel({
  variant,
  viewer,
  status,
  isSaving,
  onSaveDraft,
  onSendInvite,
  onSubmitEmployeeData,
  onMoveToClientReview,
  onFinalizeRecord,
  onExport,
}: {
  variant: "client" | "employee"
  viewer: FieldAudience
  status: WorkflowStatus
  isSaving: boolean
  onSaveDraft: () => Promise<void>
  onSendInvite: () => Promise<void>
  onSubmitEmployeeData: () => Promise<void>
  onMoveToClientReview: () => Promise<void>
  onFinalizeRecord: () => Promise<void>
  onExport: () => void
}) {
  return (
    <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <strong className="text-slate-900">Ações da etapa</strong>
        <p className="mt-2 text-slate-600">
          {variant === "employee"
            ? "O funcionário só envia os dados básicos. A finalização fica com o cliente."
            : "O cliente conduz o fluxo, aprova a revisão e libera a exportação apenas no fim."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {variant === "client" ? (
          <>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Save size={18} />
              {isSaving ? "Salvando..." : "Salvar rascunho"}
            </button>
            <button
              type="button"
              onClick={onSendInvite}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
            >
              <Mail size={18} />
              {isSaving ? "Processando..." : "Disparar link"}
            </button>
            {status === "preenchido_funcionario" || status === "convite_enviado" ? (
              <button
                type="button"
                onClick={onMoveToClientReview}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                <UsersRound size={18} />
                Iniciar revisão
              </button>
            ) : null}
            {viewer === "client" ? (
              <button
                type="button"
                onClick={onFinalizeRecord}
                disabled={isSaving}
                className="rounded-xl bg-yellow-400 px-4 py-3 font-bold text-slate-900 hover:brightness-95"
              >
                {isSaving ? "Finalizando..." : "Finalizar cadastro"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Download size={18} />
              Exportar planilha
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onSubmitEmployeeData}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 font-bold text-slate-900 hover:brightness-95"
          >
            <SendHorizontal size={18} />
            {isSaving ? "Enviando..." : "Enviar cadastro básico"}
          </button>
        )}
      </div>
    </section>
  )
}

function FieldRenderer({
  field,
  value,
  readOnly,
  onChange,
}: {
  field: FormField
  value: string | boolean | undefined
  readOnly?: boolean
  onChange: (value: string | boolean) => void
}) {
  if (field.type === "checkbox") {
    return (
      <label
        className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-medium ${
          readOnly ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white text-slate-700"
        }`}
      >
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
        />
        <span>
          {field.label}
          {field.requiredForExport ? " *" : ""}
        </span>
      </label>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className="md:col-span-2 xl:col-span-3">
        <label htmlFor={field.key} className="mb-2 block text-sm font-semibold text-slate-700">
          {field.label}
          {field.requiredForExport ? " *" : ""}
        </label>
        <textarea
          id={field.key}
          value={String(value ?? "")}
          readOnly={readOnly}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`min-h-32 w-full rounded-2xl border px-4 py-3 outline-none transition ${
            readOnly
              ? "border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          }`}
        />
      </div>
    )
  }

  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={field.key} className="mb-2 block text-sm font-semibold text-slate-700">
          {field.label}
          {field.requiredForExport ? " *" : ""}
        </label>
        <select
          id={field.key}
          value={String(value ?? "")}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
            readOnly
              ? "border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          }`}
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
        {field.requiredForExport ? " *" : ""}
      </label>
      <input
        id={field.key}
        type={field.type}
        value={String(value ?? "")}
        readOnly={readOnly}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
          readOnly
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        }`}
      />
    </div>
  )
}
