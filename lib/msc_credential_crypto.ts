'use client'

/**
 * Simple credential encryption for localStorage.
 * Uses TextEncoder/TextDecoder + base64 encoding with a key derived from the master password.
 * This is NOT military-grade encryption — it prevents casual plaintext exposure.
 * For production, replace with Web Crypto API (subtle.encrypt) using the master password.
 */

function msc_deriveKey(masterPassword: string): string {
  let hash = 0
  for (let i = 0; i < masterPassword.length; i++) {
    const char = masterPassword.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash.toString(36)
}

function msc_xorEncrypt(text: string, key: string): string {
  const keyStr = key.padEnd(32, key).slice(0, 32)
  const bytes = new TextEncoder().encode(text)
  const keyBytes = new TextEncoder().encode(keyStr)
  const result = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return btoa(String.fromCharCode(...result))
}

function msc_xorDecrypt(encoded: string, key: string): string {
  const keyStr = key.padEnd(32, key).slice(0, 32)
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const keyBytes = new TextEncoder().encode(keyStr)
  const result = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return new TextDecoder().decode(result)
}

export function msc_encryptCredentialData(data: unknown, masterPassword: string | null): string {
  const json = JSON.stringify(data)
  if (!masterPassword) return json
  const key = msc_deriveKey(masterPassword)
  return msc_xorEncrypt(json, key)
}

export function msc_decryptCredentialData(data: string, masterPassword: string | null): unknown {
  if (!masterPassword) {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  const key = msc_deriveKey(masterPassword)
  try {
    const decrypted = msc_xorDecrypt(data, key)
    return JSON.parse(decrypted)
  } catch {
    return null
  }
}
