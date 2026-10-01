import { router } from 'expo-router'
import { toast } from 'sonner-native'
import { DeleteAccountForm } from '@/features/auth/components/DeleteAccountForm'
import { SignedInScreen } from '@/features/auth/components/SignedInScreen'

export default function DeleteAccountScreen() {
  return (
    <SignedInScreen>
      {(user) => (
        <DeleteAccountForm
          user={user}
          onDeleted={() => {
            toast.success('Đã xóa tài khoản.')
            router.back()
          }}
        />
      )}
    </SignedInScreen>
  )
}
