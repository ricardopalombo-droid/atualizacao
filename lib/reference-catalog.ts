import { z } from "zod"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const referenceTypeSchema = z.enum(["cargo", "horario", "sindicato"])

export type ReferenceType = z.infer<typeof referenceTypeSchema>

export type ReferenceCatalogItem = {
  id: string
  client_id: string
  reference_type: ReferenceType
  code: string
  label: string
  metadata: Record<string, string | number | boolean | null>
  updated_at: string
}

type ParsedReferenceItem = {
  code: string
  label: string
  metadata?: Record<string, string | number | boolean | null>
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function uniqueByCode(items: ParsedReferenceItem[]) {
  const map = new Map<string, ParsedReferenceItem>()

  for (const item of items) {
    if (!item.code || !item.label) {
      continue
    }

    map.set(item.code, item)
  }

  return [...map.values()].sort((a, b) => Number(a.code) - Number(b.code))
}

function parseCargoLine(line: string) {
  const trimmed = normalizeWhitespace(line)

  if (!/^\d+\s+/.test(trimmed)) {
    return null
  }

  const tokens = trimmed.split(" ")
  const code = tokens.shift()

  if (!code) {
    return null
  }

  const trailingNumericTokens: string[] = []

  while (tokens.length > 0 && /^\d+$/.test(tokens[tokens.length - 1] ?? "")) {
    trailingNumericTokens.unshift(tokens.pop()!)
  }

  const label = normalizeWhitespace(tokens.join(" "))

  if (!label) {
    return null
  }

  return {
    code,
    label,
    metadata: {
      cbo_novo: trailingNumericTokens[0] ?? "",
      cbo_antigo: trailingNumericTokens[1] ?? "",
      cbo_esocial: trailingNumericTokens[2] ?? trailingNumericTokens[0] ?? "",
    },
  } satisfies ParsedReferenceItem
}

function parseHorarioLine(line: string) {
  const trimmed = normalizeWhitespace(line)

  if (!/^\d+\s+/.test(trimmed)) {
    return null
  }

  const match = trimmed.match(/^(\d+)\s+(.+?)\s{1,}\d+\s+[–-]\s+/)

  if (!match) {
    return null
  }

  const code = match[1]
  const label = normalizeWhitespace(match[2])

  if (!label) {
    return null
  }

  return {
    code,
    label,
  } satisfies ParsedReferenceItem
}

function parseSindicatoText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  const items: ParsedReferenceItem[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (!line.includes("Mes Data Base:") && !line.includes("Mês Data Base:")) {
      continue
    }

    let codeIndex = index + 1

    while (codeIndex < lines.length && !/^\d+$/.test(lines[codeIndex] ?? "")) {
      codeIndex += 1
    }

    const possibleCode = lines[codeIndex] ?? ""

    if (!/^\d+$/.test(possibleCode)) {
      continue
    }

    let markerIndex = codeIndex + 1

    while (markerIndex < lines.length && !/^C[oó]d\.:?$/i.test(lines[markerIndex] ?? "")) {
      markerIndex += 1
    }

    const between = lines.slice(codeIndex + 1, markerIndex).filter((currentLine) => {
      if (/^[A-Z]{2}$/.test(currentLine)) {
        return false
      }

      if (/^P[aá]g\.:/i.test(currentLine) || /^P[aá]ginas?:/i.test(currentLine)) {
        return false
      }

      return !/^\d[\d()./\- ]*$/.test(currentLine)
    })

    const label = normalizeWhitespace(between[between.length - 1] ?? "")

    if (!label) {
      continue
    }

    items.push({
      code: possibleCode,
      label,
    })
  }

  return uniqueByCode(items)
}

function parseCargoText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  const items: ParsedReferenceItem[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const code = lines[index] ?? ""

    if (!/^\d+$/.test(code)) {
      continue
    }

    const label = lines[index + 1] ?? ""

    if (!label || /^C\.?B\.?O/i.test(label) || /^P[aá]ginas?:/i.test(label)) {
      continue
    }

    const numericValues: string[] = []
    let cursor = index + 2

    while (cursor < lines.length && numericValues.length < 3) {
      const currentLine = lines[cursor] ?? ""
      const nextLine = lines[cursor + 1] ?? ""

      if (/^\d+$/.test(currentLine) && /[A-Za-zÀ-ÿ]/.test(nextLine)) {
        break
      }

      if (/^\d+$/.test(currentLine)) {
        numericValues.push(currentLine)
      } else if (/^P[aá]ginas?:/i.test(currentLine)) {
        break
      }

      cursor += 1
    }

    items.push({
      code,
      label,
      metadata: {
        cbo_novo: numericValues[0] ?? "",
        cbo_antigo: numericValues[1] ?? "",
        cbo_esocial: numericValues[2] ?? numericValues[0] ?? "",
      },
    })
  }

  return uniqueByCode(items)
}

function parseHorarioText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  const items: ParsedReferenceItem[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const code = lines[index] ?? ""

    if (!/^\d+$/.test(code)) {
      continue
    }

    let cursor = index + 1
    let label = ""

    while (cursor < lines.length) {
      const currentLine = lines[cursor] ?? ""

      if (/^\d+$/.test(currentLine)) {
        break
      }

      if (/^[1-9]\s*[–-]/.test(currentLine) || /^P[aá]ginas?:/i.test(currentLine)) {
        break
      }

      if (
        currentLine !== "Descrição" &&
        currentLine !== "Código" &&
        currentLine !== "Carga Horária Qtde" &&
        currentLine !== "Carga Horária Período" &&
        currentLine !== "Intervalo Qtde" &&
        currentLine !== "Intervalo Tipo" &&
        currentLine !== "Listagem de Horários"
      ) {
        label = currentLine
        break
      }

      cursor += 1
    }

    if (!label) {
      continue
    }

    items.push({
      code,
      label,
    })
  }

  return uniqueByCode(items)
}

async function ensurePdfJsPolyfills() {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: unknown
    ImageData?: unknown
    Path2D?: unknown
  }

  if (globalScope.DOMMatrix) {
    return
  }

  class SimpleDOMMatrix {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number

    constructor(init?: number[]) {
      this.a = init?.[0] ?? 1
      this.b = init?.[1] ?? 0
      this.c = init?.[2] ?? 0
      this.d = init?.[3] ?? 1
      this.e = init?.[4] ?? 0
      this.f = init?.[5] ?? 0
    }

    multiplySelf(other: { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }) {
      const a = this.a * (other.a ?? 1) + this.c * (other.b ?? 0)
      const b = this.b * (other.a ?? 1) + this.d * (other.b ?? 0)
      const c = this.a * (other.c ?? 0) + this.c * (other.d ?? 1)
      const d = this.b * (other.c ?? 0) + this.d * (other.d ?? 1)
      const e = this.a * (other.e ?? 0) + this.c * (other.f ?? 0) + this.e
      const f = this.b * (other.e ?? 0) + this.d * (other.f ?? 0) + this.f

      this.a = a
      this.b = b
      this.c = c
      this.d = d
      this.e = e
      this.f = f
      return this
    }

    preMultiplySelf(other: { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }) {
      return new SimpleDOMMatrix([
        other.a ?? 1,
        other.b ?? 0,
        other.c ?? 0,
        other.d ?? 1,
        other.e ?? 0,
        other.f ?? 0,
      ]).multiplySelf(this).copyTo(this)
    }

    translateSelf(tx = 0, ty = 0) {
      return this.multiplySelf({ e: tx, f: ty })
    }

    scaleSelf(scaleX = 1, scaleY = scaleX) {
      return this.multiplySelf({ a: scaleX, d: scaleY })
    }

    rotateSelf(_rotX = 0, _rotY = 0, rotZ = 0) {
      const radians = (rotZ * Math.PI) / 180
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      return this.multiplySelf({ a: cos, b: sin, c: -sin, d: cos })
    }

    invertSelf() {
      const determinant = this.a * this.d - this.b * this.c

      if (!determinant) {
        this.a = NaN
        this.b = NaN
        this.c = NaN
        this.d = NaN
        this.e = NaN
        this.f = NaN
        return this
      }

      const a = this.d / determinant
      const b = -this.b / determinant
      const c = -this.c / determinant
      const d = this.a / determinant
      const e = (this.c * this.f - this.d * this.e) / determinant
      const f = (this.b * this.e - this.a * this.f) / determinant

      this.a = a
      this.b = b
      this.c = c
      this.d = d
      this.e = e
      this.f = f
      return this
    }

    transformPoint(point: { x: number; y: number }) {
      return {
        x: this.a * point.x + this.c * point.y + this.e,
        y: this.b * point.x + this.d * point.y + this.f,
      }
    }

    private copyTo(target: SimpleDOMMatrix) {
      target.a = this.a
      target.b = this.b
      target.c = this.c
      target.d = this.d
      target.e = this.e
      target.f = this.f
      return target
    }
  }

  globalScope.DOMMatrix = SimpleDOMMatrix
}

export async function parseReferencePdf(buffer: Buffer, referenceType: ReferenceType) {
  await ensurePdfJsPolyfills()
  await import("pdfjs-dist/legacy/build/pdf.worker.mjs")
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
  })
  const document = await loadingTask.promise
  let text = ""

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join("\n")

    text += `${pageText}\n`
  }

  await document.destroy()

  if (!text.trim()) {
    throw new Error("Nao foi possivel extrair texto do PDF informado.")
  }

  switch (referenceType) {
    case "cargo":
      return parseCargoText(text)
    case "horario":
      return parseHorarioText(text)
    case "sindicato":
      return parseSindicatoText(text)
  }
}

export async function replaceReferenceCatalog(
  clientId: string,
  referenceType: ReferenceType,
  items: ParsedReferenceItem[]
) {
  const supabase = getSupabaseServerClient()
  const uniqueItems = uniqueByCode(items)

  if (uniqueItems.length === 0) {
    throw new Error("Nenhum registro valido foi identificado no PDF.")
  }

  const payload = uniqueItems.map((item) => ({
    client_id: clientId,
    reference_type: referenceType,
    code: item.code,
    label: item.label,
    metadata: item.metadata ?? {},
  }))

  const { error: upsertError } = await supabase.from("reference_catalog_items").upsert(payload, {
    onConflict: "client_id,reference_type,code",
  })

  if (upsertError) {
    throw upsertError
  }

  const codes = uniqueItems.map((item) => item.code)
  const serializedCodes = `(${codes.map((code) => `'${code.replace(/'/g, "''")}'`).join(",")})`
  const { error: deleteError } = await supabase
    .from("reference_catalog_items")
    .delete()
    .eq("client_id", clientId)
    .eq("reference_type", referenceType)
    .not("code", "in", serializedCodes)

  if (deleteError) {
    throw deleteError
  }

  return uniqueItems.length
}

export async function listReferenceCatalog(
  clientId: string,
  referenceType?: ReferenceType
): Promise<ReferenceCatalogItem[]> {
  const supabase = getSupabaseServerClient()

  let query = supabase
    .from("reference_catalog_items")
    .select("id, client_id, reference_type, code, label, metadata, updated_at")
    .eq("client_id", clientId)
    .order("code", { ascending: true })

  if (referenceType) {
    query = query.eq("reference_type", referenceType)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data as ReferenceCatalogItem[] | null) ?? []
}

export async function getReferenceCatalogSummary(clientId: string) {
  const records = await listReferenceCatalog(clientId)

  const grouped = {
    cargo: [] as ReferenceCatalogItem[],
    horario: [] as ReferenceCatalogItem[],
    sindicato: [] as ReferenceCatalogItem[],
  }

  for (const record of records) {
    grouped[record.reference_type].push(record)
  }

  return grouped
}
