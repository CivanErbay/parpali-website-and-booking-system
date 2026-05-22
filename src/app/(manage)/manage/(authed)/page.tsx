import { redirect } from 'next/navigation'
import { isoToday } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

/** /manage → today's day view. */
export default function ManageIndex() {
  redirect(`/manage/day/${isoToday()}`)
}
