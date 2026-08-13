import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

function toCsvRow(values: (string | number | null | undefined)[]) {
  return values
    .map((v) => {
      let s = v === null || v === undefined ? '' : String(v)
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

  const [
    { data: clients },
    { data: locations },
    { data: machines },
    { data: maintenances },
    { data: brands },
    { data: types },
  ] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('locations').select('*, clients(name)').order('name'),
    supabase
      .from('machines')
      .select('*, brands(name), machine_types(name), clients(name), locations(name)')
      .order('name'),
    supabase
      .from('maintenances')
      .select('*, machines(name), locations(name), technician:profiles!technician_id(full_name)')
      .order('date', { ascending: false }),
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
  lines.push('# Sedes')
  lines.push(toCsvRow(['Nombre', 'Cliente', 'Dirección']))
  for (const l of locations ?? []) {
    lines.push(toCsvRow([l.name, l.clients?.name, l.address]))
  }

  lines.push('')
  lines.push('# Máquinas')
  lines.push(
    toCsvRow(['Nombre', 'Serie', 'N.º activo', 'Marca', 'Tipo', 'Cliente', 'Sede'])
  )
  for (const m of machines ?? []) {
    lines.push(
      toCsvRow([
        m.name,
        m.serial_number,
        m.asset_number,
        m.brands?.name,
        m.machine_types?.name,
        m.clients?.name,
        m.locations?.name,
      ])
    )
  }

  lines.push('')
  lines.push('# Mantenimientos')
  lines.push(
    toCsvRow([
      'Fecha',
      'Máquina',
      // La sede del mantenimiento es dónde se hizo el trabajo, y puede diferir
      // de la sede actual de la máquina en la hoja anterior.
      'Sede',
      'Tipo',
      'Estado',
      'Técnico',
      'Horímetro',
      'Subtotal',
      'Impuesto',
      'Total',
      'N.º boleta',
      'N.º proforma',
      'Descripción',
    ])
  )
  for (const m of maintenances ?? []) {
    lines.push(
      toCsvRow([
        m.date,
        m.machines?.name,
        m.locations?.name,
        m.is_corrective ? 'Correctivo' : 'Preventivo',
        m.status,
        m.technician?.full_name,
        m.hour_meter,
        m.cost_subtotal,
        m.tax_amount,
        m.cost_total,
        m.report_ref,
        m.quote_ref,
        m.description,
      ])
    )
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
