import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'
import { SignedInScreen } from '@/features/auth/components/SignedInScreen'

export default function ChangePasswordScreen() {
  return <SignedInScreen>{(user) => <ChangePasswordForm user={user} />}</SignedInScreen>
}
