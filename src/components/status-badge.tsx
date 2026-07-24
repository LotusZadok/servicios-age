const LABELS: Record<string, string> = {
  solicitado: 'Solicitado',
  programado: 'Programado',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{LABELS[status] ?? status}</span>
}
