import Link from "next/link"
import { redirect } from "next/navigation"
import { EmployeeOnboardingForm } from "@/components/employee-onboarding-form"
import { EmployeeRecordsList } from "@/components/employee-records-list"
import { getCurrentSession } from "@/lib/auth-session"
import { getReferenceCatalogSummary } from "@/lib/reference-catalog"

export default async function CadastrosPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>
}) {
  const session = await getCurrentSession()
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  if (!session) {
    redirect("/acesso")
  }

  if (session.role !== "client_user") {
    redirect("/painel")
  }

  const lookupCatalog = session.clientId
    ? await getReferenceCatalogSummary(session.clientId)
    : { cargo: [], horario: [], sindicato: [] }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              Operação da empresa
            </span>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Painel de cadastros de funcionários</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Esta área é destinada à empresa cliente para convidar funcionários, revisar informações e concluir a parte interna do cadastro.
            </p>
          </div>

          <Link
            href="/painel"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar ao painel
          </Link>
        </div>

        <div className="mb-6">
          <EmployeeRecordsList />
        </div>

        <EmployeeOnboardingForm
          initialRecordId={resolvedSearchParams?.id ?? null}
          lookupCatalog={lookupCatalog}
        />
      </div>
    </main>
  )
}
