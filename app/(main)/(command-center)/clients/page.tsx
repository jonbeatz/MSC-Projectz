import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { MSC_Projectz_ClientsRouteView } from '@/components/MSC-Projectz-ClientsRouteView'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_hasAdminAccess } from '@/lib/msc_roles'

export default async function MSC_Projectz_ClientsPage() {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user || !msc_hasAdminAccess(ctx.user.role)) {
    redirect('/dashboard')
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading clients…
        </div>
      }
    >
      <MSC_Projectz_ClientsRouteView />
    </Suspense>
  )
}
