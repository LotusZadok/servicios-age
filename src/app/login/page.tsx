import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Servicios AGE" width={247} height={120} className="h-20 w-auto" />
          <p className="eyebrow">Acceso interno</p>
        </div>

        <form action={login} className="card space-y-5 p-8">
          {error && (
            <p className="rounded-[7px] border border-[var(--danger)]/25 bg-[var(--danger-weak)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email">Correo</label>
            <input id="email" name="email" type="email" required className="w-full px-3 py-2" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Gestión de maquinaria · uso interno
        </p>
      </div>
    </main>
  )
}
