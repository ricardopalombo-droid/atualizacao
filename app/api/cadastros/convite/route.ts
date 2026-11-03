import { z } from "zod"
import { createEmployeeInviteLink } from "@/lib/cadastro-repository"
import { enviarEmailCadastroFuncionario } from "@/lib/email-cadastro"
import { getCurrentSession } from "@/lib/auth-session"

const invitePayloadSchema = z.object({
  id: z.string().uuid(),
  inviteEmail: z.string().trim().email("Informe um e-mail válido."),
})

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 })
    }

    if (session.role !== "subscriber_admin" || !session.subscriberId) {
      return Response.json(
        { ok: false, error: "Somente o escritório/DP pode disparar convites." },
        { status: 403 }
      )
    }

    const payload = invitePayloadSchema.parse(await request.json())
    const origin = new URL(request.url).origin
    const invite = await createEmployeeInviteLink(payload.id, payload.inviteEmail, origin, {
      subscriberId: session.subscriberId,
      clientId: null,
    })

    await enviarEmailCadastroFuncionario({
      email: payload.inviteEmail,
      nome: invite.employeeName,
      inviteLink: invite.inviteLink,
      expiresAt: invite.expiresAt,
    })

    return Response.json({
      ok: true,
      inviteLink: invite.inviteLink,
      expiresAt: invite.expiresAt,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erro ao disparar convite",
      },
      { status: 500 }
    )
  }
}
