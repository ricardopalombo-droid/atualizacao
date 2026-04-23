import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Cog, ShieldCheck, Zap } from "lucide-react"
import { PRODUTOS } from "@/lib/produtos"

const beneficios = [
  {
    titulo: "Mais produtividade",
    descricao:
      "Com as rotinas automatizadas, em horários alternativos as rotinas podem ser executadas.",
    icone: Zap,
  },
  {
    titulo: "Menos erros",
    descricao:
      "A padronização dos processos reduz falhas manuais e aumenta a consistência das entregas.",
    icone: ShieldCheck,
  },
  {
    titulo: "Rotinas automatizadas",
    descricao:
      "Tarefas repetitivas passam a ser executadas de forma prática, rápida e organizada.",
    icone: Cog,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
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

      <section className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="max-w-4xl">
            <span className="inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-800">
              Soluções para escritórios contábeis
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Automatize processos e ganhe mais tempo na rotina do seu escritório
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              A PalSys oferece ferramentas práticas para automatizar rotinas fiscais, contábeis e
              operacionais, reduzindo retrabalho e trazendo mais produtividade para o dia a dia.
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
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Conhecer benefícios
              </a>
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
