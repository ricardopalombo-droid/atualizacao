"use client"

import Script from "next/script"
import Link from "next/link"
import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileText,
  LoaderCircle,
  Printer,
  ShieldCheck,
  Upload,
} from "lucide-react"

type Analysis = {
  documento_valido: boolean
  tipo_documento: "holerite" | "ferias" | "rescisao" | "desconhecido"
  documentos_considerados: string[]
  competencia: string
  titulo: string
  resumo: {
    total_vencimentos: number | null
    total_descontos: number | null
    valor_liquido: number | null
  }
  itens: Array<{
    descricao: string
    categoria: "vencimento" | "desconto" | "informativo"
    referencia: string
    valor: number
  }>
  calculos: Array<{
    titulo: string
    explicacao: string
    etapas: Array<{
      descricao: string
      base: number | null
      aliquota: number | null
      operacao: string
      valor: number
    }>
    total: number | null
    status: "confere" | "diverge" | "informativo"
  }>
  pendencias: string[]
  alertas: string[]
  conclusao: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          "expired-callback": () => void
          "error-callback": () => void
          theme: "light"
          language: string
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const documentLabels = {
  holerite: "Holerite mensal",
  ferias: "Recibo de férias",
  rescisao: "Termo de rescisão",
  desconhecido: "Documento não identificado",
}

export function ReceiptAnalyzer({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [files, setFiles] = useState<File[]>([])
  const [answers, setAnswers] = useState("")
  const [consent, setConsent] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function resetTurnstile() {
    if (window.turnstile) window.turnstile.reset()
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!files.length) return setError("Selecione o holerite, recibo de férias ou termo de rescisão.")
    if (files.length > 5) return setError("Selecione no máximo 5 arquivos.")
    const totalSize = files.reduce((total, file) => total + file.size, 0)
    if (totalSize > 4 * 1024 * 1024) return setError("Os arquivos devem somar no máximo 4 MB.")
    if (!consent) return setError("Marque o consentimento antes de continuar.")
    const browserForm = new FormData(event.currentTarget)
    const securityToken = process.env.NODE_ENV === "development"
      ? "development"
      : String(browserForm.get("cf-turnstile-response") ?? "").trim()
    if (!securityToken) return setError("Conclua a verificação de segurança.")

    setLoading(true)
    try {
      const form = new FormData()
      files.forEach((file) => form.append("arquivos", file))
      form.set("respostas", answers)
      form.set("consentimento", "true")
      form.set("turnstileToken", securityToken)
      const response = await fetch("/api/recibos/analisar", { method: "POST", body: form })
      const body = (await response.json()) as { analise?: Analysis; erro?: string }
      if (!response.ok || !body.analise) {
        throw new Error(body.erro || "Não foi possível analisar o documento.")
      }
      setAnalysis(body.analise)
      document.getElementById("resultado-analise")?.scrollIntoView({ behavior: "smooth" })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível analisar o documento.")
    } finally {
      setLoading(false)
      resetTurnstile()
    }
  }

  return (
    <>
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      )}

      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-9 print:hidden">
        <div className="grid gap-7 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <label htmlFor="receipt-file" className="text-base font-bold text-slate-900">
              1. Selecione o documento
            </label>
            <label
              htmlFor="receipt-file"
              className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-yellow-400 hover:bg-yellow-50/40"
            >
              <Upload className="mb-4 h-9 w-9 text-slate-500" />
              <strong className="text-slate-900">
                {files.length
                  ? `${files.length} ${files.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}`
                  : "Clique para escolher um ou mais arquivos"}
              </strong>
              <span className="mt-2 text-sm text-slate-500">Até 5 PDFs, JPGs ou PNGs · 4 MB no total</span>
              {files.length > 0 && (
                <span className="mt-2 max-w-full text-xs leading-5 text-slate-500">
                  {files.map((file) => file.name).join(" · ")}
                  <br />
                  {(files.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(2).replace(".", ",")} MB no total
                </span>
              )}
              <input
                id="receipt-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                multiple
                className="sr-only"
                onChange={(event) => {
                  setFiles(Array.from(event.target.files ?? []))
                  setAnalysis(null)
                  setError("")
                }}
              />
            </label>
          </div>

          <div>
            <label htmlFor="receipt-answers" className="text-base font-bold text-slate-900">
              2. Informações adicionais <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="receipt-answers"
              value={answers}
              maxLength={2_000}
              onChange={(event) => setAnswers(event.target.value)}
              placeholder="Use este espaço para responder às perguntas que aparecerem ou explicar uma dúvida específica."
              className="mt-3 min-h-48 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
            />
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4 accent-slate-900"
            />
            <span className="text-sm leading-6 text-slate-700">
              Autorizo o envio deste arquivo à OpenAI somente para gerar esta explicação. Sei que a
              PalSys não salvará o documento nem o resultado no histórico. Li as informações de
              privacidade abaixo.
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div>
            {turnstileSiteKey ? (
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-theme="light"
                data-language="pt-BR"
                data-refresh-expired="auto"
                data-retry="auto"
                aria-label="Verificação de segurança"
              />
            ) : process.env.NODE_ENV === "production" ? (
              <p className="text-sm font-semibold text-red-700">
                A verificação de segurança ainda não foi configurada.
              </p>
            ) : (
              <p className="text-xs text-slate-500">Verificação automática no ambiente de desenvolvimento.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || (process.env.NODE_ENV === "production" && !turnstileSiteKey)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <FileSearch className="h-5 w-5" />}
            {loading ? "Analisando com cuidado..." : analysis ? "Analisar novamente" : "Explicar meu documento"}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>

      {analysis && <AnalysisResult analysis={analysis} />}
    </>
  )
}

function AnalysisResult({ analysis }: { analysis: Analysis }) {
  const summaries = [
    ["Total de vencimentos", analysis.resumo.total_vencimentos, "text-emerald-700"],
    ["Total de descontos", analysis.resumo.total_descontos, "text-red-700"],
    ["Valor líquido", analysis.resumo.valor_liquido, "text-slate-950"],
  ] as const
  const visibleSummaries = summaries.filter(([, value]) => value !== null && Math.abs(value) > 0.004)
  const visibleItems = analysis.itens.filter((item) => Math.abs(item.valor) > 0.004)

  return (
    <section id="resultado-analise" className="mt-10 space-y-6 print:mt-0">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-9">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {documentLabels[analysis.tipo_documento]}
                {analysis.competencia ? ` · ${analysis.competencia}` : ""}
              </span>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{analysis.titulo}</h2>
              {analysis.documentos_considerados.length > 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  Documentos considerados: {analysis.documentos_considerados.join(", ")}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 print:hidden"
          >
            <Printer className="h-4 w-4" />
            Imprimir explicação
          </button>
        </div>

        {!analysis.documento_valido && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            O arquivo não pôde ser confirmado como holerite, recibo de férias ou termo de rescisão.
          </div>
        )}

        {visibleSummaries.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {visibleSummaries.map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${color}`}>
                {currency.format(value!)}
              </p>
            </div>
          ))}
        </div>}

        {visibleItems.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="font-bold text-slate-900">Valores encontrados no documento</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-white text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Descrição</th>
                    <th className="px-5 py-3 font-semibold">Referência</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleItems.map((item, index) => (
                    <tr key={`${item.descricao}-${index}`}>
                      <td className="px-5 py-3 font-medium text-slate-800">{item.descricao}</td>
                      <td className="px-5 py-3 text-slate-500">{item.referencia || "—"}</td>
                      <td className="px-5 py-3 capitalize text-slate-500">{item.categoria}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        {currency.format(item.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {analysis.calculos.map((calculation, index) => (
        <article key={`${calculation.titulo}-${index}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold text-slate-950">{calculation.titulo}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              calculation.status === "confere"
                ? "bg-emerald-100 text-emerald-800"
                : calculation.status === "diverge"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
            }`}>
              {calculation.status === "confere" ? "Valor confere" : calculation.status === "diverge" ? "Requer conferência" : "Explicação"}
            </span>
          </div>
          <p className="mt-3 leading-7 text-slate-600">{calculation.explicacao}</p>
          {calculation.etapas.length > 0 && (
            <ol className="mt-5 space-y-3">
              {calculation.etapas.map((step, stepIndex) => (
                <li key={`${step.descricao}-${stepIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                      <strong className="text-slate-900">{stepIndex + 1}. {step.descricao}</strong>
                      <p className="mt-1 text-sm text-slate-500">{step.operacao}</p>
                      {(step.base !== null || step.aliquota !== null) && (
                        <p className="mt-1 text-sm text-slate-500">
                          {step.base !== null ? `Base: ${currency.format(step.base)}` : ""}
                          {step.base !== null && step.aliquota !== null ? " · " : ""}
                          {step.aliquota !== null ? `Alíquota: ${step.aliquota.toLocaleString("pt-BR")}%` : ""}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-slate-900">{currency.format(step.valor)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {calculation.total !== null && (
            <p className="mt-5 text-right font-bold text-slate-950">Total: {currency.format(calculation.total)}</p>
          )}
        </article>
      ))}

      {analysis.pendencias.length > 0 && (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 md:p-8 print:hidden">
          <h3 className="flex items-center gap-2 text-lg font-bold text-amber-950">
            <AlertTriangle className="h-5 w-5" />
            Preciso de algumas informações
          </h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-amber-900">
            {analysis.pendencias.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <p className="mt-4 text-sm text-amber-800">
            Responda no campo “Informações adicionais” acima e clique em “Analisar novamente”.
          </p>
        </div>
      )}

      {analysis.alertas.length > 0 && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 md:p-8">
          <h3 className="font-bold text-red-950">Pontos que merecem conferência</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-red-900">
            {analysis.alertas.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}

      <div className="rounded-[2rem] bg-slate-900 p-6 text-white md:p-8">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <CheckCircle2 className="h-5 w-5 text-yellow-300" />
          Resumo em linguagem simples
        </h3>
        <p className="mt-3 leading-7 text-slate-200">{analysis.conclusao}</p>
        <p className="mt-5 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
          Esta explicação é informativa e pode conter falhas de leitura. Para contestar valores ou tomar
          decisões trabalhistas, confirme os dados com a empresa, o departamento pessoal ou um profissional qualificado.
        </p>
      </div>
    </section>
  )
}

export function ReceiptPrivacyNotice() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <h3 className="mt-3 font-bold text-slate-900">Sem cadastro</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Não é necessário criar conta nem informar nome, CPF ou e-mail.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <FileSearch className="h-6 w-6 text-blue-600" />
        <h3 className="mt-3 font-bold text-slate-900">Sem histórico</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">A PalSys não grava o arquivo ou a explicação no banco de dados.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <FileText className="h-6 w-6 text-yellow-600" />
        <h3 className="mt-3 font-bold text-slate-900">Uso responsável</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          O arquivo é enviado à OpenAI para análise. Veja nossa <Link href="/privacidade-dos-sistemas" className="font-semibold underline">política de privacidade</Link>.
        </p>
      </div>
    </div>
  )
}

