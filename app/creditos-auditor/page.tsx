"use client"

import Image from "next/image"
import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { Download } from "lucide-react"

const OPTIONS = [5, 20, 50, 100]

export default function CreditosAuditorPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [licenseHint, setLicenseHint] = useState("")
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [identifying, setIdentifying] = useState(false)
  const [identificationError, setIdentificationError] = useState("")
  const [quantity, setQuantity] = useState(5)
  const [unitPriceCents, setUnitPriceCents] = useState(500)
  const [loading, setLoading] = useState(false)
  const total = useMemo(() => quantity * unitPriceCents / 100, [quantity, unitPriceCents])

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("access") || ""
    if (!token) return
    setAccessToken(token)
    setIdentifying(true)
    fetch("/api/credits-customer-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token }),
      cache: "no-store",
    })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.error || "Acesso inválido ou expirado.")
        setName(data.name || "")
        setEmail(data.email || "")
        setLicenseHint(data.licenseHint || "")
        setCreditBalance(Number(data.creditBalance || 0))
        if (Number.isInteger(data.unitPriceCents)) setUnitPriceCents(data.unitPriceCents)
      })
      .catch((error) => {
        setAccessToken("")
        setIdentificationError(error instanceof Error ? error.message : "Acesso inválido ou expirado.")
      })
      .finally(() => setIdentifying(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams()
      if (accessToken) params.set("accessToken", accessToken)
      else if (licenseKey.trim()) params.set("licenseKey", licenseKey.trim())
      const query = params.size ? `?${params.toString()}` : ""
      const response = await fetch(`/api/credits-price${query}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (response.ok && Number.isInteger(data.unitPriceCents)) {
        setUnitPriceCents(data.unitPriceCents)
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [licenseKey, accessToken])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/mercadopago/create-credit-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, licenseKey, accessToken, quantity }),
      })
      const data = await response.json()
      if (!response.ok || !data.initPoint) {
        alert(data.error || "Não foi possível iniciar o pagamento.")
        return
      }
      window.location.href = data.initPoint
    } catch {
      alert("Não foi possível iniciar o pagamento.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex rounded-xl bg-white p-3 shadow-sm">
          <Image src="/logo-palsys.png" alt="PalSys" width={180} height={50} priority />
        </Link>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-slate-950 px-7 py-8 text-white sm:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-400">PalSys Auditor Integrado</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Comprar créditos de auditoria</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Cada crédito libera uma empresa em uma competência. Uma vez liberada, essa mesma empresa e competência pode ser reprocessada sem consumir outro crédito.
            </p>
            <a
              href="/api/download/auditor-integrado"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-500"
            >
              <Download size={19} />
              Baixar o PalSys Auditor Integrado
            </a>
          </div>

          <form onSubmit={submit} className="space-y-7 p-7 sm:p-10">
            {identifying ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 font-semibold text-blue-900">Identificando sua licença com segurança...</div>
            ) : accessToken && licenseHint ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                <p className="font-black">Compra vinculada automaticamente</p>
                <p className="mt-2 text-sm">{name} · {email}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
                  <span className="rounded-full bg-white px-3 py-2">Licença {licenseHint}</span>
                  <span className="rounded-full bg-white px-3 py-2">Saldo atual: {creditBalance ?? 0} crédito(s)</span>
                </div>
                <p className="mt-4 text-sm text-emerald-800">Você só precisa escolher a quantidade. Não é necessário digitar sua chave.</p>
              </div>
            ) : (
              <>
                {identificationError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{identificationError} Preencha os dados abaixo para continuar.</div> : null}
                <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Nome
                <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                E-mail
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" />
              </label>
                </div>

                <label className="grid gap-2 text-sm font-bold">
                  Chave da licença, se já possuir
                  <input value={licenseKey} onChange={(e) => setLicenseKey(e.target.value.toUpperCase())} placeholder="Deixe em branco na primeira compra" className="rounded-xl border border-slate-300 px-4 py-3 font-mono font-normal uppercase outline-none focus:border-blue-500" />
                  <span className="font-normal text-slate-500">Na primeira compra, uma licença do Auditor Integrado será criada para o e-mail informado. Clientes ativos podem abrir esta página pelo botão Comprar créditos dentro do aplicativo, sem preencher a chave.</span>
                </label>
              </>
            )}

            <div>
              <p className="text-sm font-bold">Quantidade de créditos</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OPTIONS.map((option) => (
                  <button key={option} type="button" onClick={() => setQuantity(option)} className={`rounded-xl border px-4 py-3 font-bold ${quantity === option ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                    {option} créditos
                  </button>
                ))}
              </div>
              <label className="mt-4 grid gap-2 text-sm font-bold sm:max-w-xs">
                Outra quantidade
                <input type="number" min="1" max="10000" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="flex flex-col gap-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-blue-950">{quantity} empresa/competência(s)</p>
                <p className="mt-1 text-sm text-blue-800">Créditos não utilizados permanecem no saldo. Valor unitário: {(unitPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-blue-800">Total atual</p>
                <p className="text-3xl font-black text-blue-950">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              </div>
            </div>

            <button disabled={loading} className="w-full rounded-xl bg-yellow-400 px-6 py-4 text-lg font-black text-slate-950 hover:brightness-95 disabled:opacity-60">
              {loading ? "Iniciando pagamento..." : "Comprar créditos com Mercado Pago"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
