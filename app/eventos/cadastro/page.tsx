import Link from "next/link"
import { EventRegistrationForm } from "@/components/event-registration-form"

export default function CadastroEventosPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <span className="inline-flex rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-slate-900">Criador de eventos</span>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Crie eventos Contmatic com orientação da IA</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">Sua conta permite solicitar eventos, responder às perguntas necessárias e consultar os arquivos gerados anteriormente.</p>
          <Link href="/" className="mt-8 inline-flex rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800">Voltar para o site</Link>
        </section>
        <EventRegistrationForm />
      </div>
    </main>
  )
}
