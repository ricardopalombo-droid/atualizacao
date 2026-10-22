import "server-only"

import { NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-session"

export async function requireEventSession() {
  const session = await getCurrentSession()
  if (!session) {
    throw new EventHttpError("Faça login para acessar o criador de eventos.", 401)
  }
  if (session.role !== "palsys_admin") {
    throw new EventHttpError("Este módulo ainda está liberado somente para a administração PalSys.", 403)
  }
  return session
}

export class EventHttpError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
  }
}

export function eventErrorResponse(error: unknown) {
  if (error instanceof EventHttpError) {
    return NextResponse.json({ erro: error.message }, { status: error.status })
  }
  const message = error instanceof Error ? error.message : "Não foi possível concluir a operação."
  return NextResponse.json({ erro: message }, { status: 400 })
}
