import { writeFile } from "node:fs/promises"

const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
if (!response.ok) {
  throw new Error(`Falha ao consultar municípios do IBGE (HTTP ${response.status}).`)
}

const municipalities = await response.json()
const records = municipalities
  .map((municipality) => ({
    id: String(municipality.id),
    name: String(municipality.nome),
    state: String(
      municipality["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
        municipality.microrregiao?.mesorregiao?.UF?.sigla ??
        ""
    ),
  }))
  .filter((municipality) => municipality.id && municipality.name && municipality.state)
  .sort((left, right) => left.id.localeCompare(right.id, "pt-BR"))

if (records.length < 5_000) {
  throw new Error(`A consulta retornou somente ${records.length} municípios.`)
}

await writeFile(
  new URL("../lib/ibge-municipality-codes.json", import.meta.url),
  `${JSON.stringify(records)}\n`,
  "utf8"
)

console.log(`${records.length} municípios gravados.`)
