import { CatalogForm } from '@/components/catalog'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <CatalogForm tipo="brands" error={error} />
}
