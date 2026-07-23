export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reportes</h1>
      <a
        href="/api/reports/catalog"
        className="inline-block btn btn-primary"
      >
        Descargar catálogo (CSV)
      </a>
    </div>
  )
}
