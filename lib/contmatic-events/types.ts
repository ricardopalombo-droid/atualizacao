export type ContmaticEvent = Record<string, string | number | boolean>

export type CatalogRow = {
  evento: Record<string, string | number | boolean | null>
  complemento: Record<string, string | number | boolean | null> | null
}

export type ContmaticCatalog = {
  evento_exemplo_compativel: number
  eventos: CatalogRow[]
}

export type EventProposal = {
  evento: ContmaticEvent
  origem: string
  campos: Record<string, string>
  revisar: string[]
  avisos: string[]
  bloqueios: string[]
  pedido?: string
  ia?: {
    explicacao: string
    justificativas: Record<string, string>
    modelo?: string
  }
}

export type PublicEventProposal = {
  token: string
  evento: ContmaticEvent
  avisos: string[]
  pendencias: string[]
  explicacao?: string
}
