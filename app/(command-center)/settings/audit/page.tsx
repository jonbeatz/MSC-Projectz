import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { MSC_Projectz_AuditLogViewer } from '@/components/settings/MSC-Projectz-AuditLogViewer'
import { Button } from '@/components/ui/button'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'

export default async function MSC_Projectz_SettingsAuditPage() {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user || !msc_vaultIsPayloadAdmin(ctx.user as Parameters<typeof msc_vaultIsPayloadAdmin>[0])) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings / Audit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review immutable admin action history from the settings workflow.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <MSC_Projectz_AuditLogViewer />
    </div>
  )
}
