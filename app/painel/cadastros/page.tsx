import Link from "next/link"
import { redirect } from "next/navigation"
import { EmployeeOnboardingForm } from "@/components/employee-onboarding-form"
import { EmployeeRecordsList } from "@/components/employee-records-list"
import { getCurrentSession } from "@/lib/auth-session"
import { getReferenceCatalogSummary } from "@/lib/reference-catalog"
import { getClientRecordById, listClientRecords } from "@/lib/client-repository"

export default async function CadastrosPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; clientId?: string }>
}) {
  const session = await getCurrentSession()
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  if (!session) {
    redirect("/acesso")
  }

  if (!["client_user", "subscriber_admin"].includes(session.role)) {
    redirect("/painel")
  }

  const canManage = session.role === "subscriber_admin"
  const clients = canManage && session.subscriberId ? await listClientRecords(session.subscriberId) : []
  const selectedClientId = canManage
    ? resolvedSearchParams?.clientId ?? clients[0]?.id ?? null
    : session.clientId

  if (!selectedClientId) redirect("/painel/clientes")

  const selectedClient = canManage && session.subscriberId
    ? await getClientRecordById(session.subscriberId, selectedClientId)
    : null

  if (canManage && !selectedClient) redirect("/painel/clientes")

  const lookupCatalog = selectedClientId
    ? await getReferenceCatalogSummary(selectedClientId)
    : { cargo: [], horario: [], sindicato: [] }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              {canManage ? "Operação do escritório/DP" : "Consulta da empresa"}
            </span>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Painel de cadastros de funcionários</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              {canManage
                ? `Cadastros da empresa ${selectedClient?.name ?? "selecionada"}: envie convites, revise documentos e conclua os dados internos.`
                : "A empresa pode consultar os cadastros e documentos. A revisão e a finalização são realizadas pelo DP."}
            </p>
          </div>

          <Link
            href="/painel"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar ao painel
          </Link>
        </div>

        {canManage && clients.length > 1 ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="text-sm font-semibold text-slate-700" htmlFor="client-selector">Empresa</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {clients.map((client) => (
                <Link key={client.id} href={`/painel/cadastros?clientId=${encodeURIComponent(client.id)}`} className={`rounded-lg px-3 py-2 text-sm font-semibold ${client.id === selectedClientId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                  {client.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-6">
          <EmployeeRecordsList clientId={selectedClientId} canManage={canManage} />
        </div>

        {canManage || resolvedSearchParams?.id ? (
          <EmployeeOnboardingForm
            initialRecordId={resolvedSearchParams?.id ?? null}
            clientId={selectedClientId}
            canManage={canManage}
            lookupCatalog={lookupCatalog}
          />
        ) : null}
      </div>
    </main>
  )
}
