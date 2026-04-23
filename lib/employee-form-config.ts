export type FieldType = "text" | "date" | "number" | "email" | "select" | "textarea" | "checkbox"

export type FieldOption = {
  label: string
  value: string
}

export type FormField = {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: FieldOption[]
}

export type FormSection = {
  id: string
  title: string
  description: string
  fields: FormField[]
}

export const formSections: FormSection[] = [
  {
    id: "dados-cadastrais",
    title: "Dados cadastrais",
    description: "Informações pessoais, endereço e dados básicos do colaborador.",
    fields: [
      { key: "nome_completo", label: "Nome completo", type: "text" },
      { key: "nome_mae", label: "Nome da mãe", type: "text" },
      { key: "nome_pai", label: "Nome do pai", type: "text" },
      { key: "cep", label: "CEP", type: "text", placeholder: "12239-036" },
      { key: "logradouro", label: "Logradouro", type: "text" },
      { key: "numero", label: "Número", type: "text" },
      { key: "complemento", label: "Complemento", type: "text" },
      { key: "bairro", label: "Bairro", type: "text" },
      { key: "cidade", label: "Cidade", type: "text" },
      { key: "uf", label: "UF", type: "text", placeholder: "SP" },
      { key: "email", label: "E-mail", type: "email" },
      { key: "email_alternativo", label: "E-mail alternativo", type: "email" },
      { key: "telefone", label: "Telefone", type: "text" },
      { key: "celular", label: "Celular", type: "text" },
      {
        key: "sexo",
        label: "Sexo",
        type: "select",
        options: [
          { label: "Selecione", value: "" },
          { label: "Feminino", value: "feminino" },
          { label: "Masculino", value: "masculino" },
          { label: "Outro", value: "outro" },
        ],
      },
      { key: "data_nascimento", label: "Data de nascimento", type: "date" },
      { key: "naturalidade", label: "Naturalidade", type: "text" },
    ],
  },
  {
    id: "dados-contratuais",
    title: "Dados contratuais",
    description: "Informações sindicais, salariais e de admissão.",
    fields: [
      { key: "sindicato", label: "Sindicato", type: "text" },
      { key: "tipo_tributacao", label: "Tipo de tributação", type: "text" },
      { key: "matricula_filiacao", label: "Matrícula filiação", type: "text" },
      { key: "forma_pagamento", label: "Forma de pagamento", type: "text" },
      { key: "tipo_contrato", label: "Tipo de contrato", type: "text" },
      { key: "salario", label: "Salário", type: "number" },
      { key: "horas_semanais", label: "Horas semanais", type: "number" },
      { key: "horas_mensais", label: "Horas mensais", type: "number" },
      { key: "data_termino", label: "Término do contrato", type: "date" },
      { key: "cargo", label: "Cargo", type: "text" },
      { key: "horario", label: "Horário", type: "text" },
    ],
  },
  {
    id: "documentos-oficiais",
    title: "Documentos oficiais",
    description: "Documentos pessoais obrigatórios para cadastro.",
    fields: [
      { key: "cpf", label: "CPF", type: "text" },
      { key: "pis", label: "PIS", type: "text" },
      { key: "titulo_eleitor", label: "Título de eleitor", type: "text" },
      { key: "ctps_numero", label: "Número CTPS", type: "text" },
      { key: "ctps_serie", label: "Série CTPS", type: "text" },
      { key: "ctps_uf", label: "UF CTPS", type: "text" },
      { key: "rg_numero", label: "RG", type: "text" },
      { key: "rg_orgao_emissor", label: "Órgão emissor RG", type: "text" },
      { key: "rg_data_expedicao", label: "Data expedição RG", type: "date" },
      { key: "cnh_numero", label: "CNH", type: "text" },
    ],
  },
  {
    id: "outros",
    title: "Outros",
    description: "Informações adicionais para o cadastro.",
    fields: [
      { key: "nome_social", label: "Nome social", type: "text" },
      { key: "possui_residencia_propria", label: "Possui residência própria", type: "checkbox" },
      { key: "imovel_fgts", label: "Imóvel adquirido com recurso do FGTS", type: "checkbox" },
      { key: "cnpj_vinculo_anterior", label: "CNPJ vínculo anterior", type: "text" },
      { key: "matricula_anterior", label: "Matrícula anterior", type: "text" },
      { key: "inicio_aposentadoria", label: "Início aposentadoria", type: "date" },
      { key: "motivo_aposentadoria", label: "Motivo aposentadoria", type: "text" },
      { key: "isencao_molestia_grave", label: "Isenção de moléstia grave", type: "textarea" },
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
    status: "rascunho",
    aprovado_para_integracao: false,
  }
)
