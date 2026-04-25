import Link from "next/link"
import { redirect } from "next/navigation"
import { ReferenceCatalogManagement } from "@/components/reference-catalog-management"
import { getCurrentSession } from "@/lib/auth-session"

export default async function ReferenciasPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/acesso")
  }

  if (session.role !== "subscriber_admin") {
    redirect("/painel")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              Modulo interno
            </span>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">Bases importadas do sistema</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Importe os PDFs de cargos, horarios e sindicatos para alimentar as listas usadas pelos
              clientes no cadastro de funcionarios.
            </p>
          </div>

          <Link
            href="/painel"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar ao painel
          </Link>
        </div>

        <ReferenceCatalogManagement />
      </div>
    </main>
  )
}
