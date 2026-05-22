import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import type { User } from '../payload-types'

/**
 * Auth wrapper for `/api/manage/*` mutation routes (ADR-0013). Unlike the
 * public booking endpoints — which authorize via the route itself and use
 * `overrideAccess` — manage endpoints must reject every unauthenticated
 * request before doing any work. `withUser` makes that check unskippable.
 */
export async function withUser(
  req: Request,
  handler: (ctx: { user: User; payload: Payload }) => Promise<NextResponse>,
): Promise<NextResponse> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }
  return handler({ user: user as User, payload })
}
