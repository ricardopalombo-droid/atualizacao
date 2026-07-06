import Image from "next/image"
import Link from "next/link"

const itensPrivacidade = [
  {
    titulo: "Processamento local sempre que aplicável",
    texto:
      "As soluções da PalSys são desenvolvidas para operar, sempre que aplicável, no ambiente local do cliente, escritório ou empresa contratante. Isso significa que os arquivos utilizados no processamento permanecem no computador, servidor ou pasta configurada pelo próprio usuário.",
  },
  {
    titulo: "Arquivos não são armazenados em servidores da PalSys",
    texto:
      "Os documentos processados pelos sistemas não são enviados nem armazenados em servidores da PalSys, salvo quando a própria funcionalidade contratada exigir integração externa específica e expressamente configurada pelo usuário.",
  },
  {
    titulo: "Leitura temporária para execução da rotina",
    texto:
      "Quando um sistema precisa identificar informações em arquivos, como CPF, CNPJ, nome, competência, códigos ou outros dados operacionais, essa leitura acontece de forma temporária e local, apenas no momento do processamento necessário para a execução da automação.",
  },
  {
    titulo: "Envios externos usam serviços definidos pelo usuário",
    texto:
      "Quando houver envio por e-mail, WhatsApp, APIs oficiais, plataformas de terceiros ou qualquer outro serviço externo, a transmissão ocorrerá exclusivamente pelos serviços configurados, contratados ou autorizados pelo próprio usuário.",
  },
  {
    titulo: "Históricos e registros operacionais",
    texto:
      "Quando um sistema mantiver histórico, logs, filas, status ou registros operacionais, essas informações permanecem localmente ou no ambiente da solução contratada, conforme a funcionalidade do produto. A PalSys não mantém cópia remota dos arquivos processados sem necessidade explícita da solução.",
  },
  {
    titulo: "Responsabilidade sobre ambiente e integrações",
    texto:
      "O cliente é responsável pelas pastas monitoradas, pelos provedores de e-mail, pelas integrações externas, pelas credenciais utilizadas e pelos ambientes onde as automações serão executadas. A PalSys fornece a automação, mas não assume posse dos arquivos processados no ambiente do cliente.",
  },
]

export default function PrivacidadeDosSistemasPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo-palsys.png" alt="PalSys" width={180} height={50} priority />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/" className="transition hover:text-yellow-600">
              Início
            </Link>
            <Link href="/assinar" className="transition hover:text-yellow-600">
              Assinar
            </Link>
            <Link href="/acesso" className="transition hover:text-yellow-600">
              Acesso
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
              Privacidade dos sistemas
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Como a PalSys trata arquivos e dados processados
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              A PalSys desenvolve soluções de automação para rotinas contábeis,
              fiscais e administrativas. Sempre que aplicável, essas soluções operam
              localmente no ambiente do cliente, sem envio ou armazenamento dos
              arquivos em servidores da PalSys.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {itensPrivacidade.map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-slate-900">{item.titulo}</h2>
                <p className="mt-3 leading-8 text-slate-600">{item.texto}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <h2 className="text-2xl font-bold text-slate-900">Resumo objetivo</h2>
              <p className="mt-4 leading-8 text-slate-700">
                Os arquivos usados pelas automações permanecem no ambiente definido
                pelo cliente. A PalSys não copia, não armazena e não mantém em nuvem
                os documentos processados, salvo quando uma integração externa fizer
                parte explícita da própria solução contratada.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-2xl font-bold text-slate-900">Importante</h2>
              <p className="mt-4 leading-8 text-slate-700">
                Em produtos que utilizam e-mail, WhatsApp, APIs oficiais, plataformas
                públicas ou serviços de terceiros, o envio acontece pelos serviços
                configurados pelo usuário. Nesses casos, o tratamento das informações
                também depende das políticas e regras desses provedores externos.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <h2 className="text-2xl font-bold">Ficou com dúvida?</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Se quiser entender como um produto específico da PalSys trata arquivos,
                integrações e históricos operacionais, fale com a equipe antes da
                contratação.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/assinar"
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95"
                >
                  Ver produtos
                </Link>
                <a
                  href="https://wa.me/5512997952482"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
