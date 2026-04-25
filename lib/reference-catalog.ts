import { PDFParse } from "pdf-parse"
import { z } from "zod"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export const referenceTypeSchema = z.enum(["cargo", "horario", "sindicato"])

export type ReferenceType = z.infer<typeof referenceTypeSchema>

export type ReferenceCatalogItem = {
  id: string
  subscriber_id: string
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
    .map((line) => line.trim())
    .filter(Boolean)

  const items: ParsedReferenceItem[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (!line.includes("Mes Data Base:")) {
      continue
    }

    const possibleCode = lines[index + 1] ?? ""
    const possibleName = lines[index + 3] ?? ""

    if (!/^\d+$/.test(possibleCode)) {
      continue
    }

    const label = normalizeWhitespace(possibleName.replace(/C[oó]d\.: Nome:.*$/i, ""))

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
  const items = text
    .split(/\r?\n/)
    .map((line) => parseCargoLine(line))
    .filter((item): item is ParsedReferenceItem => Boolean(item))

  return uniqueByCode(items)
}

function parseHorarioText(text: string) {
  const items = text
    .split(/\r?\n/)
    .map((line) => parseHorarioLine(line))
    .filter((item): item is ParsedReferenceItem => Boolean(item))

  return uniqueByCode(items)
}

export async function parseReferencePdf(buffer: Buffer, referenceType: ReferenceType) {
  const parser = new PDFParse({ data: buffer })
  const parsed = await parser.getText()
  const text = parsed.text ?? ""

  await parser.destroy()

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
  subscriberId: string,
  referenceType: ReferenceType,
  items: ParsedReferenceItem[]
) {
  const supabase = getSupabaseServerClient()
  const uniqueItems = uniqueByCode(items)

  if (uniqueItems.length === 0) {
    throw new Error("Nenhum registro valido foi identificado no PDF.")
  }

  const payload = uniqueItems.map((item) => ({
    subscriber_id: subscriberId,
    reference_type: referenceType,
    code: item.code,
    label: item.label,
    metadata: item.metadata ?? {},
  }))

  const { error: upsertError } = await supabase.from("reference_catalog_items").upsert(payload, {
    onConflict: "subscriber_id,reference_type,code",
  })

  if (upsertError) {
    throw upsertError
  }

  const codes = uniqueItems.map((item) => item.code)
  const serializedCodes = `(${codes.map((code) => `'${code.replace(/'/g, "''")}'`).join(",")})`
  const { error: deleteError } = await supabase
    .from("reference_catalog_items")
    .delete()
    .eq("subscriber_id", subscriberId)
    .eq("reference_type", referenceType)
    .not("code", "in", serializedCodes)

  if (deleteError) {
    throw deleteError
  }

  return uniqueItems.length
}

export async function listReferenceCatalog(
  subscriberId: string,
  referenceType?: ReferenceType
): Promise<ReferenceCatalogItem[]> {
  const supabase = getSupabaseServerClient()

  let query = supabase
    .from("reference_catalog_items")
    .select("id, subscriber_id, reference_type, code, label, metadata, updated_at")
    .eq("subscriber_id", subscriberId)
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

export async function getReferenceCatalogSummary(subscriberId: string) {
  const records = await listReferenceCatalog(subscriberId)

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
