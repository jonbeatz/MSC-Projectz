export type MscScopedUserId = string | number | null | undefined

export function msc_getScopedKey(key: string, userId: MscScopedUserId): string {
  if (userId === null || userId === undefined || String(userId).trim() === '') {
    throw new Error(`Cannot scope localStorage key "${key}" without a userId.`)
  }

  return `${key}_${String(userId).trim()}`
}
