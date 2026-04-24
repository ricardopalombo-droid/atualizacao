import * as XLSX from "xlsx"
import {
  buildDependentSheetRows,
  buildEmployeeSheetRow,
  dependentSheetHeaders,
  employeeSheetHeaders,
} from "@/lib/planilha-model"

function orderRow(headers: readonly string[], row: Record<string, string>) {
  return headers.reduce<Record<string, string>>((accumulator, header) => {
    accumulator[header] = row[header] ?? ""
    return accumulator
  }, {})
}

export function exportEmployeeWorkbook(data: Record<string, unknown>) {
  const workbook = XLSX.utils.book_new()

  const employeeRow = orderRow(employeeSheetHeaders, buildEmployeeSheetRow(data))
  const dependentRows = buildDependentSheetRows(
    Array.isArray(data.dependentes) ? (data.dependentes as Array<Record<string, unknown>>) : undefined
  ).map((row) => orderRow(dependentSheetHeaders, row))

  const employeeWorksheet = XLSX.utils.json_to_sheet([employeeRow], {
    header: [...employeeSheetHeaders],
  })
  const dependentWorksheet = XLSX.utils.json_to_sheet(dependentRows, {
    header: [...dependentSheetHeaders],
  })

  XLSX.utils.book_append_sheet(workbook, employeeWorksheet, "Relação de Funcionários Gerais")
  XLSX.utils.book_append_sheet(workbook, dependentWorksheet, "Relação de Dependentes")

  const fileNameBase =
    typeof data.nome_completo === "string" && data.nome_completo.trim()
      ? data.nome_completo.trim().toLowerCase().replace(/\s+/g, "-")
      : "funcionario"

  XLSX.writeFile(workbook, `relacao-funcionarios-${fileNameBase}.xlsx`)
}
