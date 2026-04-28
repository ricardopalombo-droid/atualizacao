import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ClientDefaultsForm } from "@/components/client-defaults-form"
import { getCurrentSession } from "@/lib/auth-session"
import { getClientRecordById } from "@/lib/client-repository"
import { getReferenceCatalogSummary } from "@/lib/reference-catalog"

export default async function ClientePadroesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getCurrentSession()
  const resolvedParams = await params

  if (!session) {
    redirect("/acesso")
  }

  if (session.role !== "subscriber_admin" || !session.subscriberId) {
    redirect("/painel")
  }

  const client = await getClientRecordById(session.subscriberId, resolvedParams.id)

  if (!client) {
    notFound()
  }

  const lookupCatalog = await getReferenceCatalogSummary(client.id)

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              Operacao do assinante
            </span>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">Padroes contabeis de {client.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Configure aqui os valores internos que normalmente se repetem nesta empresa. Esses padroes vao acelerar a revisao do cadastro pela empresa cliente.
            </p>
          </div>

          <Link
            href="/painel/clientes"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar para clientes
          </Link>
        </div>

        <ClientDefaultsForm client={client} lookupCatalog={lookupCatalog} />
      </div>
    </main>
  )
}
