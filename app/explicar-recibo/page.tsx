import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BadgeHelp, FileCheck2, ShieldCheck } from "lucide-react"
import { ReceiptAnalyzer, ReceiptPrivacyNotice } from "@/components/receipt-analyzer"

export const metadata: Metadata = {
  title: "Entenda seu holerite, férias ou rescisão | PalSys",
  description: "Envie seu documento e receba uma explicação simples dos valores e cálculos, sem cadastro.",
}

export default function ExplainReceiptPage() {
  const turnstileSiteKey = String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image src="/logo-palsys.png" alt="PalSys" width={160} height={45} className="h-auto" priority />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-800">
            <BadgeHelp className="h-4 w-4" /> Explicação simples e sem cadastro
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
            Entenda os valores do seu holerite, férias ou rescisão
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Envie o documento e veja, em linguagem simples, de onde vêm os vencimentos, descontos,
            impostos e o valor líquido — sem depender do departamento pessoal e sem criar cadastro.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"><FileCheck2 className="h-4 w-4" /> Até 5 documentos relacionados</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"><ShieldCheck className="h-4 w-4" /> Arquivo não salvo pela PalSys</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <ReceiptAnalyzer turnstileSiteKey={turnstileSiteKey} />
        <section className="mt-12 print:hidden">
          <h2 className="mb-5 text-center text-2xl font-bold text-slate-950">Como cuidamos do seu documento</h2>
          <ReceiptPrivacyNotice />
        </section>
      </div>
    </main>
  )
}

