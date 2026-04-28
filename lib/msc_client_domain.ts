/** CRM client checklist + defaults (shared by server actions and UI). Not a Server Actions module. */

export type OnboardingChecklistItem = { id: string; label: string; completed: boolean }
export type OnboardingChecklist = OnboardingChecklistItem[]

export const MSC_DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklist = [
  { id: 'contract', label: 'Contract signed', completed: false },
  { id: 'hosting', label: 'Hosting set up', completed: false },
  { id: 'dns', label: 'DNS configured', completed: false },
  { id: 'credentials', label: 'Credentials received', completed: false },
]

export function msc_isChecklistItem(x: unknown): x is OnboardingChecklistItem {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.label === 'string' && typeof o.completed === 'boolean'
}

/** Merges saved `clientVault.onboardingChecklist` with defaults; preserves extra user rows by id. */
export function msc_mergeOnboardingChecklist(clientVault: unknown): OnboardingChecklist {
  const vault =
    clientVault && typeof clientVault === 'object' && clientVault !== null
      ? (clientVault as Record<string, unknown>)
      : {}
  const raw = vault.onboardingChecklist
  const saved = Array.isArray(raw) ? raw.filter(msc_isChecklistItem) : []
  const savedById = new Map(saved.map((s) => [s.id, s]))
  const merged: OnboardingChecklistItem[] = MSC_DEFAULT_ONBOARDING_CHECKLIST.map((d) => {
    const s = savedById.get(d.id)
    return {
      id: d.id,
      label: d.label,
      completed: Boolean(s?.completed),
    }
  })
  const defaultIds = new Set(MSC_DEFAULT_ONBOARDING_CHECKLIST.map((d) => d.id))
  for (const s of saved) {
    if (!defaultIds.has(s.id)) merged.push(s)
  }
  return merged
}
