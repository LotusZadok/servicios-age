import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold">AGServicios</h1>
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-gray-900 px-3 py-2 text-white"
        >
          Entrar
        </button>
      </form>
    </main>
  )
}
