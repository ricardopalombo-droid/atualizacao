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
  dynamicReferenceFieldKeys,
  getSectionsForAudience,
  requiredExportFields,
  type FieldAudience,
  type FieldOption,
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
  naturality: string
  registryOffice: string
  registryNumber: string
  bookNumber: string
  sheetNumber: string
  situationStartDate: string
  situationMotive: string
  irrf: boolean
  familySalary: boolean
  alimony: boolean
  healthPlan: boolean
  notes: string
}

type EmployeeOnboardingFormProps = {
  variant?: "client" | "employee"
  initialRecordId?: string | null
  publicToken?: string | null
  lookupCatalog?: Partial<
    Record<
      "cargo" | "horario" | "sindicato" | "local" | "departamento" | "setor" | "secao",
      LookupRecord[]
    >
  >
}

type LookupRecord = {
  code: string
  label: string
  metadata?: Record<string, string | number | boolean | null>
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
  naturality: "",
  registryOffice: "",
  registryNumber: "",
  bookNumber: "",
  sheetNumber: "",
  situationStartDate: "",
  situationMotive: "",
  irrf: false,
  familySalary: false,
  alimony: false,
  healthPlan: false,
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

const contmaticDependentRelationshipOptions = [
  { value: "", label: "Selecione" },
  { value: "1 - Filho(a) válido", label: "1 - Filho(a) válido" },
  { value: "2 - Filho(a) vitalício (inválido)", label: "2 - Filho(a) vitalício (inválido)" },
  { value: "3 - Enteado(a) válido", label: "3 - Enteado(a) válido" },
  { value: "4 - Enteado(a) vitalício (inválido)", label: "4 - Enteado(a) vitalício (inválido)" },
  { value: "5 - Filho válido estudante maior", label: "5 - Filho válido estudante maior" },
  { value: "6 - Enteado(a) válido estudante maior", label: "6 - Enteado(a) válido estudante maior" },
  { value: "7 - Menor pobre com guarda", label: "7 - Menor pobre com guarda" },
  { value: "8 - Menor pobre com guarda mantido até", label: "8 - Menor pobre com guarda mantido até" },
  { value: "9 - Cônjuge", label: "9 - Cônjuge" },
  { value: "10 - Companheiro(a)", label: "10 - Companheiro(a)" },
  { value: "11 - Pai", label: "11 - Pai" },
  { value: "12 - Avós", label: "12 - Avós" },
  { value: "13 - Bisavós", label: "13 - Bisavós" },
  { value: "14 - Irmão com guarda", label: "14 - Irmão com guarda" },
  { value: "15 - Neto com guarda", label: "15 - Neto com guarda" },
  { value: "16 - Bisneto com guarda", label: "16 - Bisneto com guarda" },
  { value: "17 - Irmão com guarda vitalício (inválido)", label: "17 - Irmão com guarda vitalício (inválido)" },
  { value: "18 - Neto com guarda vitalício (inválido)", label: "18 - Neto com guarda vitalício (inválido)" },
  { value: "19 - Bisneto com guarda vitalício (inválido)", label: "19 - Bisneto com guarda vitalício (inválido)" },
  { value: "20 - Irmão com guarda maior estudante", label: "20 - Irmão com guarda maior estudante" },
  { value: "21 - Neto com guarda maior estudante", label: "21 - Neto com guarda maior estudante" },
  { value: "22 - Bisneto com guarda maior estudante", label: "22 - Bisneto com guarda maior estudante" },
  { value: "23 - Cônjuge que trabalha", label: "23 - Cônjuge que trabalha" },
  { value: "24 - Companheiro(a) que trabalha", label: "24 - Companheiro(a) que trabalha" },
  { value: "25 - Filho\\enteado só salário família", label: "25 - Filho\\enteado só salário família" },
  { value: "26 - Filho\\enteado só salário família vitalício (inválido)", label: "26 - Filho\\enteado só salário família vitalício (inválido)" },
  { value: "27 - Agregados/Outros - Convênio Médico", label: "27 - Agregados/Outros - Convênio Médico" },
  { value: "28 - Incapaz, da qual seja tutor ou curador", label: "28 - Incapaz, da qual seja tutor ou curador" },
  { value: "29 - Ex-cônjuge", label: "29 - Ex-cônjuge" },
] as const

function normalizeHoursValue(rawValue: string) {
  const sanitized = rawValue.replace(",", ".").replace(/[^0-9.]/g, "")
  const [integerPart = "", decimalPart = ""] = sanitized.split(".")
  const limitedInteger = integerPart.slice(0, 2)
  const limitedDecimal = decimalPart.slice(0, 2)
  const hasTrailingDot = sanitized.endsWith(".") && decimalPart.length === 0

  if (!limitedInteger && !limitedDecimal) {
    return ""
  }

  if (hasTrailingDot) {
    return `${limitedInteger}.`
  }

  return limitedDecimal.length > 0 ? `${limitedInteger}.${limitedDecimal}` : limitedInteger
}

function calculateMonthlyHours(weeklyHours: string) {
  const normalized = normalizeHoursValue(weeklyHours)

  if (!normalized || normalized.endsWith(".")) {
    return ""
  }

  const parsed = Number.parseFloat(normalized)

  if (Number.isNaN(parsed)) {
    return ""
  }

  return (parsed * 5).toFixed(2)
}

function parsePositiveInteger(value: string) {
  const digits = value.replace(/\D/g, "")

  if (!digits) {
    return null
  }

  const parsed = Number.parseInt(digits, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDaysToIsoDate(baseDateValue: string, daysToAdd: string) {
  if (!baseDateValue) {
    return ""
  }

  const parsedDays = parsePositiveInteger(daysToAdd)

  if (parsedDays === null) {
    return ""
  }

  const [year, month, day] = baseDateValue.split("-").map((part) => Number.parseInt(part, 10))

  if (!year || !month || !day) {
    return ""
  }

  const calculatedDate = new Date(year, month - 1, day)
  calculatedDate.setDate(calculatedDate.getDate() + parsedDays)

  return formatDateInputValue(calculatedDate)
}

function buildLookupOptions(records: LookupRecord[]) {
  return [
    { label: "Selecione", value: "" },
    ...records.map((record) => ({
      label: `${record.code} - ${record.label}`,
      value: record.code,
    })),
  ] satisfies FieldOption[]
}

function hasFilledValue(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value
  }

  return typeof value === "string" ? value.trim().length > 0 : false
}

function getMissingRequiredFields(formData: FormState) {
  return requiredExportFields
    .filter((field) => {
      if (field.key === "ctps_uf" && formData.ctps_digital) {
        return false
      }

      if (field.key === "ctps_data_expedicao" && formData.ctps_digital) {
        return false
      }

      return !hasFilledValue(formData[field.key])
    })
}

function normalizeCpfDigits(value: string | boolean | undefined) {
  return String(value ?? "").replace(/\D/g, "")
}

function buildDigitalCtpsFields(cpfValue: string | boolean | undefined) {
  const cpfDigits = normalizeCpfDigits(cpfValue)

  if (cpfDigits.length < 11) {
    return {
      ctps_numero: "",
      ctps_serie: "",
    }
  }

  return {
    ctps_numero: cpfDigits.slice(0, 7),
    ctps_serie: cpfDigits.slice(-4),
  }
}

function buildExperienceFields(
  admissionDate: string | boolean | undefined,
  experienceDays: string | boolean | undefined,
  extensionDays: string | boolean | undefined
) {
  const normalizedAdmissionDate = typeof admissionDate === "string" ? admissionDate : ""
  const normalizedExperienceDays = typeof experienceDays === "string" ? experienceDays : ""
  const normalizedExtensionDays = typeof extensionDays === "string" ? extensionDays : ""
  const experienceEndDate = addDaysToIsoDate(normalizedAdmissionDate, normalizedExperienceDays)
  const extensionEndDate = addDaysToIsoDate(experienceEndDate, normalizedExtensionDays)

  return {
    experiencia_termino: experienceEndDate,
    experiencia_termino_prorrogacao: extensionEndDate,
  }
}

export function EmployeeOnboardingForm({
  variant = "client",
  initialRecordId = null,
  publicToken = null,
  lookupCatalog = {},
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
      ? "Preencha suas informacoes iniciais e envie para a empresa revisar."
      : "Envie o convite, acompanhe o preenchimento e conclua o cadastro da empresa."
  )

  const currentSections = useMemo(() => getSectionsForAudience(viewer), [viewer])
  const currentSection = currentSections.find((section) => section.id === activeSection) ?? currentSections[0]
  const canSwitchViewer = variant === "client"
  const canManageDependents = variant === "employee"
  const lookupOptionsByKey = useMemo(
    () => ({
      cargo: buildLookupOptions(lookupCatalog.cargo ?? []),
      horario: buildLookupOptions(lookupCatalog.horario ?? []),
      sindicato: buildLookupOptions(lookupCatalog.sindicato ?? []),
      local: buildLookupOptions(lookupCatalog.local ?? []),
      departamento: buildLookupOptions(lookupCatalog.departamento ?? []),
      setor: buildLookupOptions(lookupCatalog.setor ?? []),
      secao: buildLookupOptions(lookupCatalog.secao ?? []),
    }),
    [lookupCatalog]
  )
  const lookupRecordByKey = useMemo(
    () => ({
      cargo: new Map((lookupCatalog.cargo ?? []).map((record) => [record.code, record])),
      horario: new Map((lookupCatalog.horario ?? []).map((record) => [record.code, record])),
      sindicato: new Map((lookupCatalog.sindicato ?? []).map((record) => [record.code, record])),
      local: new Map((lookupCatalog.local ?? []).map((record) => [record.code, record])),
      departamento: new Map((lookupCatalog.departamento ?? []).map((record) => [record.code, record])),
      setor: new Map((lookupCatalog.setor ?? []).map((record) => [record.code, record])),
      secao: new Map((lookupCatalog.secao ?? []).map((record) => [record.code, record])),
    }),
    [lookupCatalog]
  )
  const missingRequiredFields = useMemo(() => getMissingRequiredFields(formData), [formData])
  const employeeReadOnly =
    variant === "employee" &&
    ["preenchido_funcionario", "em_revisao_cliente", "finalizado", "exportado"].includes(status)

  useEffect(() => {
    if (variant !== "client" || editRecordId || publicToken) {
      return
    }

    let isMounted = true

    async function loadClientDefaults() {
      try {
        const response = await fetch("/api/clientes?current=1", {
          method: "GET",
          cache: "no-store",
        })

        const result = (await response.json()) as {
          ok: boolean
          record?: {
            employee_defaults?: Record<string, string | boolean | number | null>
          } | null
          error?: string
        }

        if (!response.ok || !result.ok || !result.record?.employee_defaults || !isMounted) {
          return
        }

        setFormData((previous) => ({
          ...previous,
          ...result.record!.employee_defaults,
        }))
        setStatusMessage("Os padroes contabeis da empresa ja foram aplicados neste novo cadastro.")
      } catch {
        // Mantem o fluxo atual se a leitura dos padroes falhar.
      }
    }

    void loadClientDefaults()

    return () => {
      isMounted = false
    }
  }, [editRecordId, publicToken, variant])

  useEffect(() => {
    const recalculatedExperienceFields = buildExperienceFields(
      formData.data_admissao,
      formData.experiencia_qtde_dias,
      formData.experiencia_qtde_dias_prorrogacao
    )

    if (
      recalculatedExperienceFields.experiencia_termino === String(formData.experiencia_termino ?? "") &&
      recalculatedExperienceFields.experiencia_termino_prorrogacao ===
        String(formData.experiencia_termino_prorrogacao ?? "")
    ) {
      return
    }

    setFormData((previous) => ({
      ...previous,
      ...recalculatedExperienceFields,
    }))
  }, [
    formData.data_admissao,
    formData.experiencia_qtde_dias,
    formData.experiencia_qtde_dias_prorrogacao,
    formData.experiencia_termino,
    formData.experiencia_termino_prorrogacao,
  ])

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
            naturality: String(dependent.full_payload?.naturality ?? ""),
            registryOffice: String(dependent.full_payload?.registryOffice ?? ""),
            registryNumber: String(dependent.full_payload?.registryNumber ?? ""),
            bookNumber: String(dependent.full_payload?.bookNumber ?? ""),
            sheetNumber: String(dependent.full_payload?.sheetNumber ?? ""),
            situationStartDate: String(dependent.full_payload?.situationStartDate ?? ""),
            situationMotive: String(dependent.full_payload?.situationMotive ?? ""),
            irrf: Boolean(dependent.full_payload?.irrf),
            familySalary: Boolean(dependent.full_payload?.familySalary),
            alimony: Boolean(dependent.full_payload?.alimony),
            healthPlan: Boolean(dependent.full_payload?.healthPlan),
            notes: String(dependent.full_payload?.notes ?? ""),
          }))
        )
        setStatusMessage(
          result.record.workflow_status === "convite_enviado"
            ? "Cadastro carregado para continuar o preenchimento."
            : "Este cadastro já foi enviado e não pode mais ser alterado pelo funcionário."
        )
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
    if (employeeReadOnly) {
      return
    }

    if (dynamicReferenceFieldKeys.includes(key as (typeof dynamicReferenceFieldKeys)[number]) && typeof value === "string") {
      const typedKey =
        key as
          | "cargo"
          | "horario"
          | "sindicato"
          | "local"
          | "departamento"
          | "setor"
          | "secao"
      const selectedRecord = lookupRecordByKey[typedKey].get(value)

      setFormData((previous) => ({
        ...previous,
        [typedKey]: value,
        [`${typedKey}_descricao`]: selectedRecord?.label ?? "",
        ...(typedKey === "cargo"
          ? {
              cargo_cbo: String(selectedRecord?.metadata?.cbo_esocial ?? ""),
            }
          : {}),
      }))
      return
    }

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

    if (key === "experiencia_termino" || key === "experiencia_termino_prorrogacao") {
      return
    }

    if (key === "ctps_digital") {
      const digitalEnabled = Boolean(value)

      setFormData((previous) => ({
        ...previous,
        ctps_digital: digitalEnabled,
        ...(digitalEnabled
          ? {
              ...buildDigitalCtpsFields(previous.cpf),
              ctps_uf: "",
              ctps_data_expedicao: "",
            }
          : {}),
      }))
      return
    }

    if (key === "cpf" && formData.ctps_digital && typeof value === "string") {
      setFormData((previous) => ({
        ...previous,
        cpf: value,
        ...buildDigitalCtpsFields(value),
        ctps_uf: "",
        ctps_data_expedicao: "",
      }))
      return
    }

    if (
      key === "data_admissao" ||
      key === "experiencia_qtde_dias" ||
      key === "experiencia_qtde_dias_prorrogacao"
    ) {
      setFormData((previous) => {
        const nextData = {
          ...previous,
          [key]: typeof value === "string" ? value : "",
        }

        return {
          ...nextData,
          ...buildExperienceFields(
            nextData.data_admissao,
            nextData.experiencia_qtde_dias,
            nextData.experiencia_qtde_dias_prorrogacao
          ),
        }
      })
      return
    }

    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function updateDependentField<Key extends keyof DependentFormState>(key: Key, value: DependentFormState[Key]) {
    if (employeeReadOnly) {
      return
    }

    if (key === "irrf") {
      const nextValue = Boolean(value)
      setDependentForm((previous) => ({
        ...previous,
        irrf: nextValue,
        alimony: nextValue ? false : previous.alimony,
      }))
      return
    }

    if (key === "alimony") {
      const nextValue = Boolean(value)
      setDependentForm((previous) => ({
        ...previous,
        alimony: nextValue,
        irrf: nextValue ? false : previous.irrf,
      }))
      return
    }

    setDependentForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function resetDependentForm() {
    if (employeeReadOnly) {
      return
    }

    setDependentForm(emptyDependentForm)
  }

  function saveDependent() {
    if (employeeReadOnly) {
      setStatusMessage("Este cadastro já foi enviado e não pode mais ser alterado pelo funcionário.")
      return
    }

    if (!dependentForm.relationshipName.trim()) {
      setStatusMessage("Informe o nome do dependente antes de salvar.")
      return
    }

    if (!dependentForm.birthDate) {
      setStatusMessage("Informe a data de nascimento do dependente antes de salvar.")
      return
    }

    if (dependentForm.irrf && dependentForm.alimony) {
      setStatusMessage("IRRF e Pensão Alimentícia não podem ser marcados ao mesmo tempo.")
      return
    }

    if (dependentForm.id) {
      setDependents((previous) =>
        previous.map((item) => (item.id === dependentForm.id ? dependentForm : item))
      )
      setStatusMessage("Dependente atualizado neste cadastro.")
    } else {
      setDependents((previous) => [
        ...previous,
        {
          ...dependentForm,
          id: crypto.randomUUID(),
        },
      ])
      setStatusMessage("Dependente adicionado neste cadastro.")
    }

    resetDependentForm()
  }

  function editDependent(dependent: DependentFormState) {
    if (employeeReadOnly) {
      return
    }

    setDependentForm(dependent)
    setStatusMessage(`Editando o dependente ${dependent.relationshipName}.`)
  }

  function deleteDependent(id: string) {
    if (employeeReadOnly) {
      setStatusMessage("Este cadastro já foi enviado e não pode mais ser alterado pelo funcionário.")
      return
    }

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

    setStatusMessage("Dependente removido deste cadastro.")
  }

  function changeViewer(nextViewer: FieldAudience) {
    setViewer(nextViewer)
    setActiveSection(getSectionsForAudience(nextViewer)[0]?.id ?? "")
  }

  useEffect(() => {
    if (!canManageDependents && activeSection === "__dependentes__") {
      setActiveSection(currentSections[0]?.id ?? "")
    }
  }, [activeSection, canManageDependents, currentSections])

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
      setStatusMessage("Informe o e-mail do funcionario para enviar o link de acesso ao cadastro.")
      return
    }

    updateField("convite_email", email)

    let currentRecordId = recordId

    if (!currentRecordId) {
      const savedId = await persist(
        "rascunho_interno",
        "Cadastro salvo. Agora o convite sera enviado para o funcionario."
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

      setWorkflow("convite_enviado", `Convite enviado com sucesso para ${email}.`)
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

    if (missingRequiredFields.length > 0) {
      const preview = missingRequiredFields.slice(0, 6).map((field) => field.label).join(", ")
      const suffix =
        missingRequiredFields.length > 6
          ? ` e mais ${missingRequiredFields.length - 6} campo(s).`
          : "."

      setStatusMessage(`Preencha os campos obrigatorios antes de exportar: ${preview}${suffix}`)
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
        naturalidade: dependent.naturality,
        cartorio: dependent.registryOffice,
        registro: dependent.registryNumber,
        livro: dependent.bookNumber,
        folha: dependent.sheetNumber,
        data_inicio_situacao: dependent.situationStartDate,
        motivo_situacao: dependent.situationMotive,
        irrf: dependent.irrf,
        salario_familia: dependent.familySalary,
        pensao_alimenticia: dependent.alimony,
        convenio_assistencia_saude: dependent.healthPlan,
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

        {variant === "client" ? (
          <RequiredFieldsNotice missingRequiredFields={missingRequiredFields} />
        ) : null}

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
              Visão da empresa
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
          {canManageDependents ? (
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
          ) : null}
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
                  optionsOverride={
                    dynamicReferenceFieldKeys.includes(
                      field.key as (typeof dynamicReferenceFieldKeys)[number]
                    )
                      ? lookupOptionsByKey[
                          field.key as
                            | "cargo"
                            | "horario"
                            | "sindicato"
                            | "local"
                            | "departamento"
                            | "setor"
                            | "secao"
                        ]
                      : undefined
                  }
                  readOnly={
                    employeeReadOnly ||
                    (variant === "employee" ? field.audience === "client" : false) ||
                    (field.key === "ctps_numero" && Boolean(formData.ctps_digital)) ||
                    (field.key === "ctps_serie" && Boolean(formData.ctps_digital)) ||
                    (field.key === "ctps_uf" && Boolean(formData.ctps_digital)) ||
                    (field.key === "ctps_data_expedicao" && Boolean(formData.ctps_digital))
                  }
                  onChange={(value) => updateField(field.key, value)}
                />
              ))}
            </div>
          </section>
        ) : canManageDependents ? (
          <DependentsSectionPhoenix
            dependentForm={dependentForm}
            dependents={dependents}
            readOnly={employeeReadOnly}
            onFieldChange={updateDependentField}
            onSave={saveDependent}
            onCancelEdit={resetDependentForm}
            onEdit={editDependent}
            onDelete={deleteDependent}
          />
        ) : null}

        {employeeReadOnly ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-600">
            Este cadastro já foi enviado pelo funcionário e não pode mais ser alterado neste link.
          </div>
        ) : null}

        <ActionPanel
          variant={variant}
          viewer={viewer}
          status={status}
          isSaving={isSaving}
          employeeReadOnly={employeeReadOnly}
          currentStatusIndex={currentStatusIndex}
          missingRequiredFieldCount={missingRequiredFields.length}
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
            <h2 className="text-2xl font-bold text-slate-900">Como funciona o cadastro</h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-600">
              O cadastro comeca com o funcionario, que preenche as informacoes iniciais pelo link recebido. Depois, a empresa revisa os dados, completa as informacoes internas e conclui o processo.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <WorkflowCard
            title="1. Envio do convite"
            description="A empresa informa o e-mail do funcionario para enviar o link de acesso ao cadastro."
            highlighted={status === "convite_enviado"}
          />
          <WorkflowCard
            title="2. Preenchimento inicial"
            description="O funcionario preenche seus dados pessoais, endereco, documentos e dependentes."
            highlighted={status === "preenchido_funcionario"}
          />
          <WorkflowCard
            title="3. Revisao da empresa"
            description="A empresa confere as informacoes, completa os dados internos e conclui o cadastro."
            highlighted={status === "em_revisao_cliente" || status === "finalizado" || status === "exportado"}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Convite do funcionario</h3>
        <p className="mt-2 text-slate-600">Digite o e-mail do funcionario para enviar o link de acesso ao cadastro.</p>
        <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="convite_email">
          E-mail do funcionario
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
          Link da area do funcionario: <strong>/cadastro/funcionario</strong>
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

function RequiredFieldsNotice({
  missingRequiredFields,
}: {
  missingRequiredFields: Array<{ key: string; label: string }>
}) {
  function focusRequiredField(fieldKey: string) {
    setTimeout(() => {
      const target = document.getElementById(fieldKey)

      if (!target) {
        return
      }

      target.scrollIntoView({ behavior: "smooth", block: "center" })
      if ("focus" in target && typeof target.focus === "function") {
        target.focus()
      }
    }, 0)
  }

  if (missingRequiredFields.length === 0) {
    return (
      <section className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6">
        <strong className="text-green-800">Checklist de exportacao concluido</strong>
        <p className="mt-2 text-green-700">
          Os campos obrigatorios destacados pelo sistema de destino ja foram preenchidos.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <strong className="text-amber-900">
        Ainda faltam {missingRequiredFields.length} campo(s) obrigatorio(s) para exportar
      </strong>
      <p className="mt-2 text-amber-800">
        Corrija os itens abaixo antes de gerar a planilha final. Clique em qualquer item para ir direto ao campo.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {missingRequiredFields.map((field) => (
          <button
            key={field.key}
            type="button"
            onClick={() => focusRequiredField(field.key)}
            className="inline-flex rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            {field.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function DependentsSection({
  dependentForm,
  dependents,
  readOnly,
  onFieldChange,
  onSave,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  dependentForm: DependentFormState
  dependents: DependentFormState[]
  readOnly?: boolean
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
          readOnly={readOnly}
        />
        <SimpleField
          label="CPF"
          value={dependentForm.cpf}
          onChange={(value) => onFieldChange("cpf", value)}
          placeholder="000.000.000-00"
          readOnly={readOnly}
        />
        <SimpleField
          label="Grau de parentesco"
          type="select"
          value={dependentForm.relationshipDegree}
          onChange={(value) => onFieldChange("relationshipDegree", value)}
          options={dependentRelationshipOptions}
          readOnly={readOnly}
        />
        <SimpleField
          label="Data de nascimento"
          type="date"
          value={dependentForm.birthDate}
          onChange={(value) => onFieldChange("birthDate", value)}
          readOnly={readOnly}
        />
        <SimpleField
          label="Data de entrega do registro"
          type="date"
          value={dependentForm.registryDeliveryDate}
          onChange={(value) => onFieldChange("registryDeliveryDate", value)}
          readOnly={readOnly}
        />
        <div className="md:col-span-2 xl:col-span-3">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Observações</label>
          <textarea
            value={dependentForm.notes}
            readOnly={readOnly}
            onChange={(event) => onFieldChange("notes", event.target.value)}
            placeholder="Anotações complementares sobre o dependente"
            className={`min-h-28 w-full rounded-2xl border px-4 py-3 outline-none transition ${
              readOnly
                ? "border-slate-200 bg-slate-100 text-slate-500"
                : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            }`}
          />
        </div>
      </div>

      {!readOnly ? (
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
      ) : null}

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
                {!readOnly ? <th className="px-4 py-3">Ação</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {dependents.map((dependent) => (
                <tr key={dependent.id ?? dependent.relationshipName} className="text-sm text-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900">{dependent.relationshipName}</td>
                  <td className="px-4 py-3">{dependent.cpf || "Sem CPF"}</td>
                  <td className="px-4 py-3">{dependent.relationshipDegree || "Não informado"}</td>
                  <td className="px-4 py-3">{dependent.birthDate ? formatDateLabel(dependent.birthDate) : "Sem data"}</td>
                  {!readOnly ? (
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
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function DependentsSectionPhoenix({
  dependentForm,
  dependents,
  readOnly,
  onFieldChange,
  onSave,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  dependentForm: DependentFormState
  dependents: DependentFormState[]
  readOnly?: boolean
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
            Cadastre os dependentes na ordem em que devem seguir para o sistema da folha.
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
          readOnly={readOnly}
        />
        <SimpleField
          label="CPF"
          value={dependentForm.cpf}
          onChange={(value) => onFieldChange("cpf", value)}
          placeholder="000.000.000-00"
          readOnly={readOnly}
        />
        <SimpleField
          label="Tipo de parentesco"
          type="select"
          value={dependentForm.relationshipDegree}
          onChange={(value) => onFieldChange("relationshipDegree", value)}
          options={contmaticDependentRelationshipOptions}
          readOnly={readOnly}
        />
        <SimpleField
          label="Data de nascimento"
          type="date"
          value={dependentForm.birthDate}
          onChange={(value) => onFieldChange("birthDate", value)}
          readOnly={readOnly}
        />
        <SimpleField
          label="Data de entrega do registro"
          type="date"
          value={dependentForm.registryDeliveryDate}
          onChange={(value) => onFieldChange("registryDeliveryDate", value)}
          readOnly={readOnly}
        />
        <SimpleField
          label="Naturalidade"
          value={dependentForm.naturality}
          onChange={(value) => onFieldChange("naturality", value)}
          placeholder="Município do dependente"
          readOnly={readOnly}
        />
        <SimpleField
          label="Cartório"
          value={dependentForm.registryOffice}
          onChange={(value) => onFieldChange("registryOffice", value)}
          placeholder="Cartório"
          readOnly={readOnly}
        />
        <SimpleField
          label="Registro"
          value={dependentForm.registryNumber}
          onChange={(value) => onFieldChange("registryNumber", value)}
          placeholder="Número do registro"
          readOnly={readOnly}
        />
        <SimpleField
          label="Livro"
          value={dependentForm.bookNumber}
          onChange={(value) => onFieldChange("bookNumber", value)}
          placeholder="Número do livro"
          readOnly={readOnly}
        />
        <SimpleField
          label="Folha"
          value={dependentForm.sheetNumber}
          onChange={(value) => onFieldChange("sheetNumber", value)}
          placeholder="Número da folha"
          readOnly={readOnly}
        />
        <SimpleField
          label="Data início da situação"
          type="date"
          value={dependentForm.situationStartDate}
          onChange={(value) => onFieldChange("situationStartDate", value)}
          readOnly={readOnly}
        />
        <div className="md:col-span-2 xl:col-span-3">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Motivo da situação</label>
          <input
            value={dependentForm.situationMotive}
            readOnly={readOnly}
            onChange={(event) => onFieldChange("situationMotive", event.target.value)}
            placeholder="Motivo da situação do dependente"
            className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
              readOnly
                ? "border-slate-200 bg-slate-100 text-slate-500"
                : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            }`}
          />
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <label className="mb-3 block text-sm font-semibold text-slate-700">Tipo de dependente</label>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${readOnly ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white text-slate-700"}`}>
              <input type="checkbox" checked={dependentForm.irrf} disabled={readOnly} onChange={(event) => onFieldChange("irrf", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400" />
              <span>IRRF</span>
            </label>
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${readOnly ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white text-slate-700"}`}>
              <input type="checkbox" checked={dependentForm.familySalary} disabled={readOnly} onChange={(event) => onFieldChange("familySalary", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400" />
              <span>Salário família</span>
            </label>
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${readOnly ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white text-slate-700"}`}>
              <input type="checkbox" checked={dependentForm.alimony} disabled={readOnly} onChange={(event) => onFieldChange("alimony", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400" />
              <span>Pensão alimentícia</span>
            </label>
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${readOnly ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-200 bg-white text-slate-700"}`}>
              <input type="checkbox" checked={dependentForm.healthPlan} disabled={readOnly} onChange={(event) => onFieldChange("healthPlan", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400" />
              <span>Convênio assistência saúde</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">IRRF e Pensão alimentícia não podem ser marcados ao mesmo tempo.</p>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Observações</label>
          <textarea
            value={dependentForm.notes}
            readOnly={readOnly}
            onChange={(event) => onFieldChange("notes", event.target.value)}
            placeholder="Anotações complementares sobre o dependente"
            className={`min-h-28 w-full rounded-2xl border px-4 py-3 outline-none transition ${
              readOnly
                ? "border-slate-200 bg-slate-100 text-slate-500"
                : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
            }`}
          />
        </div>
      </div>

      {!readOnly ? (
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
      ) : null}

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
                {!readOnly ? <th className="px-4 py-3">Ação</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {dependents.map((dependent) => (
                <tr key={dependent.id ?? dependent.relationshipName} className="text-sm text-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900">{dependent.relationshipName}</td>
                  <td className="px-4 py-3">{dependent.cpf || "Sem CPF"}</td>
                  <td className="px-4 py-3">{dependent.relationshipDegree || "Não informado"}</td>
                  <td className="px-4 py-3">{dependent.birthDate ? formatDateLabel(dependent.birthDate) : "Sem data"}</td>
                  {!readOnly ? (
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
                  ) : null}
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
  employeeReadOnly,
  currentStatusIndex,
  missingRequiredFieldCount,
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
  employeeReadOnly: boolean
  currentStatusIndex: number
  missingRequiredFieldCount: number
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
        <strong className="text-slate-900">Acoes da etapa</strong>
        <p className="mt-2 text-slate-600">
          {variant === "employee"
            ? "Nesta etapa, voce preenche as informacoes iniciais. A revisao e a conclusao do cadastro ficam com a empresa."
            : "Nesta etapa, a empresa acompanha o preenchimento, revisa as informacoes e conclui o cadastro antes da exportacao."}
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
              disabled={missingRequiredFieldCount > 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Download size={18} />
              {missingRequiredFieldCount > 0
                ? `Exportacao bloqueada (${missingRequiredFieldCount})`
                : "Exportar planilha"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onSubmitEmployeeData}
            disabled={isSaving || employeeReadOnly}
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
  optionsOverride,
  readOnly,
  onChange,
}: {
  field: FormField
  value: string | boolean | undefined
  optionsOverride?: FieldOption[]
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
      <label htmlFor={field.key} className="mb-2 block text-sm font-semibold text-slate-700">
        {field.label}
        {field.requiredForExport ? " *" : ""}
      </label>
      <input
        id={field.key}
        type={field.type}
        value={String(value ?? "")}
        readOnly={
          readOnly ||
          field.key === "horas_mensais" ||
          field.key === "experiencia_termino" ||
          field.key === "experiencia_termino_prorrogacao"
        }
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
          readOnly ||
          field.key === "horas_mensais" ||
          field.key === "experiencia_termino" ||
          field.key === "experiencia_termino_prorrogacao"
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
  readOnly = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "date" | "select"
  options?: ReadonlyArray<{ value: string; label: string }>
  readOnly?: boolean
}) {
  if (type === "select") {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
        <select
          value={value}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
            readOnly
              ? "border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          }`}
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
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
          readOnly
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-300 bg-white text-slate-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        }`}
      />
    </div>
  )
}

function formatDateLabel(value: string) {
  const parts = value.split("-")
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value
}
