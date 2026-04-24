import { z } from "zod"

export const workflowStatusSchema = z.enum([
  "rascunho_interno",
  "convite_enviado",
  "preenchido_funcionario",
  "em_revisao_cliente",
  "finalizado",
  "exportado",
])

export const actorSchema = z.enum(["employee", "client"])

export const cadastroPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid().optional().nullable(),
  subscriberId: z.string().uuid().optional().nullable(),
  actor: actorSchema,
  workflowStatus: workflowStatusSchema,
  inviteEmail: z.string().email().optional().or(z.literal("")).nullable(),
  data: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.null()])).default({}),
})

export type WorkflowStatus = z.infer<typeof workflowStatusSchema>
export type CadastroPayload = z.infer<typeof cadastroPayloadSchema>
