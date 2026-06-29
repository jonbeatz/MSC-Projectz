import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { MSC_Projectz_AdminSettingsRouteView } from '@/components/MSC-Projectz-AdminSettingsRouteView'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'
import { SettingsSkeleton } from '@/components/MscLoadingSkeleton'

export default async function MSC_Projectz_SettingsPage() {
  const ctx = await msc_getVaultLocalApiContext()

  if (!ctx.user || !msc_vaultIsPayloadAdmin(ctx.user as Parameters<typeof msc_vaultIsPayloadAdmin>[0])) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <MSC_Projectz_AdminSettingsRouteView />
    </Suspense>
  )
}
