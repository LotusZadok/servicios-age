import { CatalogForm } from '@/components/catalog'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  return <CatalogForm tipo="brands" id={id} error={error} />
}
