import { buildContmaticImportPackage } from "../lib/contmatic-import-package"
import { requiredExportFields } from "../lib/employee-form-config"

async function main() {
  const payload = Object.fromEntries(requiredExportFields.map((field) => [field.key, "1"]))
  Object.assign(payload, {
  registro_funcionario: "3",
  nome_completo: "FUNCIONARIO DE TESTE",
  data_nascimento: "2000-01-01",
  data_admissao: "2026-11-03",
  pais: "Brasil",
  pais_origem: "Brasil",
  cidade: "São José dos Campos",
  uf: "SP",
  naturalidade: "São Paulo - SP",
  cpf: "12345678901",
  ctps_digital: true,
  ctps_uf: "SP",
  matricula_esocial: "21633",
  pis: "12345678901",
  horas_semanais: "44.00",
  // A tela pode não persistir o valor calculado; o pacote deve derivar 44 × 5.
  horas_mensais: "",
  salario: "2000.00",
  cnh_numero: "01019312457",
  uf_cnh: "SP",
  horario: "1",
  })

  const result = await buildContmaticImportPackage({
    full_payload: payload,
    dependents: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        relationship_name: "DEPENDENTE DE TESTE",
        cpf: "98765432100",
        relationship_degree: "1 - Filho(a) válido",
        birth_date: "2017-12-21",
        registry_delivery_date: "2026-11-03",
        full_payload: {
          rg: "123456789",
          naturality: "São José dos Campos - SP",
          registryOffice: "CARTORIO TESTE",
          registryNumber: "12345",
          bookNumber: "A1",
          sheetNumber: "10",
          situationStartDate: "2026-11-03",
          situationMotive: "Admissão",
          irrf: true,
          familySalary: true,
          alimony: false,
          healthPlan: false,
        },
      },
    ],
  } as never, "2163")
  const funcLine = result.employeeSql
  .split(/\r?\n/)
  .find((line) => line.startsWith("INSERT INTO public.func ("))

  if (!funcLine) throw new Error("A linha FUNC não foi gerada.")

  const match = funcLine.match(/^INSERT INTO public\.func \((.*?)\) VALUES \((.*)\);$/)
  if (!match) throw new Error("A linha FUNC não pôde ser analisada.")

  const columns = match[1].split(/,\s*/)
  const values = Array.from(match[2].matchAll(/(?:NULL|'(?:''|[^'])*')(?=,|$)/g), (item) => item[0])
  const valueOf = (column: string) => values[columns.indexOf(column)]

  const expected = {
  qtdehsmensal: "'220'",
  qtdehssemana: "'44'",
  partcipa: "'false'",
  qtdedepsalfam: "'1'",
  qtdedepirrf: "'1'",
  codhorario: "'1'",
  cpf: "'123.456.789-01'",
  ctpsserieuf: "'1234567'",
  }

  const funcaux2Line = result.employeeSql
  .split(/\r?\n/)
  .find((line) => line.startsWith("INSERT INTO public.funcaux2 ("))
  if (!funcaux2Line) throw new Error("A linha FUNCAUX2 não foi gerada.")
  if (!funcaux2Line.includes("'3549904'") || !funcaux2Line.includes("'3550308'")) {
    throw new Error("Os códigos IBGE esperados não foram gerados.")
  }

  const funcaux1Line = result.employeeSql
    .split(/\r?\n/)
    .find((line) => line.startsWith("INSERT INTO public.funcaux1 ("))
  if (!funcaux1Line?.includes("'8901', 'SP'")) {
    throw new Error("A série ou a UF da CTPS digital não foi gerada corretamente.")
  }

  if (!result.employeeSql.includes("INSERT INTO public.histsind ")) {
    throw new Error("O histórico sindical não foi gerado.")
  }

  const dependentChecks = [
    "INSERT INTO public.depfun ",
    "INSERT INTO public.depenaux ",
    "INSERT INTO public.dephistf ",
    "dephistf_int1",
    "dephistf_str1",
    "dephistf_float1",
    "dephistf_date1",
    "dephistf_bool1",
    "'DEPENDENTE DE TESTE'",
    "'987.654.321-00'",
    "'123456789'",
  ]

  for (const expectedText of dependentChecks) {
    if (!result.employeeSql.includes(expectedText)) {
      throw new Error(`O conteúdo esperado do dependente não foi gerado: ${expectedText}.`)
    }
  }

  for (const [column, expectedValue] of Object.entries(expected)) {
    const actualValue = valueOf(column)
    if (actualValue !== expectedValue) {
      throw new Error(`FUNC.${column}: esperado ${expectedValue}, gerado ${actualValue}.`)
    }
  }

  const sqlLineCount = result.employeeSql.trim().split(/\r?\n/).length
  if (sqlLineCount !== 15) {
    throw new Error(`Esperadas 15 linhas SQL com um dependente, mas foram geradas ${sqlLineCount}.`)
  }

  const packageWithoutDependents = await buildContmaticImportPackage({
    full_payload: payload,
    dependents: [],
  } as never, "2163")
  const sqlLinesWithoutDependents = packageWithoutDependents.employeeSql.trim().split(/\r?\n/)
  if (sqlLinesWithoutDependents.length !== 12 || packageWithoutDependents.employeeSql.includes("public.depfun")) {
    throw new Error("O pacote sem dependentes sofreu alteração indevida.")
  }

  console.log(`Pacote validado: ${sqlLineCount} linhas SQL, incluindo um dependente.`)
}

void main()
