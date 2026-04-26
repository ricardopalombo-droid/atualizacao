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

function buildTituloEleitorComposite(data: Record<string, unknown>) {
  const parts = [asText(data.titulo_eleitor), asText(data.zona_eleitoral), asText(data.secao_eleitoral)].filter(Boolean)
  return parts.join("/")
}

export function buildPhoenixLegacyColumns(record: EmployeeRecordDetail): PhoenixLegacyColumns {
  const data = record.full_payload

  return {
    LINHA: "API",
    A: asText(data.registro_funcionario || data.codigo_funcionario || ""),
    B: asText(data.nome_completo),
    C: buildLegacyAddress(data),
    D: asText(data.telefone),
    E: asText(data.celular),
    F: asText(data.nome_mae),
    G: asText(data.nome_pai),
    H: asText(data.email),
    I: asText(data.data_nascimento),
    J: asText(data.pais_origem),
    K: asText(data.naturalidade),
    L: asText(data.deficiencia_tipo),
    M: asText(data.raca_cor),
    N: asText(data.sexo),
    O: asText(data.estado_civil),
    P: asText(data.tipo_sanguineo),
    Q: asText(data.local),
    R: asText(data.departamento),
    S: asText(data.setor),
    T: asText(data.secao),
    U: asText(data.data_admissao),
    V: asText(data.data_exame_medico),
    W: asText(data.validade_exame_medico),
    X: asText(data.data_saida),
    Y: asText(data.sindicato),
    Z: asText(data.categoria_normativa),
    AA: asText(data.tipo_contrato),
    AB: asText(data.salario),
    AC: asText(data.cargo_descricao || data.cargo),
    AD: asText(data.cbo || data.cargo_cbo),
    AE: asText(data.data_alteracao_cargo),
    AF: asText(data.horario),
    AG: asText(data.banco),
    AH: asText(data.agencia),
    AI: asText(data.tipo_conta),
    AJ: asText(data.numero_conta),
    AK: asText(data.nacionalidade),
    AL: asText(data.grau_instrucao),
    AM: buildCtpsComposite(data),
    AN: buildTituloEleitorComposite(data),
    AO: asText(data.pis),
    AP: asText(data.rg_numero),
    AQ: asText(data.cpf),
    AR: asText(data.cnh_numero),
    AS: asText(data.categoria_cnh),
    AT: asText(data.data_expedicao_cnh),
    AU: asText(data.orgao_emissor_cnh),
    AV: asText(data.validade_cnh),
    DA: asText(data.registro_funcionario),
    DB: asText(data.folha_ficha),
    DC: asText(data.rg_orgao_emissor),
    DD: asText(data.rg_orgao_emissor_complemento),
    DE: asText(data.uf_rg),
    DF: asText(data.rg_data_expedicao),
    DG: asText(data.evento_esocial),
    DH: asText(data.matricula_esocial),
    DI: asText(data.operacao_esocial),
    DJ: asText(data.status_esocial),
    DK: asText(data.numero_recibo_esocial),
    DL: asText(data.numero_protocolo_esocial),
    DM: asText(data.antecipar_indenizacao_fgts),
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
