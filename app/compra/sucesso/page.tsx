import Link from "next/link"
import { CheckCircle2, Download } from "lucide-react"

type Props = {
  searchParams: Promise<{ tipo?: string | string[] }>
}

export default async function CompraSucessoPage({ searchParams }: Props) {
  const params = await searchParams
  const isCredits = params.tipo === "creditos"
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h1 className="text-3xl font-black text-slate-900">Pagamento aprovado</h1>
        <p className="mt-4 text-slate-600">
          Seu pagamento foi recebido. Os créditos serão vinculados à licença e a confirmação será enviada por e-mail.
        </p>
        {isCredits ? (
          <a
            href="/api/download/auditor-integrado"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 font-black text-white hover:bg-blue-800"
          >
            <Download size={20} />
            Baixar o PalSys Auditor Integrado
          </a>
        ) : null}
        <Link href="/" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
