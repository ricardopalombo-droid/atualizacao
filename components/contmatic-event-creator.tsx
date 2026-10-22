"use client"

import { useEffect, useRef, useState } from "react"
import { Download, FileJson, LoaderCircle, Sparkles, Upload } from "lucide-react"
import type { ContmaticEvent, PublicEventProposal } from "@/lib/contmatic-events/types"

type StatusResponse = {
  chaveConfigurada: boolean
  modelo: string
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
  const [modelo, setModelo] = useState("")
  const [proposal, setProposal] = useState<PublicEventProposal | null>(null)
  const [eventJson, setEventJson] = useState("")
  const [revisado, setRevisado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/eventos/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response))
        return (await response.json()) as StatusResponse
      })
      .then((data) => {
        setStatus(data)
        setModelo(data.modelo)
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Não foi possível consultar a configuração.")
      })
  }, [])

  function showProposal(next: PublicEventProposal, successMessage: string) {
    setProposal(next)
    setEventJson(JSON.stringify(next.evento, null, 2))
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

  function parseEditor() {
    let parsed: unknown
    try {
      parsed = JSON.parse(eventJson)
    } catch {
      throw new Error("O JSON editado não é válido.")
    }
    return parsed as ContmaticEvent
  }

  async function updateProposal() {
    if (!proposal) throw new Error("Gere ou carregue um evento primeiro.")
    const updated = await postJson<PublicEventProposal>("/api/eventos/atualizar", {
      token: proposal.token,
      evento: parseEditor(),
    })
    showProposal(updated, "Alterações aplicadas. Confira novamente o evento.")
    return updated
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

  async function handleExport() {
    if (!revisado) throw new Error("Marque a confirmação de revisão antes de gerar o arquivo.")
    const updated = await updateProposal()
    if (updated.pendencias.length) {
      throw new Error("Ainda existem informações pendentes. Complete o pedido e gere uma nova proposta.")
    }

    const response = await fetch("/api/eventos/exportar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: updated.token, revisado: true }),
    })
    if (!response.ok) throw new Error(await readApiError(response))

    const disposition = response.headers.get("Content-Disposition") ?? ""
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "evento-contmatic.json"
    downloadBlob(await response.blob(), filename)
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
              run(async () => {
                const next = await postJson<PublicEventProposal>("/api/eventos/gerar", {
                  pedido,
                  modelo,
                })
                showProposal(
                  next,
                  next.pendencias.length
                    ? "A proposta foi criada, mas precisa de informações adicionais."
                    : "Novo evento preparado. Confira todos os dados antes de exportar.",
                )
              })
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

        <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer font-bold text-slate-700">Configuração da geração</summary>
          <div className="mt-4 grid gap-2">
            <label htmlFor="modelo-evento" className="text-sm font-semibold text-slate-700">
              Modelo da API
            </label>
            <input
              id="modelo-evento"
              value={modelo}
              onChange={(event) => setModelo(event.target.value)}
              placeholder="Modelo configurado no servidor"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-yellow-400"
            />
            <p className="text-sm leading-6 text-slate-500">
              {status?.chaveConfigurada
                ? "A chave da API está configurada no servidor. O pedido e até oito referências técnicas internas são enviados à API."
                : "A chave da API ainda não está configurada no servidor. O carregamento de um JSON próprio continua disponível."}
            </p>
          </div>
        </details>
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
              <h3 className="font-bold">Complete o pedido e gere novamente</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                {proposal.pendencias.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h3 className="font-bold">Avisos de validação</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
              {proposal.avisos.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 p-5">
            <summary className="cursor-pointer font-bold text-slate-800">Dados técnicos do evento criado</summary>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Confira fórmula, incidências, rubrica e escopos. O sistema não executa a linguagem de fórmulas do Phoenix.
            </p>
            <label htmlFor="json-evento" className="mt-5 block text-sm font-bold text-slate-700">
              JSON do novo evento
            </label>
            <textarea
              id="json-evento"
              rows={25}
              spellCheck={false}
              value={eventJson}
              onChange={(event) => {
                setEventJson(event.target.value)
                setRevisado(false)
              }}
              className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-yellow-400"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => run(async () => { await updateProposal() })}
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Aplicar alterações do JSON
            </button>
          </details>

          <label className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={revisado}
              onChange={(event) => setRevisado(event.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>Revisei o cálculo e as configurações do novo evento.</span>
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy || !revisado || proposal.pendencias.length > 0}
              onClick={() => run(handleExport)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={19} />
              3. Gerar arquivo para importação
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const evento = parseEditor()
                  downloadBlob(
                    new Blob([JSON.stringify({ evento, pendencias: proposal.pendencias, pedido }, null, 2)], {
                      type: "text/plain;charset=utf-8",
                    }),
                    "rascunho.revisao.txt",
                  )
                  setMessage("Rascunho salvo. Ele serve para revisão e não deve ser importado na Contmatic.")
                })
              }
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Salvar rascunho
            </button>
          </div>
        </section>
      ) : null}

      <p className="px-1 text-sm leading-6 text-slate-500">
        No Phoenix: Arquivos → Eventos → Eventos Usuário → Importar evento. Use um arquivo JSON por vez e valide primeiro em ambiente de teste.
      </p>
    </div>
  )
}
