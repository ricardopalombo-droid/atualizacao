import Link from "next/link"
import { redirect } from "next/navigation"
import { Building2, CheckCircle2, ClipboardList, Database, FileSpreadsheet, Shield } from "lucide-react"
import { listEmployeeRecords } from "@/lib/cadastro-repository"
import { workflowStatusLabels, type WorkflowStatus } from "@/lib/employee-form-config"
import { LogoutButton } from "@/components/logout-button"
import { getCurrentSession } from "@/lib/auth-session"

export default async function PainelPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/acesso")
  }

  const records =
    session.role === "palsys_admin"
      ? []
      : await listEmployeeRecords(20, {
          subscriberId: session.subscriberId,
          clientId: session.clientId,
        })

  const funcoes =
    session.role === "palsys_admin"
      ? [
          {
            titulo: "Assinantes da plataforma",
            descricao: "Administre a base de escritorios e empresas assinantes da PalSys.",
            href: "/painel/assinantes",
            icone: Shield,
            acao: "Gerenciar assinantes",
          },
        ]
      : session.role === "subscriber_admin"
        ? [
            {
              titulo: "Carteira de clientes",
              descricao: "Cadastre e mantenha as empresas atendidas por este escritorio.",
              href: "/painel/clientes",
              icone: Building2,
              acao: "Gerenciar clientes",
            },
          ]
        : [
            {
              titulo: "Cadastro de funcionarios",
              descricao: "Acompanhe convites, revise dados e finalize os cadastros da empresa.",
              href: "/painel/cadastros",
              icone: ClipboardList,
              acao: "Abrir modulo",
            },
            {
              titulo: "Exportacao de planilha",
              descricao: "Gere arquivos para conferencia interna ou para processos externos da empresa.",
              href: "/painel/cadastros",
              icone: FileSpreadsheet,
              acao: "Ir para exportacao",
            },
            {
              titulo: "Conferencia interna",
              descricao: "Valide o que foi preenchido pelo funcionario antes do envio ao escritorio.",
              href: "/painel/cadastros",
              icone: CheckCircle2,
              acao: "Concluir no painel",
            },
            {
              titulo: "Bases importadas",
              descricao: "Mantenha cargos, horarios e sindicatos da empresa alinhados ao cadastro.",
              href: "/painel/referencias",
              icone: Database,
              acao: "Gerenciar bases",
            },
          ]

  const badgeByRole =
    session.role === "palsys_admin"
      ? "Painel PalSys"
      : session.role === "subscriber_admin"
        ? "Painel do assinante"
        : "Painel do cliente"

  const titleByRole =
    session.role === "palsys_admin"
      ? "Operacao administrativa da plataforma"
      : session.role === "subscriber_admin"
        ? "Operacao da carteira do escritorio"
        : "Operacao de cadastros da empresa"

  const descriptionByRole =
    session.role === "palsys_admin"
      ? "Este acesso administra a plataforma, os assinantes e os limites contratados."
      : session.role === "subscriber_admin"
        ? "Este acesso administra clientes, acompanha a fila do Phoenix e opera a carteira do escritorio."
        : "Este acesso administra os funcionarios da empresa, revisa os dados recebidos e prepara o envio ao escritorio."

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              {badgeByRole}
            </span>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">{titleByRole}</h1>
            <p className="mt-3 max-w-3xl text-slate-600">{descriptionByRole}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Usuario logado: {session.displayName} ({session.email})
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Voltar ao site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className={`grid gap-6 ${funcoes.length === 1 ? "md:grid-cols-1 xl:grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
          {funcoes.map((funcao) => {
            const Icone = funcao.icone

            return (
              <article
                key={funcao.titulo}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                  <Icone size={24} />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">{funcao.titulo}</h2>
                <p className="mt-3 leading-7 text-slate-600">{funcao.descricao}</p>
                <Link
                  href={funcao.href}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  {funcao.acao}
                </Link>
              </article>
            )
          })}
        </div>

        {session.role !== "palsys_admin" ? (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {session.role === "subscriber_admin" ? "Cadastros da carteira" : "Cadastros da empresa"}
                </h2>
                <p className="mt-2 text-slate-600">
                  {session.role === "subscriber_admin"
                    ? "Visao resumida dos registros vinculados aos clientes do assinante."
                    : "Visao resumida dos registros vinculados a empresa logada."}
                </p>
              </div>
              {session.role === "client_user" ? (
                <Link
                  href="/painel/cadastros"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Novo cadastro
                </Link>
              ) : null}
            </div>

            {records.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                Ainda nao ha cadastros salvos neste escopo.
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-sm font-semibold text-slate-700">
                      <th className="px-4 py-3">Funcionario</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Atualizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {records.map((record) => (
                      <tr key={record.id} className="text-sm text-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {record.employee_name || "Sem nome informado"}
                        </td>
                        <td className="px-4 py-3">
                          {record.employee_email || record.invite_email || "Sem e-mail"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                            {workflowStatusLabels[record.workflow_status as WorkflowStatus] ?? record.workflow_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDateTime(record.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </main>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
