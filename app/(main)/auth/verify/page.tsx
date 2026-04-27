import { Msc_VerificationView } from '@/components/auth/msc_VerificationView'

type VerifyPageProps = {
  searchParams?: Promise<{ token?: string }>
}

export default async function MSC_Projectz_VerifyPage({ searchParams }: VerifyPageProps) {
  const params = searchParams ? await searchParams : undefined
  const token = params?.token ?? ''
  return <Msc_VerificationView token={token} />
}
