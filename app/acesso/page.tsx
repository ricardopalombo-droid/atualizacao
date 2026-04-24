import Link from "next/link"
import { LoginForm } from "@/components/login-form"

export default function AcessoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <span className="inline-flex rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-slate-900">
            Área restrita PalSys
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight">
            Faça login para acessar as funções do sistema
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
            O assinante administra os próprios clientes. Cada cliente tem login separado e só pode
            cadastrar funcionários vinculados à sua própria empresa.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Voltar para o site
            </Link>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  )
}
