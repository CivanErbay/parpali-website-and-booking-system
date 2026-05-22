export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/requireUser'
import { ManageChrome } from '@/components/Manage/ManageChrome/ManageChrome'

/**
 * Pathless (authed) subgroup — every page below it is behind the auth gate.
 * URLs stay /manage/... ; the login page sits outside this group so it is public.
 */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return <ManageChrome userEmail={user.email}>{children}</ManageChrome>
}
