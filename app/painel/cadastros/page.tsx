import Link from "next/link"
import { redirect } from "next/navigation"
import { EmployeeOnboardingForm } from "@/components/employee-onboarding-form"
import { getCurrentSession } from "@/lib/auth-session"

export default async function CadastrosPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/acesso")
  }

  if (session.role !== "client_user") {
    redirect("/painel")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              Módulo interno
            </span>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">Cadastro de funcionários</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Dispare o link para o funcionário, acompanhe o retorno do cadastro básico e finalize
              a parte interna do cliente antes de exportar a planilha.
            </p>
          </div>

          <Link
            href="/painel"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar ao painel
          </Link>
        </div>

        <EmployeeOnboardingForm />
      </div>
    </main>
  )
}
