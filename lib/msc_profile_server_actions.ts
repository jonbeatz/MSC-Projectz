'use server'

import { getPayload } from 'payload'

import config from '@payload-config'
import { msc_getVaultLocalApiContext } from '@/lib/msc_vault_auth_context'
import type { User } from '@/lib/types'

type MscMediaDoc = {
  id: string | number
  url?: string | null
  owner?: string | number | { id?: string | number } | null
}

type MscPayloadUserDoc = {
  id: string | number
  email?: string | null
  username?: string | null
  role?: 'admin' | 'user' | null
  avatar?: string | number | MscMediaDoc | null
}

export type MscProfileAvatarUploadResult = {
  id: string | number
  url: string
}

function msc_avatarUrlFromDoc(doc: MscMediaDoc | string | number | null | undefined): string | null {
  if (doc && typeof doc === 'object' && 'url' in doc && typeof doc.url === 'string') {
    return doc.url
  }

  return null
}

function msc_avatarIdFromDoc(doc: MscMediaDoc | string | number | null | undefined): string | number | null {
  if (doc && typeof doc === 'object' && 'id' in doc) return doc.id
  if (typeof doc === 'string' || typeof doc === 'number') return doc
  return null
}

function msc_mapProfileUser(doc: MscPayloadUserDoc): User {
  const username = doc.username?.trim() || doc.email?.split('@')[0] || 'User'
  const avatarUrl = msc_avatarUrlFromDoc(doc.avatar)
  return {
    username,
    email: doc.email || '',
    role: doc.role === 'admin' ? 'admin' : 'user',
    payloadUserId: doc.id,
    avatar: avatarUrl || undefined,
    avatarId: msc_avatarIdFromDoc(doc.avatar),
    avatarUrl,
  }
}

export async function msc_uploadProfileAvatar(formData: FormData): Promise<MscProfileAvatarUploadResult> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    throw new Error('Authentication required to upload profile avatar.')
  }

  const file = formData.get('avatar')
  if (!(file instanceof File)) {
    throw new Error('Avatar file is required.')
  }

  const payload = await getPayload({ config })
  const buffer = Buffer.from(await file.arrayBuffer())
  const created = await payload.create({
    collection: 'media',
    data: {
      owner: ctx.user.id,
    },
    file: {
      data: buffer,
      mimetype: file.type || 'application/octet-stream',
      name: file.name || `avatar-${ctx.user.id}`,
      size: file.size,
    },
    user: ctx.user,
    overrideAccess: false,
  } as Parameters<typeof payload.create>[0])

  const media = created as MscMediaDoc
  console.log('SERVER: upload profile avatar result', {
    currentUserId: ctx.user.id,
    mediaId: media.id,
    hasUrl: Boolean(media.url),
  })

  return {
    id: media.id,
    url: media.url || '',
  }
}

export async function msc_updateCurrentUserProfile(input: {
  username: string
  email: string
  avatar: string | number | null
}): Promise<User> {
  const ctx = await msc_getVaultLocalApiContext()
  if (!ctx.user) {
    throw new Error('Authentication required to update profile.')
  }

  console.log('SERVER: update profile payload received', {
    currentUserId: ctx.user.id,
    email: input.email,
    username: input.username,
    avatar: input.avatar,
    avatarType: typeof input.avatar,
  })

  const payload = await getPayload({ config })
  if (input.avatar !== null && input.avatar !== undefined && String(input.avatar).trim() !== '') {
    const media = (await payload.findByID({
      collection: 'media',
      id: input.avatar,
      depth: 0,
      overrideAccess: true,
    })) as MscMediaDoc | null
    if (!media) {
      throw new Error('Selected avatar media was not found.')
    }
    const owner = media.owner
    const ownerId =
      typeof owner === 'object' && owner !== null && 'id' in owner ? owner.id : owner
    const isOwner = ownerId !== undefined && ownerId !== null && String(ownerId) === String(ctx.user.id)
    const isAdmin = (ctx.user as { role?: string | null }).role === 'admin'
    if (!isOwner && !isAdmin) {
      throw new Error('Unauthorized: cannot use this media as avatar.')
    }
  }

  const updated = await payload.update({
    collection: 'users',
    id: ctx.user.id,
    data: {
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      avatar: input.avatar || null,
    },
    depth: 1,
    overrideAccess: true,
  })

  return msc_mapProfileUser(updated as MscPayloadUserDoc)
}
