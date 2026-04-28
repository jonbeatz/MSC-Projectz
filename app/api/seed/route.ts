import { NextResponse } from 'next/server'

import { msc_backfillDemoClientPresentation, msc_seedDatabase } from '@/lib/msc_seed_data'

/**
 * Dev-only: populate demo CRM clients, vault projects, tasks, and snippets.
 * - GET /api/seed — full seed (skipped if Nebula Digital exists).
 * - GET /api/seed?backfill=1 — add demo onboarding + phone to existing seed-named clients.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'Not available outside development.' }, { status: 403 })
  }

  const backfill = new URL(request.url).searchParams.get('backfill') === '1'
  if (backfill) {
    const result = await msc_backfillDemoClientPresentation()
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 })
    }
    return NextResponse.json(result)
  }

  const result = await msc_seedDatabase()
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}
