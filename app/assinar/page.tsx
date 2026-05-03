"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { PRODUTOS } from "@/lib/produtos"

type ProdutoAssinavel = {
  nome: string
  preco: number
  ref: string
}

export default function PalSysAssinaturaPage() {
  const [activeProduct, setActiveProduct] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [videoAberto, setVideoAberto] = useState<string | null>(null)

  function getVideoId(ref: string) {
    if (ref === "whats-001") return "-E7dx82H91E"
    if (ref === "email-001") return "dGGHX6In-vs"
    if (ref === "dre-001") return "EJy_oIlakBw"
    if (ref === "fgts-001") return "SBBBMZVABLQ"
    if (ref === "ecac-001") return "lovnQ4FBrzw"
    if (ref === "funcionarios-001") return "LW7mJt-iEFk"
    return null
  }

  async function assinarProduto(produto: ProdutoAssinavel) {
    try {
      const nomeLimpo = nome.trim()
      const emailLimpo = email.trim()

      if (!nomeLimpo) {
        alert("Informe seu nome.")
        return
      }

      if (!emailLimpo) {
        alert("Informe seu e-mail.")
        return
      }

      setActiveProduct(produto.ref)

      const response = await fetch("/api/mercadopago/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeLimpo,
          reason: produto.nome,
          price: produto.preco,
          email: emailLimpo,
          externalReference: produto.ref,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`Erro ao criar assinatura: ${JSON.stringify(data)}`)
        setActiveProduct(null)
        return
      }

      const url = data.init_point || data.sandbox_init_point

      if (!url) {
        alert("Não veio URL do Mercado Pago")
        setActiveProduct(null)
        return
      }

      window.location.href = url
    } catch (error) {
      alert("Erro ao iniciar assinatura")
      setActiveProduct(null)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-palsys.png"
              alt="PalSys"
              width={170}
              height={48}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-yellow-600 transition">
              Início
            </Link>
            <Link href="/assinar" className="hover:text-yellow-600 transition">
              Assinar
            </Link>
            <a
              href="mailto:ricardopalombo@bol.com.br"
              className="hover:text-yellow-600 transition"
            >
              E-mail
            </a>
            <a
              href="https://wa.me/5512997952482"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-600 transition"
            >
              WhatsApp
            </a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-10 px-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Assinaturas PalSys
          </h1>
          <p className="text-slate-600 mb-8">
            Preencha seus dados abaixo e escolha o produto que deseja assinar.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Seus dados</h2>
          <p className="mt-2 text-slate-600">
            Esses dados serão usados na assinatura e no envio da sua licença.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="nome"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRODUTOS.map((produto) => {
            const Icone = produto.icone
            const carregando = activeProduct === produto.ref
            const indisponivel = produto.status === "em_breve"
            const videoId = getVideoId(produto.ref)

            return (
              <div
                key={produto.ref}
                className="border border-slate-200 rounded-2xl p-6 shadow-sm bg-white transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icone size={24} />
                  </div>

                  {indisponivel && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      Em breve
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-semibold leading-7">
                  {produto.nome}
                </h2>

                <p className="mt-3 text-slate-600 leading-7">
                  {produto.descricao}
                </p>

                {videoId && (
                  <button
                    onClick={() => setVideoAberto(videoId)}
                    className="mt-4 w-full rounded-xl border border-slate-300 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    ▶ Ver demonstração
                  </button>
                )}

                <p className="mt-5 text-orange-500 font-bold text-lg">
                  R$ {produto.preco.toFixed(2).replace(".", ",")}/mês
                </p>

                {indisponivel ? (
                  <>
                    <button
                      disabled
                      className="mt-5 w-full rounded-xl py-3 font-bold bg-slate-300 text-slate-600 cursor-not-allowed"
                    >
                      Em breve
                    </button>

                    <div className="mt-3 text-sm text-slate-500">
                      Este produto ainda não está liberado para assinatura.
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        assinarProduto({
                          nome: produto.nome,
                          preco: produto.preco,
                          ref: produto.ref,
                        })
                      }
                      disabled={!!activeProduct}
                      className="mt-5 w-full bg-yellow-400 rounded-xl py-3 font-bold hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {carregando
                        ? "Iniciando assinatura..."
                        : "Assinar com Mercado Pago"}
                    </button>

                    {carregando && (
                      <div className="mt-3 text-green-600 text-sm">
                        Aguarde, você será redirecionado...
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-12 rounded-2xl border bg-slate-50 p-6">
          <h2 className="text-xl font-bold">Contato</h2>

          <div className="mt-4 space-y-2 text-slate-700">
            <p>
              <span className="font-semibold">E-mail:</span>{" "}
              <a
                href="mailto:ricardopalombo@bol.com.br"
                className="hover:text-yellow-600"
              >
                ricardopalombo@bol.com.br
              </a>
            </p>

            <p>
              <span className="font-semibold">WhatsApp:</span>{" "}
              <a
                href="https://wa.me/5512997952482"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-600"
              >
                +55 12 99795-2482
              </a>
            </p>
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/5512997952482"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-4 rounded-full shadow-lg hover:brightness-95"
      >
        WhatsApp
      </a>

      {videoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <button
              onClick={() => setVideoAberto(null)}
              className="absolute right-3 top-2 z-10 text-3xl font-bold text-white hover:opacity-80"
            >
              ×
            </button>

            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoAberto}`}
                title="Demonstração do produto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
