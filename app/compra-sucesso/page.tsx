"use client"

import Link from "next/link"
import { CheckCircle, Mail, Download, KeyRound } from "lucide-react"

export default function CompraSucessoPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
        
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-12">

          {/* Ícone topo */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Texto principal */}
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold md:text-4xl">
              Compra realizada com sucesso!
            </h1>

            <p className="mt-4 text-gray-600 text-lg">
              Seu pagamento foi aprovado.
            </p>

            <p className="mt-4 text-gray-600 text-lg">
              Em breve você receberá um <strong>e-mail</strong> com sua{" "}
              <strong>chave de acesso</strong> e também o{" "}
              <strong>link para download do sistema</strong>.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Caso não encontre o e-mail, verifique a caixa de spam.
            </p>
          </div>

          {/* Cards */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border p-5 text-center">
              <Mail className="mx-auto mb-3 h-8 w-8 text-blue-600" />
              <h2 className="font-semibold">Envio automático</h2>
              <p className="text-sm text-gray-600 mt-2">
                Você receberá tudo no e-mail cadastrado.
              </p>
            </div>

            <div className="rounded-2xl border p-5 text-center">
              <KeyRound className="mx-auto mb-3 h-8 w-8 text-blue-600" />
              <h2 className="font-semibold">Chave de acesso</h2>
              <p className="text-sm text-gray-600 mt-2">
                Utilize para ativar o sistema.
              </p>
            </div>

            <div className="rounded-2xl border p-5 text-center">
              <Download className="mx-auto mb-3 h-8 w-8 text-blue-600" />
              <h2 className="font-semibold">Download</h2>
              <p className="text-sm text-gray-600 mt-2">
                Link direto enviado por e-mail.
              </p>
            </div>

          </div>

          {/* Botões */}
          <div className="mt-10 flex justify-center gap-3 flex-wrap">
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              Voltar ao início
            </Link>

            <Link
              href="/assinar"
              className="rounded-xl border px-6 py-3 font-semibold hover:bg-gray-100 transition"
            >
              Ver planos
            </Link>
          </div>

        </div>
      </section>
    </main>
  )
}
