import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex")

  return {
    salt,
    hash,
  }
}

export function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const computed = scryptSync(password, passwordSalt, 64)
  const stored = Buffer.from(passwordHash, "hex")

  if (computed.length !== stored.length) {
    return false
  }

  return timingSafeEqual(computed, stored)
}

export function createInviteToken(bytes = 24) {
  return randomBytes(bytes).toString("hex")
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex")
}
