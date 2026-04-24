import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CheckCircle2, ClipboardList, FileSpreadsheet } from "lucide-react"
import { listEmployeeRecords } from "@/lib/cadastro-repository"
import { workflowStatusLabels, type WorkflowStatus } from "@/lib/employee-form-config"
import { LogoutButton } from "@/components/logout-button"

const funcoes = [
  {
    titulo: "Cadastro de funcionários",
    descricao: "Preencha os dados cadastrais em abas e organize o envio para integração.",
    href: "/painel/cadastros",
    icone: ClipboardList,
    acao: "Abrir módulo",
  },
  {
    titulo: "Exportação de planilha",
    descricao: "Gere um arquivo com os dados preenchidos para revisão ou importação.",
    href: "/painel/cadastros",
    icone: FileSpreadsheet,
    acao: "Ir para exportação",
  },
  {
    titulo: "Conferência interna",
    descricao: "Finalize o fluxo do cadastro dentro da própria área interna da PalSys.",
    href: "/painel/cadastros",
    icone: CheckCircle2,
    acao: "Concluir no painel",
  },
]

export default async function PainelPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("palsys_session")

  if (!session || session.value !== "authenticated") {
    redirect("/acesso")
  }

  const records = await listEmployeeRecords()

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1 text-sm font-bold text-yellow-800">
              Painel interno
            </span>
            <h1 className="mt-4 text-4xl font-bold text-slate-900">Funções liberadas após o login</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              O usuário autenticado pode acessar os módulos disponíveis da PalSys em um ambiente
              interno do próprio site.
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
        <div className="grid gap-6 md:grid-cols-3">
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

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Cadastros salvos</h2>
              <p className="mt-2 text-slate-600">
