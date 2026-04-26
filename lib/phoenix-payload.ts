import type { EmployeeRecordDetail } from "@/lib/cadastro-repository"

export type PhoenixLegacyColumns = Record<string, string>

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

function buildLegacyAddress(data: Record<string, unknown>) {
  return [
    asText(data.logradouro),
    asText(data.numero),
    asText(data.complemento),
    asText(data.bairro),
    asText(data.cidade),
    asText(data.uf),
    asText(data.cep),
  ].join(", ")
}

function buildCtpsComposite(data: Record<string, unknown>) {
  const parts = [asText(data.ctps_numero), asText(data.ctps_serie), asText(data.ctps_uf)].filter(Boolean)
  return parts.join("/")
}

export function buildPhoenixLegacyColumns(record: EmployeeRecordDetail): PhoenixLegacyColumns {
  const data = record.full_payload

  return {
    LINHA: "API",
    A: asText(data.registro_funcionario || data.codigo_funcionario || ""),
    B: asText(data.nome_completo),
    C: buildLegacyAddress(data),
    D: asText(data.nome_mae),
    E: asText(data.nome_pai),
    F: asText(data.telefone),
    G: asText(data.celular),
    H: asText(data.email),
    I: asText(data.data_nascimento),
    J: asText(data.pais_origem),
    K: asText(data.naturalidade),
    M: asText(data.raca_cor),
    N: asText(data.sexo),
    O: asText(data.estado_civil),
    Q: asText(data.local),
    U: asText(data.data_admissao),
    V: asText(data.data_exame_medico),
    W: asText(data.validade_exame_medico),
    Y: asText(data.sindicato),
    AA: asText(data.tipo_contrato),
    AB: asText(data.salario),
    AC: asText(data.cargo),
    AF: asText(data.horario),
    AG: asText(data.banco),
    AH: asText(data.agencia),
    AK: asText(data.nacionalidade),
    AL: asText(data.grau_instrucao),
    AN: buildCtpsComposite(data),
    AO: asText(data.pis),
    AP: asText(data.rg_numero),
    AQ: asText(data.cpf),
    AR: asText(data.cnh_numero),
    AS: asText(data.categoria_cnh),
    AT: asText(data.data_expedicao_cnh),
    AU: asText(data.orgao_emissor_cnh),
    AV: asText(data.validade_cnh),
    DG: asText(data.codigo_empresa_esocial),
    DI: asText(data.tipo_ambiente_esocial),
    DJ: asText(data.perfil_esocial),
    DK: asText(data.processo_esocial),
    DH: asText(data.codigo_evento_esocial),
    DN: asText(data.grau_risco),
    DO: asText(data.vinculo_empregaticio),
    DP: asText(data.indicativo_admissao),
    DQ: asText(data.caged),
  }
}

export function buildPhoenixStructuredPayload(record: EmployeeRecordDetail) {
  return {
    employeeId: record.id,
    workflowStatus: record.workflow_status,
    updatedAt: record.updated_at,
    inviteEmail: record.invite_email,
    formData: record.full_payload,
    dependents: record.dependents,
    legacyColumns: buildPhoenixLegacyColumns(record),
  }
}
