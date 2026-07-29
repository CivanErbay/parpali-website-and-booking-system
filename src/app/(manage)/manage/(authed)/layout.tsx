export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { requireUser } from '@/lib/requireUser'
import { ManageChrome } from '@/components/Manage/ManageChrome/ManageChrome'

/**
 * Pathless (authed) subgroup — every page below it is behind the auth gate.
 * URLs stay /manage/... ; the login page sits outside this group so it is public.
 */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'booking-settings' })
  const emergencyStop = Boolean((settings as { emergencyStop?: boolean } | null)?.emergencyStop)
  return (
    <ManageChrome userEmail={user.email} initialEmergencyStop={emergencyStop}>
      {children}
    </ManageChrome>
  )
}
