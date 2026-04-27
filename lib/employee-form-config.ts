import { ibgeCityNames, ibgeCountryNames } from "@/lib/location-options"

export type FieldType = "text" | "date" | "number" | "email" | "select" | "textarea" | "checkbox"

export type FieldAudience = "employee" | "client"

export type WorkflowStatus =
  | "rascunho_interno"
  | "convite_enviado"
  | "preenchido_funcionario"
  | "em_revisao_cliente"
  | "finalizado"
  | "exportado"

export type FieldOption = {
  label: string
  value: string
}

export type FormField = {
  key: string
  label: string
  type: FieldType
  audience: FieldAudience
  placeholder?: string
  options?: FieldOption[]
  requiredForExport?: boolean
}

export type FormSection = {
  id: string
  title: string
  description: string
  audience: FieldAudience
  fields: FormField[]
}

export type RequiredExportField = {
  key: string
  label: string
}

export const dynamicReferenceFieldKeys = ["cargo", "horario", "sindicato"] as const

function buildOptions(values: readonly string[]): FieldOption[] {
  return [{ label: "Selecione", value: "" }, ...values.map((value) => ({ label: value, value }))]
}

const countryOptions = buildOptions(ibgeCountryNames)

const brazilStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

const stateOptions = buildOptions(brazilStates)

const brazilCityOptions = buildOptions(ibgeCityNames)

const sexoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Masculino", value: "1 - Masculino" },
  { label: "2 - Feminino", value: "2 - Feminino" },
]

const nacionalidadeOptions = [
  { label: "Selecione", value: "" },
  { label: "10 - Brasileira", value: "10 - Brasileira" },
  { label: "20 - Naturalizado/Brasileira", value: "20 - Naturalizado/Brasileira" },
  { label: "21 - Argentina", value: "21 - Argentina" },
  { label: "22 - Boliviana", value: "22 - Boliviana" },
  { label: "23 - Chilena", value: "23 - Chilena" },
  { label: "24 - Paraguaia", value: "24 - Paraguaia" },
  { label: "25 - Uruguaia", value: "25 - Uruguaia" },
  { label: "26 - Venezuelano", value: "26 - Venezuelano" },
  { label: "27 - Colombiano", value: "27 - Colombiano" },
  { label: "28 - Peruano", value: "28 - Peruano" },
  { label: "29 - Equatoriano", value: "29 - Equatoriano" },
  { label: "30 - Alemao", value: "30 - Alemao" },
  { label: "31 - Belga", value: "31 - Belga" },
  { label: "32 - Britanica", value: "32 - Britanica" },
  { label: "34 - Canadense", value: "34 - Canadense" },
  { label: "35 - Espanhola", value: "35 - Espanhola" },
  { label: "36 - Norte-Americana(EUA)", value: "36 - Norte-Americana(EUA)" },
  { label: "37 - Francesa", value: "37 - Francesa" },
  { label: "38 - Suica", value: "38 - Suica" },
  { label: "39 - Italiana", value: "39 - Italiana" },
  { label: "40 - Haitiano", value: "40 - Haitiano" },
  { label: "41 - Japonesa", value: "41 - Japonesa" },
  { label: "42 - Chinesa", value: "42 - Chinesa" },
  { label: "43 - Coreana", value: "43 - Coreana" },
  { label: "44 - Russo", value: "44 - Russo" },
  { label: "45 - Portuguesa", value: "45 - Portuguesa" },
  { label: "46 - Paquistanes", value: "46 - Paquistanes" },
  { label: "47 - Indiano", value: "47 - Indiano" },
  { label: "48 - Outros Latino-americanas", value: "48 - Outros Latino-americanas" },
  { label: "49 - Outros asiaticas", value: "49 - Outros asiaticas" },
  { label: "50 - Outros", value: "50 - Outros" },
  { label: "51 - Outros Europeus", value: "51 - Outros Europeus" },
  { label: "60 - Angolano", value: "60 - Angolano" },
  { label: "61 - Congoles", value: "61 - Congoles" },
  { label: "62 - Sul-Africano", value: "62 - Sul-Africano" },
  { label: "70 - Outros Africanos", value: "70 - Outros Africanos" },
]

const racaCorOptions = [
  { label: "Selecione", value: "" },
  { label: "2 - Branca", value: "2 - Branca" },
  { label: "4 - Preta / Negra", value: "4 - Preta / Negra" },
  { label: "6 - Amarela", value: "6 - Amarela" },
  { label: "8 - Parda", value: "8 - Parda" },
  { label: "0 - Indigena", value: "0 - Indigena" },
]

const estadoCivilOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Solteiro", value: "1 - Solteiro" },
  { label: "2 - Casado", value: "2 - Casado" },
  { label: "3 - Divorciado", value: "3 - Divorciado" },
  { label: "4 - Separado", value: "4 - Separado" },
  { label: "5 - Viuvo", value: "5 - Viuvo" },
]

const grauInstrucaoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Analfabeto", value: "1" },
  { label: "2 - Ate o 5o ano incompleto do ensino fundamental", value: "2" },
  { label: "3 - 5o ano completo do ensino fundamental", value: "3" },
  { label: "4 - 6o ao 9o ano incompleto do ensino fundamental", value: "4" },
  { label: "5 - Ensino fundamental completo", value: "5" },
  { label: "6 - Ensino medio incompleto", value: "6" },
  { label: "7 - Ensino medio completo", value: "7" },
  { label: "8 - Educacao superior incompleta", value: "8" },
  { label: "9 - Educacao superior completa", value: "9" },
  { label: "10 - Pos-graduacao completa", value: "10" },
  { label: "11 - Mestrado completo", value: "11" },
  { label: "12 - Doutorado completo", value: "12" },
]

const tipoContaOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Corrente", value: "1 - Corrente" },
  { label: "2 - Poupanca", value: "2 - Poupanca" },
  { label: "3 - Salario", value: "3 - Salario" },
]

const formaPagamentoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Mensalista", value: "1 - Mensalista" },
  { label: "2 - Horista", value: "2 - Horista" },
  { label: "3 - Comissionado", value: "3 - Comissionado" },
  { label: "4 - Tarefeiro", value: "4 - Tarefeiro" },
  { label: "5 - Docente Mensalista", value: "5 - Docente Mensalista" },
  { label: "6 - Docente Aulista", value: "6 - Docente Aulista" },
]

const tipoPagamentoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Fixo", value: "1 - Fixo" },
  { label: "2 - Variavel", value: "2 - Variavel" },
  { label: "3 - Fixo + variavel", value: "3 - Fixo + variavel" },
]

const tipoContratoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - CLT Indeterminado", value: "1 - CLT Indeterminado" },
  { label: "2 - Lei 9601/98", value: "2 - Lei 9601/98" },
  { label: "3 - Temporario", value: "3 - Temporario" },
  { label: "4 - Prazo determinado sem clausula assecuratoria", value: "4 - Prazo determinado sem clausula assecuratoria" },
  { label: "5 - Avulso", value: "5 - Avulso" },
  { label: "6 - Estagiario", value: "6 - Estagiario" },
  { label: "7 - Contrato parcial", value: "7 - Contrato parcial" },
  { label: "8 - Prazo determinado com clausula assecuratoria", value: "8 - Prazo determinado com clausula assecuratoria" },
  { label: "9 - Intermitente", value: "9 - Intermitente" },
  { label: "10 - Teletrabalho", value: "10 - Teletrabalho" },
  { label: "11 - Verde e Amarelo", value: "11 - Verde e Amarelo" },
]

const possuiDeficienciaOptions = [
  { label: "Selecione", value: "" },
  { label: "Nao", value: "nao" },
  { label: "Sim", value: "sim" },
]

const cagedOptions = [
  { label: "Selecione", value: "" },
  { label: "10 - Admissao de empregado no 1o emprego", value: "10 - Admissao de empregado no 1o emprego" },
  { label: "25 - Admissao de empregado com emprego anterior", value: "25 - Admissao de empregado com emprego anterior" },
  { label: "35 - Reintegracao", value: "35 - Reintegracao" },
  { label: "70 - Transferencia de entrada", value: "70 - Transferencia de entrada" },
]

const grauRiscoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Nao exposicao a agente nocivo", value: "1 - Nao exposicao a agente nocivo" },
  { label: "2 - Exposicao a agente nocivo (Aposent. Exp. 15 anos)", value: "2 - Exposicao a agente nocivo (Aposent. Exp. 15 anos)" },
  { label: "3 - Exposicao a agente nocivo (Aposent. Exp. 20 anos)", value: "3 - Exposicao a agente nocivo (Aposent. Exp. 20 anos)" },
  { label: "4 - Exposicao a agente nocivo (Aposent. Exp. 25 anos)", value: "4 - Exposicao a agente nocivo (Aposent. Exp. 25 anos)" },
  { label: "5 - Nao exposicao a agente nocivo (Mais de um vinculo)", value: "5 - Nao exposicao a agente nocivo (Mais de um vinculo)" },
  { label: "6 - Exposicao a agente nocivo (Aposent. Exp. 15 anos) (Mais de um vinculo)", value: "6 - Exposicao a agente nocivo (Aposent. Exp. 15 anos) (Mais de um vinculo)" },
  { label: "7 - Exposicao a agente nocivo (Aposent. Exp. 20 anos) (Mais de um vinculo)", value: "7 - Exposicao a agente nocivo (Aposent. Exp. 20 anos) (Mais de um vinculo)" },
  { label: "8 - Exposicao a agente nocivo (Aposent. Exp. 25 anos) (Mais de um vinculo)", value: "8 - Exposicao a agente nocivo (Aposent. Exp. 25 anos) (Mais de um vinculo)" },
  {
    label: "9 - Empregadores cuja atividade nao exponha seus trabalhadores a agentes nocivos",
    value: "9 - Empregadores cuja atividade nao exponha seus trabalhadores a agentes nocivos",
  },
]

const indicativoAdmissaoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Normal", value: "1 - Normal" },
  { label: "2 - Decorrente de acao fiscal", value: "2 - Decorrente de acao fiscal" },
  { label: "3 - Decorrente de decisao judicial", value: "3 - Decorrente de decisao judicial" },
]

const tipoTributacaoSindicalOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Ja contribui este ano", value: "1 - Ja contribui este ano" },
  { label: "2 - Desconta sindical mes admissao", value: "2 - Desconta sindical mes admissao" },
  { label: "3 - Desconta sindical mes subsequente a admissao", value: "3 - Desconta sindical mes subsequente a admissao" },
  { label: "4 - Nao desconta sindical (contador)", value: "4 - Nao desconta sindical (contador)" },
]

const regimeJornadaOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Submetidos a horario de trabalho (Cap. II da CLT)", value: "1 - Submetidos a horario de trabalho (Cap. II da CLT)" },
  { label: "2 - Atividade externa especificada no inciso I do Art. 62 da CLT", value: "2 - Atividade externa especificada no inciso I do Art. 62 da CLT" },
  { label: "3 - Funcoes especificadas no inciso II do Art. 62 da CLT", value: "3 - Funcoes especificadas no inciso II do Art. 62 da CLT" },
  { label: "4 - Teletrabalho, previsto no Inciso III do Art. 62 da CLT", value: "4 - Teletrabalho, previsto no Inciso III do Art. 62 da CLT" },
]

const vinculoEmpregaticioOptions = [
  { label: "Selecione", value: "" },
  { label: "10 - Trab. urbano vinc. empregador pessoa juridica por contr. de trab. regido pela CLT, por prazo indeter.", value: "10 - Trab. urbano vinc. empregador pessoa juridica por contr. de trab. regido pela CLT, por prazo indeter." },
  { label: "15 - Trab. urbano vinc. empregador pessoa fisica por contr. de trab. regido pela CLT, por prazo indeter.", value: "15 - Trab. urbano vinc. empregador pessoa fisica por contr. de trab. regido pela CLT, por prazo indeter." },
  { label: "20 - Trab. rural vinc. empregador pessoa juridica por contr. de trab. regido pela CLT, por prazo indeter.", value: "20 - Trab. rural vinc. empregador pessoa juridica por contr. de trab. regido pela CLT, por prazo indeter." },
  { label: "25 - Trab. rural vinc. empregador pessoa fisica por contr. de trab. regido pela CLT, por prazo indeter.", value: "25 - Trab. rural vinc. empregador pessoa fisica por contr. de trab. regido pela CLT, por prazo indeter." },
  { label: "30 - Servidor regido pelo Regime Juridico Unico (Federal, estadual e municipal) e militar", value: "30 - Servidor regido pelo Regime Juridico Unico (Federal, estadual e municipal) e militar" },
  { label: "35 - Serv. publico nao-efetivo vinculado por contrato de trabalho (servidor regido pela CLT)", value: "35 - Serv. publico nao-efetivo vinculado por contrato de trabalho (servidor regido pela CLT)" },
  { label: "40 - Trab. avulso (Trab. Adm. pelo sind. da categ.) p / o qual dev. depos. de fgts, lei n. 5480 10.08.68", value: "40 - Trab. avulso (Trab. Adm. pelo sind. da categ.) p / o qual dev. depos. de fgts, lei n. 5480 10.08.68" },
  { label: "50 - Trabalhador temporario, regido pela lei 6.019, de 03.01.74", value: "50 - Trabalhador temporario, regido pela lei 6.019, de 03.01.74" },
  { label: "55 - Jovem Aprendiz", value: "55 - Jovem Aprendiz" },
  { label: "60 - Trab. urbano vinc. a empreg. pessoa juridica por contr. de trab regido pela CLT, por tempo deter. ou obra", value: "60 - Trab. urbano vinc. a empreg. pessoa juridica por contr. de trab regido pela CLT, por tempo deter. ou obra" },
  { label: "65 - Trab. urbano vinc. a empreg pessoa fisica por contr. de trab. regido pela CLT, por tempo deter. ou obra", value: "65 - Trab. urbano vinc. a empreg pessoa fisica por contr. de trab. regido pela CLT, por tempo deter. ou obra" },
  { label: "70 - Trab. rural vinc. a empreg. pessoa juridica por contr. de trab. regido pela CLT, por tempo deter. ou obra", value: "70 - Trab. rural vinc. a empreg. pessoa juridica por contr. de trab. regido pela CLT, por tempo deter. ou obra" },
  { label: "75 - Trab. rural vinc. a empreg. pessoa fisica por contr. de trab. regido pela CLT, por tempo deter. ou obra", value: "75 - Trab. rural vinc. a empreg. pessoa fisica por contr. de trab. regido pela CLT, por tempo deter. ou obra" },
  { label: "80 - Diretor sem vinculo empreg. para o qual a empresa/entidade nao optado por recolhimento do FGTS", value: "80 - Diretor sem vinculo empreg. para o qual a empresa/entidade nao optado por recolhimento do FGTS" },
  { label: "90 - Contrato de trabalho por prazo determinado, regido pela lei 9601/98 de 21.01.98", value: "90 - Contrato de trabalho por prazo determinado, regido pela lei 9601/98 de 21.01.98" },
]

export const workflowStatusOrder: WorkflowStatus[] = [
  "rascunho_interno",
  "convite_enviado",
  "preenchido_funcionario",
  "em_revisao_cliente",
  "finalizado",
  "exportado",
]

export const workflowStatusLabels: Record<WorkflowStatus, string> = {
  rascunho_interno: "Rascunho interno",
  convite_enviado: "Convite enviado",
  preenchido_funcionario: "Preenchido pelo funcionario",
  em_revisao_cliente: "Em revisao do cliente",
  finalizado: "Finalizado",
  exportado: "Exportado",
}

export const formSections: FormSection[] = [
  {
    id: "dados-pessoais-funcionario",
    title: "Dados pessoais",
    description: "Campos liberados no link enviado ao funcionario.",
    audience: "employee",
    fields: [
      { key: "nome_completo", label: "Nome completo", type: "text", audience: "employee", requiredForExport: true },
      { key: "nome_social", label: "Nome social", type: "text", audience: "employee" },
      { key: "nome_mae", label: "Nome da mae", type: "text", audience: "employee", requiredForExport: true },
      { key: "nome_pai", label: "Nome do pai", type: "text", audience: "employee" },
      { key: "email", label: "E-mail", type: "email", audience: "employee" },
      { key: "telefone", label: "Telefone", type: "text", audience: "employee" },
      { key: "celular", label: "Celular", type: "text", audience: "employee" },
      { key: "data_nascimento", label: "Data de nascimento", type: "date", audience: "employee", requiredForExport: true },
      { key: "pais_origem", label: "Pais de origem", type: "select", audience: "employee", options: countryOptions, requiredForExport: true },
      { key: "naturalidade", label: "Naturalidade", type: "select", audience: "employee", options: brazilCityOptions },
      { key: "sexo", label: "Sexo", type: "select", audience: "employee", options: sexoOptions, requiredForExport: true },
      { key: "raca_cor", label: "Tipo de raca/cor", type: "select", audience: "employee", options: racaCorOptions, requiredForExport: true },
      { key: "estado_civil", label: "Estado civil", type: "select", audience: "employee", options: estadoCivilOptions, requiredForExport: true },
      { key: "tipo_sanguineo", label: "Tipo sanguineo", type: "text", audience: "employee" },
      { key: "nacionalidade", label: "Nacionalidade", type: "select", audience: "employee", options: nacionalidadeOptions },
      { key: "grau_instrucao", label: "Grau de instrucao", type: "select", audience: "employee", options: grauInstrucaoOptions, requiredForExport: true },
    ],
  },
  {
    id: "deficiencia-acessibilidade-funcionario",
    title: "Deficiencia e acessibilidade",
    description: "Dados estruturados para PCD, reabilitacao e observacoes do cadastro.",
    audience: "employee",
    fields: [
      {
        key: "possui_deficiencia",
        label: "Possui deficiencia?",
        type: "select",
        audience: "employee",
        options: possuiDeficienciaOptions,
      },
      { key: "deficiencia_fisica", label: "Deficiencia fisica", type: "checkbox", audience: "employee" },
      { key: "deficiencia_auditiva", label: "Deficiencia auditiva", type: "checkbox", audience: "employee" },
      { key: "deficiencia_visual", label: "Deficiencia visual", type: "checkbox", audience: "employee" },
      { key: "deficiencia_intelectual", label: "Deficiencia intelectual", type: "checkbox", audience: "employee" },
      { key: "deficiencia_mental", label: "Deficiencia mental/psicossocial", type: "checkbox", audience: "employee" },
      { key: "deficiencia_multipla", label: "Deficiencia multipla", type: "checkbox", audience: "employee" },
      { key: "reabilitado", label: "Profissional reabilitado", type: "checkbox", audience: "employee" },
      { key: "preenche_cota_pcd", label: "Preenche cota de pessoas com deficiencia", type: "checkbox", audience: "employee" },
      { key: "observacao_deficiencia", label: "Observacoes sobre deficiencia e adaptacoes", type: "textarea", audience: "employee" },
    ],
  },
  {
    id: "endereco-funcionario",
    title: "Endereco",
    description: "Endereco principal do funcionario para compor a planilha final.",
    audience: "employee",
    fields: [
      { key: "pais", label: "Pais", type: "select", audience: "employee", options: countryOptions, requiredForExport: true },
      { key: "cep", label: "CEP", type: "text", audience: "employee", placeholder: "12239-036", requiredForExport: true },
      { key: "logradouro", label: "Logradouro", type: "text", audience: "employee", requiredForExport: true },
      { key: "numero", label: "Numero", type: "text", audience: "employee" },
      { key: "complemento", label: "Complemento", type: "text", audience: "employee" },
      { key: "bairro", label: "Bairro", type: "text", audience: "employee" },
      { key: "cidade", label: "Cidade", type: "text", audience: "employee", requiredForExport: true },
      { key: "uf", label: "UF", type: "select", audience: "employee", options: stateOptions, requiredForExport: true },
    ],
  },
  {
    id: "documentos-funcionario",
    title: "Documentos oficiais",
    description: "Documentos que o proprio funcionario costuma informar no cadastro inicial.",
    audience: "employee",
      fields: [
        { key: "cpf", label: "CPF", type: "text", audience: "employee", requiredForExport: true },
        { key: "pis", label: "PIS", type: "text", audience: "employee", requiredForExport: true },
        { key: "titulo_eleitor", label: "Titulo de eleitor", type: "text", audience: "employee" },
        { key: "ctps_digital", label: "CTPS digital", type: "checkbox", audience: "employee" },
        { key: "ctps_numero", label: "Numero CTPS", type: "text", audience: "employee", requiredForExport: true },
        { key: "ctps_serie", label: "Serie CTPS", type: "text", audience: "employee", requiredForExport: true },
        { key: "ctps_uf", label: "UF CTPS", type: "select", audience: "employee", options: stateOptions, requiredForExport: true },
      { key: "rg_numero", label: "RG", type: "text", audience: "employee", requiredForExport: true },
      { key: "rg_orgao_emissor", label: "Orgao emissor RG", type: "text", audience: "employee" },
      { key: "uf_rg", label: "UF do RG", type: "select", audience: "employee", options: stateOptions },
      { key: "rg_data_expedicao", label: "Data expedicao RG", type: "date", audience: "employee" },
      { key: "cnh_numero", label: "Numero CNH", type: "text", audience: "employee" },
      {
        key: "categoria_cnh",
        label: "Categoria CNH",
        type: "select",
        audience: "employee",
        options: buildOptions(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"]),
      },
      { key: "validade_cnh", label: "Validade CNH", type: "date", audience: "employee" },
    ],
  },
  {
    id: "informacoes-adicionais-funcionario",
    title: "Informacoes adicionais",
    description: "Dados extras que o funcionario pode preencher antes da revisao do cliente.",
    audience: "employee",
    fields: [
      { key: "possui_residencia_propria", label: "Possui residencia propria", type: "checkbox", audience: "employee" },
      { key: "imovel_fgts", label: "Imovel adquirido com recurso do FGTS", type: "checkbox", audience: "employee" },
      { key: "cnpj_vinculo_anterior", label: "CNPJ vinculo anterior", type: "text", audience: "employee" },
      { key: "matricula_anterior", label: "Matricula vinculo anterior", type: "text", audience: "employee" },
      { key: "data_inicio_vinculo_anterior", label: "Data inicio vinculo anterior", type: "date", audience: "employee" },
      { key: "data_fim_vinculo_anterior", label: "Data fim vinculo anterior", type: "date", audience: "employee" },
      { key: "inicio_aposentadoria", label: "Inicio aposentadoria", type: "date", audience: "employee" },
      { key: "motivo_aposentadoria", label: "Motivo aposentadoria", type: "text", audience: "employee" },
      { key: "isencao_molestia_grave", label: "Isencao de molestia grave", type: "textarea", audience: "employee" },
    ],
  },
  {
    id: "dados-contratuais-cliente",
    title: "Dados contratuais",
    description: "Campos preenchidos pelo cliente apos o retorno do funcionario.",
    audience: "client",
    fields: [
      { key: "data_admissao", label: "Data admissao", type: "date", audience: "client", requiredForExport: true },
      { key: "indicativo_admissao", label: "Indicativo admissao", type: "select", audience: "client", options: indicativoAdmissaoOptions, requiredForExport: true },
      { key: "sindicato", label: "Sindicato representante", type: "select", audience: "client", requiredForExport: true },
      { key: "tipo_tributacao_sindical", label: "Tipo tributacao sindical", type: "select", audience: "client", options: tipoTributacaoSindicalOptions, requiredForExport: true },
      { key: "categoria_normativa", label: "Categoria normativa vinculada", type: "text", audience: "client" },
      { key: "tipo_contrato", label: "Tipo de contrato", type: "select", audience: "client", options: tipoContratoOptions, requiredForExport: true },
      { key: "caged", label: "Situacao Caged entrada", type: "select", audience: "client", options: cagedOptions, requiredForExport: true },
      { key: "forma_pagamento", label: "Forma de pagamento", type: "select", audience: "client", options: formaPagamentoOptions },
      { key: "tipo_pagamento", label: "Tipo de pagamento", type: "select", audience: "client", options: tipoPagamentoOptions },
      { key: "salario", label: "Salario", type: "number", audience: "client", requiredForExport: true },
      { key: "cargo", label: "Cargo", type: "select", audience: "client", requiredForExport: true },
      { key: "regime_jornada", label: "Regime de jornada", type: "select", audience: "client", options: regimeJornadaOptions, requiredForExport: true },
      { key: "grau_risco", label: "Grau de risco", type: "select", audience: "client", options: grauRiscoOptions, requiredForExport: true },
      { key: "horas_semanais", label: "Horas semanais", type: "text", audience: "client", placeholder: "44.00" },
      { key: "horas_mensais", label: "Horas mensais", type: "text", audience: "client", placeholder: "220.00" },
      { key: "experiencia_qtde_dias", label: "Qtde. dias experiencia", type: "number", audience: "client" },
      { key: "experiencia_termino", label: "Termino experiencia", type: "date", audience: "client" },
      { key: "experiencia_qtde_dias_prorrogacao", label: "Qtde. dias prorrogacao", type: "number", audience: "client" },
      { key: "experiencia_termino_prorrogacao", label: "Termino prorrogacao", type: "date", audience: "client" },
      { key: "horario", label: "Horario", type: "select", audience: "client" },
      { key: "vinculo_empregaticio", label: "Vinculo empregaticio", type: "select", audience: "client", options: vinculoEmpregaticioOptions, requiredForExport: true },
    ],
  },
  {
    id: "lotacao-e-exames-cliente",
    title: "Lotacao e exames",
    description: "Informacoes operacionais da empresa e do exame medico.",
    audience: "client",
    fields: [
      { key: "local", label: "Local", type: "text", audience: "client" },
      { key: "departamento", label: "Departamento", type: "text", audience: "client" },
      { key: "setor", label: "Setor", type: "text", audience: "client" },
      { key: "secao", label: "Secao", type: "text", audience: "client" },
      { key: "data_exame_medico", label: "Data exame medico", type: "date", audience: "client" },
      { key: "validade_exame_medico", label: "Validade exame medico (meses)", type: "number", audience: "client" },
      { key: "data_saida", label: "Data de saida", type: "date", audience: "client" },
      { key: "registro_funcionario", label: "Registro de funcionario", type: "text", audience: "client" },
      { key: "folha_ficha", label: "Folha/Ficha", type: "text", audience: "client" },
      { key: "chapa", label: "Chapa", type: "text", audience: "client" },
    ],
  },
  {
    id: "dados-bancarios-fgts-cliente",
    title: "Banco e FGTS",
    description: "Campos complementares de fechamento preenchidos pelo cliente.",
    audience: "client",
    fields: [
      { key: "banco", label: "Banco", type: "text", audience: "client" },
      { key: "agencia", label: "Agencia", type: "text", audience: "client" },
      { key: "tipo_conta", label: "Tipo da conta", type: "select", audience: "client", options: tipoContaOptions },
      { key: "numero_conta", label: "Numero da conta", type: "text", audience: "client" },
      { key: "antecipar_indenizacao_fgts", label: "Antecipar indenizacao do FGTS", type: "checkbox", audience: "client" },
    ],
  },
]

export const defaultFormValues = formSections.reduce<Record<string, string | boolean>>(
  (accumulator, section) => {
    section.fields.forEach((field) => {
      accumulator[field.key] = field.type === "checkbox" ? false : ""
    })

    return accumulator
  },
  {
    status: "rascunho_interno",
    aprovado_para_integracao: false,
    convite_email: "",
  }
)

export function getSectionsForAudience(audience: FieldAudience) {
  return formSections.filter((section) => section.audience === audience)
}

export const requiredExportFields: RequiredExportField[] = formSections.flatMap((section) =>
  section.fields
    .filter((field) => field.requiredForExport)
    .map((field) => ({
      key: field.key,
      label: field.label,
    }))
)
