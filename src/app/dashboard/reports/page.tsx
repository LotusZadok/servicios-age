export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reportes</h1>
      <a
        href="/api/reports/catalog"
        className="inline-block rounded bg-gray-900 px-3 py-2 text-sm text-white"
      >
        Descargar catálogo (CSV)
      </a>
    </div>
  )
}
