import { redirect } from 'next/navigation'

/** Legacy route: Code Vault now lives under Dashboard → project → Task Pulse → Code Vault. */
export default function MSC_Projectz_VaultPage() {
  redirect('/dashboard')
}
