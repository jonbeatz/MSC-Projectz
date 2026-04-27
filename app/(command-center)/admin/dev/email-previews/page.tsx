import { redirect } from 'next/navigation'
import { MSC_Projectz_EmailPreviewsClient } from '@/app/(command-center)/admin/dev/email-previews/MSC-Projectz-EmailPreviewsClient'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import { msc_vaultIsPayloadAdmin } from '@/lib/msc_vault_payload_access'

export default async function MSC_Projectz_AdminEmailPreviewsPage() {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user || !msc_vaultIsPayloadAdmin(ctx.user as Parameters<typeof msc_vaultIsPayloadAdmin>[0])) {
    redirect('/dashboard')
  }

  return <MSC_Projectz_EmailPreviewsClient />
}
