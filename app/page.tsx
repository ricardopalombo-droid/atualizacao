import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Cog,
  ShieldCheck,
  Target,
  UsersRound,
  Zap,
} from "lucide-react"
import { PRODUTOS } from "@/lib/produtos"

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image src="/logo-palsys.png" alt="PalSys" width={180} height={50} priority />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/" className="transition hover:text-yellow-600">
              Início
            </Link>
            <a href="#beneficios" className="transition hover:text-yellow-600">
              Benefícios
            </a>
            <a href="#produtos" className="transition hover:text-yellow-600">
              Produtos
            </a>
            <a href="#contato" className="transition hover:text-yellow-600">
              Contato
            </a>
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

      <section id="produtos" className="border-y bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Produtos</h2>
            <p className="mt-4 text-lg text-slate-600">
              Escolha a automação ideal para a necessidade do seu escritório.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRODUTOS.map((produto) => {
              const Icone = produto.icone

              return (
                <div
                  key={produto.ref}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icone size={24} />
                    </div>

                    {produto.status === "em_breve" && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        Em breve
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold leading-7 text-slate-900">
                    {produto.nome}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">{produto.descricao}</p>
                </div>
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
