export default function CompraPendentePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Pagamento pendente</h1>
        <p className="mt-4 text-slate-600">
          Seu pagamento ainda está em análise ou aguardando confirmação.
        </p>
      </div>
    </main>
  )
}
