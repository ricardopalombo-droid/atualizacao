import { buildContmaticImportPackage } from "../lib/contmatic-import-package"
import { requiredExportFields } from "../lib/employee-form-config"

const payload = Object.fromEntries(requiredExportFields.map((field) => [field.key, "1"]))
Object.assign(payload, {
  registro_funcionario: "3",
  nome_completo: "FUNCIONARIO DE TESTE",
  data_nascimento: "2000-01-01",
  data_admissao: "2026-11-03",
  pais: "Brasil",
  pais_origem: "Brasil",
  cpf: "12345678901",
  pis: "12345678901",
  horas_semanais: "44.00",
  horas_mensais: "220.00",
  salario: "2000.00",
  cnh_numero: "01019312457",
  uf_cnh: "SP",
  horario: "1",
})

const result = buildContmaticImportPackage({ full_payload: payload } as never, "2163")
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
  qtdedepsalfam: "'0'",
  qtdedepirrf: "'0'",
  codhorario: "'1'",
}

for (const [column, expectedValue] of Object.entries(expected)) {
  const actualValue = valueOf(column)
  if (actualValue !== expectedValue) {
    throw new Error(`FUNC.${column}: esperado ${expectedValue}, gerado ${actualValue}.`)
  }
}

console.log(`Pacote validado: ${result.employeeSql.trim().split(/\r?\n/).length} linhas SQL.`)
