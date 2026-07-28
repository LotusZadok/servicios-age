# Marca y nombres

## La marca: Servicios AGE

La empresa se llama **Servicios AGE**. Todo el texto visible para quien usa
la aplicación tiene que usar ese nombre.

### El logo

El logo son cuatro imágenes PNG, generadas a partir del arte original a
3000px, cada una para un uso puntual:

| Archivo | Tamaño | Uso |
|---|---|---|
| `public/logo.png` | 494×240 | Lockup completo, se usa en el login. Es 3× el alto de los 80px a los que se muestra en pantalla, pensado para pantallas retina. |
| `public/logo-mark.png` | 78×96 | El glifo de la E solo, la marca de 27px que aparece en las barras de navegación. |
| `src/app/icon.ico` | 16/32/48 | Favicon de la pestaña del navegador, con el glifo de la E. |
| `src/app/apple-icon.png` | 180×180 | Icono de la app (por ejemplo al agregarla a la pantalla de inicio), con la palabra "AGE" completa. |

**Son PNG a propósito, no SVG.** El arte de origen no es vectorial — es una
ilustración rasterizada — y la aplicación siempre muestra el logo en estos
tres tamaños fijos y conocidos. Renderizar cada uno a su tamaño final da
archivos más chicos y más nítidos que tener un solo SVG y escalarlo en el
navegador. Existió antes un SVG que "escalaba a cualquier tamaño", pero en
la práctica pesaba 108 KB porque por dentro era este mismo PNG de 3000px
envuelto en una etiqueta `<svg>` — no una ilustración vectorial real. Los
cuatro PNG juntos pesan unos 32 KB. Si en algún momento se vuelve a
considerar un SVG, vale la pena medir el peso real antes de asumir que va a
ser más liviano.

El arte original de 3000px del que se generaron los cuatro PNG no está
versionado en este repositorio — no aparece en el historial de git ni hay
ninguna entrada para él en `.gitignore`. Se recibió directamente de fuera
del repositorio y se usó una sola vez para renderizar los cuatro archivos
finales, que sí son la fuente de verdad versionada. Si hace falta
regenerarlos a otro tamaño, hay que pedir el archivo original de nuevo.

**El favicon usa el glifo de la E, no la palabra "AGE" completa, por una
razón medida y no estética:** la palabra "AGE" tiene una proporción de
2,83:1 (mucho más ancha que alta), y a los 16px de un favicon esa
proporción la vuelve ilegible — se ve como una mancha. El glifo de la E
solo tiene una proporción de 0,82:1, casi cuadrada, y llena bien el
espacio disponible. La palabra completa sí se usa en `apple-icon.png`,
donde el ícono es mucho más grande (180×180) y el tamaño sostiene el
detalle.

### Colores

Todo el color de la marca vive en `src/app/globals.css`. Hay dos verdes,
cada uno pensado para un uso distinto:

- **`#16a045`** — para elementos que **no son texto**: anillos de foco,
  subrayado de la navegación, íconos. Da un contraste de 3.41:1 sobre
  fondo blanco, que **no alcanza** el nivel AA de accesibilidad para texto
  (se necesita 4.5:1), pero sí es suficiente para estos usos no textuales.
- **`#0d7a33`** — para **texto** en verde. Da 5.46:1 sobre blanco, que sí
  cumple AA.

Si se agrega texto en verde en algún lugar nuevo, tiene que usar
`#0d7a33`, no `#16a045`.

## Por qué sobrevive el nombre anterior, "AGServicios"

El proyecto se llamaba antes AGServicios y se renombró a Servicios AGE. El
nombre viejo sigue apareciendo, a propósito, en un puñado de lugares
técnicos que la persona usuaria final nunca ve, y donde cambiarlos rompería
algo:

- **`supabase/config.toml`**, en `project_id = "AGServicios-web"`: este
  valor nombra los contenedores Docker que corren Supabase en local. Si se
  cambia, la próxima vez que se levante el entorno local el CLI crea
  contenedores nuevos y vacíos, y el volumen con los datos ya sembrados
  para desarrollo queda huérfano (sigue existiendo en disco, pero ya no
  conectado a nada).
- **`scripts/seed-portal-test.ts`**, en el correo
  `portal@agservicios.local`: es la cuenta de prueba que ya está sembrada
  en el entorno local para probar el flujo de portal de clientes. Cambiar
  el correo en el script no renombra esa cuenta — crea una segunda, casi
  idéntica, y además obliga a actualizar `E2E_CLIENT_EMAIL` en
  `.env.local` en sincronía con ese cambio.
- **`docs/design/`**: son documentos fechados que registran qué se
  decidió en cada momento del proyecto. Son un registro histórico, no
  documentación viva — editarlos después de los hechos les quita el valor
  de decir con certeza qué se pensó y cuándo.
- **`AGServicios-main`**: es el nombre propio del repositorio original
  (una app Android con backend Flask y SQL Server) que este proyecto
  reemplaza. Es una referencia a otro proyecto, no un error de tipeo.
- **El historial de git de este repositorio.**

Ninguno de estos es un error ni un descuido — quedaron así a propósito, y
no deberían renombrarse solo por consistencia con el nombre nuevo de la
marca.
