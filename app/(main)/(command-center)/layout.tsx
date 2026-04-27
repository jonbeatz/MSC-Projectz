import { MSC_Projectz_CommandCenterShell } from '@/components/MSC-Projectz-CommandCenterShell'

export default function MSC_Projectz_CommandCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MSC_Projectz_CommandCenterShell>{children}</MSC_Projectz_CommandCenterShell>
}
