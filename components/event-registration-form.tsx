"use client"

import Link from "next/link"
import { useState } from "react"

export function EventRegistrationForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [fields, setFields] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" })

  function updateField(field: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (fields.password !== fields.confirmPassword) {
      setError("A confirmação da senha não confere.")
      return
    }

    setBusy(true)
    try {
      const response = await fetch("/api/eventos/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
      if (!response.ok) throw new Error(data?.error ?? "Não foi possível concluir o cadastro.")
      setMessage(data?.message ?? "Confira seu e-mail para ativar a conta.")
      setFields({ name: "", email: "", phone: "", password: "", confirmPassword: "" })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível concluir o cadastro.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Criar conta</h2>
      <p className="mt-2 text-slate-600">Cadastre-se para solicitar eventos e guardar seu histórico.</p>

      <div className="mt-7 grid gap-4">
        <Field id="name" label="Nome completo" type="text" value={fields.name} onChange={(value) => updateField("name", value)} autoComplete="name" />
        <Field id="email" label="E-mail" type="email" value={fields.email} onChange={(value) => updateField("email", value)} autoComplete="email" />
        <Field id="phone" label="Telefone com DDD" type="tel" value={fields.phone} onChange={(value) => updateField("phone", value)} autoComplete="tel" />
        <Field id="password" label="Senha" type="password" value={fields.password} onChange={(value) => updateField("password", value)} autoComplete="new-password" />
        <Field id="confirm-password" label="Confirmar senha" type="password" value={fields.confirmPassword} onChange={(value) => updateField("confirmPassword", value)} autoComplete="new-password" />
      </div>

      <p className="mt-3 text-sm text-slate-500">Use pelo menos 8 caracteres, com letra e número.</p>
      {error ? <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p> : null}

      <button disabled={busy || Boolean(message)} className="mt-6 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95 disabled:opacity-60">
        {busy ? "Enviando confirmação..." : "Cadastrar e validar e-mail"}
      </button>
      <p className="mt-5 text-center text-sm text-slate-600">
        Já possui conta? <Link href="/acesso" className="font-bold text-slate-900 hover:underline">Entrar</Link>
      </p>
    </form>
  )
}

function Field(props: { id: string; label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const id = `cadastro-${props.id}`
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">{props.label}</label>
      <input id={id} type={props.type} value={props.value} onChange={(event) => props.onChange(event.target.value)} autoComplete={props.autoComplete} required className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200" />
    </div>
  )
}
