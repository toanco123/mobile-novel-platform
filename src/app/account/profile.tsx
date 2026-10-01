import { ProfileForm } from '@/features/auth/components/ProfileForm'
import { SignedInScreen } from '@/features/auth/components/SignedInScreen'

export default function ProfileScreen() {
  return <SignedInScreen>{(user) => <ProfileForm user={user} />}</SignedInScreen>
}
