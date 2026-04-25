export function isLive(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function getSafePath(localPath: string): string {
  if (isLive()) {
    return ''
  }
  return localPath
}
