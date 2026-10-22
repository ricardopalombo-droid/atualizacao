import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import type { EventProposal, PublicEventProposal } from "./types"

const TOKEN_VERSION = "v1"

function getKey() {
  const configured = String(process.env.EVENTOS_PROPOSAL_SECRET ?? "").trim()
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("EVENTOS_PROPOSAL_SECRET não configurado no servidor.")
  }
  return createHash("sha256")
    .update(configured || "palsys-eventos-dev-only-change-me")
    .digest()
}

export function sealProposal(proposal: EventProposal) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(proposal), "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [TOKEN_VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".")
}

export function openProposal(token: unknown) {
  if (typeof token !== "string" || token.length > 1_500_000) {
    throw new Error("Proposta inválida ou expirada.")
  }
  const [version, ivRaw, tagRaw, encryptedRaw, extra] = token.split(".")
  if (version !== TOKEN_VERSION || !ivRaw || !tagRaw || !encryptedRaw || extra) {
    throw new Error("Proposta inválida ou expirada.")
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivRaw, "base64url"))
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, "base64url")),
      decipher.final(),
    ])
    return JSON.parse(decrypted.toString("utf8")) as EventProposal
  } catch {
    throw new Error("Proposta inválida ou expirada.")
  }
}

export function toPublicProposal(proposal: EventProposal): PublicEventProposal {
  return {
    token: sealProposal(proposal),
    evento: proposal.evento,
    avisos: proposal.avisos,
    pendencias: proposal.bloqueios,
    explicacao: proposal.ia?.explicacao,
  }
}
