// Chép từ web (src/features/auth/hooks.ts). Khác web: useCompleteAuthRedirect nhận tham số của deep
// link; lỗi ảnh là CoverError (app không có StorageFullError của bản giả).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { CoverError } from '@/lib/image'
import type { User } from '@/types/user'
import * as api from './api'

export const authKeys = {
  session: ['auth', 'session'] as const,
}

/** networkMode 'always': phiên đọc trên máy, mở app lúc offline vẫn biết ai đang đăng nhập */
export const useSession = () =>
  useQuery({
    queryKey: authKeys.session,
    queryFn: api.getSession,
    staleTime: Infinity,
    networkMode: 'always',
  })

/** Tải lại phiên khi đăng nhập/đăng xuất xảy ra ngoài các hook ở đây (link email, hết hạn) */
export function useAuthSync() {
  const queryClient = useQueryClient()
  useEffect(
    () =>
      api.onAuthStateChange(
        () => void queryClient.invalidateQueries({ queryKey: authKeys.session }),
      ),
    [queryClient],
  )
}

/**
 * Màn nhận deep link (auth/callback, reset-password): đổi ?code= lấy phiên rồi lưu vào cache phiên.
 * Đổi mã lỗi mà máy vẫn có phiên (Android có thể giao link OAuth cho cả trình duyệt lẫn router, mã
 * đã được signInWithProvider dùng) thì coi như xong.
 */
export function useCompleteAuthRedirect(params: api.AuthRedirectParams) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['auth', 'callback', params.code ?? null, params.error ?? null],
    queryFn: async () => {
      let user: User | null
      try {
        user = await api.completeAuthRedirect(params)
      } catch (error) {
        user = await api.getSession()
        if (!user) throw error
      }
      queryClient.setQueryData(authKeys.session, user)
      return user
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}

function useSetSession() {
  const queryClient = useQueryClient()
  return (user: User | null) => queryClient.setQueryData(authKeys.session, user)
}

export function useSignIn() {
  const setSession = useSetSession()
  return useMutation({ mutationFn: api.signInWithPassword, onSuccess: setSession })
}

export function useSignUp() {
  const setSession = useSetSession()
  return useMutation({ mutationFn: api.signUp, onSuccess: (r) => setSession(r.user) })
}

/** Kết quả null: người dùng đóng trình duyệt giữa chừng, giữ nguyên phiên cũ */
export function useSignInWithProvider() {
  const setSession = useSetSession()
  return useMutation({
    mutationFn: api.signInWithProvider,
    onSuccess: (user) => {
      if (user) setSession(user)
    },
  })
}

/** Đăng nhập Apple (riêng của app); kết quả null (người dùng đóng bảng) thì không làm gì */
export function useSignInWithApple() {
  const setSession = useSetSession()
  return useMutation({
    mutationFn: api.signInWithApple,
    onSuccess: (user) => {
      if (user) setSession(user)
    },
  })
}

export function useSignOut() {
  const setSession = useSetSession()
  return useMutation({ mutationFn: api.signOut, onSuccess: () => setSession(null) })
}

export function useUpdateProfile() {
  const setSession = useSetSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (user) => {
      setSession(user)
      // Bình luận hiển thị tên/ảnh mới
      void queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}

export const useChangePassword = () => useMutation({ mutationFn: api.changePassword })

/** Xóa tài khoản: xong thì bỏ mọi dữ liệu đã tải của người này và về trạng thái khách */
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.removeQueries()
      queryClient.setQueryData(authKeys.session, null)
    },
  })
}

export const useSendPasswordReset = () => useMutation({ mutationFn: api.sendPasswordReset })
export const useUpdatePassword = () => useMutation({ mutationFn: api.updatePassword })

/** Thông báo lỗi hiển thị cho người dùng từ lỗi bất kỳ của các hàm auth */
export function authErrorMessage(error: unknown) {
  if (error instanceof api.AuthError || error instanceof CoverError) return error.message
  return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
}
