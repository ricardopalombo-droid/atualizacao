import "server-only"

import catalogJson from "./data/catalogo.json"
import templateJson from "./data/modelo_exportado.json"
import type {
  CatalogRow,
  ContmaticCatalog,
  ContmaticEvent,
  EventProposal,
} from "./types"

const catalog = catalogJson as unknown as ContmaticCatalog
const template = templateJson as unknown as ContmaticEvent

const DIRECT: Record<string, string> = {
  codeventoid: "CodEventoId",
  codusuario: "CodUsuario",
  descricao: "Descricao",
  tipo: "Tipo",
  prioridade: "Prioridade",
  refvalor: "RefValor",
  inssnumero: "INSSNumero",
  irrfnumero: "IRRFNumero",
  fgtsnumero: "FGTSNumero",
  dirfnumero: "DirfNumero",
  rais: "Rais",
  pis: "Pis",
  salfam: "SalFam",
  variavelnumero: "VariavelNumero",
  dsrnumero: "DsrNumero",
  compoesal: "CompoeSal",
  proporcional: "Proporcional",
  codevsubstituido: "CodEvSubstituido",
  escopo: "Escopo",
  dednumero: "DedNumero",
  descparam: "DescParam",
  formula: "Formula",
}

const EXTRA_DIRECT: Record<string, string> = {
  rubricaesocial: "RubricaESocial",
  isencaodedirrf: "IsencaoDedIrrf",
  basesindical: "BaseSindical",
  observacao: "Observacao",
  escopo: "EscopoEvtoFol1",
}

// Mapeamentos compatíveis com a única exportação conhecida; continuam pendentes de comprovação.
const INFERRED: Record<string, string> = {
  evtofol1_int_1: "EventoOriginario",
  evtofol1_int_2: "CodigoHomologNet",
  evtofol1_int_3: "EventoRelacionado",
  evtofol1_flo_1: "CodigoTRCT",
  evtofol1_flo_2: "Outros",
  evtofol1_flo_4: "BaseINSS",
  evtofol1_flo_5: "BaseFGTS",
  evtofol1_flo_6: "BaseIRRF",
  evtofol1_flo_7: "BasePisPasep",
}

const UNMAPPED = ["Apelido", "Status", "CorrecaoESocial"]

export function getCatalog() {
  return catalog
}

export function getTemplate() {
  return structuredClone(template)
}

export function normalizeText(value: unknown) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const SEARCH_STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "como", "copiar", "criar", "crie", "da", "das",
  "de", "deve", "diretamente", "do", "dos", "e", "em", "evento", "folha", "funcionar",
  "informado", "mais", "na", "nas", "no", "nos", "o", "os", "para", "pelo", "por",
  "preserve", "quero", "sera", "teste", "um", "uma", "usuario",
])

function canonicalSearchToken(token: string) {
  if (/^\d+(?:[.,]\d+)?$/.test(token)) return token.replace(",", ".")
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1)
  return token
}

function searchTokens(value: unknown) {
  const normalized = normalizeText(value).replace(/\bd[\s.]*s[\s.]*r\b/g, " dsr ")
  return (normalized.match(/[a-z0-9]+(?:[.,][0-9]+)?/g) ?? [])
    .filter((token) => token.length >= 3 && !SEARCH_STOP_WORDS.has(token))
    .map(canonicalSearchToken)
}

export function validateEvent(event: unknown) {
  const errors: string[] = []

  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return ["O evento deve ser um objeto JSON, com um único evento."]
  }

  const candidate = event as Record<string, unknown>

  for (const [key, example] of Object.entries(template)) {
    if (!(key in candidate)) {
      errors.push(`Campo obrigatório ausente: ${key}`)
      continue
    }

    const value = candidate[key]
    const valid =
      typeof example === "boolean"
        ? typeof value === "boolean"
        : typeof example === "number"
          ? typeof value === "number" && Number.isFinite(value)
          : typeof value === "string"

    if (!valid) {
      errors.push(`Tipo inválido em ${key}: esperado ${typeof example}.`)
    }
  }

  const extras = Object.keys(candidate)
    .filter((key) => !(key in template))
    .sort()
  if (extras.length) {
    errors.push(`Campos não reconhecidos no exemplo: ${extras.join(", ")}`)
  }

  for (const key of ["CodEventoId", "CodUsuario"]) {
    const value = candidate[key]
    if (typeof value === "number" && (!Number.isInteger(value) || value < 1000)) {
      errors.push(`${key} deve ser um inteiro >= 1000 para um novo evento de usuário.`)
    }
  }

  const description = candidate.Descricao
  if (
    typeof description === "string" &&
    (!description.trim() || description.length > 30 || /[\u0000-\u001f]/.test(description))
  ) {
    errors.push("Descrição deve ter de 1 a 30 caracteres, sem quebras de linha.")
  }

  if (typeof candidate.Formula === "string" && !candidate.Formula.trim()) {
    errors.push("A fórmula não pode ficar vazia.")
  }

  return errors
}

export function searchCatalog(query: string, limit = 8) {
  const terms = new Set(searchTokens(query))

  const ranked: Array<{ score: number; code: number; item: CatalogRow }> = []
  for (const item of catalog.eventos) {
    const code = Number(item.evento.codeventoid)
    if (!Number.isInteger(code) || code < 1) continue

    const description = normalizeText(item.evento.descricao ?? "")
    const descriptionTerms = new Set(searchTokens(description))
    const parameterTerms = new Set(searchTokens(item.evento.descparam ?? ""))
    let score = 0
    for (const term of terms) {
      if (descriptionTerms.has(term)) score += 12
      else if (
        term.length >= 4 &&
        [...descriptionTerms].some((word) => word.startsWith(term) || term.startsWith(word))
      ) {
        score += 4
      }
      if (parameterTerms.has(term)) score += 2
      if (String(code) === term) score += 100
    }
    const descriptiveTerms = [...descriptionTerms].filter((term) => !/^\d/.test(term))
    const unmatchedDescriptiveTerms = descriptiveTerms.filter((term) => !terms.has(term))
    score -= unmatchedDescriptiveTerms.length * 6
    if (descriptiveTerms.length && unmatchedDescriptiveTerms.length === 0) score += 8
    score -= [...descriptionTerms].filter((term) => /^\d/.test(term) && !terms.has(term)).length
    if (!terms.size || score > 0) ranked.push({ score, code, item })
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.code - b.code)
    .slice(0, limit)
    .map(({ item }) => item)
}

function copyMappedValues(
  event: ContmaticEvent,
  provenance: Record<string, string>,
  pending: string[],
  mapping: Record<string, string>,
  values: Record<string, string | number | boolean | null>,
  label: string,
  inferred = false,
) {
  for (const [column, key] of Object.entries(mapping)) {
    const value = values[column]
    if (value === null || value === undefined) {
      pending.push(key)
      continue
    }
    event[key] = value
    provenance[key] = `${label}.${column}`
    if (inferred) pending.push(key)
  }
}

export function buildProposal(options: {
  code?: number
  description?: string
  changes?: Record<string, unknown>
  officialTemplate?: unknown
}): EventProposal {
  let event: ContmaticEvent
  let provenance: Record<string, string>
  let source: string
  let pending: string[]

  if (options.officialTemplate !== undefined) {
    const errors = validateEvent(options.officialTemplate)
    if (errors.length) throw new Error(errors.join("\n"))
    event = structuredClone(options.officialTemplate) as ContmaticEvent
    provenance = Object.fromEntries(Object.keys(event).map((key) => [key, "JSON fornecido pelo usuário"]))
    source = "JSON fornecido pelo usuário"
    pending = []
  } else {
    const found = catalog.eventos.filter(
      (item) => Number(item.evento.codeventoid) === options.code,
    )
    if (found.length !== 1) {
      throw new Error("Não foi possível localizar uma referência interna única para esse cálculo.")
    }

    const item = found[0]
    event = getTemplate()
    provenance = Object.fromEntries(
      Object.keys(event).map((key) => [key, "Valor do exemplo JSON (não mapeado no backup)"]),
    )
    pending = [...UNMAPPED]
    copyMappedValues(event, provenance, pending, DIRECT, item.evento, "eventos")
    copyMappedValues(
      event,
      provenance,
      pending,
      EXTRA_DIRECT,
      item.complemento ?? {},
      "evtofol1",
    )
    copyMappedValues(
      event,
      provenance,
      pending,
      INFERRED,
      item.complemento ?? {},
      "evtofol1: inferência",
      true,
    )
    source = `Referência interna ${options.code}`

    if (options.code === catalog.evento_exemplo_compativel) {
      event = getTemplate()
      provenance = Object.fromEntries(
        Object.keys(event).map((key) => [key, "JSON original compatível com a referência"]),
      )
      pending = []
    }
  }

  const usedCodes = catalog.eventos.map((item) => Number(item.evento.codeventoid))
  const newCode = Math.max(999, ...usedCodes) + 1
  event.CodEventoId = newCode
  event.CodUsuario = newCode
  provenance.CodEventoId = "Próximo código local; o importador pode renumerar"
  provenance.CodUsuario = provenance.CodEventoId

  if (options.description !== undefined) {
    event.Descricao = options.description
    provenance.Descricao = "Pedido do usuário"
  }

  for (const [key, rawValue] of Object.entries(options.changes ?? {})) {
    if (!(key in template)) throw new Error(`Campo desconhecido: ${key}`)
    event[key] = rawValue as string | number | boolean
    provenance[key] = "Alteração explícita do usuário"
    pending = pending.filter((item) => item !== key)
  }

  const errors = validateEvent(event)
  if (errors.length) throw new Error(errors.join("\n"))

  const warnings = [
    "O arquivo foi validado estruturalmente. Confirme a importação e o cálculo em um ambiente de teste da Contmatic.",
  ]
  if (pending.length) {
    warnings.push(
      "Algumas configurações sem correspondência direta foram preservadas a partir dos exemplos técnicos.",
    )
  }

  return {
    evento: event,
    origem: source,
    campos: provenance,
    revisar: [...new Set(pending)].sort(),
    avisos: warnings,
    bloqueios: [],
  }
}

export function formulaIdentifiers(formula: string) {
  return new Set(
    normalizeText(formula)
      .replace(/\/\/[^\r\n]*/g, "")
      .replace(/"[^"\r\n]*"|'[^'\r\n]*'/g, "")
      .match(/[a-z_][a-z_0-9]*/g) ?? [],
  )
}

export function knownFormulaIdentifiers() {
  const result = new Set<string>()
  for (const item of catalog.eventos) {
    const code = Number(item.evento.codeventoid)
    if (!Number.isInteger(code) || code < 1) continue
    for (const identifier of formulaIdentifiers(String(item.evento.formula ?? ""))) {
      result.add(identifier)
    }
  }
  return result
}
