'use client'

import { deleteUser } from './actions'

export function DeleteUserButton({ id, fullName }: { id: string; fullName: string }) {
  return (
    <form action={deleteUser.bind(null, id)}>
      <button
        type="submit"
        className="link-danger"
        onClick={(e) => {
          if (!confirm(`¿Eliminar a "${fullName}"? Esta acción no se puede deshacer.`)) {
            e.preventDefault()
          }
        }}
      >
        Eliminar
      </button>
    </form>
  )
}
