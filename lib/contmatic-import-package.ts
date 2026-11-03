import type { EmployeeRecordDetail } from "@/lib/cadastro-repository"
import { requiredExportFields } from "@/lib/employee-form-config"
import ibgeMunicipalities from "@/lib/ibge-municipality-codes.json"

type SqlValue = string | number | boolean | null | undefined

export type ContmaticImportPackage = {
  companyAlias: string
  employeeCode: string
  employeeFileName: string
  generalFileName: string
  zipFileName: string
  employeeSql: string
  generalSql: string
  warnings: string[]
}

function asText(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim()
}

function onlyDigits(value: unknown) {
  return asText(value).replace(/\D/g, "")
}

function formatCpf(value: unknown) {
  const digits = onlyDigits(value)
  if (digits.length !== 11) return digits
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
}

function leadingCode(value: unknown, fallback = "") {
  const text = asText(value)
  const match = text.match(/^(\d+)/)
  return match?.[1] ?? fallback
}

function integerText(value: unknown, fallback = "0") {
  const normalized = asText(value).replace(",", ".")
  if (!normalized) return fallback

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? String(Math.trunc(parsed)) : fallback
}

function sqlValue(value: SqlValue) {
  if (value === null || value === undefined) return "NULL"
  const text = typeof value === "boolean" ? (value ? "true" : "false") : String(value)
  return `'${text.replace(/'/g, "''")}'`
}

function validateKnownColumnTypes(table: string, columns: string[], values: SqlValue[]) {
  const fields = new Map(columns.map((column, index) => [column, values[index]]))
  const assertInteger = (column: string) => {
    const value = fields.get(column)
    if (value === null || value === undefined) return
    if (!/^-?\d+$/.test(String(value))) {
      throw new Error(`Falha interna ao gerar ${table}.${column}: era esperado um número inteiro.`)
    }
  }
  const assertMaxLength = (column: string, maxLength: number) => {
    const value = fields.get(column)
    if (value === null || value === undefined) return
    if (String(value).length > maxLength) {
      throw new Error(`Falha interna ao gerar ${table}.${column}: máximo de ${maxLength} caractere(s).`)
    }
  }

  if (table === "func") {
    [
      "numbanco",
      "qtdehsmensal",
      "qtdehssemana",
      "matriculasind",
      "regiaoconsreg",
      "qtdedepsalfam",
      "qtdedepirrf",
      "codhorario",
    ].forEach(assertInteger)
  }

  if (table === "funcaux2") {
    assertInteger("motivoaposen")
    assertMaxLength("numerocnhcompl", 1)
    assertMaxLength("ufcnh", 2)
  }
}

function insert(table: string, columns: string[], values: SqlValue[]) {
  if (columns.length !== values.length) {
    throw new Error(
      `Falha interna ao gerar ${table}: ${columns.length} colunas e ${values.length} valores.`
    )
  }

  validateKnownColumnTypes(table, columns, values)

  return `INSERT INTO public.${table} (${columns.join(", ")}) VALUES (${values.map(sqlValue).join(", ")});`
}

function naturalityParts(value: unknown) {
  const text = asText(value)
  const match = text.match(/^(.*?)\s+-\s+([A-Z]{2})$/i)
  return {
    city: (match?.[1] ?? text).trim(),
    state: match?.[2]?.toUpperCase() ?? "",
  }
}

function normalizeMunicipalityName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
}

type IbgeMunicipality = {
  id: string
  name: string
  state: string
}

function resolveIbgeMunicipalityCode(city: string, state: string, label: string) {
  const normalizedState = state.trim().toUpperCase()
  const normalizedCity = normalizeMunicipalityName(city)

  if (!normalizedCity || !/^[A-Z]{2}$/.test(normalizedState)) {
    throw new Error(`Não foi possível identificar o município de ${label}: confira cidade e UF.`)
  }

  const municipality = (ibgeMunicipalities as IbgeMunicipality[]).find(
    (item) =>
      item.state === normalizedState &&
      normalizeMunicipalityName(item.name) === normalizedCity
  )

  if (!municipality) {
    throw new Error(`Município de ${label} não localizado no IBGE: ${city} - ${normalizedState}.`)
  }

  return municipality.id
}

function contmaticRaceCode(value: unknown) {
  const code = leadingCode(value)
  return ({ "2": "1", "4": "2", "8": "3", "6": "4", "0": "5" } as Record<string, string>)[code] ?? code
}

function brazilCountryCode(value: unknown) {
  return asText(value).toLocaleLowerCase("pt-BR").includes("brasil") ? "01058" : ""
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "1"
}

function validatePackageData(record: EmployeeRecordDetail, companyAlias: string) {
  const data = record.full_payload
  const missing = requiredExportFields
    .filter((field) => {
      if ((field.key === "ctps_uf" || field.key === "ctps_data_expedicao") && booleanValue(data.ctps_digital)) {
        return false
      }
      return !asText(data[field.key]) && data[field.key] !== true
    })
    .map((field) => field.label)

  if (!companyAlias) {
    missing.push("Apelido Contmatic da empresa")
  }

  const employeeCode = asText(
    data.registro_funcionario || data.matricula_esocial || data.folha_ficha || data.chapa
  )

  if (!employeeCode) {
    missing.push("Registro do funcionário")
  } else if (!/^\d+$/.test(employeeCode)) {
    throw new Error("O Registro do funcionário precisa conter somente números para gerar o pacote Contmatic.")
  }

  const cnhNumber = onlyDigits(data.cnh_numero)
  if (cnhNumber && cnhNumber.length < 11) {
    missing.push("Número da CNH com 11 caracteres")
  }
  if (cnhNumber && !asText(data.uf_cnh || data.uf_rg)) {
    missing.push("UF da CNH")
  }

  if (missing.length > 0) {
    throw new Error(`Preencha antes de gerar o pacote: ${Array.from(new Set(missing)).join(", ")}.`)
  }

  return employeeCode
}

const temporaryCadgwInsert = "INSERT INTO public.cadgw (apelido, razaosocial, endereco, nocasa, complcasa, bairro, distrito, subdistr, cep, cidade, uf, cgc, cpf, inscest, natjurid, codatividade, inicatividade, dataregistroxxxxxxx, nomeresp, qualifresp, cpfresp, foneresp, distrlp, dataisssimples, dataicmssimples, apelidomatriz, fpas, codbfgts, categempreg, codcgc, sat, cei, numcontfgts, codcontfgts, decman1, numproprietfamil, codmunicipio, codsindpat, regimefolha, arredonda, recpis, tipoempresa, vctogrmes, planocontas, regapurac, ccm, periodoicms, qtdetotalizador, metcontab, cae, codbcc, numerocc, porcfpas, porcsat, porcinssemp, desccodativ, feriasdobro, decimoterc1a, decimoterc2a, pgvariaveis, calendario, dpto, setor, secao, plcontascontab, balanco, tipocaixas, datainicbalanco, usaindicecon, n1extra, n2extra, n3extra, n4extra, n5extra, n6extra, n7extra, n8extra, n9extra, n10extra, f1extra, f2extra, f3extra, f4extra, x1extra, x2extra, x3extra, x4extra, x5extra, x6extra, x7extra, ativocentralsimples) VALUES ('ZZLIMPA', 'EMPRESA TEMPORARIA IMPORTACAO PALSYS', 'RUA TESTE', '0', 'TEMPORARIA', 'TESTE', '', '7099', '00000-000', 'SAO PAULO', 'SP', '00000000000000', '', '', '2135', '821999', '03/03/2023', '03/03/2023', 'IMPORTACAO PALSYS', '', '', '', '1', '  /  /    ', '  /  /    ', '', NULL, '0', '0', '0', NULL, '', '  /  /    ', NULL, NULL, '0', NULL, '0', '0', '0', NULL, '6', '2', '2', '1', '446287', '1', '6', '1', 'ADM', '0', NULL, '0', '0', '0', 'Administrativo', NULL, NULL, NULL, NULL, '0', '0', '0', '0', '0', '13', '2', NULL, '0', '0', '0', '1', '33', '1', '2', '0', '0', '1', '0', '2', '0', '0', '0', NULL, '8219999', '32060910', NULL, '12', '  .    .  - ', '', 'false');"

export async function buildContmaticImportPackage(
  record: EmployeeRecordDetail,
  rawCompanyAlias: string | null | undefined
): ContmaticImportPackage {
  const data = record.full_payload
  const companyAlias = asText(rawCompanyAlias)
  const employeeCode = validatePackageData(record, companyAlias)
  const admissionDate = asText(data.data_admissao)
  const naturality = naturalityParts(data.naturalidade)
  const addressCountryCode = brazilCountryCode(data.pais) || "01058"
  const birthCountryCode = brazilCountryCode(data.pais_origem) || addressCountryCode
  const addressMunicipalityCode = addressCountryCode === "01058"
    ? resolveIbgeMunicipalityCode(asText(data.cidade), asText(data.uf), "endereço")
    : "0"
  const birthMunicipalityCode = birthCountryCode === "01058"
    ? resolveIbgeMunicipalityCode(naturality.city, naturality.state, "nascimento")
    : "0"
  const employeeName = asText(data.nome_completo)
  const employeeRegistration = asText(data.registro_funcionario) || employeeCode
  const employeeSheet = asText(data.folha_ficha) || employeeRegistration
  const employeeBadge = asText(data.chapa) || employeeRegistration
  const cpfDigits = onlyDigits(data.cpf)
  const digitalCtps = booleanValue(data.ctps_digital)
  const ctpsNumber = digitalCtps ? cpfDigits.slice(0, 7) : asText(data.ctps_numero)
  const ctpsSeries = digitalCtps ? cpfDigits.slice(7, 11) : asText(data.ctps_serie)
  const ctpsState = asText(data.ctps_uf) || (digitalCtps ? asText(data.uf_rg || data.uf) : "")
  // No cadastro FUNC estes campos são inteiros (smallint), embora a tela os
  // represente com casas decimais, por exemplo 44.00 e 220.00.
  const weeklyHours = integerText(data.horas_semanais)
  const informedMonthlyHours = integerText(data.horas_mensais, "")
  const monthlyHours = informedMonthlyHours || String(Number(weeklyHours) * 5)
  const salary = asText(data.salario).replace(",", ".")
  const notes = "CADASTRO GERADO PELO PALSYS - CONFERIR ANTES DE TRANSMITIR AO ESOCIAL"

  const statements = [
    temporaryCadgwInsert,
    insert("cargofun", ["apelidopg", "func", "codcargo", "motivo", "dataalteracao"], [
      companyAlias, employeeCode, asText(data.cargo), "Admissão", admissionDate,
    ]),
    insert("func", [
      "apelidopg", "funcid", "numregistro", "numchapa", "nome", "endereco", "numero", "compl", "bairro", "cidade", "uf", "cep", "fone", "datanasc", "nomepai", "nomemae", "estcivil", "sexo", "ctpsserieuf", "pis", "cpf", "rg", "titeleitor", "zona", "secao", "reservista", "carthabilt", "tpsanguinio", "naturalidade", "ufnasc", "nacionalidade", "datachegada", "situacaocaged", "grauinstr", "vinculoempreg", "admrefgts", "tipocontrato", "validadeexmed", "op13ferres", "dataadmissao", "dataopcaofgts", "dataexmedico", "datatransf", "datarescisao", "numcontfgts", "numbanco", "numerocc", "tiposalario", "codsind", "tptributsind", "qtdehsmensal", "qtdehssemana", "tempoexper", "tempoprorrog", "codlocal", "coddepto", "codsetor", "codsecao", "codrisco", "emissorrg", "emissorufrg", "dataexprg", "dataexpctps", "tipovisto", "numrne", "validaderne", "dataexpctpsex", "valctpsex", "numctpsex", "datacadpis", "matriculasind", "nomeconsreg", "numconsreg", "siglaconsreg", "regiaoconsreg", "partcipa", "qtdedepsalfam", "qtdedepirrf", "codhorario", "observacao", "datatransferenciasaida",
    ], [
      companyAlias, employeeCode, employeeRegistration, employeeBadge, employeeName, asText(data.logradouro), asText(data.numero), asText(data.complemento), asText(data.bairro), asText(data.cidade), asText(data.uf), asText(data.cep), asText(data.telefone || data.celular), asText(data.data_nascimento), asText(data.nome_pai), asText(data.nome_mae), leadingCode(data.estado_civil), leadingCode(data.sexo), ctpsNumber, onlyDigits(data.pis), formatCpf(data.cpf), asText(data.rg_numero), asText(data.titulo_eleitor), asText(data.zona_eleitoral), asText(data.secao_eleitoral), "", asText(data.cnh_numero), asText(data.tipo_sanguineo) || null, naturality.city, naturality.state, leadingCode(data.nacionalidade, "10"), null, leadingCode(data.caged, "0"), leadingCode(data.grau_instrucao), leadingCode(data.vinculo_empregaticio), leadingCode(data.codigo_admissao || data.indicativo_admissao, "0"), leadingCode(data.tipo_contrato), asText(data.validade_exame_medico) || "0", "0", admissionDate, admissionDate, asText(data.data_exame_medico) || null, null, asText(data.data_saida) || null, null, asText(data.banco) || null, asText(data.numero_conta), "0", asText(data.sindicato), leadingCode(data.tipo_tributacao_sindical, "0"), monthlyHours, weeklyHours, asText(data.experiencia_qtde_dias) || "0", asText(data.experiencia_qtde_dias_prorrogacao) || "0", asText(data.local) || "0", asText(data.departamento) || "0", asText(data.setor) || "0", asText(data.secao) || "0", leadingCode(data.grau_risco, "1"), leadingCode(data.rg_orgao_emissor), asText(data.uf_rg), asText(data.rg_data_expedicao) || null, asText(data.ctps_data_expedicao) || null, null, "", null, null, null, null, null, null, null, "", null, null, "false", "0", "0", asText(data.horario) || "0", notes, null,
    ]),
    insert("funcaux", ["apelidopg", "funcid", "racacor", "int1", "int2", "int3", "int4", "float1", "float2", "str1", "str2", "data1", "data2"], [
      companyAlias, employeeCode, contmaticRaceCode(data.raca_cor), "0", "0", "0", "0", "0", "0", null, "", null, null,
    ]),
    insert("funcaux1", [
      "apelidopg", "funcid", "nome", "nomemae", "nomepai", "seriectps", "ufctps", "catcnh", "venctocnh", "termcontr", "formacad", "alvara", "numchapa", "funcaux1_int_1", "funcaux1_int_2", "funcaux1_int_3", "funcaux1_int_4", "funcaux1_int_5", "funcaux1_int_6", "funcaux1_int_7", "funcaux1_int_8", "funcaux1_int_9", "funcaux1_int_10", "funcaux1_chr_1", "funcaux1_chr_2", "funcaux1_chr_3", "funcaux1_chr_4", "funcaux1_chr_5", "funcaux1_chr_6", "funcaux1_chr_7", "funcaux1_chr_8", "funcaux1_chr_9", "funcaux1_chr_10", "funcaux1_chr_11", "anteciparindenizfgts", "funcaux1_log_2", "funcaux1_log_3", "funcaux1_log_4", "funcaux1_log_5", "funcaux1_flo_1", "funcaux1_flo_2", "funcaux1_flo_3", "funcaux1_flo_4", "funcaux1_flo_5", "funcaux1_dat_1", "funcaux1_dat_2", "funcaux1_dat_3", "funcaux1_dat_4", "funcaux1_dat_5", "funcaux1_dat_6",
    ], [
      companyAlias, employeeCode, " ", "", "", ctpsSeries, ctpsState, asText(data.categoria_cnh) || null, asText(data.validade_cnh) || null, asText(data.experiencia_termino_prorrogacao || data.experiencia_termino) || null, null, "false", employeeSheet, "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", null, null, null, null, "|", null, null, null, null, null, null, booleanValue(data.antecipar_indenizacao_fgts), "false", "false", "false", "false", "0", "0", "0", "0", "0", null, null, null, null, null, null,
    ]),
    insert("funcaux2", [
      "apelidopg", "funcid", "tipolog", "codmunicipio", "codpais", "caixapostal", "fonecelular", "codpaisnasc", "codmunnasc", "obsdeffisico", "casadobrasil", "filhosbrasil", "dataexpcnh", "orgaoemissorcnh", "expedicaocr", "orgemissorcr", "vencimentocr", "expedicaorne", "orgemissrne", "numeropass", "orgemispass", "ufpass", "codpaispass", "emissaopass", "validadepass", "numerocnv", "expedicaocnv", "validadecnv", "residprop", "imoveladfgts", "cnpjva", "matriculava", "dtiniciova", "dtfimva", "observacaova", "inicioaposen", "motivoaposen", "instensinoid", "coordenadoid", "agenintgid", "natobrigator", "seguradoraas", "numeroas", "prevtermestg", "areaatuaestg", "inscinssdata", "inscinssnro", "extra_int_1", "extra_int_2", "extra_int_3", "extra_int_4", "extra_int_5", "extra_int_6", "extra_int_7", "extra_int_8", "motivotrabtemp", "tipoinctrabtemp", "extra_chr_1", "numerocompl", "caixapostalcompl", "complementocompl", "bairrocompl", "cidadecompl", "enderecocompl", "emailcompl", "emailalternativo", "orgaoemissorcompl", "numerocnhcompl", "ufcnh", "orgaoemissorric", "nroconselhoreg", "nomesocial", "matriculavacompl", "numprocreintegra", "apelidotransf", "cnpjtransf", "matriculatransf", "extra_chr_11", "extra_log_1", "extra_log_2", "extra_log_3", "extra_log_4", "ctpsdigital", "extra_flo_1", "extra_flo_2", "extra_flo_3", "extra_flo_4", "extra_flo_5", "extra_dat_1", "extra_dat_2", "extra_dat_3", "extra_dat_4", "extra_dat_5", "extra_dat_6",
    ], [
      companyAlias, employeeCode, "33", addressMunicipalityCode, addressCountryCode, "", asText(data.celular), birthCountryCode, birthMunicipalityCode, asText(data.observacao_deficiencia), "false", "false", asText(data.data_expedicao_cnh) || null, leadingCode(data.orgao_emissor_cnh, "0"), null, null, null, null, "", null, "0", null, null, null, null, null, null, null, booleanValue(data.possui_residencia_propria), booleanValue(data.imovel_fgts), asText(data.cnpj_vinculo_anterior) || null, asText(data.matricula_anterior) || null, asText(data.data_inicio_vinculo_anterior) || null, asText(data.data_fim_vinculo_anterior) || null, null, asText(data.inicio_aposentadoria) || null, leadingCode(data.motivo_aposentadoria, "0"), "0", "0", "0", "false", null, null, null, null, null, onlyDigits(data.pis), "0", "0", "0", "0", "0", "-1", "0", "0", "0", "0", null, null, "", "", "", "", "", asText(data.email), "", "", " ", asText(data.uf_cnh || data.uf_rg), "", "", asText(data.nome_social), null, null, null, null, null, null, "false", "false", "false", "false", booleanValue(data.ctps_digital), "0", "0", "0", "0", "0", null, null, null, null, null, null,
    ]),
    insert("funcaux3", [
      "apelidopg", "funcid", "motivo", "tipoinclusao", "extra_chr_1", "matriculaesocial", "apelidosucessora", "extra_chr_2", "extra_chr_3", "extra_chr_4", "extra_chr_5", "extra_int_1", "extra_int_2", "extra_int_3", "extra_int_4", "extra_int_5", "extra_int_6", "extra_int_7", "extra_int_8", "extra_int_9", "extra_int_10", "extra_float_1", "extra_float_2", "extra_float_3", "extra_float_4", "extra_float_5", "extra_float_6", "extra_float_7", "extra_float_8", "extra_float_9", "extra_float_10", "extra_date_1", "extra_date_2", "extra_date_3", "extra_date_4", "extra_date_5", "extra_date_6", "extra_date_7", "extra_date_8", "extra_date_9", "extra_date_10", "extra_logical_1", "extra_logical_2", "extra_logical_3", "extra_logical_4", "extra_logical_5", "extra_logical_6", "extra_logical_7", "extra_logical_8", "extra_logical_9", "extra_logical_10", "justificativa",
    ], [
      companyAlias, employeeCode, "0", "0", null, asText(data.matricula_esocial), null, null, null, null, null, "0", leadingCode(data.indicativo_admissao, "1"), "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", null, null, null, null, null, null, null, null, null, null, "false", "false", "false", "false", "false", "false", "false", "false", "false", "false", null,
    ]),
    insert("histanex", ["apelidopg", "tipoempregado", "empid", "data", "anexo", "histanex_int_1", "histanex_int_2", "histanex_int_3", "histanex_chr_1", "histanex_chr_2", "histanex_chr_3", "histanex_log_1", "histanex_log_2", "histanex_flo_1", "histanex_flo_2", "histanex_flo_3", "histanex_dat_1", "histanex_dat_2", "histanex_dat_3"], [
      companyAlias, "1", employeeCode, admissionDate, "4", "0", "0", "0", null, null, null, "false", "false", "0", "0", "0", null, null, null,
    ]),
    insert("histhora", ["apelidopg", "tipoempregado", "empid", "datainicio", "horarioid", "histhora_int_1", "histhora_int_2", "histhora_int_3", "histhora_int_4", "histhora_int_5", "histhora_chr_1", "histhora_chr_2", "histhora_chr_3", "histhora_log_1", "histhora_log_2", "histhora_flo_1", "histhora_flo_2", "histhora_flo_3", "histhora_flo_4", "histhora_dat_1", "histhora_dat_2", "histhora_dat_3", "histhora_dat_4"], [
      companyAlias, "1", employeeCode, admissionDate, asText(data.horario) || "0", "0", "0", "0", "0", "0", null, null, null, "false", "false", "0", "0", "0", "0", null, null, null, null,
    ]),
    insert("histrisc", ["apelidopg", "tipoempregado", "empid", "datainicio", "grauriscoid", "histrisc_int_1", "histrisc_int_2", "histrisc_int_3", "histrisc_int_4", "histrisc_int_5", "histrisc_chr_1", "histrisc_chr_2", "histrisc_chr_3", "histrisc_log_1", "histrisc_log_2", "histrisc_flo_1", "histrisc_flo_2", "histrisc_flo_3", "histrisc_flo_4", "histrisc_dat_1", "histrisc_dat_2", "histrisc_dat_3", "histrisc_dat_4"], [
      companyAlias, "1", employeeCode, admissionDate, leadingCode(data.grau_risco, "1"), "0", "0", "0", "0", "0", "", "", "", "false", "false", "0", "0", "0", "0", null, null, null, null,
    ]),
    insert("histsind", ["apelidopg", "tipoempregado", "empid", "datafiliacao", "sindicatoid", "histsind_int_1", "histsind_int_2", "histsind_int_3", "histsind_int_4", "histsind_int_5", "histsind_chr_1", "histsind_chr_2", "histsind_chr_3", "histsind_log_1", "histsind_log_2", "histsind_flo_1", "histsind_flo_2", "histsind_flo_3", "histsind_flo_4", "histsind_dat_1", "histsind_dat_2", "histsind_dat_3", "histsind_dat_4"], [
      companyAlias, "1", employeeCode, admissionDate, asText(data.sindicato), leadingCode(data.tipo_tributacao_sindical, "0"), "0", "0", "0", "0", "", "", "", "false", "false", "0", "0", "0", "0", null, null, null, null,
    ]),
    insert("histsal", ["apelidopg", "tipoempregado", "empid", "datadissidio", "datareajuste", "tipo", "horassemana", "horasmes", "valor", "aumentocomp", "motivo", "histsal_int_1", "histsal_int_2", "histsal_int_3", "histsal_chr_1", "histsal_chr_2", "histsal_chr_3", "histsal_log_1", "histsal_log_2", "histsal_log_3", "regimejornada", "histsal_flo_2", "histsal_flo_3", "histsal_dat_1", "histsal_dat_2", "histsal_dat_3"], [
      companyAlias, "1", employeeCode, admissionDate, admissionDate, leadingCode(data.tipo_pagamento, "1"), weeklyHours, monthlyHours, salary, "false", "Admissão", "1", "1", "1", "", "", "", "false", "false", "false", leadingCode(data.regime_jornada, "1"), "0", "0", null, null, null,
    ]),
  ]

  const safeAlias = companyAlias.replace(/[^a-zA-Z0-9_-]/g, "_")

  return {
    companyAlias,
    employeeCode,
    employeeFileName: `generated_script_empresa_${safeAlias}.sql`,
    generalFileName: `generated_script_geral_${safeAlias}.sql`,
    zipFileName: `Script_${safeAlias}.zip`,
    employeeSql: `${statements.join("\r\n")}\r\n`,
    generalSql: "\r\n",
    warnings: [
      "A empresa temporária ZZLIMPA precisa não existir antes da importação.",
      "Depois da importação, exclua manualmente a ZZLIMPA no Contmatic.",
      "O pacote contém somente o funcionário selecionado e seus registros auxiliares mínimos.",
    ],
  }
}
