import Link from "next/link"
import { redirect } from "next/navigation"
import { ClientManagement } from "@/components/client-management"
import { getCurrentSession } from "@/lib/auth-session"
import { getSubscriberRecord } from "@/lib/subscriber-repository"

export default async function ClientesPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/acesso")
  }

  if (session.role !== "subscriber_admin" || !session.subscriberId) {
    redirect("/painel")
  }

  const subscriber = await getSubscriberRecord(session.subscriberId)

  if (!subscriber) {
    redirect("/painel")
  }

  const pageTitle = subscriber.subscriber_type === "accounting_office"
    ? "Clientes do escritório"
    : subscriber.subscriber_type === "business_group"
      ? "Empresas do grupo"
      : "Minha empresa"
  const pageDescription = subscriber.subscriber_type === "accounting_office"
    ? "Cadastre as empresas atendidas pelo escritório e mantenha separado o código Contmatic de cada cliente."
    : subscriber.subscriber_type === "business_group"
      ? "Cadastre matriz, filiais e outras empresas do grupo. Cada código Contmatic corresponde a uma empresa separada."
      : "Mantenha os dados da empresa e o código usado para gerar o script no destino correto da Contmatic."

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              Operação do assinante
            </span>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              {pageDescription}
            </p>
          </div>

          <Link
            href="/painel"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar ao painel
          </Link>
        </div>

        <ClientManagement subscriberType={subscriber.subscriber_type} />
      </div>
    </main>
  )
}
