import { createUser } from '../actions'

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <form action={createUser} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo usuario</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium">
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
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
          Contraseña temporal
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium">
          Rol
        </label>
        <select id="role" name="role" className="mt-1 w-full rounded border px-3 py-2">
          <option value="empleado">empleado</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <button type="submit" className="rounded bg-gray-900 px-3 py-2 text-sm text-white">
        Crear usuario
      </button>
    </form>
  )
}
