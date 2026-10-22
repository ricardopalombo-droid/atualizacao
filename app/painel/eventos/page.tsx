import Link from "next/link"
import { redirect } from "next/navigation"
import { ContmaticEventCreator } from "@/components/contmatic-event-creator"
import { getCurrentSession } from "@/lib/auth-session"

export default async function EventosPage() {
  const session = await getCurrentSession()
  if (!session) redirect("/acesso")
  if (session.role !== "palsys_admin") redirect("/painel")

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-yellow-400/15 px-4 py-1 text-sm font-bold text-yellow-300">
                Folha de pagamento
              </span>
              <h1 className="mt-4 text-4xl font-bold">Criador de eventos Contmatic</h1>
              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                Descreva o cálculo, revise somente o evento novo e baixe um JSON para importar no Phoenix.
              </p>
            </div>
            <Link
              href="/painel"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-bold text-white hover:bg-white/10"
            >
              Voltar ao painel
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <ContmaticEventCreator />
      </section>
    </main>
  )
}
