"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Download,
  Link2,
  Mail,
  Pencil,
  Plus,
  Save,
  SendHorizontal,
  Trash2,
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

type DependentFormState = {
  id: string | null
  relationshipName: string
  cpf: string
  relationshipDegree: string
  birthDate: string
  registryDeliveryDate: string
  notes: string
}

type EmployeeOnboardingFormProps = {
  variant?: "client" | "employee"
  initialRecordId?: string | null
  publicToken?: string | null
}

const viewerLabels: Record<FieldAudience, string> = {
  employee: "Funcionário",
  client: "Cliente",
}

const emptyDependentForm: DependentFormState = {
  id: null,
  relationshipName: "",
  cpf: "",
  relationshipDegree: "",
  birthDate: "",
  registryDeliveryDate: "",
  notes: "",
}

const dependentRelationshipOptions = [
  { value: "", label: "Selecione" },
  { value: "01 - Cônjuge", label: "01 - Cônjuge" },
  {
    value: "02 - Companheiro(a) com filho ou união estável",
    label: "02 - Companheiro(a) com filho ou união estável",
  },
  { value: "03 - Filho(a) ou enteado(a)", label: "03 - Filho(a) ou enteado(a)" },
  {
    value: "04 - Filho(a) ou enteado(a), universitário(a) ou escola técnica de 2º grau",
    label: "04 - Filho(a) ou enteado(a), universitário(a) ou escola técnica de 2º grau (desativado)",
  },
  {
    value: "06 - Irmão(ã), neto(a) ou bisneto(a) sem arrimo dos pais, com guarda judicial",
    label: "06 - Irmão(ã), neto(a) ou bisneto(a) sem arrimo dos pais, com guarda judicial",
  },
  {
    value: "07 - Irmão(ã), neto(a) ou bisneto(a) universitário(a) ou escola técnica, com guarda judicial",
    label:
      "07 - Irmão(ã), neto(a) ou bisneto(a) universitário(a) ou escola técnica, com guarda judicial (desativado)",
  },
  { value: "09 - Pais, avós e bisavós", label: "09 - Pais, avós e bisavós" },
  { value: "10 - Menor pobre com guarda judicial", label: "10 - Menor pobre com guarda judicial" },
  {
    value: "11 - Pessoa absolutamente incapaz, tutor ou curador",
    label: "11 - Pessoa absolutamente incapaz, tutor ou curador",
  },
  { value: "12 - Ex-cônjuge", label: "12 - Ex-cônjuge" },
  { value: "99 - Agregado/Outros", label: "99 - Agregado/Outros" },
] as const

function normalizeHoursValue(rawValue: string) {
  const sanitized = rawValue.replace(",", ".").replace(/[^0-9.]/g, "")
  const [integerPart = "", decimalPart = ""] = sanitized.split(".")
  const limitedInteger = integerPart.slice(0, 2)
  const limitedDecimal = decimalPart.slice(0, 2)

  if (!limitedInteger && !limitedDecimal) {
    return ""
  }

  return limitedDecimal.length > 0 ? `${limitedInteger}.${limitedDecimal}` : limitedInteger
}

function calculateMonthlyHours(weeklyHours: string) {
  const normalized = normalizeHoursValue(weeklyHours)

  if (!normalized) {
    return ""
  }

  const parsed = Number.parseFloat(normalized)

  if (Number.isNaN(parsed)) {
    return ""
  }

  return (parsed * 5).toFixed(2)
}

export function EmployeeOnboardingForm({
  variant = "client",
  initialRecordId = null,
  publicToken = null,
}: EmployeeOnboardingFormProps) {
  const editRecordId = initialRecordId
  const [viewer, setViewer] = useState<FieldAudience>(variant === "employee" ? "employee" : "client")
  const [activeSection, setActiveSection] = useState(getSectionsForAudience(viewer)[0]?.id ?? "")
  const [formData, setFormData] = useState<FormState>(defaultFormValues)
  const [dependents, setDependents] = useState<DependentFormState[]>([])
  const [dependentForm, setDependentForm] = useState<DependentFormState>(emptyDependentForm)
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
    if (!editRecordId && !publicToken) {
      return
    }

    let isMounted = true

    async function loadRecord() {
      try {
        const targetUrl =
          variant === "employee"
            ? `/api/cadastros/funcionario?token=${encodeURIComponent(publicToken ?? "")}`
            : `/api/cadastros?id=${editRecordId}`

        const response = await fetch(targetUrl, {
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
            dependents?: Array<{
              id: string
              relationship_name: string | null
              cpf: string | null
              relationship_degree: string | null
              birth_date: string | null
              registry_delivery_date: string | null
              full_payload?: Record<string, string | boolean | number | null>
            }>
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
        setDependents(
          (result.record.dependents ?? []).map((dependent) => ({
            id: dependent.id,
            relationshipName: dependent.relationship_name ?? "",
            cpf: dependent.cpf ?? "",
            relationshipDegree: dependent.relationship_degree ?? "",
            birthDate: dependent.birth_date ?? "",
            registryDeliveryDate: dependent.registry_delivery_date ?? "",
            notes: String(dependent.full_payload?.notes ?? ""),
          }))
        )
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
  }, [editRecordId, publicToken, variant])

  function updateField(key: string, value: string | boolean) {
    if (key === "horas_semanais" && typeof value === "string") {
      const normalizedWeeklyHours = normalizeHoursValue(value)

      setFormData((previous) => ({
        ...previous,
        horas_semanais: normalizedWeeklyHours,
        horas_mensais: calculateMonthlyHours(normalizedWeeklyHours),
      }))
      return
    }

    if (key === "horas_mensais") {
      return
    }

    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function updateDependentField<Key extends keyof DependentFormState>(key: Key, value: DependentFormState[Key]) {
    setDependentForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function resetDependentForm() {
    setDependentForm(emptyDependentForm)
  }

  function saveDependent() {
    if (!dependentForm.relationshipName.trim()) {
      setStatusMessage("Informe o nome do dependente antes de salvar.")
      return
    }

    if (dependentForm.id) {
      setDependents((previous) =>
        previous.map((item) => (item.id === dependentForm.id ? dependentForm : item))
      )
      setStatusMessage("Dependente atualizado na sessão atual.")
    } else {
      setDependents((previous) => [
        ...previous,
        {
          ...dependentForm,
          id: crypto.randomUUID(),
        },
      ])
      setStatusMessage("Dependente adicionado na sessão atual.")
    }

    resetDependentForm()
  }

  function editDependent(dependent: DependentFormState) {
    setDependentForm(dependent)
    setStatusMessage(`Editando o dependente ${dependent.relationshipName}.`)
  }

  function deleteDependent(id: string) {
    const target = dependents.find((item) => item.id === id)
    const confirmed = window.confirm(
      `Excluir o dependente ${target?.relationshipName || "selecionado"} da lista atual?`
    )

    if (!confirmed) {
      return
    }

    setDependents((previous) => previous.filter((item) => item.id !== id))

    if (dependentForm.id === id) {
      resetDependentForm()
    }

    setStatusMessage("Dependente removido da sessão atual.")
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
          dependents,
        }),
      })

      const result = (await response.json()) as { ok: boolean; id?: string; error?: string }

      if (!response.ok || !result.ok || !result.id) {
        setStatusMessage(result.error ?? "Não foi possível salvar no banco agora.")
        return null
      }

      setRecordId(result.id)
      setWorkflow(nextStatus, message)
      return result.id
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao persistir cadastro.")
      return null
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

    let currentRecordId = recordId

    if (!currentRecordId) {
      const savedId = await persist(
        "rascunho_interno",
        "Cadastro salvo antes do disparo do link. Agora estamos enviando o convite."
      )

      if (!savedId) {
        return
      }

      currentRecordId = savedId
    }

    if (!currentRecordId) {
      setStatusMessage("Salve o cadastro antes de disparar o link.")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/cadastros/convite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentRecordId,
          inviteEmail: email,
        }),
      })

      const result = (await response.json()) as { ok: boolean; error?: string }

      if (!response.ok || !result.ok) {
        setStatusMessage(result.error ?? "Não foi possível enviar o link por e-mail.")
        return
      }

      setWorkflow("convite_enviado", `Link enviado com sucesso para ${email}.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro ao enviar convite.")
    } finally {
      setIsSaving(false)
    }
  }

  async function submitEmployeeData() {
    if (variant === "employee") {
      setIsSaving(true)

      try {
        const response = await fetch("/api/cadastros/funcionario", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: publicToken,
            data: formData,
            dependents,
          }),
        })

        const result = (await response.json()) as { ok: boolean; error?: string; id?: string }

        if (!response.ok || !result.ok || !result.id) {
          setStatusMessage(result.error ?? "Não foi possível enviar o cadastro básico.")
          return
        }

        setRecordId(result.id)
        setWorkflow(
          "preenchido_funcionario",
          "Cadastro básico enviado. Agora o cliente deve revisar e completar os campos internos."
        )
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Erro ao enviar cadastro básico.")
      } finally {
        setIsSaving(false)
      }

      return
    }

    await persist(
      "preenchido_funcionario",
      "Cadastro básico enviado. Agora o cliente deve revisar e completar os campos internos."
    )
  }

  async function moveToClientReview() {
    const savedId = await persist(
      "em_revisao_cliente",
      "O cadastro entrou em revisão do cliente. Complete dados contratuais, banco, eSocial e validações."
    )
    if (savedId) {
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

    exportEmployeeWorkbook({
      ...formData,
      dependentes: dependents.map((dependent) => ({
        codigo: dependent.id ?? "",
        nome_parentesco: dependent.relationshipName,
        cpf: dependent.cpf,
        grau_parentesco: dependent.relationshipDegree,
        nascimento: dependent.birthDate,
        data_entrega_registro: dependent.registryDeliveryDate,
        observacoes: dependent.notes,
      })),
    })
    setWorkflow("exportado", "Planilha gerada com sucesso para a próxima etapa operacional.")
  }

  const currentStatusIndex = workflowStatusOrder.indexOf(status)

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
          <button
            type="button"
            onClick={() => setActiveSection("__dependentes__")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeSection === "__dependentes__"
                ? "bg-yellow-400 text-slate-900"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Dependentes
          </button>
        </div>

        {activeSection !== "__dependentes__" && currentSection ? (
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
        ) : (
          <DependentsSection
            dependentForm={dependentForm}
            dependents={dependents}
            onFieldChange={updateDependentField}
            onSave={saveDependent}
            onCancelEdit={resetDependentForm}
            onEdit={editDependent}
            onDelete={deleteDependent}
          />
        )}

        <ActionPanel
          variant={variant}
          viewer={viewer}
          status={status}
          isSaving={isSaving}
          currentStatusIndex={currentStatusIndex}
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
            description="O funcionário informa documentos, endereço, dados pessoais e dependentes."
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
        <p className="mt-2 text-slate-600">Informe o e-mail que receberá o link de preenchimento.</p>
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

function DependentsSection({
  dependentForm,
  dependents,
  onFieldChange,
  onSave,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  dependentForm: DependentFormState
  dependents: DependentFormState[]
  onFieldChange: <Key extends keyof DependentFormState>(key: Key, value: DependentFormState[Key]) => void
  onSave: () => void
  onCancelEdit: () => void
  onEdit: (dependent: DependentFormState) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Dependentes</h3>
          <p className="mt-2 text-slate-600">
            Cadastre os dependentes do funcionário para compor a aba específica da planilha.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {dependents.length} dependente(s) na lista
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SimpleField
          label="Nome do dependente"
          value={dependentForm.relationshipName}
          onChange={(value) => onFieldChange("relationshipName", value)}
          placeholder="Ex.: Ana da Silva"
        />
        <SimpleField
          label="CPF"
          value={dependentForm.cpf}
          onChange={(value) => onFieldChange("cpf", value)}
          placeholder="000.000.000-00"
        />
        <SimpleField
          label="Grau de parentesco"
          type="select"
          value={dependentForm.relationshipDegree}
          onChange={(value) => onFieldChange("relationshipDegree", value)}
          options={dependentRelationshipOptions}
        />
        <SimpleField
          label="Data de nascimento"
          type="date"
          value={dependentForm.birthDate}
          onChange={(value) => onFieldChange("birthDate", value)}
        />
        <SimpleField
          label="Data de entrega do registro"
          type="date"
          value={dependentForm.registryDeliveryDate}
          onChange={(value) => onFieldChange("registryDeliveryDate", value)}
        />
        <div className="md:col-span-2 xl:col-span-3">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Observações</label>
          <textarea
            value={dependentForm.notes}
            onChange={(event) => onFieldChange("notes", event.target.value)}
            placeholder="Anotações complementares sobre o dependente"
            className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          {dependentForm.id ? "Salvar dependente" : "Adicionar dependente"}
        </button>
        {dependentForm.id ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancelar edição
          </button>
        ) : null}
      </div>

      {dependents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
          Ainda não há dependentes adicionados para este funcionário.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Dependente</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Parentesco</th>
                <th className="px-4 py-3">Nascimento</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {dependents.map((dependent) => (
                <tr key={dependent.id ?? dependent.relationshipName} className="text-sm text-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900">{dependent.relationshipName}</td>
                  <td className="px-4 py-3">{dependent.cpf || "Sem CPF"}</td>
                  <td className="px-4 py-3">{dependent.relationshipDegree || "Não informado"}</td>
                  <td className="px-4 py-3">{dependent.birthDate ? formatDateLabel(dependent.birthDate) : "Sem data"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(dependent)}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => dependent.id && onDelete(dependent.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Excluir
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
  )
}

function ActionPanel({
  variant,
  viewer,
  status,
  isSaving,
  currentStatusIndex,
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
  currentStatusIndex: number
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
            {viewer === "client" && currentStatusIndex < workflowStatusOrder.indexOf("finalizado") ? (
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
        readOnly={readOnly || field.key === "horas_mensais"}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
          readOnly || field.key === "horas_mensais"
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        }`}
      />
    </div>
  )
}

function SimpleField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "date" | "select"
  options?: ReadonlyArray<{ value: string; label: string }>
}) {
  if (type === "select") {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        >
          {options?.map((option) => (
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

function formatDateLabel(value: string) {
  const parts = value.split("-")
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value
}
