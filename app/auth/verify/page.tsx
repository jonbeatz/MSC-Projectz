import { VerificationView } from '@/components/auth/VerificationView'

type VerifyPageProps = {
  searchParams?: Promise<{ token?: string }>
}

export default async function MSC_Projectz_VerifyPage({ searchParams }: VerifyPageProps) {
  const params = searchParams ? await searchParams : undefined
  const token = params?.token ?? ''
  return <VerificationView token={token} />
}
