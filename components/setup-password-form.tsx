"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export function SetupPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setErrorMessage("")

    startTransition(async () => {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Não foi possível definir a senha.")
        return
      }

      setMessage("Senha criada com sucesso. Você já pode entrar no painel.")
      setTimeout(() => {
        router.push("/acesso")
      }, 1200)
    })
  }

  if (!token) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Link inválido</h2>
        <p className="mt-3 text-slate-600">
          O link para definir a senha está incompleto ou expirado.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Definir senha de acesso</h2>
      <p className="mt-2 text-slate-600">
        Crie sua senha para acessar o painel do escritório.
      </p>

      <div className="mt-8 grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            required
            minLength={6}
            className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita a senha"
            required
            minLength={6}
            className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
      </div>

      {errorMessage ? <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p> : null}
      {message ? <p className="mt-4 text-sm font-medium text-emerald-600">{message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Salvando..." : "Criar senha"}
      </button>
    </form>
  )
}
