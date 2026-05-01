"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isResetPending, startResetTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const [resetMode, setResetMode] = useState(false)
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
    setResetMessage("")

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
        setErrorMessage(data.error ?? "Nao foi possivel entrar.")
        return
      }

      router.push("/painel")
      router.refresh()
    })
  }

  function handleResetPassword() {
    setErrorMessage("")
    setResetMessage("")

    startResetTransition(async () => {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
        }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Não foi possível enviar o link.")
        return
      }

      setResetMessage(
        data?.message ?? "Se o e-mail existir na base, enviaremos um link para criar uma nova senha."
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
      <p className="mt-2 text-slate-600">
        Use o login da PalSys, do assinante ou do cliente para acessar a area correspondente.
      </p>

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
      {resetMessage ? <p className="mt-4 text-sm font-medium text-emerald-600">{resetMessage}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => setResetMode((current) => !current)}
          className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
        >
          {resetMode ? "Ocultar redefinição de senha" : "Criar ou trocar senha"}
        </button>

        {resetMode ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Informe o e-mail de acesso para receber um link de criação ou troca de senha.
            </p>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetPending}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResetPending ? "Enviando..." : "Receber link por e-mail"}
            </button>
          </div>
        ) : null}
      </div>
    </form>
  )
}
