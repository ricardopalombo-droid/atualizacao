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

const countries = [
  "Brasil",
  "Argentina",
  "Bolívia",
  "Chile",
  "Colômbia",
  "Paraguai",
  "Peru",
  "Portugal",
  "Uruguai",
  "Venezuela",
  "Estados Unidos",
  "Espanha",
  "Itália",
  "Alemanha",
  "Japão",
  "China",
]

const countryOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  ...countries.map((country) => ({ label: country, value: country })),
]

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

const stateOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  ...brazilStates.map((state) => ({ label: state, value: state })),
]

const naturalityOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "São José dos Campos - SP", value: "São José dos Campos - SP" },
  { label: "Campinas - SP", value: "Campinas - SP" },
  { label: "São Paulo - SP", value: "São Paulo - SP" },
  { label: "Taubaté - SP", value: "Taubaté - SP" },
  { label: "Jacareí - SP", value: "Jacareí - SP" },
  { label: "Rio de Janeiro - RJ", value: "Rio de Janeiro - RJ" },
  { label: "Belo Horizonte - MG", value: "Belo Horizonte - MG" },
  { label: "Salvador - BA", value: "Salvador - BA" },
  { label: "Curitiba - PR", value: "Curitiba - PR" },
  { label: "Porto Alegre - RS", value: "Porto Alegre - RS" },
]

const sexoOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "1 - Masculino", value: "1 - Masculino" },
  { label: "2 - Feminino", value: "2 - Feminino" },
]

const racaCorOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "1 - Branca", value: "1 - Branca" },
  { label: "2 - Preta", value: "2 - Preta" },
  { label: "3 - Parda", value: "3 - Parda" },
  { label: "4 - Amarela", value: "4 - Amarela" },
  { label: "5 - Indígena", value: "5 - Indígena" },
  { label: "6 - Não informado", value: "6 - Não informado" },
]

const estadoCivilOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "1 - Solteiro", value: "1 - Solteiro" },
  { label: "2 - Casado", value: "2 - Casado" },
  { label: "3 - Divorciado", value: "3 - Divorciado" },
  { label: "4 - Separado", value: "4 - Separado" },
  { label: "5 - Viúvo", value: "5 - Viúvo" },
]

const grauInstrucaoOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "01 - Analfabeto, inclusive o que, embora tenha recebido instrução, não se alfabetizou", value: "01" },
  { label: "02 - Até o 5º ano incompleto do ensino fundamental", value: "02" },
  { label: "03 - 5º ano completo do ensino fundamental", value: "03" },
  { label: "04 - Do 6º ao 9º ano do ensino fundamental incompleto", value: "04" },
  { label: "05 - Ensino fundamental completo", value: "05" },
  { label: "06 - Ensino médio incompleto", value: "06" },
  { label: "07 - Ensino médio completo", value: "07" },
  { label: "08 - Educação superior incompleta", value: "08" },
  { label: "09 - Educação superior completa", value: "09" },
  { label: "10 - Pós-graduação completa", value: "10" },
  { label: "11 - Mestrado completo", value: "11" },
  { label: "12 - Doutorado completo", value: "12" },
]

const tipoContaOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "1 - Corrente", value: "1 - Corrente" },
  { label: "2 - Poupança", value: "2 - Poupança" },
  { label: "3 - Salário", value: "3 - Salário" },
]

const tipoContratoOptions: FieldOption[] = [
  { label: "Selecione", value: "" },
  { label: "1 - Prazo indeterminado", value: "1 - Prazo indeterminado" },
  { label: "2 - Prazo determinado, definido em dias", value: "2 - Prazo determinado, definido em dias" },
  { label: "3 - Prazo determinado, vinculado a fato", value: "3 - Prazo determinado, vinculado a fato" },
  { label: "4 - Prazo determinado sem cláusula assecuratória", value: "4 - Prazo determinado sem cláusula assecuratória" },
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
  preenchido_funcionario: "Preenchido pelo funcionário",
  em_revisao_cliente: "Em revisão do cliente",
  finalizado: "Finalizado",
  exportado: "Exportado",
}

export const formSections: FormSection[] = [
  {
    id: "dados-pessoais-funcionario",
    title: "Dados pessoais",
    description: "Campos liberados no link enviado ao funcionário.",
    audience: "employee",
    fields: [
      { key: "nome_completo", label: "Nome completo", type: "text", audience: "employee", requiredForExport: true },
      { key: "nome_social", label: "Nome social", type: "text", audience: "employee" },
      { key: "nome_mae", label: "Nome da mãe", type: "text", audience: "employee", requiredForExport: true },
      { key: "nome_pai", label: "Nome do pai", type: "text", audience: "employee" },
      { key: "email", label: "E-mail", type: "email", audience: "employee" },
      { key: "telefone", label: "Telefone", type: "text", audience: "employee" },
      { key: "celular", label: "Celular", type: "text", audience: "employee" },
      { key: "data_nascimento", label: "Data de nascimento", type: "date", audience: "employee", requiredForExport: true },
      { key: "pais_origem", label: "País de origem", type: "select", audience: "employee", options: countryOptions },
      { key: "naturalidade", label: "Naturalidade", type: "select", audience: "employee", options: naturalityOptions },
      {
        key: "sexo",
        label: "Sexo",
        type: "select",
        audience: "employee",
        options: sexoOptions,
      },
      { key: "raca_cor", label: "Raça/Cor", type: "select", audience: "employee", options: racaCorOptions },
      { key: "estado_civil", label: "Estado civil", type: "select", audience: "employee", options: estadoCivilOptions },
      { key: "tipo_sanguineo", label: "Tipo sanguíneo", type: "text", audience: "employee" },
      { key: "nacionalidade", label: "Nacionalidade", type: "select", audience: "employee", options: countryOptions },
      { key: "grau_instrucao", label: "Grau de instrução", type: "select", audience: "employee", options: grauInstrucaoOptions },
      { key: "deficiencia_tipo", label: "Deficiência (tipo)", type: "text", audience: "employee" },
    ],
  },
  {
    id: "endereco-funcionario",
    title: "Endereço",
    description: "Endereço principal do funcionário para compor a planilha final.",
    audience: "employee",
    fields: [
      { key: "cep", label: "CEP", type: "text", audience: "employee", placeholder: "12239-036", requiredForExport: true },
      { key: "logradouro", label: "Logradouro", type: "text", audience: "employee", requiredForExport: true },
      { key: "numero", label: "Número", type: "text", audience: "employee" },
      { key: "complemento", label: "Complemento", type: "text", audience: "employee" },
      { key: "bairro", label: "Bairro", type: "text", audience: "employee" },
      { key: "cidade", label: "Cidade", type: "text", audience: "employee", requiredForExport: true },
      { key: "uf", label: "UF", type: "select", audience: "employee", options: stateOptions, requiredForExport: true },
    ],
  },
  {
    id: "documentos-funcionario",
    title: "Documentos oficiais",
    description: "Documentos que o próprio funcionário costuma informar no cadastro inicial.",
    audience: "employee",
    fields: [
      { key: "cpf", label: "CPF", type: "text", audience: "employee", requiredForExport: true },
      { key: "pis", label: "PIS", type: "text", audience: "employee", requiredForExport: true },
      { key: "titulo_eleitor", label: "Título de eleitor", type: "text", audience: "employee" },
      { key: "ctps_numero", label: "Número CTPS", type: "text", audience: "employee", requiredForExport: true },
      { key: "ctps_serie", label: "Série CTPS", type: "text", audience: "employee" },
      { key: "ctps_uf", label: "UF CTPS", type: "text", audience: "employee" },
      { key: "rg_numero", label: "RG", type: "text", audience: "employee", requiredForExport: true },
      { key: "rg_orgao_emissor", label: "Órgão emissor RG", type: "text", audience: "employee" },
      { key: "uf_rg", label: "UF do RG", type: "select", audience: "employee", options: stateOptions },
      { key: "rg_data_expedicao", label: "Data expedição RG", type: "date", audience: "employee" },
      { key: "cnh_numero", label: "Número CNH", type: "text", audience: "employee" },
      {
        key: "categoria_cnh",
        label: "Categoria CNH",
        type: "select",
        audience: "employee",
        options: [
          { label: "Selecione", value: "" },
          { label: "A", value: "A" },
          { label: "B", value: "B" },
          { label: "C", value: "C" },
          { label: "D", value: "D" },
          { label: "E", value: "E" },
          { label: "AB", value: "AB" },
          { label: "AC", value: "AC" },
          { label: "AD", value: "AD" },
          { label: "AE", value: "AE" },
        ],
      },
      { key: "validade_cnh", label: "Validade CNH", type: "date", audience: "employee" },
    ],
  },
  {
    id: "informacoes-adicionais-funcionario",
    title: "Informações adicionais",
    description: "Dados extras que o funcionário pode preencher antes da revisão do cliente.",
    audience: "employee",
    fields: [
      { key: "possui_residencia_propria", label: "Possui residência própria", type: "checkbox", audience: "employee" },
      { key: "imovel_fgts", label: "Imóvel adquirido com recurso do FGTS", type: "checkbox", audience: "employee" },
      { key: "cnpj_vinculo_anterior", label: "CNPJ vínculo anterior", type: "text", audience: "employee" },
      { key: "matricula_anterior", label: "Matrícula vínculo anterior", type: "text", audience: "employee" },
      { key: "data_inicio_vinculo_anterior", label: "Data início vínculo anterior", type: "date", audience: "employee" },
      { key: "data_fim_vinculo_anterior", label: "Data fim vínculo anterior", type: "date", audience: "employee" },
      { key: "inicio_aposentadoria", label: "Início aposentadoria", type: "date", audience: "employee" },
      { key: "motivo_aposentadoria", label: "Motivo aposentadoria", type: "text", audience: "employee" },
      { key: "isencao_molestia_grave", label: "Isenção de moléstia grave", type: "textarea", audience: "employee" },
    ],
  },
  {
    id: "dados-contratuais-cliente",
    title: "Dados contratuais",
    description: "Campos preenchidos pelo cliente após o retorno do funcionário.",
    audience: "client",
    fields: [
      { key: "data_admissao", label: "Data admissão", type: "date", audience: "client", requiredForExport: true },
      { key: "sindicato", label: "Sindicato representante", type: "text", audience: "client", requiredForExport: true },
      { key: "categoria_normativa", label: "Categoria normativa vinculada", type: "text", audience: "client" },
      {
        key: "tipo_contrato",
        label: "Tipo de contrato",
        type: "select",
        audience: "client",
        options: tipoContratoOptions,
        requiredForExport: true,
      },
      { key: "salario", label: "Salário", type: "number", audience: "client", requiredForExport: true },
      { key: "cargo", label: "Função", type: "text", audience: "client", requiredForExport: true },
      { key: "cbo", label: "CBO", type: "text", audience: "client", requiredForExport: true },
      { key: "horas_semanais", label: "Horas semanais", type: "number", audience: "client" },
      { key: "horas_mensais", label: "Horas mensais", type: "number", audience: "client" },
      { key: "horario", label: "Horário", type: "text", audience: "client" },
      { key: "data_alteracao_cargo", label: "Data alteração do cargo", type: "date", audience: "client" },
    ],
  },
  {
    id: "lotacao-e-exames-cliente",
    title: "Lotação e exames",
    description: "Informações operacionais da empresa e do exame médico.",
    audience: "client",
    fields: [
      { key: "local", label: "Local", type: "text", audience: "client" },
      { key: "departamento", label: "Departamento", type: "text", audience: "client" },
      { key: "setor", label: "Setor", type: "text", audience: "client" },
      { key: "secao", label: "Seção", type: "text", audience: "client" },
      { key: "data_exame_medico", label: "Data exame médico", type: "date", audience: "client" },
      { key: "validade_exame_medico", label: "Validade exame médico (meses)", type: "number", audience: "client" },
      { key: "data_saida", label: "Data de saída", type: "date", audience: "client" },
      { key: "registro_funcionario", label: "Registro de funcionário", type: "text", audience: "client" },
      { key: "folha_ficha", label: "Folha/Ficha", type: "text", audience: "client" },
      { key: "grau_risco", label: "Grau de risco", type: "text", audience: "client" },
      { key: "caged", label: "CAGED", type: "text", audience: "client" },
    ],
  },
  {
    id: "dados-bancarios-esocial-cliente",
    title: "Banco, FGTS e eSocial",
    description: "Campos complementares de fechamento preenchidos pelo cliente.",
    audience: "client",
    fields: [
      { key: "banco", label: "Banco", type: "text", audience: "client" },
      { key: "agencia", label: "Agência", type: "text", audience: "client" },
      {
        key: "tipo_conta",
        label: "Tipo da conta",
        type: "select",
        audience: "client",
        options: tipoContaOptions,
      },
      { key: "numero_conta", label: "Número da conta", type: "text", audience: "client" },
      { key: "evento_esocial", label: "Evento eSocial", type: "text", audience: "client" },
      { key: "matricula_esocial", label: "Matrícula eSocial", type: "text", audience: "client" },
      { key: "operacao_esocial", label: "Operação eSocial", type: "text", audience: "client" },
      { key: "status_esocial", label: "Status eSocial", type: "text", audience: "client" },
      { key: "numero_recibo_esocial", label: "Número recibo eSocial", type: "text", audience: "client" },
      { key: "numero_protocolo_esocial", label: "Número protocolo eSocial", type: "text", audience: "client" },
      { key: "antecipar_indenizacao_fgts", label: "Antecipar indenização do FGTS", type: "checkbox", audience: "client" },
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
