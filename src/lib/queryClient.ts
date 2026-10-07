import NetInfo from '@react-native-community/netinfo'
import { MutationCache, onlineManager, QueryCache, QueryClient } from '@tanstack/react-query'
import { reportError } from './monitoring'

// Cùng mặc định với web (src/app/queryClient.ts): query/mutation lỗi (sau khi đã thử lại) đều qua
// reportError; lỗi nghiệp vụ, lỗi mạng bị lọc ở đó
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => reportError(error, { queryKey: query.queryKey }),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      reportError(error, { mutationKey: mutation.options.mutationKey }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

// TanStack Query mặc định nghe sự kiện online/offline của trình duyệt; trên điện thoại lấy từ NetInfo
// để query tự tạm dừng khi mất mạng và chạy lại khi có mạng
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
)
