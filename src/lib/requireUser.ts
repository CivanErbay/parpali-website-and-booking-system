import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '../payload-types'

/**
 * Auth gate for the `(manage)` dashboard (ADR-0013). Uses Payload's local-API
 * `auth()` to read the `payload-token` session cookie from the request headers.
 */

export async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return (user as User | null) ?? null
}

/** Returns the signed-in user or redirects to the login page. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/manage/login')
  return user
}
