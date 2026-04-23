import {
  FileSpreadsheet,
  Landmark,
  Building2,
  MessageCircle,
  Mail,
  Receipt,
  Users,
} from "lucide-react"

export type StatusProduto = "disponivel" | "em_breve"

export type ProdutoSite = {
  nome: string
  preco: number
  ref: string
  descricao: string
  icone: React.ComponentType<{ size?: number }>
  status: StatusProduto
}

export const PRODUTOS: ProdutoSite[] = [
  {
    nome: "Automação DRE + Geração R-4000",
    preco: 89.9,
    ref: "dre-001",
    descricao:
      "Automatize a geração da DRE e da Reinf R-4000, eliminando processos manuais e ganhando produtividade.",
    icone: FileSpreadsheet,
    status: "disponivel",
  },
  {
    nome: "Importação guia rápida - FGTS Digital",
    preco: 49.9,
    ref: "fgts-001",
    descricao:
      "Agilize a importação das guias no FGTS Digital com mais praticidade no dia a dia.",
    icone: Landmark,
    status: "disponivel",
  },
  {
    nome: "eCAC / Recibos REINF e DCTFWeb",
    preco: 39.9,
    ref: "ecac-001",
    descricao:
      "Automatize consultas e obtenção de recibos para rotinas ligadas ao eCAC, REINF e DCTFWeb.",
    icone: Building2,
    status: "disponivel",
  },
  {
    nome: "Envio Automático de Documentos por WhatsApp",
    preco: 49.9,
    ref: "whats-001",
    descricao:
      "Envie documentos aos clientes com mais rapidez por meio de fluxos automáticos no WhatsApp.",
    icone: MessageCircle,
    status: "disponivel",
  },
  {
    nome: "Envio Automático de Documentos por E-mail",
    preco: 49.9,
    ref: "email-001",
    descricao:
      "Facilite o disparo de arquivos e comunicações com processos automáticos por e-mail.",
    icone: Mail,
    status: "disponivel",
  },
  {
    nome: "Leitura de Extratos e geração de lançamentos",
    preco: 59.9,
    ref: "extratos-001",
    descricao:
      "Transforme informações de extratos em lançamentos com mais velocidade e menos retrabalho.",
    icone: Receipt,
    status: "em_breve",
  },
  {
    nome: "Planilha Funcionários - Importação de Cadastros",
    preco: 39.9,
    ref: "funcionarios-001",
    descricao:
      "Importe dados cadastrais de funcionários a partir de planilhas de forma prática e organizada.",
    icone: Users,
    status: "em_breve",
  },
]
