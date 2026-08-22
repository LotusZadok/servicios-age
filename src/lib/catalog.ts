/**
 * Marcas y tipos de maquinaria son el mismo CRUD: nombre, descripción y baja
 * lógica. Las dos rutas vivían duplicadas archivo por archivo; ahora lo único
 * que cambia entre ellas son estas etiquetas.
 *
 * La clave es el segmento de la URL. Las URLs no cambiaron: /dashboard/brands
 * y /dashboard/machine-types siguen existiendo como páginas de tres líneas.
 */
export const CATALOGS = {
  brands: {
    tabla: 'brands',
    ruta: '/dashboard/brands',
    titulo: 'Marcas',
    nuevo: 'Nueva marca',
    editar: 'Editar marca',
    vacio: 'Sin marcas',
    pista: 'Crea la primera con “Nueva marca”.',
  },
  'machine-types': {
    tabla: 'machine_types',
    ruta: '/dashboard/machine-types',
    titulo: 'Tipos de maquinaria',
    nuevo: 'Nuevo tipo',
    editar: 'Editar tipo',
    vacio: 'Sin tipos de maquinaria',
    pista: 'Crea el primero con “Nuevo tipo”.',
  },
} as const

export type CatalogKey = keyof typeof CATALOGS
