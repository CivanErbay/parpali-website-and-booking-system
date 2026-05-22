import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/requireUser'
import { LoginForm } from '@/components/Manage/LoginForm/LoginForm'

export const dynamic = 'force-dynamic'

export default async function ManageLoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/manage')
  return <LoginForm />
}
