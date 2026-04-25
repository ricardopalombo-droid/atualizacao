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

export const dependentPayloadSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  relationshipName: z.string().default(""),
  cpf: z.string().default(""),
  relationshipDegree: z.string().default(""),
  birthDate: z.string().default(""),
  registryDeliveryDate: z.string().default(""),
  notes: z.string().default(""),
})

export const cadastroPayloadSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  subscriberId: z.string().uuid().optional().nullable(),
  actor: actorSchema,
  workflowStatus: workflowStatusSchema,
  inviteEmail: z.string().email().optional().or(z.literal("")).nullable(),
  data: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.null()])).default({}),
  dependents: z.array(dependentPayloadSchema).default([]),
})

export type WorkflowStatus = z.infer<typeof workflowStatusSchema>
export type CadastroPayload = z.infer<typeof cadastroPayloadSchema>
export type DependentPayload = z.infer<typeof dependentPayloadSchema>
