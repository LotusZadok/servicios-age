import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

function toCsvRow(values: (string | null | undefined)[]) {
  return values
    .map((v) => {
      let s = v ?? ''
      // Neutralize spreadsheet formula injection: a leading =, +, -, @, or
      // control char can be executed as a formula when opened in Excel.
      if (/^[=+\-@\t\r]/.test(s)) {
        s = `'${s}`
      }
      return `"${s.replace(/"/g, '""')}"`
    })
    .join(',')
}

export async function GET() {
  await requireUser()
  const supabase = await createClient()

  const [{ data: clients }, { data: machines }, { data: brands }, { data: types }] =
    await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('machines').select('*, brands(name), machine_types(name)').order('name'),
      supabase.from('brands').select('*').order('name'),
      supabase.from('machine_types').select('*').order('name'),
    ])

  const lines: string[] = []

  lines.push('# Clientes')
  lines.push(toCsvRow(['Nombre', 'Correo', 'Teléfono']))
  for (const c of clients ?? []) {
    lines.push(toCsvRow([c.name, c.email, c.phone]))
  }

  lines.push('')
  lines.push('# Máquinas')
  lines.push(toCsvRow(['Nombre', 'Serie', 'Marca', 'Tipo']))
  for (const m of machines ?? []) {
    lines.push(toCsvRow([m.name, m.serial_number, m.brands?.name, m.machine_types?.name]))
  }

  lines.push('')
  lines.push('# Marcas')
  lines.push(toCsvRow(['Nombre']))
  for (const b of brands ?? []) {
    lines.push(toCsvRow([b.name]))
  }

  lines.push('')
  lines.push('# Tipos de maquinaria')
  lines.push(toCsvRow(['Nombre']))
  for (const t of types ?? []) {
    lines.push(toCsvRow([t.name]))
  }

  const csv = lines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="catalogo-servicios-age.csv"',
    },
  })
}
