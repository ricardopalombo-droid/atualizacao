import Link from "next/link"
import { SetupPasswordForm } from "@/components/setup-password-form"

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = String(params.token ?? "")

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <span className="inline-flex rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-slate-900">
            Primeiro acesso
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight">
            Defina a senha do seu painel
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
            Use este link para criar a senha do escritório e concluir seu acesso ao sistema.
          </p>
          <div className="mt-8">
            <Link
              href="/acesso"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Voltar para o login
            </Link>
          </div>
        </section>

        <SetupPasswordForm token={token} />
      </div>
    </main>
  )
}
