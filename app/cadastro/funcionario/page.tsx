import { EmployeeOnboardingForm } from "@/components/employee-onboarding-form"

export default async function CadastroFuncionarioPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const token = resolvedSearchParams?.token ?? null

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <span className="inline-flex rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-slate-900">
            Link do funcionário
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Preencha seu cadastro básico</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Nesta etapa você informa apenas seus dados pessoais, endereço, documentos e dependentes.
            Os campos internos da empresa serão revisados e completados depois pelo cliente.
          </p>
        </div>

        {token ? (
          <EmployeeOnboardingForm variant="employee" publicToken={token} />
        ) : (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-red-700 shadow-sm">
            Link inválido ou incompleto. Peça um novo convite ao responsável da empresa.
          </div>
        )}
      </div>
    </main>
  )
}
