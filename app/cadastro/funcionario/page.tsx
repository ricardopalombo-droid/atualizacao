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
            Area do funcionario
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Preencha seu cadastro inicial</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Esta etapa pertence ao funcionario e serve para informar dados pessoais, endereco, documentos e dependentes. Os dados internos da empresa serao revisados e completados depois pela equipe responsavel.
          </p>
        </div>

        {token ? (
          <EmployeeOnboardingForm variant="employee" publicToken={token} />
        ) : (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-red-700 shadow-sm">
            Link invalido ou incompleto. Solicite um novo convite a empresa responsavel pelo cadastro.
          </div>
        )}
      </div>
    </main>
  )
}
