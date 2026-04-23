"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState("")
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })

  function updateField(field: "email" | "password", value: string) {
    setCredentials((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        setErrorMessage(data.error ?? "Não foi possível entrar.")
        return
      }

      router.push("/painel")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
      <p className="mt-2 text-slate-600">Use seu login e senha para acessar a área interna.</p>

      <div className="mt-8 grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Login
          </label>
          <input
            id="email"
            type="email"
            value={credentials.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="seu-email@empresa.com"
            required
            className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Digite sua senha"
            required
            className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
      </div>

      {errorMessage ? <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
