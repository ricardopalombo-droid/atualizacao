import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Cog,
  FileSearch,
  ShieldCheck,
  Target,
  UsersRound,
  Zap,
} from "lucide-react"
import { PRODUTOS } from "@/lib/produtos"

const resumoPrivacidadeProduto =
  "Processamento local sempre que aplicável, sem armazenamento dos arquivos em servidores da PalSys."

const beneficios = [
  {
    titulo: "Mais produtividade",
    descricao:
      "Com as rotinas automatizadas, o escritório ganha tempo para focar em análise, atendimento e crescimento.",
    icone: Zap,
  },
  {
    titulo: "Menos erros",
    descricao:
      "A padronização dos processos reduz falhas manuais e aumenta a consistência das entregas.",
    icone: ShieldCheck,
  },
  {
    titulo: "Automação sob medida",
    descricao:
      "As soluções são adaptadas para a realidade operacional de cada escritório e de cada cliente.",
    icone: Cog,
  },
]

// Para reativar os botões de demonstração no catálogo no futuro, volte este helper:
// function getVideoUrl(ref: string) {
//   if (ref === "whats-001") return "https://www.youtube.com/watch?v=lFXViQerYxQ"
//   if (ref === "email-001") return "https://www.youtube.com/watch?v=dGGHX6In-vs"
//   if (ref === "dre-001") return "https://www.youtube.com/watch?v=EJy_oIlakBw"
//   if (ref === "fgts-001") return "https://www.youtube.com/watch?v=SuQao5qEEow"
//   if (ref === "ecac-001") return "https://www.youtube.com/watch?v=lovnQ4FBrzw"
//   if (ref === "funcionarios-001") return "https://www.youtube.com/watch?v=LW7mJt-iEFk"
//   return null
// }

function getVideoUrl(ref: string) {
  if (ref === "whats-001") return "https://www.youtube.com/watch?v=lFXViQerYxQ"
  if (ref === "email-001") return "https://www.youtube.com/watch?v=xAvIlFxByP8"
  if (ref === "central-documentos-001") return "https://www.youtube.com/watch?v=McAZDftTzmM"
  if (ref === "buscador-xml-001") return "https://www.youtube.com/watch?v=LCkGH_FFKvc"
  if (ref === "dre-001") return "https://www.youtube.com/watch?v=EJy_oIlakBw"
  if (ref === "fgts-001") return "https://www.youtube.com/watch?v=SuQao5qEEow"
  if (ref === "dctfweb-integra-001") return "https://www.youtube.com/watch?v=IkpKPZHazCk"
  if (ref === "funcionarios-001") return "https://www.youtube.com/watch?v=LW7mJt-iEFk"
  if (ref === "pdf-monitor-001") return "https://www.youtube.com/watch?v=PwCItzETcg4"
  if (ref === "consolida-impostos-001") return "https://www.youtube.com/watch?v=tAHFeYmP6BY"
  if (ref === "consolidador-folhas-001") return "https://www.youtube.com/watch?v=3bs2H7Mewo4"
  return null
}

function getVideoEmbedUrl(ref: string) {
  const videoUrl = getVideoUrl(ref)
  if (!videoUrl) return null

  const videoId = new URL(videoUrl).searchParams.get("v")
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null
}

const productHighlights: Record<string, string[]> = {
  "fgts-001": [
    "Agiliza a preparação das guias para importação no FGTS Digital.",
    "Reduz etapas manuais em rotinas realizadas para várias empresas.",
    "Ajuda o escritório a ganhar produtividade sem depender do Integra Contador.",
  ],
  "dctfweb-integra-001": [
    "Busca a declaração, o recibo e a guia da DCTFWeb.",
    "Utiliza a integração oficial do Integra Contador da Receita Federal.",
    "Centraliza os documentos e facilita a organização da rotina fiscal.",
  ],
  "whats-001": [
    "Acompanha automaticamente a pasta definida pelo escritório.",
    "Reconhece o PDF e localiza o contato cadastrado para o envio.",
    "Reduz tarefas repetitivas e o risco de documentos esquecidos.",
  ],
  "email-001": [
    "Localiza os PDFs disponíveis na pasta configurada.",
    "Identifica o destinatário e realiza o envio por e-mail.",
    "Organiza uma rotina que normalmente exigiria vários envios manuais.",
  ],
  "central-documentos-001": [
    "Organiza documentos em pastas no Google Drive.",
    "Automatiza os envios pelo WhatsApp a partir da estrutura configurada.",
    "Mantém o computador disponível enquanto o processo é executado.",
  ],
  "buscador-xml-001": [
    "Consulta e baixa NF-e, NFC-e, CT-e e NFS-e.",
    "Organiza XMLs por empresa, período e tipo de documento.",
    "Centraliza certificados A1, acervos e o controle de NSU.",
  ],
  "funcionarios-001": [
    "O colaborador preenche os dados iniciais por um link.",
    "A empresa revisa e completa as informações internas.",
    "O escritório recebe os cadastros organizados para importar na folha.",
  ],
  "pdf-monitor-001": [
    "Captura relatórios impressos pelo Contmatic com a impressora PalSys.",
    "Identifica empresa, tipo de relatório e competência.",
    "Renomeia e salva os PDFs na pasta definida pelo escritório.",
  ],
  "consolida-impostos-001": [
    "Automatiza a geração de relatórios fiscais da Contmatic G5.",
    "Consolida as informações em planilhas e arquivos PDF.",
    "Entrega uma conferência mais organizada e com menos trabalho manual.",
  ],
  "consolidador-folhas-001": [
    "Lê relatórios de folha em PDF entre diferentes competências.",
    "Soma eventos e encargos para facilitar a conferência.",
    "Gera resultados organizados em PDF e Excel.",
  ],
}

export default function HomePage() {
  const produtosCatalogo = PRODUTOS.filter(
    (produto) => !["dre-001", "extratos-001"].includes(produto.ref),
  )
  // Para voltar a mostrar esses produtos no catálogo, remova os refs acima:
  // "dre-001", "extratos-001"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image src="/logo-palsys.png" alt="PalSys" width={180} height={50} priority />
          </Link>

          <nav className="hidden items-center gap-3 text-[13px] font-medium md:flex lg:gap-4 lg:text-sm xl:gap-5">
            <Link href="/" className="transition hover:text-yellow-600">
              Início
            </Link>
            <a href="#beneficios" className="transition hover:text-yellow-600">
              Benefícios
            </a>
            <a href="#produtos" className="transition hover:text-yellow-600">
              Produtos
            </a>
            <Link
              href="/explicar-recibo"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
            >
              <FileSearch size={16} />
              Entenda seu recibo
            </Link>
            <Link
              href="/eventos/cadastro"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-yellow-300 bg-yellow-100 px-3 py-2 font-bold text-yellow-800 shadow-sm transition hover:bg-yellow-200"
            >
              <ClipboardList size={16} />
              Criar eventos
            </Link>
            <a href="#contato" className="hidden transition hover:text-yellow-600 xl:inline">
              Contato
            </a>
            <Link href="/privacidade-dos-sistemas" className="hidden transition hover:text-yellow-600 xl:inline">
              Privacidade
            </Link>
            <Link
              href="/acesso"
              className="rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50"
            >
              Entrar
            </Link>
            <Link
              href="/assinar"
              className="rounded-xl bg-yellow-400 px-4 py-2 font-bold hover:brightness-95"
            >
              Assinar
            </Link>
          </nav>
        </div>
        <nav className="grid grid-cols-2 gap-3 border-t border-slate-100 px-4 py-3 md:hidden">
          <Link
            href="/explicar-recibo"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center text-sm font-bold text-blue-700 shadow-sm"
          >
            <FileSearch size={17} />
            Entenda seu recibo
          </Link>
          <Link
            href="/eventos/cadastro"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-300 bg-yellow-100 px-3 py-3 text-center text-sm font-bold text-yellow-800 shadow-sm"
          >
            <ClipboardList size={17} />
            Criar eventos
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="grid items-center gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-800">
                Soluções para escritórios contábeis
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Automatize processos e ganhe mais tempo na rotina do seu escritório
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Na PalSys, desenvolvemos soluções de automação pensadas especialmente
                para a rotina de escritórios contábeis. Nosso objetivo é facilitar
                tarefas repetitivas, reduzir erros e ganhar tempo no dia a dia.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/assinar"
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-900 hover:brightness-95"
                >
                  Ver produtos
                </Link>

                <Link
                  href="/acesso"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Acessar área do cliente
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#beneficios"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Conhecer benefícios
                </a>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-10 inset-y-8 rounded-full bg-blue-100/60 blur-3xl" />
              <div className="relative">
                <Image
                  src="/comp.png"
                  alt="PalSys automação contábil"
                  width={640}
                  height={380}
                  className="h-auto w-full max-w-[34rem]"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                  <UsersRound size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                    Soluções criadas para a realidade do seu escritório
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
                    Automações pensadas para a rotina de escritórios contábeis, com
                    menos retrabalho e mais consistência operacional.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                  <p className="text-sm leading-7 text-slate-600">
                    Trabalhamos com personalizações sob medida nos sistemas da linha
                    Contmatic, adaptando as automações conforme a necessidade de cada
                    cliente. Isso inclui desde rotinas específicas até processos mais
                    complexos dentro dos sistemas.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                  <p className="text-sm leading-7 text-slate-600">
                    Também realizamos alterações e cadastros em massa, agilizando
                    atividades que normalmente levariam horas para serem feitas
                    manualmente. Com isso, sua equipe pode focar no que realmente
                    importa: análise, atendimento e crescimento do negócio.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                  <p className="text-sm leading-7 text-slate-600">
                    Se você busca mais produtividade, padronização e segurança nos
                    processos, a PalSys pode criar a solução ideal para o seu
                    escritório.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/assinar"
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-900 hover:brightness-95"
                >
                  Ver produtos
                </Link>
                <Link
                  href="/acesso"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Entrar na plataforma
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-slate-900 p-8 text-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.65)]">
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                Como a PalSys ajuda no dia a dia
              </h2>

              <div className="mt-7 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
                    <Target size={20} />
                  </div>
                  <div>
                    <strong className="text-lg">Rotinas sob medida</strong>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Automatizamos tarefas conforme a realidade operacional do
                      escritório e dos clientes atendidos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-300">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <strong className="text-lg">Alterações e cadastros em massa</strong>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Reduza horas de digitação manual em processos repetitivos dentro
                      dos sistemas contábeis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200/15 text-slate-100">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <strong className="text-lg">Padronização e segurança</strong>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Mais consistência nas entregas, menos retrabalho e menor risco
                      de falhas humanas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid items-center gap-7 overflow-hidden rounded-[1.75rem] bg-slate-900 p-8 text-white shadow-xl md:grid-cols-[auto_1fr_auto] md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-slate-950">
            <FileSearch size={28} />
          </div>
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">Novo autoatendimento</span>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Não entendeu seu holerite, férias ou rescisão?</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Envie o documento e receba uma explicação simples dos valores e cálculos, sem cadastro.
            </p>
          </div>
          <Link
            href="/explicar-recibo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:brightness-95"
          >
            Explicar meu documento
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section id="beneficios" className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Benefícios</h2>
          <p className="mt-4 text-lg text-slate-600">
            Mais agilidade, mais organização e menos retrabalho nas rotinas do escritório.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {beneficios.map((beneficio) => {
            const Icone = beneficio.icone
            return (
              <div
                key={beneficio.titulo}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                  <Icone size={24} />
                </div>

                <h3 className="mt-4 text-xl font-semibold text-slate-900">{beneficio.titulo}</h3>

                <p className="mt-3 leading-7 text-slate-600">{beneficio.descricao}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[1.75rem] border border-blue-100 bg-white p-8 shadow-sm">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
              Privacidade e processamento local
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Seus arquivos permanecem no ambiente definido pelo cliente
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              As soluções da PalSys foram desenvolvidas para operar, sempre que aplicável,
              no ambiente local do cliente. Os arquivos processados não são enviados nem
              armazenados em servidores da PalSys, salvo quando a própria funcionalidade
              exigir integração externa configurada pelo usuário.
            </p>
            <div className="mt-6">
              <Link
                href="/privacidade-dos-sistemas"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Entender como os dados são tratados
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="produtos" className="scroll-mt-28 border-y bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-yellow-700">
                Automações PalSys
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                Veja como cada solução funciona antes de escolher
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Conheça o que cada produto automatiza, os ganhos para a rotina do escritório e assista à demonstração sem sair da página.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-800">
              Vídeos demonstrativos
            </span>
          </div>

          <div className="mt-10 space-y-6">
            {produtosCatalogo.map((produto) => {
              const Icone = produto.icone
              const videoEmbedUrl = getVideoEmbedUrl(produto.ref)
              const highlights = productHighlights[produto.ref] ?? []

              return (
                <article
                  key={produto.ref}
                  className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_-44px_rgba(15,23,42,0.38)] lg:grid-cols-[1.06fr_0.94fr]"
                >
                  <div className="p-6 md:p-8 lg:p-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                        <Icone size={24} />
                      </div>

                      {produto.status === "em_breve" && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          Em breve
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                      {produto.nome}
                    </h3>

                    <p className="mt-4 text-base leading-7 text-slate-600">{produto.descricao}</p>

                    {highlights.length > 0 ? (
                      <ul className="mt-6 space-y-3">
                        {highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-3 text-sm leading-6 text-slate-700 md:text-base">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>{resumoPrivacidadeProduto}</span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/assinar"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95"
                      >
                        Conhecer planos
                        <ArrowRight size={17} />
                      </Link>
                      <a
                        href="#contato"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Tirar dúvidas
                      </a>
                    </div>
                  </div>

                  <div className="order-first flex min-h-full items-center bg-slate-950 p-4 sm:p-6 lg:order-none lg:p-8">
                    {videoEmbedUrl ? (
                      <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
                        <div className="aspect-video">
                          <iframe
                            className="h-full w-full"
                            src={videoEmbedUrl}
                            title={`Demonstração: ${produto.nome}`}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm">
                          <span className="font-semibold text-white">Veja a solução funcionando</span>
                          <span className="text-slate-400">Demonstração em vídeo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-slate-600 text-center text-slate-300">
                        Demonstração em preparação
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/assinar"
              className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-900 hover:brightness-95"
            >
              Ir para assinatura
            </Link>
            <Link
              href="/acesso"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Entrar para acessar funções
            </Link>
          </div>
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl bg-slate-900 px-8 py-12 text-white">
          <h2 className="text-3xl font-bold">Fale com a PalSys</h2>

          <p className="mt-4 text-slate-300">Envie sua dúvida ou solicite mais informações.</p>

          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <form action="https://api.web3forms.com/submit" method="POST" className="space-y-4">
              <input
                type="hidden"
                name="access_key"
                value="24e32c4c-6fa3-4d50-b745-7153ffc77743"
              />
              <input type="hidden" name="subject" value="Novo contato PalSys" />
              <input type="hidden" name="from_name" value="Site PalSys" />

              <input
                type="text"
                name="name"
                required
                placeholder="Seu nome"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <input
                type="email"
                name="email"
                required
                placeholder="Seu e-mail"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <textarea
                name="message"
                required
                rows={4}
                placeholder="Digite sua mensagem..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:brightness-95"
              >
                Enviar mensagem
              </button>
            </form>

            <div>
              <h3 className="text-xl font-semibold">Contato direto</h3>

              <div className="mt-6 space-y-4">
                <p>
                  <strong>E-mail:</strong>
                  <br />
                  <a href="mailto:ricardopalombo@bol.com.br" className="hover:text-yellow-400">
                    ricardopalombo@bol.com.br
                  </a>
                </p>

                <p>
                  <strong>WhatsApp:</strong>
                  <br />
                  <a
                    href="https://wa.me/5512997952482"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-400"
                  >
                    +55 12 99795-2482
                  </a>
                </p>
              </div>

              <a
                href="https://wa.me/5512997952482"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-xl bg-green-500 px-6 py-3 font-bold hover:brightness-95"
              >
                Falar no WhatsApp
              </a>

              <div className="mt-6 text-sm text-slate-300">
                <Link href="/privacidade-dos-sistemas" className="underline underline-offset-4 hover:text-white">
                  Como a PalSys trata arquivos e dados processados
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <a
        href="https://wa.me/5512997952482"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 rounded-full bg-green-500 px-5 py-4 text-white shadow-lg hover:brightness-95"
      >
        WhatsApp
      </a>
    </div>
  )
}
