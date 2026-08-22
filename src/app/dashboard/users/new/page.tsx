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
      {error && <p className="text-sm link-danger">{error}</p>}
      <div>
        <label htmlFor="full_name">Nombre completo</label>
        <input id="full_name" name="full_name" required className="field" />
      </div>
      <div>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password">Contraseña temporal</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="role">Rol</label>
        <select id="role" name="role" className="field">
          <option value="empleado">empleado</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary">
        Crear usuario
      </button>
    </form>
  )
}
