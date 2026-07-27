<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Marca

La empresa se llama **Servicios AGE**. Todo texto visible al usuario usa ese nombre.

El logo son cuatro PNG generados desde el arte original a 3000px:

- `public/logo.png` (494×240) — lockup completo, login. Es 3× del alto de 80px
  al que se muestra, para pantallas retina.
- `public/logo-mark.png` (78×96) — glifo de la E, marca de 27px en las navs.
- `src/app/icon.ico` (16/32/48) — favicon de la pestaña, con el glifo de la E.
- `src/app/apple-icon.png` (180×180) — icono de app, con la palabra AGE completa.

**Son PNG a propósito, no SVG.** El arte de origen no es vectorial, y la app usa
el logo en tres tamaños fijos y conocidos, así que renderizar a medida da archivos
más chicos y más nítidos que escalar en tiempo de ejecución. No los reemplaces por
un SVG "porque escala" sin medir: el SVG que existía pesaba 108 KB y era un PNG
envuelto.

**La pestaña usa el glifo de la E y no la palabra AGE por una razón medida:** AGE
es 2,83:1, y a 16px se vuelve ilegible. El glifo es 0,82:1 y llena el cuadrado.
La palabra completa sí se usa en `apple-icon.png`, donde el tamaño la sostiene.

Si agregás o renombrás un asset de marca, acordate de excluirlo en el `matcher`
de `src/proxy.ts`, o cada petición pagará una llamada de auth a Supabase.

Todo el color vive en `src/app/globals.css`. Verde de marca `#16a045` para
elementos **no textuales** (foco, subrayado de nav, iconos); `#0d7a33` para
**texto** verde. El primero da 3.41:1 sobre blanco y no cumple AA para texto;
el segundo da 5.46:1 y sí.

## El nombre anterior era AGServicios

Sobrevive a propósito en identificadores técnicos que no ve el usuario y cuyo
cambio rompería entornos. **No son errores. No los renombres.**

- `supabase/config.toml` → `project_id = "AGServicios-web"`: nombra los
  contenedores Docker locales. Cambiarlo hace que el CLI levante contenedores
  vacíos y huérfane el volumen con los datos sembrados.
- `scripts/seed-portal-test.ts` → `portal@agservicios.local`: cuenta ya sembrada.
  Editarlo no la renombra, crea una segunda casi idéntica, y además obliga a
  cambiar `E2E_CLIENT_EMAIL` en `.env.local` en sincronía.
- `docs/superpowers/specs/` y `plans/`: registros fechados. Describen qué se
  decidió en esa fecha; editarlos retroactivamente destruye su valor como
  registro.
- `AGServicios-main`: nombre propio del repositorio original (Android/Flask/SQL
  Server) que este proyecto reemplaza.
- El nombre del repositorio y el historial de git.
