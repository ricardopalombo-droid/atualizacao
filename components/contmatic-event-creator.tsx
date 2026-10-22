"use client"

import { useEffect, useRef, useState } from "react"
import { CircleHelp, Download, FileJson, History, LoaderCircle, Sparkles, Upload, X } from "lucide-react"
import type { PublicEventProposal } from "@/lib/contmatic-events/types"

type StatusResponse = {
  chaveConfigurada: boolean
}

type EventHistoryItem = {
  id: string
  request_text: string
  event_description: string
  event_code: number
  filename: string
  event_json: Record<string, string | number | boolean>
  created_at: string
}

async function readApiError(response: Response) {
  const data = (await response.json().catch(() => null)) as { erro?: string } | null
  return data?.erro ?? "Não foi possível concluir a operação."
}

async function postJson<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(await readApiError(response))
  return (await response.json()) as T
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function ContmaticEventCreator() {
  const uploadRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [pedido, setPedido] = useState("")
  const [proposal, setProposal] = useState<PublicEventProposal | null>(null)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [revisado, setRevisado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [history, setHistory] = useState<EventHistoryItem[]>([])
  const [historyError, setHistoryError] = useState("")

  async function loadHistory() {
    const response = await fetch("/api/eventos/historico", { cache: "no-store" })
    if (!response.ok) throw new Error(await readApiError(response))
    const data = (await response.json()) as { items: EventHistoryItem[] }
    setHistory(data.items)
  }

  useEffect(() => {
    fetch("/api/eventos/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response))
        return (await response.json()) as StatusResponse
      })
      .then((data) => {
        setStatus(data)
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Não foi possível consultar a configuração.")
      })

    loadHistory().catch((reason: unknown) => {
      setHistoryError(reason instanceof Error ? reason.message : "Não foi possível carregar o histórico.")
    })
    // A carga ocorre uma única vez ao abrir a ferramenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showProposal(next: PublicEventProposal, successMessage: string) {
    setProposal(next)
    setAnswers(next.pendencias.map(() => ""))
    setQuestionDialogOpen(next.pendencias.length > 0)
    setRevisado(false)
    setError("")
    setMessage(successMessage)
  }

  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await action()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível concluir a operação.")
    } finally {
      setBusy(false)
    }
  }

  async function handleUpload(file: File) {
    if (file.size > 2_000_000) throw new Error("O arquivo JSON deve ter no máximo 2 MB.")
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      throw new Error("O arquivo selecionado não contém JSON válido.")
    }
    const next = await postJson<PublicEventProposal>("/api/eventos/template", { evento: parsed })
    showProposal(next, "Evento carregado. Revise os dados antes de gerar outro arquivo.")
  }

  async function generateProposal(fullRequest: string) {
    const next = await postJson<PublicEventProposal>("/api/eventos/gerar", {
      pedido: fullRequest,
    })
    showProposal(
      next,
      next.pendencias.length
        ? "A proposta foi criada, mas precisa de algumas respostas."
        : "Novo evento preparado. Confira todos os dados antes de exportar.",
    )
  }

  async function handleQuestionAnswers() {
    if (!proposal?.pendencias.length) return
    if (answers.some((answer) => !answer.trim())) {
      throw new Error("Responda todas as perguntas antes de continuar.")
    }

    const additionalInformation = proposal.pendencias
      .map((question, index) => `Pergunta: ${question}\nResposta: ${answers[index].trim()}`)
      .join("\n\n")
    const supplementedRequest = `${pedido.trim()}\n\nInformações adicionais fornecidas pelo usuário:\n${additionalInformation}`
    if (supplementedRequest.length > 12_000) {
      throw new Error("O pedido e as respostas ultrapassaram o limite permitido.")
    }

    setPedido(supplementedRequest)
    await generateProposal(supplementedRequest)
  }

  async function handleExport() {
    if (!proposal) throw new Error("Gere ou carregue um evento primeiro.")
    if (!revisado) throw new Error("Marque a confirmação de revisão antes de gerar o arquivo.")
    if (proposal.pendencias.length) {
      throw new Error("Ainda existem informações pendentes. Complete o pedido e gere uma nova proposta.")
    }

    const response = await fetch("/api/eventos/exportar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: proposal.token, revisado: true }),
    })
    if (!response.ok) throw new Error(await readApiError(response))

    const disposition = response.headers.get("Content-Disposition") ?? ""
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "evento-contmatic.json"
    downloadBlob(await response.blob(), filename)
    await loadHistory()
    setMessage("Arquivo gerado. Confira a importação e o cálculo em um ambiente de teste do Phoenix.")
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
            <Sparkles size={23} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">1. Descreva o cálculo</h2>
            <p className="mt-2 leading-7 text-slate-600">
              Informe nome, base de cálculo, percentual ou valor, condições, folhas abrangidas e incidências desejadas.
            </p>
          </div>
        </div>

        <label htmlFor="pedido-evento" className="mt-7 block text-sm font-bold text-slate-700">
          O que o evento deve calcular?
        </label>
        <textarea
          id="pedido-evento"
          rows={7}
          maxLength={12_000}
          value={pedido}
          onChange={(event) => setPedido(event.target.value)}
          placeholder="Ex.: Preciso criar um adicional chamado Adicional de risco. O percentual será informado no lançamento e o cálculo deve usar o salário mensal..."
          className="mt-2 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 leading-7 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={busy || !pedido.trim() || !status?.chaveConfigurada}
            onClick={() =>
              run(() => generateProposal(pedido))
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="animate-spin" size={19} /> : <Sparkles size={19} />}
            {busy ? "Preparando..." : "Gerar evento"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Upload size={19} />
            Continuar de um JSON meu
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void run(() => handleUpload(file))
              event.target.value = ""
            }}
          />
        </div>

        {!status?.chaveConfigurada ? (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            A geração automática está temporariamente indisponível. Você ainda pode continuar a partir de um JSON próprio.
          </p>
        ) : null}
      </section>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-800 whitespace-pre-wrap">
          {error}
        </div>
      ) : null}
      {message ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-medium text-emerald-800">
          {message}
        </div>
      ) : null}

      {proposal ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <FileJson size={23} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">2. Confira o novo evento</h2>
              {proposal.explicacao ? (
                <p className="mt-2 leading-7 text-slate-600">{proposal.explicacao}</p>
              ) : null}
            </div>
          </div>

          {proposal.pendencias.length ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
              <h3 className="font-bold">Precisamos de algumas respostas</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                {proposal.pendencias.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <button
                type="button"
                disabled={busy}
                onClick={() => setQuestionDialogOpen(true)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-red-800 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <CircleHelp size={19} />
                Responder perguntas
              </button>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h3 className="font-bold">Avisos de validação</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
              {proposal.avisos.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          {!proposal.pendencias.length ? (
            <>
              <label className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={revisado}
                  onChange={(event) => setRevisado(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>Revisei as informações do novo evento.</span>
              </label>

              <div className="mt-5">
                <button
                  type="button"
                  disabled={busy || !revisado}
                  onClick={() => run(handleExport)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={19} />
                  3. Gerar arquivo para importação
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {questionDialogOpen && proposal?.pendencias.length ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !busy) setQuestionDialogOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-questions-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="event-questions-title" className="text-2xl font-bold text-slate-900">
                  Complete as informações
                </h2>
                <p className="mt-2 leading-7 text-slate-600">
                  Responda em linguagem simples. Suas respostas serão acrescentadas ao pedido original.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar perguntas"
                disabled={busy}
                onClick={() => setQuestionDialogOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              {proposal.pendencias.map((question, index) => (
                <div key={`${question}-${index}`}>
                  <label htmlFor={`event-answer-${index}`} className="block font-bold leading-6 text-slate-800">
                    {index + 1}. {question}
                  </label>
                  <textarea
                    id={`event-answer-${index}`}
                    rows={3}
                    value={answers[index] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => current.map((answer, answerIndex) =>
                        answerIndex === index ? event.target.value : answer
                      ))
                    }
                    placeholder="Digite sua resposta..."
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 leading-6 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                  />
                </div>
              ))}
            </div>

            {error ? (
              <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {error}
              </div>
            ) : null}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setQuestionDialogOpen(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Responder depois
              </button>
              <button
                type="button"
                disabled={busy || answers.some((answer) => !answer.trim())}
                onClick={() => run(handleQuestionAnswers)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="animate-spin" size={19} /> : <Sparkles size={19} />}
                {busy ? "Gerando novamente..." : "Usar respostas e gerar novamente"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <History size={23} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Meus eventos gerados</h2>
            <p className="mt-2 leading-7 text-slate-600">Aqui ficam os pedidos concluídos e seus respectivos arquivos JSON.</p>
          </div>
        </div>

        {historyError ? <p className="mt-5 text-sm font-semibold text-red-700">{historyError}</p> : null}
        {!historyError && history.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-600">
            Nenhum evento concluído ainda.
          </div>
        ) : null}
        {history.length ? (
          <div className="mt-6 grid gap-4">
            {history.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{item.event_description}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Código {item.event_code} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.created_at))}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.request_text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadBlob(new Blob([`${JSON.stringify(item.event_json, null, 2)}\n`], { type: "application/json" }), item.filename)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Download size={18} />
                    Baixar novamente
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <p className="px-1 text-sm leading-6 text-slate-500">
        No Phoenix: Arquivos → Eventos → Eventos Usuário → Importar evento. Use um arquivo JSON por vez e valide primeiro em ambiente de teste.
      </p>
    </div>
  )
}
