import { z } from "zod"

export const employeeDocumentTypeSchema = z.enum([
  "rg_cin",
  "cnh",
  "comprovante_endereco",
  "ctps",
  "pis_nis",
  "certidao_civil",
  "comprovante_bancario",
  "aso",
  "dependente",
  "outro",
])

export type EmployeeDocumentType = z.infer<typeof employeeDocumentTypeSchema>

export const employeeDocumentTypeLabels: Record<EmployeeDocumentType, string> = {
  rg_cin: "RG ou CIN",
  cnh: "CNH",
  comprovante_endereco: "Comprovante de endereço",
  ctps: "CTPS",
  pis_nis: "PIS/NIS",
  certidao_civil: "Certidão civil",
  comprovante_bancario: "Comprovante bancário",
  aso: "ASO",
  dependente: "Documento do dependente",
  outro: "Outro documento",
}

export const extractableEmployeeFieldKeys = [
  "nome_completo",
  "nome_mae",
  "nome_pai",
  "data_nascimento",
  "pais_origem",
  "naturalidade",
  "sexo",
  "nacionalidade",
  "estado_civil",
  "cpf",
  "pis",
  "ctps_numero",
  "ctps_serie",
  "ctps_uf",
  "ctps_data_expedicao",
  "rg_numero",
  "rg_orgao_emissor",
  "uf_rg",
  "rg_data_expedicao",
  "cnh_numero",
  "uf_cnh",
  "categoria_cnh",
  "data_expedicao_cnh",
  "orgao_emissor_cnh",
  "validade_cnh",
  "cep",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "dependente_nome",
  "dependente_cpf",
  "dependente_rg",
  "dependente_data_nascimento",
  "dependente_naturalidade",
  "dependente_filiacao_1",
  "dependente_filiacao_2",
] as const

export type ExtractableEmployeeFieldKey = (typeof extractableEmployeeFieldKeys)[number]

export type EmployeeDocumentExtractedField = {
  key: ExtractableEmployeeFieldKey
  value: string
  confidence: "alta" | "media" | "baixa"
  evidence: string
}

export type EmployeeDocumentAnalysis = {
  valid: boolean
  detectedType: EmployeeDocumentType
  fields: EmployeeDocumentExtractedField[]
  warnings: string[]
}

export type EmployeeDocumentRecord = {
  id: string
  employee_id: string
  document_type: EmployeeDocumentType
  original_name: string
  mime_type: string
  size_bytes: number
  analysis_status: "pending" | "processing" | "completed" | "failed"
  extracted_fields: EmployeeDocumentExtractedField[]
  analysis_warnings: string[]
  analysis_error: string | null
  uploaded_by: string
  delete_after: string
  created_at: string
}
