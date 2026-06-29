import { redirect } from 'next/navigation'
import { MSC_Projectz_VerifyReminderClient } from '@/app/(main)/auth/verify-reminder/MSC-Projectz-VerifyReminderClient'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'

type MscReminderUser = {
  email?: string | null
  isVerified?: boolean | null
  role?: 'master-admin' | 'admin' | 'user' | null
}

function msc_maskEmail(email: string): string {
  const trimmed = email.trim()
  const [local, domain] = trimmed.split('@')
  if (!local || !domain) return 'your email'
  const first = local[0] || ''
  return `${first}***@${domain}`
}

export default async function MSC_Projectz_VerifyReminderPage() {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user?.id) {
    redirect('/auth')
  }

  const user = (await ctx.payload.findByID({
    collection: 'users',
    id: ctx.user.id,
    depth: 0,
    overrideAccess: true,
  })) as MscReminderUser

  if (user?.isVerified) {
    redirect('/dashboard')
  }

  const maskedEmail = user?.email ? msc_maskEmail(user.email) : 'your email'
  const canUseDevBypass =
    process.env.NODE_ENV !== 'production' && (user?.role === 'admin' || user?.role === 'master-admin')

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center">
        <MSC_Projectz_VerifyReminderClient maskedEmail={maskedEmail} canUseDevBypass={Boolean(canUseDevBypass)} />
      </div>
    </main>
  )
}
