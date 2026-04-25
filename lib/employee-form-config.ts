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

function buildOptions(values: readonly string[]): FieldOption[] {
  return [{ label: "Selecione", value: "" }, ...values.map((value) => ({ label: value, value }))]
}

const countries = [
  "Brasil",
  "Afeganistao",
  "Africa do Sul",
  "Alemanha",
  "Angola",
  "Arabia Saudita",
  "Argentina",
  "Australia",
  "Belgica",
  "Bolivia",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Coreia do Sul",
  "Costa Rica",
  "Cuba",
  "Dinamarca",
  "Egito",
  "El Salvador",
  "Emirados Arabes Unidos",
  "Equador",
  "Espanha",
  "Estados Unidos",
  "Franca",
  "Grecia",
  "Guatemala",
  "Guine-Bissau",
  "Holanda",
  "India",
  "Inglaterra",
  "Irlanda",
  "Israel",
  "Italia",
  "Japao",
  "Mexico",
  "Mocambique",
  "Noruega",
  "Nova Zelandia",
  "Paraguai",
  "Peru",
  "Portugal",
  "Reino Unido",
  "Republica Dominicana",
  "Russia",
  "Senegal",
  "Suecia",
  "Suica",
  "Uruguai",
  "Venezuela",
]

const countryOptions = buildOptions(countries)

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

const brazilCityOptions = buildOptions([
  "Aracaju - SE",
  "Bauru - SP",
  "Belem - PA",
  "Belo Horizonte - MG",
  "Blumenau - SC",
  "Boa Vista - RR",
  "Brasilia - DF",
  "Campinas - SP",
  "Campo Grande - MS",
  "Caxias do Sul - RS",
  "Contagem - MG",
  "Cuiaba - MT",
  "Curitiba - PR",
  "Feira de Santana - BA",
  "Florianopolis - SC",
  "Fortaleza - CE",
  "Foz do Iguacu - PR",
  "Goiania - GO",
  "Guarulhos - SP",
  "Joao Pessoa - PB",
  "Joinville - SC",
  "Juiz de Fora - MG",
  "Londrina - PR",
  "Macapa - AP",
  "Maceio - AL",
  "Manaus - AM",
  "Maringa - PR",
  "Maua - SP",
  "Natal - RN",
  "Niteroi - RJ",
  "Osasco - SP",
  "Palmas - TO",
  "Petropolis - RJ",
  "Piracicaba - SP",
  "Ponta Grossa - PR",
  "Porto Alegre - RS",
  "Porto Velho - RO",
  "Praia Grande - SP",
  "Recife - PE",
  "Ribeirao Preto - SP",
  "Rio Branco - AC",
  "Rio de Janeiro - RJ",
  "Salvador - BA",
  "Santo Andre - SP",
  "Santos - SP",
  "Sao Bernardo do Campo - SP",
  "Sao Goncalo - RJ",
  "Sao Jose do Rio Preto - SP",
  "Sao Jose dos Campos - SP",
  "Sao Luis - MA",
  "Sao Paulo - SP",
  "Sorocaba - SP",
  "Taubate - SP",
  "Teresina - PI",
  "Uberlandia - MG",
  "Vila Velha - ES",
  "Vitoria - ES",
  "Volta Redonda - RJ",
])

const sexoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Masculino", value: "1 - Masculino" },
  { label: "2 - Feminino", value: "2 - Feminino" },
]

const racaCorOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Branca", value: "1 - Branca" },
  { label: "2 - Preta", value: "2 - Preta" },
  { label: "3 - Parda", value: "3 - Parda" },
  { label: "4 - Amarela", value: "4 - Amarela" },
  { label: "5 - Indigena", value: "5 - Indigena" },
  { label: "6 - Nao informado", value: "6 - Nao informado" },
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
  { label: "01 - Analfabeto", value: "01" },
  { label: "02 - Ate o 5o ano incompleto do ensino fundamental", value: "02" },
  { label: "03 - 5o ano completo do ensino fundamental", value: "03" },
  { label: "04 - 6o ao 9o ano incompleto do ensino fundamental", value: "04" },
  { label: "05 - Ensino fundamental completo", value: "05" },
  { label: "06 - Ensino medio incompleto", value: "06" },
  { label: "07 - Ensino medio completo", value: "07" },
  { label: "08 - Educacao superior incompleta", value: "08" },
  { label: "09 - Educacao superior completa", value: "09" },
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
    label: "99 - Empregadores cuja atividade nao exponha seus trabalhadores a agentes nocivos",
    value: "99 - Empregadores cuja atividade nao exponha seus trabalhadores a agentes nocivos",
  },
]

const indicativoAdmissaoOptions = [
  { label: "Selecione", value: "" },
  { label: "1 - Normal", value: "1 - Normal" },
  { label: "2 - Decorrente de acao fiscal", value: "2 - Decorrente de acao fiscal" },
  { label: "3 - Decorrente de decisao judicial", value: "3 - Decorrente de decisao judicial" },
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
      { key: "pais_origem", label: "Pais de origem", type: "select", audience: "employee", options: countryOptions },
      { key: "naturalidade", label: "Naturalidade", type: "select", audience: "employee", options: brazilCityOptions },
      { key: "sexo", label: "Sexo", type: "select", audience: "employee", options: sexoOptions },
      { key: "raca_cor", label: "Raca/Cor", type: "select", audience: "employee", options: racaCorOptions },
      { key: "estado_civil", label: "Estado civil", type: "select", audience: "employee", options: estadoCivilOptions },
      { key: "tipo_sanguineo", label: "Tipo sanguineo", type: "text", audience: "employee" },
      { key: "nacionalidade", label: "Nacionalidade", type: "select", audience: "employee", options: countryOptions },
      { key: "grau_instrucao", label: "Grau de instrucao", type: "select", audience: "employee", options: grauInstrucaoOptions },
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
      { key: "ctps_numero", label: "Numero CTPS", type: "text", audience: "employee", requiredForExport: true },
      { key: "ctps_serie", label: "Serie CTPS", type: "text", audience: "employee" },
      { key: "ctps_uf", label: "UF CTPS", type: "text", audience: "employee" },
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
      { key: "indicativo_admissao", label: "Indicativo de admissao", type: "select", audience: "client", options: indicativoAdmissaoOptions },
      { key: "sindicato", label: "Sindicato representante", type: "text", audience: "client", requiredForExport: true },
      { key: "categoria_normativa", label: "Categoria normativa vinculada", type: "text", audience: "client" },
      { key: "tipo_contrato", label: "Tipo de contrato", type: "select", audience: "client", options: tipoContratoOptions, requiredForExport: true },
      { key: "salario", label: "Salario", type: "number", audience: "client", requiredForExport: true },
      { key: "cargo", label: "Funcao", type: "text", audience: "client", requiredForExport: true },
      { key: "cbo", label: "CBO", type: "text", audience: "client", requiredForExport: true },
      { key: "horas_semanais", label: "Horas semanais", type: "text", audience: "client", placeholder: "44.00" },
      { key: "horas_mensais", label: "Horas mensais", type: "text", audience: "client", placeholder: "220.00" },
      { key: "horario", label: "Horario", type: "text", audience: "client" },
      { key: "data_alteracao_cargo", label: "Data alteracao do cargo", type: "date", audience: "client" },
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
      { key: "grau_risco", label: "Grau de risco", type: "select", audience: "client", options: grauRiscoOptions },
      { key: "caged", label: "CAGED", type: "select", audience: "client", options: cagedOptions },
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
