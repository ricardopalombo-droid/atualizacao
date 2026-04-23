import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { EmployeeOnboardingForm } from "@/components/employee-onboarding-form"

export default async function CadastrosPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("palsys_session")

  if (!session || session.value !== "authenticated") {
    redirect("/acesso")
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
              Preencha os dados em etapas, aprove o cadastro e conclua o fluxo internamente dentro
              da própria área da PalSys.
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
